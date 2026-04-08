# Onboarding — Frontend Kavita

Guia prático para um novo desenvolvedor começar a contribuir no frontend. Siga na ordem — cada seção prepara para a próxima.

---

## Sumário

- [Setup local](#setup-local)
- [Verificação do ambiente](#verificação-do-ambiente)
- [Entendendo o projeto](#entendendo-o-projeto)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como o frontend se comunica com o backend](#como-o-frontend-se-comunica-com-o-backend)
- [Autenticação — o que você precisa saber](#autenticação--o-que-você-precisa-saber)
- [Dados mínimos para desenvolvimento](#dados-mínimos-para-desenvolvimento)
- [O que você vai encontrar (e não é bug)](#o-que-você-vai-encontrar-e-não-é-bug)
- [Seus primeiros 3 dias](#seus-primeiros-3-dias)
- [Onde encontrar o quê](#onde-encontrar-o-quê)
- [Erros comuns de quem está começando](#erros-comuns-de-quem-está-começando)
- [Ordem de leitura dos docs](#ordem-de-leitura-dos-docs)

---

## Setup local

### Pré-requisitos

| Ferramenta | Versão mínima | Como verificar |
|------------|---------------|----------------|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Git | 2.x | `git --version` |
| Backend | — | `kavita-backend` rodando em `localhost:5000` |

Conhecimento esperado: React, TypeScript, Tailwind CSS. Next.js App Router é desejável mas não obrigatório.

### Passo a passo

```bash
# 1. Clone e instale
git clone <url-do-repositorio>/kavita-frontend.git
cd kavita-frontend
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env.local
# Os defaults funcionam para desenvolvimento local com backend em localhost:5000

# 3. Inicie o backend (em outro terminal)
cd ../kavita-backend
npm run dev

# 4. Inicie o frontend
cd ../kavita-frontend
npm run dev
# → http://localhost:3000
```

---

## Verificação do ambiente

Após `npm run dev`, valide cada item antes de seguir:

| Verificação | Como testar | Esperado |
|-------------|-------------|----------|
| Home carrega | Acesse `http://localhost:3000` | Hero carousel + categorias visíveis |
| Catálogo funciona | Clique em "Produtos" | Lista de produtos com cards |
| Admin acessível | Acesse `http://localhost:3000/admin/login` | Tela de login admin |
| Imagens carregam | Veja se os cards de produto têm foto | Imagens do backend em `localhost:5000/uploads/` |
| Testes rodam | `npm run test:run` | ~1470 passam. **~46 falham** — é esperado (veja abaixo) |

### Sobre os testes falhando

Ao rodar `npm run test:run` pela primeira vez, **~46 testes falham em 8 arquivos**. Isso é um problema conhecido — não significa que você quebrou algo.

**Causa:** Alguns mocks usam a exportação nomeada legada `apiRequest` em vez do `default` export atual do `apiClient`.

**Arquivos afetados:** `apiClient.csrf.test.ts`, `newsPublicApi.test.ts`, `useCotacoesAdmin.test.tsx`, `products.test.ts` (services), `DeleteButton.test.tsx`, `ProductCard.test.tsx`, `ProdutoForm.test.tsx`.

**O que fazer:** Ignore durante o onboarding. Detalhes da correção em [troubleshooting.md](./troubleshooting.md#testes-falhando-conhecidos-mocks-desatualizados).

---

## Entendendo o projeto

Kavita é uma plataforma de e-commerce agrícola com duas áreas:

- **Área pública** (`/`): loja com produtos, serviços, drones, Kavita News, checkout com MercadoPago
- **Painel admin** (`/admin`): gestão completa de conteúdo, pedidos, clientes, relatórios

O frontend é um Next.js 15 (App Router) que consome uma API REST Express em repositório separado (`kavita-backend`). Autenticação é por cookies HttpOnly — o frontend não armazena tokens.

### Conceitos-chave

Estes são os pilares do projeto. Entender esses 7 itens desbloqueia o resto:

| Conceito | O que é | Arquivo |
|----------|---------|---------|
| `apiClient` | Cliente HTTP único — CSRF, credentials, timeout, error handling | `src/lib/apiClient.ts` |
| `absUrl()` | Normaliza URLs de imagens/uploads para URL absoluta | `src/utils/absUrl.ts` |
| `AuthContext` | Autenticação da loja (cookie HttpOnly, Zod validation) | `src/context/AuthContext.tsx` |
| `AdminAuthContext` | Autenticação do admin (permissões do servidor, nunca localStorage) | `src/context/AdminAuthContext.tsx` |
| `CartContext` | Carrinho (composto por 5 sub-hooks em `context/cart/`) | `src/context/CartContext.tsx` |
| Server Data | Fetchers server-side para dados públicos (RSC) | `src/server/data/*.ts` |
| Schemas Zod | Validação de respostas da API em fluxos críticos | `src/lib/schemas/api.ts` |

---

## Estrutura de pastas

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── page.tsx            # Home (RSC → HomeClient)
│   ├── layout.tsx          # Root layout (providers, header, footer)
│   ├── globals.css         # CSS global + design tokens (cores)
│   ├── produtos/           # Catálogo de produtos
│   ├── servicos/           # Catálogo de serviços
│   ├── checkout/           # Fluxo de checkout (multi-step)
│   ├── admin/              # Painel administrativo (layout próprio)
│   │   ├── layout.tsx      # Auth guard + sidebar
│   │   ├── produtos/       # CRUD de produtos
│   │   ├── pedidos/        # Gestão de pedidos
│   │   └── ...
│   └── ...
│
├── components/             # Componentes React (por domínio)
│   ├── admin/              # Exclusivos do painel (sidebar, forms, tables)
│   ├── products/           # Cards, grid, listagem
│   ├── checkout/           # Formulários do checkout
│   ├── layout/             # Header, Footer, HeroCarousel
│   ├── ui/                 # Compartilhados: LoadingState, ErrorState, EmptyState
│   └── ...
│
├── context/                # React Contexts
│   ├── AuthContext.tsx      # Auth de usuários
│   ├── AdminAuthContext.tsx # Auth de admins
│   └── CartContext.tsx      # Carrinho (orquestrador)
│       └── cart/            # Sub-hooks: actions, sync, persistence, calculations, utils
│
├── hooks/                  # Custom hooks
│   ├── useAdminResource.ts # CRUD genérico para admin (SWR)
│   ├── useFetchProducts.ts # Busca de produtos (SWR)
│   ├── useCheckoutForm.ts  # Estado do formulário de checkout
│   └── ...
│
├── lib/                    # Infraestrutura
│   ├── apiClient.ts        # Cliente HTTP (401 linhas, bem comentado)
│   ├── errors.ts           # ApiError + isApiError()
│   ├── schemas/api.ts      # Schemas Zod (12 schemas)
│   └── ...
│
├── server/data/            # Server-only data fetchers (RSC)
├── services/               # Endpoints, wrappers, lógica de negócio
├── types/                  # Tipos do domínio (15 arquivos)
└── utils/                  # Funções auxiliares (absUrl, formatters, pricing)
```

### Regra de ouro

| Camada | Responsabilidade | Importado por |
|--------|-----------------|---------------|
| `server/data/` | Buscar dados no servidor (RSC) | Apenas `page.tsx` server-side |
| `hooks/` | Buscar dados no cliente (SWR) | Client Components |
| `context/` | Estado global (auth, carrinho) | Client Components |
| `lib/` | Infraestrutura (HTTP, erros, schemas) | Qualquer camada |
| `components/` | UI e lógica de apresentação | Páginas e componentes |
| `services/` | Endpoints e lógica de negócio | Hooks e componentes |
| `utils/` | Funções puras | Qualquer camada |
| `types/` | Tipos de domínio | Qualquer camada |

---

## Como o frontend se comunica com o backend

Todo request HTTP em Client Components passa pelo `apiClient`:

```
Componente/Hook
  └─ apiClient.get("/api/public/produtos")
       ├─ Resolve URL absoluta
       ├─ Injeta credentials (include para /api, omit para /uploads)
       ├─ Se mutation: injeta CSRF token automaticamente
       ├─ Aplica timeout (15s padrão)
       ├─ Se 401: dispara evento global "auth:expired"
       ├─ Parse defensivo (JSON → texto → null)
       ├─ Unwrap envelope { ok: true, data: ... }
       └─ Retorna dados ou lança ApiError
```

Para dados públicos renderizados no servidor (home, detalhe de produto, news), usam-se os fetchers em `src/server/data/` que fazem `fetch()` direto — isso é correto para RSC.

> Para regras de quando usar qual padrão, veja [Data Fetching](./data-fetching.md). Para a lista completa de proibições, veja [Regras de projeto](./maintenance-guide.md#regras-de-projeto).

---

## Autenticação — o que você precisa saber

Existem **dois sistemas de autenticação completamente independentes**:

| | Loja | Admin |
|---|---|---|
| **Context** | `AuthContext` | `AdminAuthContext` |
| **Hook** | `useAuth()` | `useAdminAuth()` |
| **Cookie** | HttpOnly padrão | `adminToken` (HttpOnly) |
| **Login** | `POST /api/login` | `POST /api/admin/login` |

**Nunca** misture `useAuth()` em contexto admin ou `useAdminAuth()` em contexto de loja.

O middleware Edge (`middleware.ts` na raiz) protege todas as rotas `/admin/*` verificando presença do cookie. A validação real (JWT, permissões) é no backend.

Veja [Fluxos Críticos](./critical-flows.md#login-do-usuário) para detalhes dos fluxos de login.

---

## Dados mínimos para desenvolvimento

Para navegar pela loja e testar o admin, o banco precisa ter alguns dados. Verifique com a equipe ou com o setup do backend:

| O que é necessário | Por quê | Como verificar |
|--------------------|---------|----------------|
| Pelo menos 1 categoria ativa | Home mostra categorias na navegação | Home exibe menu de categorias |
| Pelo menos 2-3 produtos | Catálogo e cards precisam de dados | `/produtos` mostra cards |
| 1 usuário admin com role `master` | Acesso completo ao painel admin | Login em `/admin/login` funciona |
| 1 usuário de loja | Testar login, carrinho, checkout | Login em `/login` funciona |
| Hero slide ativo (opcional) | Carousel da home | Home mostra banner |

Se o banco estiver vazio:
- A home vai carregar mas sem categorias nem hero (é esperado — fallback para arrays vazios)
- O admin vai funcionar mas sem dados para listar
- O checkout precisa de pelo menos 1 produto no carrinho para testar

> O backend pode ter um script de seed. Verifique `kavita-backend/` por scripts de `seed` ou `setup`.

---

## O que você vai encontrar (e não é bug)

Estas são limitações e inconsistências reais do projeto. São coisas que você precisa saber para não perder tempo:

| O que você vai ver | O que é | O que fazer |
|--------------------|---------|-------------|
| ~46 testes falhando | Mocks desatualizados (`apiRequest` legado) | Ignorar no onboarding. Veja [troubleshooting](./troubleshooting.md#testes-falhando-conhecidos-mocks-desatualizados) |
| `alert()` no admin | Padrão legado em pedidos, produtos, serviços, equipe | Código novo deve usar `toast` |
| Arquivos de 500-758 linhas | `pedidos/page.tsx` (758), `useCheckoutState.ts` (674), `produtoform.tsx` (530) | Funcionam. Candidatos a refatoração futura |
| `produtoform.tsx` em lowercase | Violação de naming. Restante do projeto usa PascalCase | Não renomear (impacto em imports) |
| Nenhum `error.tsx` | Sem error boundaries. Crash de componente = tela branca | Limitação conhecida |
| Nenhum `not-found.tsx` | 404 mostra página padrão do Next.js | Limitação conhecida |
| Apenas 2 `loading.tsx` | Só `produtos/[id]` e `news/cotacoes` têm skeleton | Demais rotas não têm loading state |
| `as any` em vários arquivos | Principalmente hooks admin e checkout | Priorize tipar ao trabalhar nesses arquivos |
| Páginas RSC como wrapper vazio | `/produtos`, `/servicos` delegam tudo para Client Component | Funciona, mas não aproveita RSC. Padrão correto em `/` e `/produtos/[id]` |

---

## Seus primeiros 3 dias

### Dia 1 — Conhecer o ambiente

**Objetivo:** navegar pela aplicação e confirmar que tudo funciona.

1. Siga o [setup local](#setup-local) e a [verificação do ambiente](#verificação-do-ambiente)
2. Navegue pela loja pública:
   - Home → clique em uma categoria → veja um produto → adicione ao carrinho
   - Abra o checkout (precisa estar logado)
3. Navegue pelo admin:
   - Login em `/admin/login`
   - Dashboard → Produtos → abra o formulário de edição de um produto
   - Pedidos → veja a lista e os status
4. Rode `npm run test:run` — confirme que ~1470 passam (~46 falham — é esperado)

**Ao final do dia 1:** Você conhece as duas áreas da aplicação e sabe que o ambiente está funcional.

### Dia 2 — Entender a infraestrutura

**Objetivo:** ler os 3 arquivos mais importantes do projeto.

5. **Leia `src/lib/apiClient.ts`** — 401 linhas, mas bem comentado. É o padrão HTTP de todo o projeto. Entenda: CSRF, credentials, 401 handling, envelope unwrap.

6. **Leia `src/context/AuthContext.tsx`** — 181 linhas. Entenda: como login funciona, Zod validation de responses, email nunca como fallback.

7. **Leia `src/hooks/useAdminResource.ts`** — 256 linhas. Entenda: CRUD genérico com SWR, auth handling (401→redirect), response unwrapping. Este hook é usado pela maioria das páginas admin.

**Ao final do dia 2:** Você entende como o frontend busca dados, autentica e gerencia CRUD.

### Dia 3 — Primeira contribuição

**Objetivo:** fazer uma alteração real, testar e entender o fluxo de contribuição.

**Tarefa guiada (escolha uma):**

**Opção A — Componente + teste:**
1. Abra `src/components/ui/EmptyState.tsx` e leia o componente (98 linhas, 3 variants)
2. Abra `src/__tests__/components/EmptyState.test.tsx` e leia os testes existentes
3. Adicione uma prop `icon` opcional ao EmptyState (aceita um componente React, ex: ícone Lucide)
4. Quando `icon` for passado, renderize antes da mensagem
5. Escreva um teste que verifica: se `icon` não é passado, o ícone padrão aparece; se `icon` é passado, o custom icon aparece
6. Rode `npx vitest run src/__tests__/components/EmptyState.test.tsx` para validar

**Opção B — Utilitário + teste:**
1. Abra `src/lib/formatApiError.ts` e leia o utilitário
2. Abra `src/__tests__/lib/formatApiError.test.ts` e leia os testes
3. Altere a mensagem padrão para erro de rede (quando não é ApiError) para algo mais descritivo
4. Atualize o teste correspondente
5. Rode `npx vitest run src/__tests__/lib/formatApiError.test.ts` para validar

**Ao final do dia 3:** Você fez uma alteração, escreveu/atualizou um teste e entende o fluxo de desenvolvimento.

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

## Erros comuns de quem está começando

Os erros mais frequentes para quem chega no projeto:

- Usar `fetch()` direto em vez de `apiClient`
- Importar `server/data/` em Client Component (são `server-only`)
- Misturar `useAuth()` e `useAdminAuth()` (são independentes)
- Usar hex hardcoded em Tailwind em vez de design tokens
- Construir URL de imagem manualmente em vez de `absUrl()`

Para a lista completa de regras e o checklist de review, veja [Regras de projeto](./maintenance-guide.md#regras-de-projeto) e [Checklist de review](./maintenance-guide.md#checklist-de-review).

---

## Ordem de leitura dos docs

Após completar o onboarding, leia nesta ordem:

| Ordem | Documento | Por quê |
|-------|-----------|---------|
| 1 | [Arquitetura Frontend](./frontend-architecture.md) | Entender as camadas e limitações do projeto |
| 2 | [Data Fetching](./data-fetching.md) | Saber quando usar RSC, SWR ou apiClient direto |
| 3 | [Padrões de Componentes](./component-patterns.md) | Como criar componentes, hooks e formulários |
| 4 | [Fluxos Críticos](./critical-flows.md) | Como auth, checkout e pedidos funcionam por dentro |
| 5 | [Guia de Manutenção](./maintenance-guide.md) | Como adicionar features + regras + checklist de PR |
| 6 | [Testes](./testing-guide.md) | Como escrever testes para componentes, hooks, utilitários |
| 7 | [Troubleshooting](./troubleshooting.md) | Quando algo der errado |
| 8 | [COLORS.md](../COLORS.md) | Quando precisar mexer em cores |
| 9 | [Segurança](../FRONTEND_SECURITY_ALIGNMENT.md) | Quando mexer em auth, checkout ou uploads |
