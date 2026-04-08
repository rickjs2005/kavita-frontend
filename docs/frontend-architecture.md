# Arquitetura Frontend — Kavita

Visão técnica das camadas, decisões arquiteturais e responsabilidades de cada parte do frontend.

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack tecnológico](#stack-tecnológico)
- [Camadas da aplicação](#camadas-da-aplicação)
- [App Router e estrutura de rotas](#app-router-e-estrutura-de-rotas)
- [Client vs Server Components](#client-vs-server-components)
- [HTTP Client (apiClient)](#http-client-apiclient)
- [Autenticação](#autenticação)
- [Carrinho de compras](#carrinho-de-compras)
- [Validação com Zod](#validação-com-zod)
- [Design tokens e estilos](#design-tokens-e-estilos)
- [Segurança](#segurança)
- [Testes](#testes)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Visão geral

```
┌──────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)            │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Server      │  │ Client      │  │ Edge         │ │
│  │ Components  │  │ Components  │  │ Middleware    │ │
│  │             │  │             │  │              │ │
│  │ page.tsx    │  │ hooks/      │  │ middleware.ts │ │
│  │ layout.tsx  │  │ context/    │  │ (admin auth) │ │
│  │ server/data │  │ components/ │  │              │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────────┘ │
│         │                │                           │
│         │   ┌────────────┴────────────┐              │
│         │   │    lib/apiClient.ts     │              │
│         │   │  (CSRF, credentials,    │              │
│         │   │   timeout, error wrap)  │              │
│         │   └────────────┬────────────┘              │
└─────────┼────────────────┼───────────────────────────┘
          │                │
          ▼                ▼
   ┌──────────────────────────────┐
   │   Backend Express (:5000)    │
   │   kavita-backend (repo sep.) │
   └──────────────────────────────┘
```

---

## Stack tecnológico

| Categoria | Tecnologia | Versão | Papel |
|-----------|-----------|--------|-------|
| Framework | Next.js | 15 | App Router, RSC, API routes |
| UI | React | 19 | Componentes, hooks, contexts |
| Linguagem | TypeScript | 5 | Type safety em todo o projeto |
| Estilos | Tailwind CSS | 3 | Utility-first CSS com design tokens |
| HTTP | Fetch API | nativo | Via `apiClient` (Axios removido) |
| Cache/SWR | SWR | 2 | Client-side data fetching |
| Validação | Zod | 4 | Schema validation de API responses |
| Formulários | React Hook Form | 7 | Formulários com resolvers Zod |
| Animações | Framer Motion | — | Transições e animações |
| Gráficos | Recharts | 3 | Dashboard admin |
| Testes | Vitest | 4 | Unit + component tests |
| Notificações | react-hot-toast | — | Toasts de sucesso/erro |

---

## Camadas da aplicação

### 1. Rotas e páginas (`src/app/`)

Cada diretório em `src/app/` corresponde a uma rota. O App Router do Next.js mapeia:
- `page.tsx` → página renderizada na rota
- `layout.tsx` → layout que envolve páginas filhas
- `loading.tsx` → skeleton exibido durante carregamento (Suspense)
- `error.tsx` → fallback de erro (error boundary) — **não existe atualmente no projeto**

> **Limitação conhecida:** O projeto não tem nenhum `error.tsx` nem `not-found.tsx`. Se um componente lançar exceção não capturada, a página mostra tela branca. Existem apenas 2 `loading.tsx` (em `produtos/[id]` e `news/cotacoes`).

### 2. Server Data Fetchers (`src/server/data/`)

Funções que rodam exclusivamente no servidor. Marcadas com `import "server-only"` para prevenir importação acidental em Client Components.

```typescript
// src/server/data/categories.ts
import "server-only";

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const res = await fetch(`${API_BASE}/api/public/categorias`, {
    cache: "no-store",
  });
  // ... parse e retorno
}
```

Características:
- Usam `fetch()` direto (correto para RSC — sem necessidade de apiClient)
- Revalidation configurada por módulo (60s categorias, 120s cotações, 300s hero)
- Fallback para arrays vazios ou defaults em caso de erro
- Nunca acessam cookies do browser

### 3. Hooks (`src/hooks/`)

Hooks de data fetching para Client Components. Todos usam SWR para cache e revalidação.

```typescript
// Padrão básico
const { data, error, isLoading, mutate } = useSWR(key, fetcher, config);
```

Hooks notáveis:
- `useAdminResource<T>` — CRUD genérico para qualquer entidade admin
- `useFetchProducts` / `useFetchServicos` — Listagem pública
- `useProductPromotion` — Cache em memória com TTL de 5 min
- `useCep` — Consulta de CEP com debounce
- `useCheckoutForm` — Estado complexo do formulário de checkout

### 4. Contexts (`src/context/`)

Estado global compartilhado entre componentes:

| Context | Escopo | Persistência |
|---------|--------|-------------|
| `AuthContext` | Sessão do usuário da loja | Cookie HttpOnly (backend) |
| `AdminAuthContext` | Sessão do administrador | Cookie HttpOnly (backend) |
| `CartContext` | Carrinho de compras | localStorage + sync com backend |

O `CartContext` é composto por 4 sub-hooks em `src/context/cart/`:
- `useCartPersistence` — Persiste no localStorage, isolado por userId
- `useCartSync` — Sincroniza com o backend quando logado
- `useCartCalculations` — Calcula totais, descontos, frete
- `useCartActions` — Add, remove, update, clear

### 5. Lib (`src/lib/`)

Infraestrutura compartilhada:

| Arquivo | Responsabilidade |
|---------|-----------------|
| `apiClient.ts` | Cliente HTTP único (400 linhas) |
| `errors.ts` | `ApiError` class, `isApiError()` type guard |
| `formatApiError.ts` | Formata erros para exibição ao usuário |
| `handleApiError.ts` | Handler genérico de erros |
| `adminErrorHandler.ts` | Handler específico para admin (401→redirect) |
| `schemas/api.ts` | Schemas Zod para todas as responses críticas |
| `sanitizeHtml.ts` | `sanitizeAsText()`, `sanitizeUrl()` |

### 6. Componentes (`src/components/`)

Organizados por domínio, não por tipo:

```
components/
├── admin/          # Componentes do painel (sidebar, forms, tables)
│   ├── produtos/   # ProdutoCard, ProdutoForm
│   ├── hero/       # SlideForm, HeroSlidePreview, HeroMediaUpload
│   ├── kavita-news/# PostForm, ClimaForm, CotacoesForm
│   └── ...
├── products/       # ProductCard, ProductGrid, ProductBuyBox
├── drones/         # HeroSection, GallerySection, SpecsSection
├── news/           # PostCard, ClimaCard, CotacaoCard
├── checkout/       # AddressForm, PaymentMethodForm, PersonalInfoForm
├── home/           # HomeClient
├── layout/         # Header, Footer, HeroCarousel
└── ui/             # LoadingState, ErrorState, EmptyState, CustomButton
```

### 7. Types, Utils, Services

- `src/types/` — Tipos de domínio (Product, Service, Auth, Admin, etc.)
- `src/utils/` — Funções puras (formatadores, cálculos de preço, absUrl)
- `src/services/api/` — Constantes de endpoint (`endpoints.ts`) e wrappers por domínio (`services/auth.ts`, `services/products.ts`, `services/addresses.ts`, `services/users.ts`)
- `src/services/` (raiz) — Service layer com lógica de negócio: `products.ts` (normalização), `services.ts` (normalização de serviços), `shippingQuote.ts` (cotação de frete com Zod validation)

---

## App Router e estrutura de rotas

### Rotas públicas

| Rota | Tipo | Dados |
|------|------|-------|
| `/` | RSC | Categorias, hero, shop settings (server fetch) |
| `/produtos` | Client | Lista via `useFetchProducts` |
| `/produtos/[id]` | RSC | Produto + promoção (server fetch) |
| `/servicos` | Client | Lista via `useFetchServicos` |
| `/drones` | Client | Dados via `useFetchDronesPage` |
| `/news/**` | RSC | Overview, cotações, posts (server fetch) |
| `/checkout` | Client | Cart context + checkout state |
| `/mercado-do-cafe/**` | RSC/Client | Corretoras, filtros |

### Rotas admin (`/admin/*`)

Todas protegidas por:
1. **middleware.ts** (Edge) — verifica presença do cookie `adminToken`
2. **admin/layout.tsx** — valida sessão via `AdminAuthContext`
3. **useAdminRouteGuard** — verifica permissões específicas por rota

Padrão típico de página admin:
```tsx
// src/app/admin/produtos/page.tsx
"use client";
export default function AdminProdutosPage() {
  const { items, loading, create, update, remove } =
    useAdminResource<Product>({ endpoint: "/api/admin/produtos" });
  // ... UI com listagem, formulário, ações
}
```

### Layouts

| Layout | Escopo | Responsabilidades |
|--------|--------|-------------------|
| `src/app/layout.tsx` | Global | AuthProvider, CartProvider, Header, Footer, metadata |
| `src/app/admin/layout.tsx` | Admin | AdminAuthProvider, Sidebar, auth guard |

---

## Client vs Server Components

### Quando usar Server Component

- Página que exibe dados públicos estáticos ou semi-estáticos
- Dados que não dependem do estado do usuário
- SEO é importante (conteúdo renderizado no HTML)

### Quando usar Client Component

- Interatividade: formulários, botões, event handlers
- Estado local: useState, useEffect
- Contextos: useAuth, useCart, useAdminAuth
- Data fetching dependente do usuário (carrinho, pedidos, favoritos)

### Padrão ideal

```
page.tsx (RSC) → fetch dados no servidor → passa props → ClientComponent.tsx
```

### Realidade do projeto

Algumas páginas (produtos, serviços) usam o page.tsx como wrapper vazio:
```tsx
export default function Page() {
  return <ProductsPageClient />;
}
```
Isso funciona mas coloca toda a busca no cliente. Quando possível, prefira o padrão ideal com fetch no servidor.

---

## HTTP Client (apiClient)

Arquivo: `src/lib/apiClient.ts` (400 linhas)

### Funcionalidades

| Feature | Detalhe |
|---------|---------|
| **Credentials** | `include` para `/api/*`, `omit` para `/uploads/*` |
| **CSRF** | Token de `/api/csrf-token`, cache 10min, dedup de requests |
| **Timeout** | 15s padrão, configurável por request |
| **Parse** | JSON → texto → null (defensivo) |
| **Envelope** | Unwrap automático de `{ ok: true, data: ... }` |
| **Erros** | Todos envolvidos em `ApiError` com status, code, message |
| **Auth expired** | Evento `auth:expired` despachado no 401 |

### API

```typescript
import apiClient from "@/lib/apiClient";

// GET
const produtos = await apiClient.get<Product[]>("/api/public/produtos");

// POST
const result = await apiClient.post<{ id: number }>("/api/admin/produtos", payload);

// PUT
await apiClient.put(`/api/admin/produtos/${id}`, payload);

// PATCH
await apiClient.patch(`/api/admin/produtos/${id}/status`, { ativo: true });

// DELETE
await apiClient.delete(`/api/admin/produtos/${id}`);

// Com opções
const data = await apiClient.get("/api/algo", {
  timeout: 30000,        // timeout custom
  signal: abortSignal,   // AbortController signal
  skipContentType: true, // para FormData (upload)
});
```

### Tratamento de erros

```typescript
import { ApiError, isApiError } from "@/lib/errors";
import { formatApiError } from "@/lib/formatApiError";

try {
  await apiClient.post("/api/checkout", payload);
} catch (err: unknown) {
  if (isApiError(err)) {
    console.error(`Erro ${err.status}: ${err.message}`);
    // err.code, err.details, err.requestId disponíveis
  }
  const uiError = formatApiError(err); // { title, message } para exibir ao usuário
  toast.error(uiError.message);
}
```

---

## Autenticação

### Fluxo de login do usuário

```
1. Usuário preenche email/senha
2. POST /api/login → backend retorna cookie HttpOnly + dados do usuário
3. extractAuthUser(response) → valida via Zod AuthUserSchema
4. Se válido: setUser(validated) → state populado
5. Se inválido: schema rejeita → usuário não é autenticado
6. Redirect para página anterior (ou home)
```

### Fluxo de login admin

```
1. Admin preenche email/senha
2. POST /api/admin/login → backend retorna cookie adminToken
3. loadSession() → GET /api/admin/me → AdminUserSchema.safeParse(response)
4. Se válido: setAdminUser(validated) → permissões carregadas do servidor
5. Se inválido: clearState() → redirect para /admin/login
```

### Expiração de sessão

```
Qualquer request → apiClient recebe 401
  → dispatchAuthExpired(url)
    → window.dispatchEvent(new CustomEvent("auth:expired"))
      → AuthContext/AdminAuthContext ouvem o evento
        → Limpam state → Redirect para login
```

### Permissões admin

```typescript
const { hasPermission, hasRole } = useAdminAuth();

if (hasPermission("products_manage")) { /* ... */ }
if (hasRole(["master", "gerente"])) { /* ... */ }
// Role "master" bypassa todas as verificações de permissão
```

---

## Carrinho de compras

Composição do `CartContext`:

```
CartContext.tsx (orquestrador)
  ├── useCartPersistence(userId)  → localStorage isolado por conta
  ├── useCartSync(items, userId)  → sincroniza com GET/POST /api/cart
  ├── useCartCalculations(items)  → subtotal, desconto, frete, total
  └── useCartActions(items, set)  → addItem, removeItem, updateQty, clear
```

Validação: cada item do carrinho passa por `CartApiItemSchema` (Zod) — itens com preço zero ou campos inválidos são descartados silenciosamente.

---

## Validação com Zod

Arquivo: `src/lib/schemas/api.ts`

### Schemas existentes

| Schema | Endpoint | Valida |
|--------|----------|--------|
| `AuthUserSchema` | `/api/users/me`, `/api/login` | id (int+), nome, email |
| `AdminUserSchema` | `/api/admin/me` | id, nome, email, role, permissions[] |
| `CartApiItemSchema` | `/api/cart` | produto_id (int+), valor_unitario (>0) |
| `CheckoutResponseSchema` | `/api/checkout` | pedido_id (int+) |
| `PaymentResponseSchema` | `/api/payment/start` | init_point (URL) |
| `CouponPreviewSchema` | `/api/checkout/preview-coupon` | success, desconto (>=0) |
| `ShippingQuoteSchema` | `/api/shipping/quote` | price (número finito >=0) |
| `UploadResponseSchema` | upload endpoints | url OU path (ao menos um) |

### Helpers

```typescript
import { strictParse, safeParseSilent, SchemaError } from "@/lib/schemas/api";

// Lança SchemaError se inválido (use em operações críticas)
const user = strictParse(AuthUserSchema, responseData);

// Retorna null se inválido (use em listas, itens individuais)
const item = safeParseSilent(CartApiItemSchema, rawItem);
```

### Onde schemas são usados hoje

- `AuthContext.tsx` — login e refreshUser
- `AdminAuthContext.tsx` — loadSession
- `CartContext.tsx` — parse de itens do backend
- `checkout/useCheckoutState.ts` — responses de checkout, pagamento, cupom
- `shippingQuote.ts` — cotação de frete
- `useUpload.ts` — response de upload

### Onde schemas ainda não são usados (gap conhecido)

- `useFetchProducts` — confia na resposta sem validação
- `useFetchServicos` — confia na resposta sem validação
- `useFetchDronesPage` — confia na resposta sem validação
- Hooks admin em geral — `useAdminResource` não valida via schema

---

## Design tokens e estilos

Três camadas:

```
globals.css (:root)     → CSS vars (--color-primary: #359293)
tailwind.config.ts      → Mapeia CSS var para classe (primary: "var(--color-primary)")
Componentes             → Usam classes Tailwind (bg-primary, text-accent)
```

Para detalhes completos do sistema de cores, consulte [COLORS.md](../COLORS.md).

### Regras

- Nunca use hex direto em classes Tailwind: `bg-[#359293]` → use `bg-primary`
- Para adicionar uma cor nova: `globals.css` → `tailwind.config.ts` → usar
- Cores Tailwind padrão (gray, white, black) podem ser usadas para UI neutra

---

## Segurança

### Resumo das proteções

| Camada | Proteção |
|--------|----------|
| **CSRF** | Token automático via apiClient em mutations |
| **XSS** | Zero `dangerouslySetInnerHTML`, sanitizeUrl() em redirects |
| **CSP** | Headers separados para admin (restrito) e público |
| **Auth** | Cookies HttpOnly, validação Zod de responses |
| **Redirect** | `safeInternalRedirect()` previne open redirect |
| **Upload** | Schema validation na response |

Para detalhes completos, consulte [FRONTEND_SECURITY_ALIGNMENT.md](../FRONTEND_SECURITY_ALIGNMENT.md).

---

## Testes

- **Framework:** Vitest + jsdom + @testing-library/react
- **Localização:** `src/__tests__/` (espelha a estrutura de `src/`)
- **Cobertura:** ~77% statements, ~69% branches, ~71% functions
- Coverage exclui `src/app/**` (páginas RSC)

### Categorias de teste

| Tipo | Exemplos | Quantidade |
|------|----------|-----------|
| Componentes | Header, ProductCard, Footer, etc. | ~60 arquivos |
| Hooks | useAdminRouteGuard, useCheckoutForm | ~6 arquivos |
| Services | endpoints, auth, products | ~7 arquivos |
| Lib | apiClient.csrf, errors, sanitizeHtml | ~5 arquivos |
| Utils | absUrl, formatters, pricing, stock | ~10 arquivos |
| Contexts | AdminAuthContext | ~1 arquivo |
| Server data | categories, shopSettings | ~2 arquivos |

---

## Limitações conhecidas

| Limitação | Impacto | Status |
|-----------|---------|--------|
| RSC subutilizado em `/produtos`, `/servicos` | Data fetching no cliente sem benefícios de RSC | Funcional, otimização futura |
| Admin layout é Client Component | Toda árvore admin renderizada no cliente | Funcional, poderia ser RSC |
| `unsafe-inline` na CSP | Necessário por Next.js inline scripts + react-hot-toast | Aguarda migração para nonce-based CSP |
| Sem error boundaries globais | Crash de componente mostra tela branca | Necessita `error.tsx` nas rotas |
| Poucos `loading.tsx` | Maioria das rotas sem skeleton loader | Apenas 2 atualmente |
| Schemas Zod parcialmente usados | Hooks de fetch público não validam respostas | Infraestrutura existe, uso parcial |
| `as any` espalhado (~200 ocorrências em código de produção) | Type safety minada em hooks admin e checkout | Reduzir progressivamente ao trabalhar nesses arquivos |
| `alert()` no admin (15 ocorrências) | UX inconsistente — pedidos, produtos, serviços, equipe usam `alert()` em vez de `toast` | Padrão legado, código novo deve usar `toast` |
| Arquivos grandes sem decomposição | `pedidos/page.tsx` (758 linhas), `useCheckoutState.ts` (674), `produtoform.tsx` (530) | Funcionais, candidatos a refatoração futura |
| Naming inconsistente | `produtocard.tsx` e `produtoform.tsx` em lowercase vs PascalCase do restante | Legado, não renomeado por impacto em imports |
| i18n ausente | Toda a UI em pt-BR hardcoded | Decisão futura |
| Testes com mocks desatualizados | ~46 testes falham por usar export nomeado legado do apiClient | Corrigir mocks para usar `default` export |
