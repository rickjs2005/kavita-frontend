# Onboarding — Frontend Kavita

Guia prático para um novo desenvolvedor começar a contribuir no frontend da Kavita.

---

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Setup local](#setup-local)
- [Entendendo o projeto em 5 minutos](#entendendo-o-projeto-em-5-minutos)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Fluxo de um request HTTP](#fluxo-de-um-request-http)
- [Padrão RSC + Client Component](#padrão-rsc--client-component)
- [Autenticação](#autenticação)
- [Testes](#testes)
- [Onde encontrar o quê](#onde-encontrar-o-quê)
- [Primeiras tarefas recomendadas](#primeiras-tarefas-recomendadas)
- [Erros comuns de quem está começando](#erros-comuns-de-quem-está-começando)

---

## Pré-requisitos

| Ferramenta | Versão mínima | Observação |
|------------|---------------|------------|
| Node.js | 20+ | `node -v` para verificar |
| npm | 10+ | Vem com o Node.js |
| Git | 2.x | Qualquer versão recente |
| Backend | — | `kavita-backend` rodando em `localhost:5000` |

Conhecimento esperado: React, TypeScript, Tailwind CSS. Familiaridade com Next.js App Router é desejável mas não obrigatória.

---

## Setup local

```bash
# 1. Clone e instale
git clone <url-do-repositorio>/kavita-frontend.git
cd kavita-frontend
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local — os defaults de desenvolvimento já funcionam se o backend
# estiver rodando em localhost:5000

# 3. Inicie o backend (em outro terminal)
cd ../kavita-backend
npm run dev

# 4. Inicie o frontend
cd ../kavita-frontend
npm run dev
# → http://localhost:3000
```

### Verificação rápida

Após `npm run dev`:
1. Acesse `http://localhost:3000` — deve mostrar a home com categorias e hero
2. Acesse `http://localhost:3000/admin/login` — deve mostrar a tela de login admin
3. Execute `npm run test:run` — veja a seção abaixo sobre estado atual dos testes

### Estado atual dos testes

Ao rodar `npm run test:run` pela primeira vez, você verá que **~1470 testes passam**, mas **~46 falham em 8 arquivos**. Isso é um problema conhecido — não significa que você quebrou algo.

**Causa:** Alguns arquivos de teste usam mocks com a exportação nomeada legada `apiRequest` em vez do `default` export atual do `apiClient`. Os testes que falham estão em:
- `apiClient.csrf.test.ts` — mocks de CSRF desatualizados
- `newsPublicApi.test.ts` — mock de API pública
- `useCotacoesAdmin.test.tsx` — mock de admin hook
- `products.test.ts` (services) — mock de service layer
- Alguns testes de componentes (`DeleteButton`, `ProductCard`, `ProdutoForm`)

**O que fazer:** Ignore essas falhas durante o onboarding. Elas não afetam o funcionamento da aplicação. A correção envolve atualizar os mocks para usar `default` export (veja [troubleshooting.md](./troubleshooting.md#testes-falhando-por-mock-de-apiclient)).

---

## Entendendo o projeto em 5 minutos

Kavita é uma plataforma de e-commerce agrícola com duas áreas:

- **Área pública** (`/`): loja com produtos, serviços, drones, Kavita News, checkout com MercadoPago
- **Painel admin** (`/admin`): gestão completa de conteúdo, pedidos, clientes, relatórios

O frontend é um Next.js 15 App Router que consome uma API REST Express em repositório separado. A comunicação acontece via `apiClient` (nunca `fetch()` direto). Autenticação é por cookies HttpOnly — o frontend não armazena tokens.

### Conceitos-chave

| Conceito | O que é | Onde vive |
|----------|---------|-----------|
| `apiClient` | Cliente HTTP único do projeto | `src/lib/apiClient.ts` |
| `absUrl()` | Normaliza URLs de imagens/uploads | `src/utils/absUrl.ts` |
| `AuthContext` | Estado de autenticação da loja | `src/context/AuthContext.tsx` |
| `AdminAuthContext` | Estado de autenticação do admin | `src/context/AdminAuthContext.tsx` |
| `CartContext` | Estado do carrinho de compras | `src/context/CartContext.tsx` |
| Server Data | Fetchers server-side (RSC) | `src/server/data/*.ts` |
| Schemas Zod | Validação de respostas da API | `src/lib/schemas/api.ts` |

---

## Estrutura de pastas

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── page.tsx            # Home (RSC → HomeClient)
│   ├── layout.tsx          # Root layout (providers, header, footer)
│   ├── globals.css         # CSS global + design tokens
│   ├── produtos/           # Catálogo de produtos
│   ├── servicos/           # Catálogo de serviços
│   ├── drones/             # Drones agrícolas
│   ├── checkout/           # Fluxo de checkout (multi-step)
│   ├── news/               # Kavita News (posts, clima, cotações)
│   ├── mercado-do-cafe/    # Mercado do Café (corretoras)
│   ├── login/              # Autenticação do usuário
│   ├── admin/              # Painel administrativo (layout próprio)
│   │   ├── layout.tsx      # Auth guard + sidebar
│   │   ├── produtos/       # CRUD de produtos
│   │   ├── pedidos/        # Gestão de pedidos
│   │   └── ...             # demais módulos admin
│   └── ...
│
├── components/             # Componentes React
│   ├── admin/              # Exclusivos do painel admin
│   ├── products/           # Cards, grid, listagem de produtos
│   ├── drones/             # Seções da landing de drones
│   ├── news/               # Cards de notícias, clima, cotações
│   ├── checkout/           # Formulários do checkout
│   ├── home/               # HomeClient
│   ├── layout/             # Header, Footer, HeroCarousel
│   ├── ui/                 # Compartilhados: LoadingState, ErrorState, EmptyState
│   └── ...
│
├── context/                # React Contexts
│   ├── AuthContext.tsx      # Auth de usuários (cookie HttpOnly)
│   ├── AdminAuthContext.tsx # Auth de admins (cookie HttpOnly)
│   └── CartContext.tsx      # Carrinho (composto por 4 sub-hooks)
│       └── cart/            # useCartActions, useCartSync, useCartPersistence, useCartCalculations
│
├── hooks/                  # Custom hooks
│   ├── useFetchProducts.ts # Busca de produtos (SWR)
│   ├── useFetchServicos.ts # Busca de serviços (SWR)
│   ├── useAdminResource.ts # CRUD genérico para admin (SWR)
│   ├── useCheckoutForm.ts  # Estado do formulário de checkout
│   ├── useCep.ts           # Consulta de CEP
│   └── ...
│
├── lib/                    # Infraestrutura
│   ├── apiClient.ts        # Cliente HTTP (fetch + CSRF + timeout)
│   ├── errors.ts           # ApiError class + isApiError()
│   ├── schemas/api.ts      # Schemas Zod para responses da API
│   ├── sanitizeHtml.ts     # Sanitização de conteúdo
│   └── ...
│
├── server/data/            # Server-only data fetchers (RSC)
│   ├── categories.ts       # Categorias públicas
│   ├── shopSettings.ts     # Configurações da loja
│   ├── heroSlides.ts       # Slides do hero
│   └── ...
│
├── services/api/           # Definições de endpoints e wrappers
│   ├── endpoints.ts        # Constantes de URL
│   └── services/           # auth.ts, products.ts, addresses.ts, users.ts
│
├── types/                  # Tipos TypeScript do domínio
│   ├── product.ts, service.ts, auth.ts, admin.ts, ...
│
└── utils/                  # Funções auxiliares
    ├── absUrl.ts           # URLs de imagem
    ├── formatters.ts       # Formatação de texto/números
    ├── pricing.ts          # Cálculos de preço
    └── ...
```

### Regra de ouro

| Camada | Responsabilidade | Quem importa |
|--------|-----------------|--------------|
| `server/data/` | Buscar dados no servidor (RSC) | Apenas páginas `page.tsx` server-side |
| `hooks/` | Buscar dados no cliente (SWR) | Client Components |
| `context/` | Estado global (auth, carrinho) | Client Components |
| `lib/` | Infraestrutura (HTTP, erros, schemas) | Qualquer camada |
| `components/` | UI pura ou com lógica de apresentação | Páginas e outros componentes |
| `services/api/` | Definição de endpoints e chamadas | Hooks e componentes |
| `utils/` | Funções puras (formatação, cálculos) | Qualquer camada |
| `types/` | Tipos de domínio | Qualquer camada |

---

## Fluxo de um request HTTP

Todo request HTTP do frontend segue este caminho:

```
Componente/Hook
  └─ apiClient.get("/api/public/produtos")
       ├─ Resolve URL absoluta (API_BASE + path)
       ├─ Injeta credentials (include para /api, omit para /uploads)
       ├─ Se mutation (POST/PUT/PATCH/DELETE): injeta CSRF token
       ├─ Aplica timeout (15s padrão)
       ├─ Faz fetch()
       ├─ Se 401: dispara evento global "auth:expired"
       ├─ Parse defensivo (JSON → texto → null)
       ├─ Unwrap envelope { ok: true, data: ... }
       └─ Retorna dados ou lança ApiError
```

> Todo request HTTP em Client Components passa pelo `apiClient`. Nunca use `fetch()` direto, Axios ou `process.env` inline. Veja [Regras de projeto](./maintenance-guide.md#regras-de-projeto) para a lista completa.

---

## Padrão RSC + Client Component

O padrão ideal (usado na home e em detalhe de produto):

```tsx
// src/app/page.tsx — Server Component (async)
import HomeClient from "@/components/home/HomeClient";
import { fetchPublicCategories } from "@/server/data/categories";

export default async function HomePage() {
  const categories = await fetchPublicCategories();  // fetch no servidor
  return <HomeClient categories={categories} />;      // repassa para client
}
```

```tsx
// src/components/home/HomeClient.tsx — Client Component
"use client";
export default function HomeClient({ categories }: Props) {
  // Lógica interativa aqui (state, effects, event handlers)
}
```

**Realidade atual:** Algumas páginas como `/produtos` e `/servicos` usam o page.tsx apenas como wrapper vazio que renderiza um Client Component, e toda a busca acontece no cliente. Esse padrão funciona mas não aproveita os benefícios de RSC (streaming, SEO, menos JavaScript no cliente).

---

## Autenticação

Existem **dois sistemas de autenticação completamente independentes**:

| | Usuários da loja | Administradores |
|---|---|---|
| **Context** | `AuthContext` | `AdminAuthContext` |
| **Hook** | `useAuth()` | `useAdminAuth()` |
| **Cookie** | Cookie HttpOnly padrão | `adminToken` (HttpOnly) |
| **Verificação** | `GET /api/users/me` | `GET /api/admin/me` |
| **Login** | `POST /api/login` | `POST /api/admin/login` |
| **Validação** | Zod `AuthUserSchema` | Zod `AdminUserSchema` |

**Nunca** misture `useAuth()` em contexto admin ou `useAdminAuth()` em contexto de loja.

O middleware Edge (`middleware.ts`) protege todas as rotas `/admin/*` verificando a presença do cookie `adminToken`. A validação real (assinatura JWT, expiração, permissões) é feita pelo backend.

---

## Testes

```bash
npm run test:run          # Execução única
npm run test              # Modo watch
npm run test:coverage     # Com cobertura

# Arquivo específico
npx vitest run src/__tests__/components/Header.test.tsx
```

### Convenções

- Estrutura de `src/__tests__/` espelha `src/`
- Mocks: `vi.mock()` (sempre estáticos, hoistados)
- Variáveis de ambiente: `vi.stubEnv()` (nunca `process.env` direto)
- `server-only`: mapeado para mock em `src/__tests__/mocks/server-only.ts`
- Coverage exclui `src/app/**` (páginas RSC testadas via integração)

### Padrão de teste de componente

```tsx
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import MeuComponente from "@/components/MeuComponente";

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("MeuComponente", () => {
  it("renderiza corretamente", () => {
    render(<MeuComponente prop="valor" />);
    expect(screen.getByText("Texto esperado")).toBeInTheDocument();
  });
});
```

---

## Onde encontrar o quê

| Preciso de... | Olhar em... |
|----------------|-------------|
| Uma rota/página | `src/app/<rota>/page.tsx` |
| Um componente visual | `src/components/<area>/` |
| Um hook de dados | `src/hooks/` |
| O cliente HTTP | `src/lib/apiClient.ts` |
| Schemas de validação | `src/lib/schemas/api.ts` |
| Tipos de domínio | `src/types/` |
| Busca server-side (RSC) | `src/server/data/` |
| Endpoints da API | `src/services/api/endpoints.ts` |
| Design tokens (cores) | `COLORS.md` + `src/app/globals.css` + `tailwind.config.ts` |
| Segurança frontend | `FRONTEND_SECURITY_ALIGNMENT.md` |
| Configuração Next.js | `next.config.ts` |
| Middleware (auth admin) | `middleware.ts` (raiz) |
| Testes | `src/__tests__/` (espelha src/) |

---

## Primeiras tarefas recomendadas

Para se familiarizar com o projeto, faça nesta ordem:

### Dia 1 — Entender o ambiente

1. **Navegue pela loja** — home, produtos, detalhe de produto, carrinho, checkout
2. **Navegue pelo admin** — login com credencial de teste, dashboard, produtos, pedidos
3. **Rode os testes** (`npm run test:run`) — ~1470 passam, ~46 falham (veja [estado dos testes](#estado-atual-dos-testes))

### Dia 2 — Entender a infraestrutura

4. **Leia `src/lib/apiClient.ts`** — entenda o padrão HTTP do projeto (401 linhas, mas bem comentado)
5. **Leia `src/context/AuthContext.tsx`** — entenda o fluxo de auth com Zod validation
6. **Leia `src/hooks/useAdminResource.ts`** — entenda o padrão CRUD genérico com SWR

### Dia 3 — Primeira contribuição guiada

7. **Tarefa prática:** Abra `src/components/ui/EmptyState.tsx`, leia o componente. Depois abra `src/__tests__/components/EmptyState.test.tsx` e leia os testes. Agora adicione uma prop `icon` opcional (ex: um ícone Lucide) e escreva um teste para ela. Isso exercita: ler componente, entender testes, criar PR simples.

8. **Alternativa:** Se preferir algo mais backend-aware, tente alterar o texto de uma mensagem de erro em `src/lib/formatApiError.ts` e veja o teste correspondente.

---

## Pegadinhas que você vai encontrar

Estas são limitações e inconsistências reais do projeto. Não são bugs — são coisas que você precisa saber:

| O que você vai ver | Explicação |
|--------------------|------------|
| ~46 testes falhando | Mocks desatualizados, não bugs reais. Veja [troubleshooting](./troubleshooting.md#testes-falhando-conhecidos-mocks-desatualizados). |
| `alert()` no admin (pedidos, produtos, serviços, equipe) | Padrão legado. Código novo deve usar `toast`. |
| Arquivos de 500-758 linhas no admin | `pedidos/page.tsx` (758), `useCheckoutState.ts` (674), `produtoform.tsx` (530). São candidatos a refatoração futura, mas funcionam. |
| `produtoform.tsx` e `produtocard.tsx` em lowercase | Violação de naming convention. Restante do projeto usa PascalCase. |
| Nenhum `error.tsx` nem `not-found.tsx` | Ausência de error boundaries. Se um componente crashar, a página fica branca. |
| `as any` em vários arquivos | Principalmente em hooks admin e checkout. Priorize tipar corretamente ao trabalhar nesses arquivos. |

---

## Erros comuns de quem está começando

Os erros mais frequentes para quem chega no projeto:

- Usar `fetch()` direto em vez de `apiClient`
- Importar `server/data/` em Client Component (são `server-only`)
- Misturar `useAuth()` e `useAdminAuth()` (são independentes)
- Usar hex hardcoded em Tailwind em vez de design tokens
- Construir URL de imagem manualmente em vez de `absUrl()`

Para a lista completa de regras e o checklist de review, veja [Regras de projeto](./maintenance-guide.md#regras-de-projeto) e [Checklist de review](./maintenance-guide.md#checklist-de-review).

---

## Próximos passos

Após completar o onboarding, leia:

- [Arquitetura Frontend](./frontend-architecture.md) — visão detalhada das camadas
- [Padrões de Componentes](./component-patterns.md) — como criar componentes e hooks
- [Data Fetching](./data-fetching.md) — quando usar RSC vs client fetch
- [Fluxos Críticos](./critical-flows.md) — como funcionam auth, checkout, pedidos
- [Guia de Manutenção](./maintenance-guide.md) — como adicionar features e módulos
- [Troubleshooting](./troubleshooting.md) — problemas comuns e soluções
