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

### Autenticação: quatro contextos independentes

O projeto tem **quatro contextos de auth isolados**, cada um com cookie HttpOnly próprio. Nunca misture o hook de um contexto com a árvore de outro.

| Contexto | Arquivo | Provider usado em | Para quem | Cookie/Endpoint |
|---|---|---|---|---|
| `AuthContext` | `src/context/AuthContext.tsx` | `src/app/layout.tsx` (root) | usuários da loja | cookie `auth_token` via `/api/login`, `/api/users/register` |
| `AdminAuthContext` | `src/context/AdminAuthContext.tsx` | `src/app/admin/layout.tsx` | administradores | cookie `adminToken` via `/api/admin/login`, `/api/admin/me` |
| `CorretoraAuthContext` | `src/context/CorretoraAuthContext.tsx` | `src/app/painel/corretora/layout.tsx` | usuários de corretora | cookie próprio via `/api/corretora/login`, `/api/corretora/me`; também suporta **impersonação** (admin entra no painel) via `/api/corretora/exit-impersonation` |
| `ProducerAuthContext` | `src/context/ProducerAuthContext.tsx` | `src/app/painel/produtor/layout.tsx` | produtor rural | **magic-link** via `/api/public/produtor/magic-link` → cookie emitido em `/api/produtor/verify/:token`; sessão lida em `/api/produtor/me` |

Cada layout faz redirect automático para sua tela de login quando a sessão não existe:
- `/admin/*` → `/admin/login`
- `/painel/corretora/*` → `/painel/corretora/login`
- `/painel/produtor/*` → `/produtor/entrar` (magic-link)

Middleware Edge (`middleware.ts`) só protege `/admin/**` cosmeticamente (checa presença do cookie). Validação real é no backend.

### Estrutura de rotas

```
src/app/
├── (raiz)                    → home pública (HomeClient)
├── produtos/                 → listagem + [id]
├── servicos/                 → listagem + [id]
├── drones/                   → landing + [id]
├── news/                     → Kavita News (posts + clima + cotações)
├── categorias/[category]
├── mercado-do-cafe/          → hub público + corretoras, cidade, cadastro,
│                               lead-status, lote-vendido, verificação
├── checkout/                 → fluxo de compra (+ sucesso, pendente, erro)
├── favoritos/                → requer auth loja
├── meus-dados/               → perfil, endereços (auth loja)
├── pedidos/                  → meus pedidos + [id] (auth loja)
├── admin/                    → painel admin (AdminAuthProvider)
│   ├── produtos, servicos, drones, pedidos, clientes, ...
│   ├── carrinhos, cupons, destaques, frete, relatorios, ...
│   ├── mercado-do-cafe/      → moderação corretoras, planos, KYC, métricas
│   └── kavita-news, configuracoes, logs, auditoria, equipe
├── painel/
│   ├── corretora/            → dashboard, leads, contratos, reviews,
│   │                           planos, equipe, analytics, notificações
│   │                           (CorretoraAuthProvider)
│   └── produtor/             → dashboard, perfil, meus-dados, contratos
│                               (ProducerAuthProvider, magic-link)
├── produtor/entrar           → formulário público magic-link
├── login, register,
   forgot-password,
   reset-password             → fluxo auth da loja
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

### Convenção de data fetching

| Cenário | Padrão correto |
|---|---|
| Dados públicos renderizados no servidor (categorias, configurações de loja) | `src/server/data/*.ts` (server functions, `cache: "no-store"`) |
| Dados do usuário logado (pedidos, carrinho, favoritos) | `apiClient` em hook ou diretamente no componente cliente |
| Listas públicas reutilizadas (serviços, produtos) | hook em `src/hooks/` usando `apiClient` |
| Promoções por produto | `useProductPromotion(id)` — tem cache em memória, evita N+1 |
| Axios | **Proibido** — completamente removido |
| `fetch()` direto em componente | **Proibido** — usar `apiClient` ou hook |
| `process.env.NEXT_PUBLIC_API_URL` inline | **Proibido** — usar `import { API_BASE } from "@/utils/absUrl"` |

### Design Tokens de Cor

Todas as cores do tema estão centralizadas em design tokens. Veja `COLORS.md` para o catálogo completo.

| Camada | Arquivo | O que contém |
|---|---|---|
| CSS vars (fonte de verdade) | `src/app/globals.css` (`:root`) | Valores hex reais |
| Tailwind config | `tailwind.config.ts` (`colors`) | Mapeamento `nome → var(--color-*)` |
| Componentes | `src/components/`, `src/app/` | Classes Tailwind semânticas |

**Usar corretamente:**

```tsx
// Em classes Tailwind
className="bg-primary hover:bg-primary-hover text-accent"

// Em props de libs (Recharts, SVG, etc.)
fill="var(--color-chart-primary)"
stroke="var(--color-accent-bright)"

// Em objetos JS dinâmicos (inline style)
style={{ color: "var(--color-success)" }}
```

**Proibido:**
- `bg-[#359293]` ou qualquer hex arbitrário em classes Tailwind — usar o token semântico
- Criar cor nova direto no componente sem registrar em `globals.css` + `tailwind.config.ts`
- Duplicar hex que já existe como token — buscar o token correspondente

Cores Tailwind padrão (gray, red, slate, white, black) podem ser usadas normalmente para UI neutra.

### Regras de projeto (evitar regressões)

- **Toda URL de mídia** passa por `absUrl()` — nunca concatenar manualmente
- **Todo request HTTP** usa `apiClient` — nunca `fetch()` direto em componentes
- **`API_BASE`** sempre importado de `@/utils/absUrl`, nunca redefinido localmente
- `src/server/data/` é server-only — nunca importar em Client Components
- O campo de imagem de produto é `image` (string) e `images` (array); serviços usam `imagem` (string) e `images` (array) — os nomes diferem intencionalmente
- `absUrl` conhece os prefixos de subpasta `products/`, `colaboradores/`, `logos/`, `news/`, `drones/` — ao adicionar novo módulo com uploads, adicionar o prefixo correspondente
- `console.log` com debug/trace é proibido em produção — usar `console.warn`/`console.error` apenas para erros reais
- **Toda cor de tema** usa design tokens — nunca hex hardcoded em classes Tailwind (ver seção acima)
