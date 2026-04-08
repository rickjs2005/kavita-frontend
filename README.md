# Kavita — Frontend

Frontend da plataforma **Kavita**, um sistema de e-commerce para o setor agropecuário, com área pública (loja, serviços, drones, notícias) e painel administrativo completo.

Construído com **Next.js 15 (App Router)**, **React 19**, **TypeScript** e **Tailwind CSS**. Consome uma API REST Node.js/Express hospedada em repositório separado ([`kavita-backend`](../kavita-backend)).

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [Onboarding](docs/onboarding.md) | Guia para novos desenvolvedores — setup, estrutura, primeiros passos |
| [Arquitetura Frontend](docs/frontend-architecture.md) | Camadas, decisões técnicas, responsabilidades |
| [Data Fetching](docs/data-fetching.md) | Quando usar RSC, hooks SWR, apiClient direto |
| [Padrões de Componentes](docs/component-patterns.md) | Como criar componentes, hooks, formulários |
| [Fluxos Críticos](docs/critical-flows.md) | Auth, checkout, pedidos, CRUD admin, upload |
| [Guia de Manutenção](docs/maintenance-guide.md) | Como adicionar features, módulos, campos |
| [Troubleshooting](docs/troubleshooting.md) | Problemas comuns e soluções |
| [Sistema de Cores](COLORS.md) | Design tokens, catálogo, regras de uso |
| [Segurança Frontend](FRONTEND_SECURITY_ALIGNMENT.md) | Auditoria, schemas Zod, CSP, contratos com backend |

---

## Quick start

```bash
git clone <url-do-repositorio>/kavita-frontend.git
cd kavita-frontend
npm install
cp .env.example .env.local    # ajuste se necessário
npm run dev                    # → http://localhost:3000
```

**Pré-requisitos:** Node.js 20+, npm 10+, backend rodando em `localhost:5000`.

