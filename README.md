# Kavita — Frontend

Frontend da plataforma **Kavita**, um sistema de e-commerce para o setor agropecuário, com área pública (loja, serviços, drones, notícias) e painel administrativo completo.

Construído com **Next.js 15 (App Router)**, **React 19**, **TypeScript** e **Tailwind CSS**. Consome uma API REST Node.js/Express hospedada em repositório separado ([`kavita-backend`](../kavita-backend)).

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

Novo no projeto? Comece pelo [guia de onboarding](docs/onboarding.md).

---

## Documentação

| Documento | Quando usar |
|-----------|-------------|
| [Onboarding](docs/onboarding.md) | Primeiro dia — setup, estrutura, primeiras tarefas |
| [Arquitetura](docs/frontend-architecture.md) | Entender camadas, decisões técnicas, limitações |
| [Data Fetching](docs/data-fetching.md) | Decidir entre RSC, SWR, apiClient direto |
| [Padrões de Componentes](docs/component-patterns.md) | Criar componentes, hooks, formulários |
| [Fluxos Críticos](docs/critical-flows.md) | Entender auth, checkout, pedidos, CRUD admin |
| [Manutenção](docs/maintenance-guide.md) | Adicionar features, módulos, regras do projeto |
| [Testes](docs/testing-guide.md) | Como escrever testes para componentes, hooks, utilitários |
| [Troubleshooting](docs/troubleshooting.md) | Resolver problemas de dev, testes, build |
| [Cores / Design Tokens](COLORS.md) | Adicionar ou usar cores do tema |
| [Segurança](FRONTEND_SECURITY_ALIGNMENT.md) | Auditoria, schemas Zod, CSP, contratos |

---

## Funcionalidades

### Área pública

- Catálogo de produtos com busca, filtros e navegação por categoria
- Serviços especializados com contato via WhatsApp
- Drones agrícolas com specs, galeria e representantes
- Mercado do Café com corretoras e cadastro
- Carrinho com persistência + checkout com MercadoPago
- Conta do usuário: perfil, endereços, pedidos, favoritos
- **Kavita News**: notícias, clima, cotações agrícolas
- Busca global, contato e vagas

### Painel administrativo (`/admin`)

- Dashboard com KPIs e gráficos
- CRUD de produtos, serviços, drones com upload de imagens
- Gestão de pedidos, clientes, cupons e frete
- Conteúdo: posts, clima, cotações, corretoras
- Relatórios, configurações, equipe, logs de auditoria
- Hero section com preview desktop/mobile

---

## Estrutura do projeto

```
src/
├── app/                    # Rotas (App Router)
│   ├── (root)/             # Páginas públicas
│   └── admin/              # Painel administrativo
├── components/             # Componentes por domínio (admin/, products/, ui/, ...)
├── context/                # Auth, AdminAuth, Cart
├── hooks/                  # SWR hooks, formulários, CEP
├── lib/                    # apiClient, erros, schemas Zod
├── server/data/            # Server-only data fetchers (RSC)
├── services/               # Endpoints, wrappers, lógica de negócio
├── types/                  # Tipos do domínio
└── utils/                  # absUrl, formatters, pricing
```

Detalhes de cada camada em [docs/frontend-architecture.md](docs/frontend-architecture.md).

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000     # Backend Express
NEXT_PUBLIC_API_BASE=/api                     # Prefixo das rotas
NEXT_PUBLIC_SITE_URL=http://localhost:3000    # Frontend
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=           # MercadoPago
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=             # Google Maps
NEXT_PUBLIC_WEATHER_API_KEY=                 # API de clima
NEXT_PUBLIC_APP_ENV=development              # development | production
```

> Variáveis `NEXT_PUBLIC_*` ficam expostas ao cliente. Nunca adicione segredos com esse prefixo.

---

## Scripts

```bash
npm run dev           # Desenvolvimento (localhost:3000)
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run lint          # ESLint (flat config)
npm run lint:fix      # ESLint com autofix
npm run test          # Vitest em modo watch
npm run test:run      # Execução única
npm run test:coverage # Cobertura (v8)
```

> O script de lint usa `set ESLINT_USE_FLAT_CONFIG=true&&` por compatibilidade com Windows. Não altere.

---

## Tecnologias

| Categoria | Stack |
|-----------|-------|
| Framework | Next.js 15 (App Router, RSC + Client Components) |
| UI | React 19, Tailwind CSS 3, Lucide React, Framer Motion |
| Formulários | React Hook Form 7, Zod 4 |
| HTTP | Fetch API nativo via `apiClient` (Axios removido) |
| Cache | SWR 2 |
| Gráficos | Recharts 3 |
| Testes | Vitest 4, jsdom, @testing-library/react |
| Lint | ESLint 9 (flat config), TypeScript ESLint |
| Linguagem | TypeScript 5 |

---

## Testes

**Cobertura:** ~77% statements / ~69% branches / ~71% functions

> ~46 testes em 8 arquivos falham por mocks desatualizados. A aplicação funciona normalmente. Detalhes em [troubleshooting](docs/troubleshooting.md#testes-falhando-conhecidos-mocks-desatualizados).

---

## Rotas

### Públicas

| Rota | Descrição |
|------|-----------|
| `/` | Home |
| `/produtos`, `/produtos/[id]` | Catálogo de produtos |
| `/servicos`, `/servicos/[id]` | Serviços |
| `/drones`, `/drones/[id]` | Drones |
| `/categorias/[category]` | Produtos por categoria |
| `/mercado-do-cafe/**` | Mercado do Café |
| `/checkout` | Checkout |
| `/pedidos`, `/pedidos/[id]` | Pedidos do usuário |
| `/meus-dados/**` | Perfil e endereços |
| `/favoritos` | Favoritos |
| `/news/**` | Kavita News |
| `/busca` | Busca global |
| `/login`, `/register` | Autenticação |
| `/contato`, `/trabalhe-conosco` | Contato e vagas |

### Admin (`/admin/**`)

| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard |
| `/admin/produtos` | Produtos |
| `/admin/servicos` | Serviços |
| `/admin/drones` | Drones |
| `/admin/pedidos` | Pedidos |
| `/admin/clientes` | Clientes |
| `/admin/cupons` | Cupons |
| `/admin/frete` | Frete |
| `/admin/equipe` | Equipe |
| `/admin/logs` | Logs |
| `/admin/kavita-news` | Conteúdo |
| `/admin/mercado-do-cafe` | Corretoras |
| `/admin/configuracoes` | Configurações |
| `/admin/relatorios` | Relatórios |
| `/admin/destaques` | Hero section |

---

## Status do projeto

Em desenvolvimento ativo. Estrutura principal implementada. Próximas frentes:

- Cobertura de testes em formulários admin e contextos
- Integração MercadoPago (webhook e confirmação)
- Melhorias de acessibilidade
- Otimizações de performance
- Internacionalização (i18n) — atualmente pt-BR only

---

## Licença

Uso interno. Licença a definir.
