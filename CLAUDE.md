# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # inicia Next.js em localhost:3000
npm run build        # build de produção
npm run lint         # ESLint (flat config, Windows-aware)
npm run lint:fix     # ESLint com autofix
npm run test         # Vitest em modo watch
npm run test:run     # Vitest run once (sem watch)
npm run test:coverage

# rodar um arquivo de teste específico:
npx vitest run src/__tests__/components/Header.test.tsx
```

O lint usa `set ESLINT_USE_FLAT_CONFIG=true&&` explicitamente no script por causa do Windows; não altere isso.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. As três principais:

```
NEXT_PUBLIC_API_URL=http://localhost:5000     # URL base do backend Express
NEXT_PUBLIC_API_BASE=/api                    # prefixo das rotas da API
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Arquitetura

### Stack e divisão de responsabilidades

- **Next.js 15 App Router** com RSC + Client Components
- **Backend Express/Node** rodando em `:5000` (repositório separado: `kavita-backend/`)
- Imagens servidas via `http://localhost:5000/uploads/...`

### Padrão de dados: RSC → Client Component

As páginas públicas seguem o padrão de busca no servidor e repasse para o cliente:

```
src/app/page.tsx (RSC, async)
  └─ fetchPublicCategories() → via src/server/data/categories.ts
  └─ passa props para HomeClient (Client Component)
```

Os server-side fetchers em `src/server/data/` usam `server-only` e fetch com `no-store`. Nunca importe esses módulos em Client Components.

### HTTP client

Use sempre `apiClient` de `@/lib/apiClient`:

```ts
import apiClient from "@/lib/apiClient";
apiClient.get("/api/public/produtos")
apiClient.post("/api/admin/produtos", payload)
```

O cliente gerencia automaticamente:
- `credentials: "include"` para rotas `/api` e `credentials: "omit"` para `/uploads`
- CSRF token (header `x-csrf-token`) injetado em POST/PUT/PATCH/DELETE
- Parse defensivo de JSON/texto
- Erros lançados como `ApiError` (importar de `@/lib/errors`)

Não use `fetch()` diretamente em componentes. O alias legado `apiFetch` existe mas é equivalente ao `apiRequest`.

### URLs de imagem

Use sempre `absUrl()` de `@/utils/absUrl` para montar URLs de imagem:

```ts
import { absUrl, API_BASE } from "@/utils/absUrl";
absUrl(produto.image)   // converte qualquer formato para URL absoluta
```

O backend salva caminhos como `/uploads/modulo/arquivo.ext`. O `absUrl` trata todos os formatos possíveis: path com barra inicial, sem barra, filename puro, URL absoluta, `data:`, backslashes Windows. Nunca construa URL de upload manualmente com `${API_BASE}${campo}` — isso quebra se a env var tiver trailing slash.

### Autenticação: dois contextos independentes

| Contexto | Arquivo | Para quem | Mecanismo |
|---|---|---|---|
| `AuthContext` | `src/context/AuthContext.tsx` | usuários loja | cookie HttpOnly via `/api/auth` |
| `AdminAuthContext` | `src/context/AdminAuthContext.tsx` | administradores | cookie HttpOnly via `/api/admin/auth` |

O layout admin (`src/app/admin/layout.tsx`) usa `AdminAuthProvider` e faz redirect automático para `/admin/login` sem sessão válida. Não misture os dois contextos.

### Estrutura de rotas

```
src/app/
├── (raiz)           → home pública (HomeClient)
├── produtos/        → listagem + [id]
├── servicos/        → listagem + [id]
├── drones/          → landing + [id]
├── news/            → Kavita News
├── categorias/[category]
├── checkout/        → fluxo de compra
├── admin/           → painel admin (layout próprio com auth guard)
│   ├── produtos, servicos, drones, pedidos, clientes, ...
│   └── configuracoes, logs, equipe, frete, cupons, ...
└── login, register, forgot-password, reset-password
```

### next.config.ts

- `images.remotePatterns` inclui padrões estáticos para dev local + padrão dinâmico derivado de `NEXT_PUBLIC_API_URL` para cobrir staging/produção
- `images.unoptimized: true` apenas em development
- CSP endurecida somente nas rotas `/admin/**`

### Testes

- Framework: **Vitest** + `jsdom` + `@testing-library/react`
- Setup em `vitest.setup.ts`; alias `server-only` mapeado para mock em `src/__tests__/mocks/server-only.ts`
- Coverage exclui `src/app/**` (páginas RSC são difíceis de testar em isolamento)
- `NEXT_PUBLIC_API_URL` deve ser definido via `vi.stubEnv()` nos testes que testam comportamento dependente da env var — não mute `process.env` diretamente

### Regras de projeto (evitar regressões)

- **Toda URL de mídia** passa por `absUrl()` — nunca concatenar manualmente
- **Todo request HTTP** usa `apiClient` — nunca `fetch()` direto em componentes
- `src/server/data/` é server-only — nunca importar em Client Components
- O campo de imagem de produto é `image` (string) e `images` (array); serviços usam `imagem` (string) e `images` (array) — os nomes diferem intencionalmente
- `absUrl` conhece os prefixos de subpasta `products/`, `colaboradores/`, `logos/`, `news/`, `drones/` — ao adicionar novo módulo com uploads, adicionar o prefixo correspondente