Para o guia completo de setup, veja [docs/onboarding.md](docs/onboarding.md).

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Rotas da aplicação](#rotas-da-aplicação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Arquitetura e padrões](#arquitetura-e-padrões)
- [Autenticação](#autenticação)
- [Segurança](#segurança)
- [Testes](#testes)
- [Status do projeto](#status-do-projeto)

---

## Funcionalidades

### Área pública

- Catálogo de produtos com busca, filtros e navegação por categoria
- Listagem e detalhes de serviços especializados (contato via WhatsApp integrado)
- Catálogo de drones com especificações técnicas, galeria e representantes
- Mercado do Café com listagem de corretoras e cadastro
- Carrinho de compras com persistência (usuário autenticado e anônimo)
- Checkout com seleção de endereço, aplicação de cupom, cálculo de frete e integração com MercadoPago
- Conta do usuário: perfil, endereços, histórico de pedidos, favoritos
- **Kavita News**: notícias, informações climáticas, cotações agrícolas
- Busca global, página de contato e área de vagas

### Painel administrativo (`/admin`)

- Dashboard com KPIs e gráficos de vendas
- Gestão de produtos, serviços e drones (CRUD completo com upload de imagens)
- Gestão de pedidos e clientes
- Gestão de cupons e frete
- Gerenciamento de conteúdo (posts, dados de clima, cotações)
- Mercado do Café: corretoras e solicitações
- Relatórios: vendas, produtos, serviços, estoque, clientes
- Configurações da loja, categorias e usuários administrativos
- Destaques e hero section com preview desktop/mobile
- Logs de auditoria de ações administrativas

---

## Tecnologias

| Categoria | Tecnologias |
|-----------|-------------|
| Framework | Next.js 15 (App Router, RSC + Client Components) |
| UI | React 19, Tailwind CSS 3, Lucide React, Framer Motion |
| Formulários | React Hook Form 7, Zod 4 |
| HTTP | Fetch API nativo (via `apiClient` interno — Axios removido) |
| Dados/Cache | SWR 2 |
| Gráficos | Recharts 3 |
| Testes | Vitest 4, jsdom, @testing-library/react |
| Lint | ESLint 9 (flat config), TypeScript ESLint |
| Linguagem | TypeScript 5 |

---

## Estrutura do projeto

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (root)/             # Páginas públicas
│   └── admin/              # Painel administrativo
├── components/             # Componentes React (por domínio)
│   ├── admin/              # Exclusivos do painel admin
│   ├── products/           # Cards e listagens de produtos
│   ├── ui/                 # Compartilhados (LoadingState, ErrorState, etc.)
│   └── ...
├── context/                # React Contexts (Auth, AdminAuth, Cart)
├── hooks/                  # Custom hooks (SWR, formulários, CEP)
├── lib/                    # Infraestrutura (apiClient, erros, schemas Zod)
├── server/data/            # Server-only data fetchers (RSC)
├── services/api/           # Constantes de endpoints e wrappers
├── types/                  # Tipos TypeScript do domínio
└── utils/                  # Funções auxiliares (absUrl, formatters, pricing)
```

Para detalhes de cada camada, veja [docs/frontend-architecture.md](docs/frontend-architecture.md).

---

## Rotas da aplicação

### Públicas

| Rota | Descrição |
|------|-----------|
| `/` | Home |
| `/produtos`, `/produtos/[id]` | Catálogo de produtos |
| `/servicos`, `/servicos/[id]` | Catálogo de serviços |
| `/drones`, `/drones/[id]` | Catálogo de drones |
| `/categorias/[category]` | Produtos por categoria |
| `/mercado-do-cafe/**` | Mercado do Café (corretoras, cadastro) |
| `/checkout` | Carrinho e checkout |
| `/pedidos`, `/pedidos/[id]` | Histórico de pedidos |
| `/meus-dados/**` | Perfil, endereços |
| `/favoritos` | Lista de favoritos |
| `/news/**` | Kavita News (artigos, clima, cotações) |
| `/busca` | Busca global |
| `/login`, `/register` | Autenticação de usuários |
| `/contato`, `/trabalhe-conosco` | Contato e vagas |

### Administrativas (`/admin/**`)

| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard |
| `/admin/produtos` | Gestão de produtos |
| `/admin/servicos` | Gestão de serviços |
| `/admin/drones` | Gestão de drones |
| `/admin/pedidos` | Gestão de pedidos |
| `/admin/clientes` | Gestão de clientes |
| `/admin/cupons` | Cupons de desconto |
| `/admin/frete` | Configuração de frete |
| `/admin/equipe` | Usuários administrativos |
| `/admin/logs` | Logs de auditoria |
| `/admin/kavita-news` | Gestão de conteúdo |
| `/admin/mercado-do-cafe` | Corretoras e solicitações |
| `/admin/configuracoes` | Categorias e configurações |
| `/admin/relatorios` | Relatórios (vendas, estoque, clientes) |
| `/admin/destaques` | Destaques e hero section |

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e ajuste os valores:

```env
# URL base do backend Express
NEXT_PUBLIC_API_URL=http://localhost:5000

# Prefixo das rotas da API
NEXT_PUBLIC_API_BASE=/api

# URL base do frontend
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Integrações de terceiros
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=   # Chave pública do MercadoPago
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=      # Google Maps (representantes)
NEXT_PUBLIC_WEATHER_API_KEY=          # API de clima (Kavita News)

# Ambiente
NEXT_PUBLIC_APP_ENV=development       # development | production
```

> Todas as variáveis com prefixo `NEXT_PUBLIC_` ficam expostas ao cliente. Nunca adicione segredos com esse prefixo.

---

## Scripts disponíveis

```bash
npm run dev           # Desenvolvimento (localhost:3000)
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run lint          # ESLint (flat config)
npm run lint:fix      # ESLint com autofix
npm run test          # Vitest em modo watch
npm run test:run      # Vitest — execução única
npm run test:coverage # Vitest com cobertura (v8)
```

> O script de lint usa `set ESLINT_USE_FLAT_CONFIG=true&&` explicitamente por compatibilidade com Windows. Não altere essa linha.

---

## Arquitetura e padrões

### RSC + Client Components

Páginas públicas seguem o padrão de busca no servidor com repasse para o cliente:

```
src/app/page.tsx (RSC, async)
  └─ fetchPublicCategories() → src/server/data/categories.ts
  └─ passa props para HomeClient (Client Component)
```

Os fetchers em `src/server/data/` são marcados com `server-only` e nunca devem ser importados em Client Components.

Para detalhes completos sobre data fetching, veja [docs/data-fetching.md](docs/data-fetching.md).

### HTTP client

Todo request HTTP usa `apiClient` de `@/lib/apiClient`:

```ts
import apiClient from "@/lib/apiClient";

apiClient.get("/api/public/produtos")
apiClient.post("/api/admin/produtos", payload)
```

O cliente gerencia automaticamente:
- `credentials: "include"` para rotas `/api`, `"omit"` para `/uploads`
- Token CSRF (`x-csrf-token`) injetado em POST/PUT/PATCH/DELETE
- Timeout padrão de 15s
- Erros padronizados como `ApiError` (importar de `@/lib/errors`)

Não use `fetch()` diretamente em componentes. O uso de Axios é proibido e foi completamente removido.

### URLs de imagem

Use sempre `absUrl()` de `@/utils/absUrl`:

```ts
import { absUrl } from "@/utils/absUrl";

absUrl(produto.image) // → "http://localhost:5000/uploads/products/arquivo.jpg"
```

Nunca construa URLs de upload concatenando strings manualmente.

### Validação de respostas da API

Respostas críticas são validadas com Zod (schemas em `src/lib/schemas/api.ts`):

```ts
import { strictParse, AuthUserSchema } from "@/lib/schemas/api";

const user = strictParse(AuthUserSchema, response);
```

---

## Autenticação

Dois contextos independentes:

| | Usuários da loja | Administradores |
|---|---|---|
| **Context** | `AuthContext` | `AdminAuthContext` |
| **Hook** | `useAuth()` | `useAdminAuth()` |
| **Cookie** | Cookie HttpOnly | `adminToken` (HttpOnly) |
| **Validação** | Zod `AuthUserSchema` | Zod `AdminUserSchema` |

> As duas autenticações são completamente independentes. Nunca misture `useAuth()` em contexto admin ou `useAdminAuth()` em contexto de loja.

Para detalhes, veja [docs/critical-flows.md](docs/critical-flows.md#login-do-usuário).

---

## Segurança

| Proteção | Implementação |
|----------|---------------|
| **CSRF** | Token automático via apiClient (cache 10min, dedup) |
| **CSP** | Headers separados para admin (restrito) e público |
| **XSS** | Zero `dangerouslySetInnerHTML`, `sanitizeUrl()` em redirects |
| **Auth** | Cookies HttpOnly, validação Zod de responses |
| **Headers** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS |

Para detalhes completos, veja [FRONTEND_SECURITY_ALIGNMENT.md](FRONTEND_SECURITY_ALIGNMENT.md).

---

## Testes

**Framework:** Vitest + jsdom + @testing-library/react

```bash
npm run test:run                                     # Execução única
npm run test:coverage                                # Com cobertura
npx vitest run src/__tests__/components/Header.test.tsx  # Arquivo específico
```

**Convenções:**
- Estrutura de `src/__tests__/` espelha `src/`
- Mocks via `vi.mock()` (sempre estáticos, hoistados)
- Variáveis de ambiente via `vi.stubEnv()` (nunca `process.env` direto)
- Coverage exclui `src/app/**` (páginas RSC testadas via integração)

**Cobertura:** ~77% statements / ~69% branches / ~71% functions

---

## Status do projeto

O projeto está em desenvolvimento ativo. A estrutura principal está implementada — loja pública, painel administrativo, autenticação, checkout e Kavita News. As próximas frentes de trabalho incluem:

- Aumentar cobertura de testes nas áreas de formulários admin e contextos
- Consolidar integração com MercadoPago (webhook e confirmação)
- Melhorias de acessibilidade nos formulários
- Otimizações de performance (lazy loading, prefetch seletivo)
- Internacionalização (i18n) — atualmente pt-BR only

---

## Regras de projeto

| Regra | Motivo |
|-------|--------|
| Toda URL de mídia passa por `absUrl()` | Trata todos os formatos, evita URLs quebradas |
| Todo request HTTP usa `apiClient` | Credentials, CSRF, timeout, erros automáticos |
| `API_BASE` importado de `@/utils/absUrl` | Evita divergência entre contextos |
| `server/data/` é server-only | Previne import em Client Components |
| Design tokens para cores | Consistência visual centralizada |
| Sem `console.log` de debug | Proibido em produção |
| Sem Axios | Removido — `apiClient` é o padrão único |
| Nomes de campos de imagem | Produtos: `image`/`images`. Serviços: `imagem`/`images`. Intencional. |

---

## Licença

Uso interno. Licença a definir.
