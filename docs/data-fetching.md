# Data Fetching — Frontend Kavita

Quando usar cada padrão de busca de dados e como implementar corretamente.

---

## Sumário

- [Visão geral](#visão-geral)
- [Padrão 1: Server Data Fetcher (RSC)](#padrão-1-server-data-fetcher-rsc)
- [Padrão 2: Client Hook com SWR](#padrão-2-client-hook-com-swr)
- [Padrão 3: apiClient direto no componente](#padrão-3-apiclient-direto-no-componente)
- [Padrão 4: useAdminResource (CRUD admin)](#padrão-4-useadminresource-crud-admin)
- [Tabela de decisão](#tabela-de-decisão)
- [Revalidação e cache](#revalidação-e-cache)
- [Tratamento de erros](#tratamento-de-erros)
- [Proibições](#proibições)

---

## Visão geral

O projeto tem 4 padrões de data fetching, cada um para um cenário diferente:

```
Server Data Fetcher ─── dados públicos estáticos/semi-estáticos (RSC)
Client Hook (SWR) ──── dados dinâmicos ou dependentes de interação
apiClient direto ────── mutations e operações pontuais
useAdminResource ───── CRUD admin genérico (combina SWR + mutations)
```

---

## Padrão 1: Server Data Fetcher (RSC)

**Quando usar:** Dados públicos que podem ser buscados no servidor durante a renderização. Ideal para SEO e performance.

**Onde ficam:** `src/server/data/*.ts`

### Exemplo existente

```typescript
// src/server/data/categories.ts
import "server-only";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  try {
    const res = await fetch(`${API}/api/public/categorias`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    const raw = Array.isArray(json?.data) ? json.data : json;
    return raw
      .filter((c: PublicCategory) => c.ativo !== false)
      .sort((a: PublicCategory, b: PublicCategory) =>
        (a.sort_order ?? 99) - (b.sort_order ?? 99) || a.nome.localeCompare(b.nome)
      );
  } catch {
    return [];
  }
}
```

### Como usar na página

```typescript
// src/app/page.tsx (RSC)
import { fetchPublicCategories } from "@/server/data/categories";

export const revalidate = 300; // ISR: revalida a cada 5 minutos

export default async function HomePage() {
  const categories = await fetchPublicCategories();
  return <HomeClient categories={categories} />;
}
```

### Características

| Aspecto | Detalhe |
|---------|---------|
| Execução | Servidor (build ou request time) |
| Cookies | Não envia (RSC não tem acesso a cookies do browser) |
| CSRF | Não necessário (server-to-server) |
| Cache | Controlado por `revalidate` ou `cache: "no-store"` |
| Erros | Retorna fallback (array vazio, defaults) — nunca quebra a página |
| Guard | `import "server-only"` previne import em Client Component |

### Módulos existentes

| Fetcher | Endpoint | Revalidate |
|---------|----------|------------|
| `fetchPublicCategories()` | `/api/public/categorias` | 60s |
| `fetchPublicShopSettings()` | `/api/public/shop-settings` | no-store |
| `fetchPublicHeroSlides()` | `/api/public/hero-slides` | no-store |
| `fetchPublicHero()` | `/api/public/hero` | 300s |
| `fetchPublicCotacoes()` | `/api/public/cotacoes` | 120s |
| `fetchPublicCorretoras()` | `/api/public/corretoras` | 120s |
| `fetchNewsOverview()` | `/api/public/news/*` (parallel) | 120s |

### Onde este padrão é usado de verdade

Nem todas as páginas públicas usam server data fetchers. Na prática:

| Página | Usa RSC com server fetch? | Como busca dados |
|--------|--------------------------|------------------|
| `/` (home) | **Sim** | `fetchPublicCategories`, `fetchPublicShopSettings`, `fetchPublicHeroSlides` em parallel |
| `/produtos/[id]` | **Sim** | Fetch direto do produto + promoção no servidor (exemplar) |
| `/news/**` | **Sim** | `fetchNewsOverview`, `fetchPublicCotacoes` |
| `/mercado-do-cafe/**` | **Sim** | `fetchPublicCorretoras` |
| `/produtos` | **Não** | page.tsx é wrapper vazio → `ProductsPageClient` faz tudo client-side |
| `/servicos` | **Não** | page.tsx é `"use client"` inteiro (369 linhas) |
| `/drones` | **Não** | page.tsx é wrapper → `DronesClient` faz tudo client-side |
| `/checkout` | **Não** | Depende de auth/carrinho, deve ser client |

As páginas que usam wrapper vazio funcionam, mas não aproveitam streaming, SEO ou redução de JS. `produtos/[id]` é o exemplo de como migrar uma listagem para RSC.

---

## Padrão 2: Client Hook com SWR

**Quando usar:** Dados que dependem de interação do usuário (busca, filtros, paginação) ou que precisam de revalidação client-side.

**Onde ficam:** `src/hooks/use*.ts`

### Exemplo existente

```typescript
// src/hooks/useFetchProducts.ts (simplificado)
"use client";

import useSWR from "swr";
import apiClient from "@/lib/apiClient";

export function useFetchProducts(params?: { categoria?: string; busca?: string }) {
  const key = buildKey(params);

  const { data, error, isLoading, mutate } = useSWR(
    key,
    (url: string) => apiClient.get(url),
    { revalidateOnFocus: false }
  );

  return {
    products: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
  };
}
```

### Como usar no componente

```tsx
"use client";

function ProductList() {
  const [busca, setBusca] = useState("");
  const { products, loading, error } = useFetchProducts({ busca });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  return <ProductGrid products={products} />;
}
```

### Características

| Aspecto | Detalhe |
|---------|---------|
| Execução | Browser |
| Cookies | Enviados automaticamente (apiClient com credentials: include) |
| CSRF | Não aplicável (hooks fazem GET) |
| Cache | SWR cache em memória |
| Revalidação | Configurável (revalidateOnFocus, refreshInterval, etc.) |
| Erros | Retornados como `error` string — componente decide como exibir |

### Config SWR padrão no projeto

```typescript
{
  revalidateOnFocus: false,  // Evita refetch ao voltar para a aba
  // Outros defaults do SWR são mantidos:
  // revalidateOnReconnect: true
  // dedupingInterval: 2000
}
```

### Hooks existentes

| Hook | Dados | Observação |
|------|-------|------------|
| `useFetchProducts` | Produtos | Busca, filtros, paginação |
| `useFetchServicos` | Serviços | Busca, especialidade |
| `useFetchDronesPage` | Drones | Configuração completa da página |
| `useProductPromotion` | Promoção por produto | Cache em memória com TTL 5min |
| `useUserAddresses` | Endereços do usuário | Requer auth |
| `useCep` | Dados de CEP | Consulta externa |

---

## Padrão 3: apiClient direto no componente

**Quando usar:** Mutations (POST, PUT, DELETE) e operações pontuais que não precisam de cache SWR.

### Exemplo: submissão de formulário

```typescript
"use client";

import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import toast from "react-hot-toast";

async function handleSubmit(formData: FormData) {
  try {
    const result = await apiClient.post<{ id: number }>(
      "/api/admin/produtos",
      formData
    );
    toast.success("Produto criado");
    return result;
  } catch (err: unknown) {
    if (isApiError(err)) {
      toast.error(err.message);
    } else {
      toast.error("Erro inesperado");
    }
  }
}
```

### Quando usar apiClient direto vs hook

| Cenário | Usar |
|---------|------|
| Listagem com cache e refetch | Hook com SWR |
| Formulário de criação/edição | apiClient.post/put direto |
| Toggle de status | apiClient.patch direto |
| Delete com confirmação | apiClient.delete direto |
| Operação única sem reuso | apiClient direto |

---

## Padrão 4: useAdminResource (CRUD admin)

**Quando usar:** Páginas admin que seguem o padrão CRUD (listar, criar, editar, remover).

```typescript
const { items, loading, saving, error, create, update, remove, refetch } =
  useAdminResource<Product>({ endpoint: "/api/admin/produtos" });
```

### O que o hook gerencia automaticamente

- **GET** na montagem (via SWR)
- **POST/PUT/DELETE** com CSRF e credentials
- **401/403** → redirect para login
- **409** (conflict) → mensagem sugerindo desativar
- **Toasts** de sucesso/erro
- **refetch** automático após mutations

Veja [component-patterns.md](./component-patterns.md#padrão-de-hook-admin-useadminresource) para detalhes da API do hook.

---

## Tabela de decisão

| Cenário | Padrão | Exemplo |
|---------|--------|---------|
| Dados públicos na home (categorias, hero) | Server Data Fetcher | `fetchPublicCategories()` |
| Configurações da loja | Server Data Fetcher | `fetchPublicShopSettings()` |
| Lista de produtos com filtros | Client Hook (SWR) | `useFetchProducts()` |
| Promoção de um produto | Client Hook (cache TTL) | `useProductPromotion(id)` |
| Carrinho do usuário | Context (CartContext) | `useCart()` |
| Dados do perfil do usuário | apiClient direto | `apiClient.get("/api/users/me")` |
| CRUD admin genérico | useAdminResource | `useAdminResource<Coupon>()` |
| Submissão de formulário | apiClient direto | `apiClient.post("/api/admin/produtos", data)` |
| Upload de arquivo | useUpload hook | `upload(file, endpoint, field)` |

### Proibido

Nunca use `fetch()` direto em Client Components, Axios, ou `process.env` inline. Para a lista completa de proibições e motivos, veja [Regras de projeto](./maintenance-guide.md#regras-de-projeto).

---

## Revalidação e cache

### Server-side (RSC)

```typescript
// No page.tsx
export const revalidate = 300; // Revalida a cada 5 minutos (ISR)
```

| Módulo | Revalidate | Motivo |
|--------|-----------|--------|
| Home (categorias, hero) | 300s | Muda raramente |
| Cotações | 120s | Dados de mercado semi-frequentes |
| News | 120s | Atualização moderada |
| Corretoras | 120s | Atualização moderada |
| Shop settings | no-store | Muda via admin, precisa ser atual |

### Client-side (SWR)

SWR faz cache em memória automaticamente. Defaults:
- `dedupingInterval: 2000ms` — requests idênticos em 2s são deduplicados
- `revalidateOnFocus: false` (configurado no projeto) — não refaz request ao voltar à aba
- `mutate()` força revalidação manual após mutation

---

## Tratamento de erros

### Em Server Data Fetchers

Retornam fallback seguro — nunca lançam erro que quebre a página:

```typescript
try {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];  // fallback
  return parseResponse(res);
} catch {
  return [];  // fallback em caso de rede
}
```

### Em Client Hooks

Retornam `error` como string:

```typescript
return {
  data: data ?? [],
  loading: isLoading,
  error: error?.message ?? null,
};
```

O componente decide como exibir:
```tsx
if (error) return <ErrorState message={error} />;
```

### Em mutations (apiClient direto)

```typescript
try {
  await apiClient.post("/api/admin/produtos", payload);
  toast.success("Salvo");
} catch (err: unknown) {
  if (isApiError(err)) {
    // Erro estruturado do backend
    toast.error(err.message);
  } else {
    // Erro de rede ou inesperado
    toast.error("Erro de conexão");
  }
}
```

### Classe ApiError

```typescript
class ApiError extends Error {
  status: number;     // HTTP status code
  code?: string;      // Código do backend (ex: "STOCK_LIMIT")
  details?: unknown;  // Dados adicionais
  requestId?: string; // ID do request para debugging
  url?: string;       // URL que falhou
}
```
