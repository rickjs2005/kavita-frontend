# Kavita — Frontend

Frontend da plataforma **Kavita**, um sistema de e-commerce para o setor agropecuário, com área pública (loja, serviços, drones, notícias) e painel administrativo completo.

Construído com **Next.js 15 (App Router)**, **React 19**, **TypeScript** e **Tailwind CSS**. Consome uma API REST Node.js/Express hospedada em repositório separado ([`kavita-backend`](../kavita-backend)).

---

## Sumário

- [Objetivo](#objetivo)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Rotas da aplicação](#rotas-da-aplicação)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução local](#instalação-e-execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Arquitetura e padrões](#arquitetura-e-padrões)
- [Autenticação](#autenticação)
- [Segurança](#segurança)
- [Testes](#testes)
- [Status do projeto](#status-do-projeto)

---

## Objetivo

Kavita é uma plataforma para comercialização de produtos agrícolas, serviços especializados (veterinários, agrônomos, mecânicos) e drones agrícolas. Além da loja, oferece um hub de conteúdo chamado **Kavita News**, com clima, cotações de mercado e artigos.

O painel administrativo permite gerenciar todo o conteúdo, pedidos, clientes, relatórios e configurações da plataforma.

---

## Funcionalidades

### Área pública

- Catálogo de produtos com busca, filtros e navegação por categoria
- Listagem e detalhes de serviços especializados (contato via WhatsApp integrado)
- Catálogo de drones com especificações técnicas, galeria e representantes
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
- Relatórios: vendas, produtos, serviços, estoque, clientes
- Configurações da loja, categorias e usuários administrativos
- Logs de auditoria de ações administrativas

---

## Tecnologias

| Categoria | Tecnologias |
|---|---|
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
│
├── components/             # Componentes React
│   ├── admin/              # Componentes exclusivos do painel admin
│   ├── auth/               # Formulários de autenticação
│   ├── cart/               # Carrinho de compras
│   ├── checkout/           # Fluxo de checkout
│   ├── drones/             # Seções da página de drones
│   ├── layout/             # Header, Footer, HeroSection, etc.
│   ├── products/           # Cards e listagens de produtos
│   ├── news/               # Kavita News
│   └── ui/                 # Componentes compartilhados (LoadingState, ErrorState, etc.)
│
├── context/                # React Context
│   ├── AuthContext.tsx      # Autenticação de usuários da loja
│   ├── AdminAuthContext.tsx # Autenticação de administradores
│   └── CartContext.tsx      # Estado do carrinho
│
├── hooks/                  # Custom hooks (fetch de dados, formulários, CEP, etc.)
├── lib/                    # HTTP client, schemas Zod, tratamento de erros
├── server/                 # Funções server-only (RSC data fetching)
│   └── data/               # Categorias, configurações da loja
├── services/api/           # Constantes de endpoints e wrappers de API
├── types/                  # Tipos TypeScript do domínio
└── utils/                  # Funções auxiliares (formatters, absUrl, pricing, etc.)
```

---

## Rotas da aplicação

### Públicas

| Rota | Descrição |
|---|---|
| `/` | Home |
| `/produtos`, `/produtos/[id]` | Catálogo de produtos |
| `/servicos`, `/servicos/[id]` | Catálogo de serviços |
| `/drones`, `/drones/[id]` | Catálogo de drones |
| `/categorias/[category]` | Produtos por categoria |
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
|---|---|
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
| `/admin/configuracoes` | Categorias e configurações |
| `/admin/relatorios` | Relatórios (vendas, estoque, clientes...) |
| `/admin/destaques` | Destaques e hero section |

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Backend `kavita-backend` rodando em `localhost:5000` (ou conforme `.env.local`)

---

## Instalação e execução local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/kavita-frontend.git
cd kavita-frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

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
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=      # Google Maps (seção de representantes)
NEXT_PUBLIC_WEATHER_API_KEY=          # API de clima (Kavita News)

# Ambiente
NEXT_PUBLIC_APP_ENV=development       # development | production
```

> Todas as variáveis com prefixo `NEXT_PUBLIC_` ficam expostas ao cliente. Nunca adicione segredos com esse prefixo.

---

## Scripts disponíveis

```bash
npm run dev           # Inicia em modo desenvolvimento (localhost:3000)
npm run build         # Build de produção
npm run start         # Inicia o servidor de produção
npm run lint          # Verifica erros de lint (ESLint flat config)
npm run lint:fix      # Corrige problemas de lint automaticamente
npm run test          # Vitest em modo watch
npm run test:run      # Vitest — execução única
npm run test:coverage # Vitest com relatório de cobertura (v8)
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

Nunca construa URLs de upload concatenando strings manualmente — isso quebra quando `NEXT_PUBLIC_API_URL` tem trailing slash ou o path varia de formato.

### Validação de formulários

Formulários usam React Hook Form com resolvers Zod. Os schemas estão em `src/lib/schemas/`.

### Endpoints centralizados

Todas as constantes de URL ficam em `src/services/api/endpoints.ts`. Evite strings de URL espalhadas nos componentes.

---

## Autenticação

O sistema tem dois contextos de autenticação independentes:

### Usuários da loja (`AuthContext`)

- Sessão via cookie HttpOnly (gerenciado pelo backend)
- Verificação na inicialização: `GET /api/users/me`
- Login: `POST /api/login` | Logout: `POST /api/logout`
- Registro: `POST /api/users/register`
- Validação do payload com Zod (`AuthUserSchema`)
- Hook de acesso: `useAuth()`

### Administradores (`AdminAuthContext`)

- Sessão via cookie HttpOnly (`adminToken`)
- Verificação: `GET /api/admin/me`
- Permissões sempre buscadas do servidor (nunca armazenadas localmente)
- Papéis disponíveis: `master`, `gerente`, `suporte`, `leitura`
- O layout `/admin` redireciona automaticamente para `/admin/login` sem sessão válida
- Respostas 401 disparam o evento global `"auth:expired"` para encerramento centralizado da sessão
- Hook de acesso: `useAdminAuth()`

> As duas autenticações são completamente independentes. Nunca misture `useAuth()` em contexto admin ou `useAdminAuth()` em contexto de loja.

---

## Segurança

### CSRF

Token buscado de `/api/csrf-token` (cache de 10 min, deduplicado) e injetado automaticamente pelo `apiClient` no header `x-csrf-token` em todas as mutations.

### Content Security Policy (CSP)

- Rotas `/admin/**`: CSP restrita com `frame-ancestors 'none'`
- Rotas públicas: CSP padrão com `frame-ancestors 'self'`
- `unsafe-inline` mantido em `script-src` (scripts injetados pelo Next.js) e `style-src` (react-hot-toast) — documentado em `next.config.ts`
- Em produção: `upgrade-insecure-requests` e HSTS ativo

### Headers de segurança (todas as rotas)

| Header | Valor |
|---|---|
| `X-Frame-Options` | `SAMEORIGIN` (público) / `DENY` (admin) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

### XSS

- `sanitizeAsText()` e `sanitizeAsTextWithLineBreaks()` para escaping de conteúdo dinâmico
- `sanitizeUrl()` para validação de URLs antes de uso em `href`
- URLs de imagem sempre processadas por `absUrl()`, nunca concatenadas manualmente

### Auditoria

Ações administrativas são registradas e consultáveis em `/admin/logs`.

---

## Testes

**Framework:** Vitest + jsdom + @testing-library/react

```bash
npm run test:run      # Execução única
npm run test:coverage # Com relatório de cobertura
npx vitest run src/__tests__/components/Header.test.tsx  # Arquivo específico
```

**Convenções:**

- Estrutura de `src/__tests__/` espelha `src/`
- Mocks de módulos com `vi.mock()` (sempre estáticos, hoistados pelo Vitest)
- Variáveis de ambiente em testes via `vi.stubEnv()` — nunca mutando `process.env` diretamente
- `server-only` mapeado para mock em `src/__tests__/mocks/server-only.ts`
- Datas locais usam `new Date(ano, mês, dia)` para evitar diferenças de fuso horário
- Coverage exclui `src/app/**` (páginas RSC são testadas via integração)

**Cobertura atual:** ~77% statements / ~69% branches / ~71% functions

---

## Status do projeto

O projeto está em desenvolvimento ativo. A estrutura principal está implementada — loja pública, painel administrativo, autenticação, checkout e Kavita News. As próximas frentes de trabalho incluem:

- Aumentar cobertura de testes nas áreas de formulários admin e contextos de autenticação
- Consolidar integração com MercadoPago (webhook e confirmação de pagamento)
- Melhorias de acessibilidade nos componentes de formulário
- Otimizações de performance (lazy loading, prefetch seletivo)
- Internacionalização (i18n) — atualmente o sistema é pt-BR only

---

## Observações de desenvolvimento

- **Backend separado:** o repositório `kavita-backend` deve estar rodando em `localhost:5000` para o desenvolvimento funcionar. Configure `NEXT_PUBLIC_API_URL` para outros ambientes.
- **Imagens:** servidas via `http://localhost:5000/uploads/`. Use sempre `absUrl()` — nunca `${API_BASE}${campo}`.
- **Nomes de campos:** produtos usam `image` (singular) e `images` (array); serviços usam `imagem` e `images`. Os nomes diferem intencionalmente entre os módulos.
- **`console.log` de debug é proibido em produção.** Use `console.warn` / `console.error` apenas para erros reais.
- **Axios foi completamente removido.** Não reintroduza como dependência.
- **`process.env.NEXT_PUBLIC_API_URL` inline é proibido.** Sempre importe `API_BASE` de `@/utils/absUrl`.

---

## Licença

Uso interno. Licença a definir.
