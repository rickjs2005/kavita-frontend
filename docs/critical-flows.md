# Fluxos Críticos — Frontend Kavita

Documentação dos fluxos mais importantes do frontend: como funcionam, quais arquivos envolvem e quais edge cases tratam.

---

## Sumário

- [Login do usuário](#login-do-usuário)
- [Login do administrador](#login-do-administrador)
- [Login da corretora](#login-da-corretora)
- [Login do produtor (magic-link)](#login-do-produtor-magic-link)
- [Impersonação de corretora pelo admin](#impersonação-de-corretora-pelo-admin)
- [Registro de usuário](#registro-de-usuário)
- [Expiração de sessão](#expiração-de-sessão)
- [Navegação pública e catálogo](#navegação-pública-e-catálogo)
- [Carrinho de compras](#carrinho-de-compras)
- [Checkout](#checkout)
- [Carrinhos abandonados (admin)](#carrinhos-abandonados-admin)
- [Gestão de pedidos (admin)](#gestão-de-pedidos-admin)
- [CRUD admin (padrão geral)](#crud-admin-padrão-geral)
- [Upload de imagens (admin)](#upload-de-imagens-admin)
- [Hero section / banners](#hero-section--banners)
- [Favoritos](#favoritos)
- [Endereços do usuário](#endereços-do-usuário)
- [Mercado do Café — lead público](#mercado-do-café--lead-público)
- [Mercado do Café — painel corretora](#mercado-do-café--painel-corretora)
- [KYC/AML da corretora](#kycaml-da-corretora)
- [Contratos digitais (Fase 10.1)](#contratos-digitais-fase-101)

---

## Login do usuário

### Arquivos envolvidos
- `src/app/login/page.tsx` — Página de login
- `src/context/AuthContext.tsx` — `login()`, `refreshUser()`
- `src/lib/schemas/api.ts` — `AuthUserSchema`, `extractAuthUser()`

### Fluxo

```
1. Usuário preenche email + senha
2. Validação client-side:
   - Email: regex de formato
   - Senha: mínimo 6 caracteres
3. AuthContext.login(email, senha):
   a. POST /api/login { email, senha }
   b. Backend retorna cookie HttpOnly + dados do usuário
   c. extractAuthUser(response) → Zod valida shape
   d. Se válido: setUser(dados) → logado
   e. Se inválido: schema rejeita → erro exibido
4. Redirect para página anterior (via query param `from`) ou home
```

### Tratamento de erros
- Credenciais inválidas → mensagem genérica (sem revelar se email existe)
- Rede → "Erro de conexão"
- Schema inválido → tratado como "não autenticado"

### Segurança
- Email normalizado (trim + lowercase) antes do envio
- Sem fallback para valores do formulário — dados sempre do backend
- Cookie HttpOnly gerenciado pelo backend (frontend não armazena token)

---

## Login do administrador

### Arquivos envolvidos
- `src/app/admin/login/LoginClient.tsx` — Formulário de login
- `src/context/AdminAuthContext.tsx` — `login()`, `loadSession()`
- `src/lib/schemas/api.ts` — `AdminUserSchema`
- `middleware.ts` — Verificação de cookie na Edge

### Fluxo

```
1. Admin preenche email + senha
2. AdminAuthContext.login(email, senha):
   a. POST /api/admin/login { email, senha }
   b. Backend retorna cookie adminToken (HttpOnly)
   c. loadSession():
      - GET /api/admin/me
      - AdminUserSchema.safeParse(response)
      - Se válido: setAdminUser(dados) com role + permissions
      - Se inválido: clearState() → redirect para login
3. safeInternalRedirect(from) → redirect para /admin ou página anterior
```

### Proteções
- Middleware Edge verifica presença de cookie `adminToken` em todas as rotas `/admin/*`
- Permissões sempre do servidor (`/api/admin/me`), nunca do localStorage
- `safeInternalRedirect()` previne open redirect no parâmetro `from`
- Race conditions prevenidas via `inflightRef` (dedup de requests simultâneos)
- Role `master` bypassa todas as verificações de permissão

---

## Login da corretora

### Arquivos envolvidos
- `src/app/painel/corretora/login/` — formulário
- `src/app/painel/corretora/layout.tsx` — `CorretoraAuthProvider` + guard de rota
- `src/context/CorretoraAuthContext.tsx` — `loadSession`, `markLoggedIn`, `logout`, `exitImpersonation`

### Fluxo (senha)

```
1. Usuário de corretora preenche email + senha em /painel/corretora/login
2. POST /api/corretora/login → backend emite cookie HttpOnly próprio (corretoraToken)
3. markLoggedIn(user) e redirect para /painel/corretora
4. loadSession() depois busca GET /api/corretora/me para manter state atualizado
5. Se 401/403 em qualquer request: redirect para /painel/corretora/login
```

### Fluxo (magic-link alternativo)
```
POST /api/corretora/magic-link { email } → e-mail com token
clique no link → GET /api/corretora/verify/:token → cookie emitido
```

### Diferenças em relação ao admin

- Não tem RBAC — um usuário de corretora logado tem acesso a todas as telas do painel dela. Permissões granulares (ex.: `mercado_cafe_leads.gerenciar`) são aplicadas apenas no **backend** em endpoints sensíveis.
- Multi-user: `corretora_users` suporta roles `owner`/`manager`/`sales`/`viewer`, mas o frontend ainda não as diferencia.
- 2FA opcional via TOTP (`/api/corretora/totp/setup`, `/totp/verify`).
- Reset de senha: `/api/corretora/password-reset/request` e `/confirm`.

---

## Login do produtor (magic-link)

### Arquivos envolvidos
- `src/app/produtor/entrar/EntrarClient.tsx` — formulário público (só e-mail)
- `src/app/verificar/[token]/` ou rota callback — consome o token
- `src/app/painel/produtor/layout.tsx` — `ProducerAuthProvider` + guard
- `src/context/ProducerAuthContext.tsx` — `loadSession`, `markLoggedIn`, `logout`

### Fluxo (não existe senha)

```
1. Produtor digita e-mail em /produtor/entrar
2. POST /api/public/produtor/magic-link { email } → backend envia e-mail com token assinado
3. Produtor clica no link → frontend consome GET /api/produtor/verify/:token
4. Backend valida HMAC + expiração → emite cookie HttpOnly de produtor
5. loadSession() → GET /api/produtor/me → popula user state
6. Redirect para /painel/produtor
7. Logout: POST /api/produtor/logout (cookie limpo; state zerado)
```

### Operações sensíveis
- LGPD: `POST /api/producer/data-request`, `POST /api/producer/data-deletion` (Fase 10.3)
- Listagem de contratos: `GET /api/producer/contratos`

### Observações
- O produtor não cria conta tradicional — o cadastro acontece quando ele é associado a um lead de corretora ou a um contrato.
- Link tem TTL curto (definido no backend) — se expirar, o produtor pede um novo.

---

## Impersonação de corretora pelo admin

### Arquivos envolvidos
- `src/app/admin/mercado-do-cafe/corretora/[id]/page.tsx` — botão "Impersonar"
- `src/context/CorretoraAuthContext.tsx` — `exitImpersonation()`

### Fluxo

```
1. Admin em /admin/mercado-do-cafe/corretora/[id] clica "Entrar como corretora"
2. POST /api/admin/corretoras/:id/impersonate → backend emite cookie de corretora
   (o adminToken continua válido, é um cookie independente)
3. Admin navega para /painel/corretora → vê tudo como se fosse a corretora
4. Banner dourado no topo indica "Você está impersonando — Sair"
5. Clique em "Sair" → exitImpersonation() → POST /api/corretora/exit-impersonation
6. Backend limpa o cookie de corretora (adminToken permanece intacto)
7. Redirect de volta para /admin/mercado-do-cafe/corretora/[id]
```

### Proteções
- Toda ação em impersonação é gravada em `admin_audit_logs` (backend).
- O botão "Sair" nunca deve ser escondido/disable — é o único caminho seguro de volta.
- `CorretoraAuthContext.exitImpersonation` é distinto de `logout`: o primeiro limpa só o cookie de corretora, o segundo faz logout total.

---

## Registro de usuário

### Arquivos envolvidos
- `src/app/register/page.tsx` — Formulário de cadastro
- `src/context/AuthContext.tsx` — `register()`

### Fluxo

```
1. Usuário preenche: nome, email, CPF, telefone, senha, confirmar senha
2. Validação client-side:
   - Senha: 8+ chars, maiúscula, minúscula, número
   - CPF: 11 dígitos
   - Senhas coincidem
3. Honeypot anti-bot: campo invisível — se preenchido, rejeita silenciosamente
4. AuthContext.register(payload):
   a. POST /api/users/register
   b. Se ok: tenta login automático (POST /api/login)
   c. Se login automático falha: redirect para /login com mensagem de sucesso
5. Redirect para home (se login automático funcionou)
```

### Segurança
- Honeypot field previne bots simples
- CPF mascarado na UI durante digitação
- Mensagens de erro genéricas (sem revelar "email já cadastrado" para prevenir enumeração)

---

## Expiração de sessão

### Arquivos envolvidos
- `src/lib/apiClient.ts` — `dispatchAuthExpired()`
- `src/context/AuthContext.tsx` — listener de `auth:expired`
- `src/context/AdminAuthContext.tsx` — listener de `auth:expired`
- `src/app/admin/layout.tsx` — listener de `auth:expired`

### Fluxo

```
1. Qualquer request HTTP recebe 401 do backend
2. apiClient detecta 401 → dispatchAuthExpired(url)
   (ignora rotas de /login e /logout para evitar loop)
3. window.dispatchEvent(new CustomEvent("auth:expired"))
4. Context que estiver ativo captura o evento:
   - AuthContext: setUser(null) → redirect para /login
   - AdminAuthContext: clearState() → redirect para /admin/login
5. Mensagem: "Sessão expirada. Faça login novamente."
```

### Edge case
- Se a expiração acontece durante o checkout, o estado do formulário é perdido (sem recovery)
- Se múltiplos requests 401 chegam simultâneamente, apenas um redirect acontece

---

## Navegação pública e catálogo

### Home

```
src/app/page.tsx (RSC)
  └─ Promise.all([fetchPublicCategories(), fetchPublicShopSettings(), fetchPublicHeroSlides()])
     └─ <HomeClient categories={...} shop={...} heroSlides={...} />
        ├─ HeroCarousel (slides de destaque)
        ├─ Categorias (navegação)
        ├─ DestaquesSection (produtos em destaque)
        ├─ ServicosSection
        └─ TrustBar
```

### Listagem de produtos

```
src/app/produtos/page.tsx → <ProductsPageClient />
  └─ useFetchProducts() → SWR → GET /api/public/produtos
     └─ ProductGrid → ProductCard[]
        ├─ Busca por texto
        ├─ Filtros por categoria
        ├─ Ordenação (preço, nome, relevância)
        └─ Paginação
```

### Detalhe do produto

```
src/app/produtos/[id]/page.tsx (RSC)
  └─ fetch produto + promoção no servidor
     └─ <ProdutoContent produto={...} promotion={...} />
        ├─ Galeria de imagens
        ├─ ProductBuyBox (preço, estoque, add ao carrinho)
        ├─ Descrição
        └─ ProductReviews
```

### Serviços

```
src/app/servicos/page.tsx → Client Component
  └─ useFetchServicos() → SWR → GET /api/public/servicos
     └─ Lista com busca, filtro por especialidade, paginação
        └─ Cada serviço: contato via WhatsApp integrado
```

---

## Carrinho de compras

### Arquivos envolvidos
- `src/context/CartContext.tsx` — Orquestrador
- `src/context/cart/useCartActions.ts` — Operações
- `src/context/cart/useCartPersistence.ts` — localStorage
- `src/context/cart/useCartSync.ts` — Sync com backend
- `src/context/cart/useCartCalculations.ts` — Cálculos
- `src/context/cart/cartUtils.ts` — Helpers

### Fluxo

```
Adicionar item:
1. useCartActions.addItem(product, quantity)
2. Validação: estoque disponível, quantidade válida
3. Se item já existe: incrementa quantidade
4. Se novo: adiciona com dados normalizados
5. useCartPersistence persiste no localStorage (chave isolada por userId)
6. useCartSync sincroniza com backend (POST /api/cart) se logado

Mudança de usuário:
1. Login/logout detectado pelo CartContext
2. makeCartKey(newUserId) gera nova chave
3. Carrinho do localStorage é carregado para o novo usuário
4. Itens do usuário anterior não migram (isolamento por conta)

Validação de itens (do backend):
1. GET /api/cart → itens do servidor
2. Cada item passa por CartApiItemSchema (Zod)
3. Itens com valor_unitario <= 0 ou campos inválidos → descartados silenciosamente
```

---

## Checkout

### Arquivos envolvidos
- `src/app/checkout/page.tsx` — Layout do checkout
- `src/app/checkout/useCheckoutState.ts` — State machine (674 linhas)
- `src/app/checkout/checkoutTypes.ts` — Tipos
- `src/app/checkout/checkoutUtils.tsx` — Helpers
- `src/app/checkout/sections/PersonalInfoSection.tsx`
- `src/app/checkout/sections/ShippingSection.tsx`
- `src/app/checkout/sections/PaymentSection.tsx`
- `src/app/checkout/sections/OrderSummarySection.tsx`

### Fluxo completo

```
1. Verificação de auth → se não logado: exibe CTA de login
2. Carrega carrinho do CartContext
3. Normaliza itens (campo variants: id/productId/product_id, quantity/quantidade/qtd)
4. Busca promoções em paralelo para todos os itens
5. Carrega endereços salvos do usuário (GET /api/users/addresses)
   - Seleciona endereço padrão ou primeiro da lista
   - Restaura último endereço usado (sessionStorage)

6. Seção: Dados pessoais
   - Nome, CPF, telefone, email (pré-preenchidos se logado)
   - Validação: nome min 2, CPF 11 dígitos, telefone min 10

7. Seção: Endereço de entrega
   - CEP → auto-fetch de cotação de frete (com cancel tokens)
   - Endereço rural: campos extras (comunidade, observações de acesso)
   - Opção de retirada (sem endereço, sem frete)

8. Seção: Cupom de desconto (opcional)
   - POST /api/checkout/preview-coupon → CouponPreviewSchema
   - Cupom invalidado se quantidade ou promoção mudar

9. Seção: Método de pagamento
   - Seleção entre opções disponíveis

10. Submissão:
    a. Validação completa de todos os campos
    b. POST /api/checkout/pedidos → CheckoutResponseSchema (pedido_id)
    c. Se pagamento via gateway:
       - POST /api/payment/start → PaymentResponseSchema (init_point)
       - sanitizeUrl(init_point) → validação contra open redirect
       - isMercadoPagoUrl(url) → validação adicional
       - window.location.href = url (redirect para MercadoPago)
    d. Se pagamento direto:
       - Redirect para /checkout/sucesso
    e. Limpa carrinho após sucesso

11. Páginas de resultado:
    - /checkout/sucesso — confirmação de pedido
    - /checkout/pendente — aguardando pagamento
    - /checkout/erro — falha no processamento
```

### Tratamento de erros
- Cancel tokens previnem race conditions em operações assíncronas
- CEP sem cobertura → mensagem específica
- 401/403 durante checkout → logout + redirect para login
- URL de pagamento validada por `sanitizeUrl()` + `isMercadoPagoUrl()`
- Coupon errors com status codes específicos

### Edge cases tratados
- Múltiplos formatos de campo de item (backwards compat com backend)
- Endereço rural com campos específicos (comunidade, observações de acesso)
- Free shipping por produto, por CEP range, por zona
- Restauração de último endereço via sessionStorage
- Cupom invalidado ao mudar quantidade ou promoção

### Cuidados ao mexer no checkout

O `useCheckoutState.ts` tem 674 linhas e é a parte mais complexa do frontend. Antes de alterar:
- Entenda que ele usa cancel tokens (flag `aborted`) para evitar race conditions — não remova essas flags
- Há ~14 `as any` type casts — eles existem por conta de tipos variantes do backend (campo `id`/`productId`/`product_id`)
- A validação de URL de pagamento (`sanitizeUrl` + `isMercadoPagoUrl`) é uma proteção de segurança — não simplifique
- Sessão expirando durante checkout perde o formulário (sem recovery de estado — limitação conhecida)

---

## Gestão de pedidos (admin)

### Arquivos envolvidos
- `src/app/admin/pedidos/page.tsx` — Página principal (758 linhas)

### Funcionalidades
- Listagem de pedidos com filtro por cliente (via query param `clienteId`)
- Layout responsivo: tabela (desktop) + cards (mobile)
- Status de entrega: atualização via PUT `/api/admin/pedidos/{id}/entrega`
- Status de pagamento: atualização via PUT `/api/admin/pedidos/{id}/pagamento`
- Comunicação com cliente:
  - Email via POST `/api/admin/comunicacao/email`
  - WhatsApp: gera link com mensagem template
- Copy-to-clipboard de dados do cliente
- Marcação manual de pagamento (transferências bancárias)

### Fluxo de atualização de status

```
1. Admin seleciona novo status no dropdown
2. atualizandoId = pedido.id (loading visual)
3. PUT /api/admin/pedidos/{id}/entrega { status_entrega: novoStatus }
4. Se sucesso: refetch da lista
5. Se erro: alert() com mensagem (legado — deveria ser toast)
```

### Cuidados ao mexer em pedidos

O `admin/pedidos/page.tsx` tem 758 linhas em um único arquivo — UI, lógica de negócio, API calls e estado. É o maior arquivo do projeto. Ao alterar:
- Usa `alert()` em vez de `toast` (7 ocorrências) — padrão legado
- Clipboard API tem fallback para browsers sem suporte
- Normalização de telefone adiciona +55 se necessário
- Layout é responsivo (tabela desktop + cards mobile) — teste ambos

---

## CRUD admin (padrão geral)

A maioria das páginas admin segue o mesmo padrão usando `useAdminResource<T>`:

### Arquivos
- `src/hooks/useAdminResource.ts` — Hook genérico
- `src/app/admin/<modulo>/page.tsx` — Página específica

### Fluxo

```
1. useAdminResource<T>({ endpoint: "/api/admin/<modulo>" })
   - SWR faz GET /api/admin/<modulo> → lista de items
   - Retorna: { items, loading, saving, error, refetch, create, update, remove }

2. Listagem: items.map(item => <Card item={item} />)

3. Criar:
   a. create(payload) → POST /api/admin/<modulo> body=payload
   b. Toast de sucesso → refetch automático

4. Editar:
   a. Seleciona item → popula formulário
   b. update(id, payload) → PUT /api/admin/<modulo>/{id} body=payload
   c. Toast de sucesso → refetch automático

5. Remover:
   a. confirm("Tem certeza?")
   b. remove(id) → DELETE /api/admin/<modulo>/{id}
   c. Se 409 (item em uso): sugere desativar em vez de excluir
   d. Toast de sucesso → refetch automático

6. Auth: 401/403 → redirect para /admin/login com toast
```

### Módulos que usam este padrão
- Produtos, Serviços, Drones, Cupons, Categorias, Equipe

---

## Upload de imagens (admin)

### Arquivos envolvidos
- `src/utils/useUpload.ts` — Hook genérico
- `src/lib/schemas/api.ts` — `UploadResponseSchema`

### Fluxo

```
1. const { upload, uploading, error } = useUpload()
2. Usuário seleciona arquivo (input file)
3. upload(file, endpoint, fieldName):
   a. Cria FormData com file no campo fieldName
   b. apiClient.post(endpoint, formData, { skipContentType: true })
      - CSRF token injetado automaticamente
      - Credentials incluídos automaticamente
   c. strictParse(UploadResponseSchema, response)
      - Valida que response tem `url` ou `path`
   d. Retorna { url?, path?, filename? }
4. Se erro: error state atualizado, componente exibe mensagem
```

### Uso nos componentes

```typescript
const { upload, uploading, error } = useUpload();

const handleFile = async (file: File) => {
  const result = await upload(file, "/api/admin/produtos", "images");
  if (result) {
    setImageUrl(result.url || result.path);
  }
};
```

---

## Hero section / banners

### Área pública
- `src/server/data/heroSlides.ts` — Fetch de slides ativos
- `src/components/layout/HeroCarousel.tsx` — Carousel na home

### Admin
- `src/app/admin/destaques/site-hero/page.tsx` — Listagem de slides
- `src/app/admin/destaques/site-hero/[id]/page.tsx` — Edição de slide
- `src/app/admin/destaques/site-hero/novo/page.tsx` — Criação de slide
- `src/components/admin/hero/SlideForm.tsx` — Formulário
- `src/components/admin/hero/HeroSlidePreview.tsx` — Preview desktop + mobile
- `src/components/admin/hero/HeroMediaUpload.tsx` — Upload de mídia

### Fluxo admin

```
1. GET /api/admin/hero-slides → lista com thumbnail, tipo, ordem, CTA
2. Criar: preenchimento do SlideForm → upload de mídia → POST
3. Editar: carrega slide → SlideForm pré-populado → PUT
4. Toggle ativo/inativo: PATCH /api/admin/hero-slides/{id}/toggle
5. Excluir: DELETE /api/admin/hero-slides/{id}
6. Preview: HeroSlidePreview exibe como vai ficar (desktop e mobile)
```

### Como o hero reflete no público

```
1. Admin cria/edita slide no painel
2. Backend persiste no banco
3. Próximo request do frontend (ou após revalidate de 300s):
   - fetchPublicHeroSlides() busca slides ativos
   - HeroCarousel renderiza na home
```

---

## Favoritos

### Objetivo

Permitir que usuários logados marquem produtos como favoritos e visualizem a lista em `/favoritos`.

### Arquivos envolvidos

- `src/app/favoritos/page.tsx` — Página de listagem (Client Component, 118 linhas)
- `src/components/products/ProductCard.tsx` — Botão de toggle no card de produto
- `src/services/api/endpoints.ts` — `ENDPOINTS.FAVORITES.LIST` e `ENDPOINTS.FAVORITES.TOGGLE(id)`

### Fluxo — toggle no ProductCard

```
1. Usuário clica no ícone de coração no ProductCard
2. Verificação: se não logado → redirect para /login
3. Optimistic update: setIsFavorite(!current)
4. Se estava favoritado:
   - DELETE /api/favorites/{productId}
5. Se não estava:
   - POST /api/favorites { productId }
6. Se a API falha: reverte o state para o valor anterior (rollback)
```

### Fluxo — página /favoritos

```
1. Verificação de auth:
   - Se authLoading: aguarda
   - Se não logado: mostra CTA de login (não faz fetch)
2. GET /api/favorites → lista de produtos favoritados
   - Aceita resposta como array direto ou envelope { data: [...] }
3. Renderiza ProductCard para cada favorito (com initialIsFavorite=true)
4. Se 401: mostra mensagem "Faça login novamente"
5. Se erro genérico: mostra mensagem "Erro ao carregar seus favoritos"
6. Se lista vazia: mostra empty state com CTA "Começar a comprar"
```

### Estados tratados

| Estado | O que mostra |
|--------|-------------|
| Auth carregando | Nada (aguarda) |
| Não logado | CTA de login |
| Carregando favoritos | Texto "Carregando favoritos..." |
| Erro de API | Mensagem de erro em vermelho |
| Lista vazia | Empty state com link para a loja |
| Com favoritos | Grid responsivo de ProductCards |

### Cuidados ao mexer

- O toggle usa **optimistic update** — o state muda antes da API responder. Se a API falhar, o state é revertido. Não quebre esse padrão.
- O `ProductCard` recebe `initialIsFavorite` como prop — na página de favoritos, é sempre `true`.
- A verificação de auth no toggle usa `window.location` para redirect (não `router.push`) — funciona mas não é o padrão ideal. Cuidado ao refatorar.
- A response do endpoint aceita dois formatos (`[...]` e `{ data: [...] }`) — isso é intencional para compatibilidade com o backend.

---

## Endereços do usuário

### Objetivo

Permitir que o usuário gerencie endereços de entrega (criar, editar, excluir) usados no checkout.

### Arquivos envolvidos

- `src/hooks/useUserAddresses.ts` — Hook CRUD com SWR (95 linhas)
- `src/app/meus-dados/enderecos/page.tsx` — Listagem de endereços
- `src/app/meus-dados/enderecos/novo/page.tsx` — Formulário de criação
- `src/app/meus-dados/enderecos/[id]/page.tsx` — Formulário de edição
- `src/components/checkout/AddressForm.tsx` — Formulário compartilhado (usado no checkout e em meus-dados)
- `src/types/address.ts` — Tipos `UserAddress` e `UserAddressPayload`
- `src/services/api/endpoints.ts` — `ENDPOINTS.USERS.ADDRESSES` e `ENDPOINTS.USERS.ADDRESS(id)`

### Fluxo — listar endereços

```
1. useUserAddresses() → SWR faz GET /api/users/addresses
2. Se loading: mostra skeleton (2 placeholders com animate-pulse)
3. Se lista vazia: mostra empty state "Nenhum endereço cadastrado"
4. Se tem endereços: renderiza cards com:
   - Apelido (ou "Endereço" como fallback)
   - Badge "Padrão" se is_default=true
   - Rua, número, bairro, cidade/estado, CEP
   - Ponto de referência e telefone (se existirem)
   - Botões: Editar (link) e Excluir (ação direta)
```

### Fluxo — criar endereço

```
1. Usuário clica "+ Novo endereço" → navega para /meus-dados/enderecos/novo
2. Preenche AddressForm (CEP, rua, número, bairro, cidade, estado, etc.)
3. Submit: useUserAddresses().createAddress(payload)
   - POST /api/users/addresses
   - Optimistic update: adiciona ao array local via mutate
   - Toast: "Endereço salvo com sucesso!"
4. Redirect para listagem
```

### Fluxo — editar endereço

```
1. Usuário clica "Editar" → navega para /meus-dados/enderecos/{id}
2. AddressForm pré-populado com dados do endereço
3. Submit: useUserAddresses().updateAddress(id, payload)
   - PUT /api/users/addresses/{id}
   - Optimistic update: substitui item no array via mutate
   - Toast: "Endereço atualizado com sucesso!"
4. Redirect para listagem
```

### Fluxo — excluir endereço

```
1. Usuário clica "Excluir" na listagem
2. useUserAddresses().deleteAddress(id)
   - DELETE /api/users/addresses/{id}
   - Optimistic update: filtra item do array via mutate
   - Toast: "Endereço excluído com sucesso."
3. Se erro: toast de erro + throw (para caller tratar)
```

### Estados tratados

| Estado | O que mostra |
|--------|-------------|
| Carregando | Skeleton (2 cards placeholder) |
| Lista vazia | Empty state dashed border |
| Com endereços | Cards com dados + botões Editar/Excluir |
| Erro de fetch | Toast de erro (via SWR onError) |
| Erro de mutation | Toast de erro + throw para caller |

### Integração com checkout

Os endereços gerenciados aqui são os mesmos usados no checkout (`useCheckoutState.ts`):
- Checkout carrega endereços salvos via `GET /api/users/addresses`
- Seleciona o endereço padrão (`is_default`) ou o primeiro da lista
- Restaura último endereço usado via sessionStorage

Se o usuário altera endereços em `/meus-dados`, o checkout refletirá na próxima abertura (os dados vêm do backend, não de cache local).

### Cuidados ao mexer

- O hook `useUserAddresses` usa **optimistic update** (segundo parâmetro `false` no `mutate`) — a UI atualiza antes da confirmação do backend. Se a API falha, o SWR fará revalidação automática.
- Todas as mutations fazem `throw err` após o toast de erro — isso permite que o caller (página) também reaja ao erro (ex: manter formulário aberto).
- O `AddressForm` é compartilhado entre checkout e meus-dados — alterações nele afetam os dois contextos.
- Os endpoints usam constantes centralizadas (`ENDPOINTS.USERS.ADDRESSES`) — não hardcode URLs.

---

## Carrinhos abandonados (admin)

### Arquivos envolvidos
- `src/app/admin/carrinhos/page.tsx` — listagem, botão "Buscar carrinhos abandonados agora", ações por carrinho
- Backend: `routes/admin/adminCarts.js`, `services/cartsAdminService.js`, `jobs/abandonedCartsScanJob.js`

### Detecção (automática + manual)

```
1. Job abandonedCartsScanJob roda a cada ABANDONED_CART_SCAN_INTERVAL_MS (default 15min)
2. Pega carrinhos com status='aberto' e idade > ABANDONED_CART_MIN_HOURS (default 24h)
3. Copia snapshot (itens + total) para carrinhos_abandonados e agenda 3 notificações
   (whatsapp +1h, email +4h, whatsapp +24h)
4. Admin abre /admin/carrinhos → GET /api/admin/carrinhos → lista populada
5. Botão "Buscar carrinhos abandonados agora" → POST /api/admin/carrinhos/scan
   devolve { candidates, inserted, skippedEmpty, skippedError, minHours }
   registra em admin_audit_logs (action: carrinhos.scan)
```

### Ações por carrinho

| Ação | Endpoint | Efeito |
|------|----------|--------|
| Registrar WhatsApp | `POST /api/admin/carrinhos/:id/notificar { tipo: "whatsapp" }` | insere notificação pending (worker **não envia** whatsapp — só registra) |
| Abrir WhatsApp | `GET /api/admin/carrinhos/:id/whatsapp-link` | retorna `wa.me/...` com mensagem pronta; abre em nova aba |
| Registrar e-mail | `POST /api/admin/carrinhos/:id/notificar { tipo: "email" }` | worker `abandonedCartNotificationsWorker` envia o e-mail automaticamente |

### Recuperação
Quando o cliente finaliza a compra, `checkoutService.markAbandonedCartRecovered()` marca `recuperado=1` e o worker cancela notificações pendentes.

---

## Mercado do Café — lead público

### Arquivos envolvidos
- `src/app/mercado-do-cafe/corretoras/[slug]/page.tsx` — detalhe da corretora (RSC)
- `src/components/mercado-do-cafe/LeadContactForm.tsx` — formulário público
- Backend: `routes/public/publicCorretoras.js`, `controllers/corretorasLeadsPublicController.js`

### Fluxo

```
1. Produtor encontra corretora em /mercado-do-cafe/corretoras/[slug]
2. Preenche formulário (nome, telefone, e-mail, produto, volume, cidade)
3. POST /api/public/corretoras/:id/leads → backend valida Turnstile (invisible) + rate limit
4. Lead entra em corretora_leads com status="novo"
5. Corretora é notificada (e-mail + sino)
6. Produtor recebe link com token para acompanhar status em
   /mercado-do-cafe/lead-status/[id]/[token] — público, lido via HMAC
```

### Proteções
- Cloudflare Turnstile invisible (verifyTurnstile no backend)
- Rate limit global (Redis)
- Token HMAC para consulta pública de status sem autenticação

---

## Mercado do Café — painel corretora

### Arquivos envolvidos
- `src/app/painel/corretora/leads/page.tsx` — inbox de leads
- `src/app/painel/corretora/leads/[id]/page.tsx` — detalhe de lead
- `src/components/painel-corretora/*` — LeadsTable, QuickRepliesDropdown, StatsCards, LiveMarketQuotes
- Backend: `routes/corretoraPanel/corretoraLeads.js`, `services/corretoraLeadsService.js` (1182 linhas)

### Fluxo do lead (do lado da corretora)

```
1. Corretora vê novo lead na inbox (/painel/corretora/leads)
2. Abre o lead → GET /api/corretora/leads/:id
3. Ações:
   - mudar status: PUT /api/corretora/leads/:id/status (todo evento grava em corretora_lead_events)
   - adicionar nota interna: POST /api/corretora/leads/:id/notes
   - broadcast "lote vendido": backend envia link público HMAC para produtor
   - gerar contrato: POST /api/corretora/contratos (bloqueado se KYC pendente — ver KYC abaixo)
4. Atualização em tempo (quase) real: polling 60s em /api/corretora/notifications
   (migração para SSE/WebSocket é roadmap)
```

### Ticker CEPEA/ICE
Componente `LiveMarketQuotes` consome `GET /api/public/market-quotes` (Fase 10.4). Atualização visual a cada ~60s.

---

## KYC/AML da corretora

### Arquivos envolvidos
- `src/hooks/useMyKycStatus.ts` — status da própria corretora
- `src/app/mercado-do-cafe/verificacao/page.tsx` — página pública informativa
- `src/app/admin/mercado-do-cafe/page.tsx` — tab de KYC admin
- Backend: `services/corretoraKycService.js`, `routes/admin/adminCorretoraKyc.js`

### Estados possíveis (FSM)

```
pending → in_review → { verified | rejected }
```

### Gate de contrato

```
Corretora clica "Gerar contrato" no lead
  → backend checa corretora_kyc.status
  → se != "verified" → 400 { code: "KYC_REQUIRED" }
  → frontend mostra banner "Conclua a verificação para emitir contratos"
  → link para /mercado-do-cafe/verificacao
```

### Admin
- `/admin/mercado-do-cafe` tab KYC: listar, aprovar, rejeitar, ver `provider_response_raw`
- Providers: `kycMockAdapter` (dev) ou `kycBigdatacorpAdapter` (prod)
- Toda ação grava em `admin_audit_logs`

---

## Contratos digitais (Fase 10.1)

### Arquivos envolvidos
- `src/hooks/useLeadContratos.ts` — contratos do lead
- `src/hooks/useProducerContratos.ts` — contratos do produtor
- `src/components/painel-corretora/ContratoCard.tsx`
- Backend: `services/contratoService.js` (610L), `services/contratoSignerService.js`, `routes/public/publicContratoVerificacao.js`

### Fluxo (corretora gera, produtor assina)

```
1. Corretora clica "Gerar contrato" no lead → POST /api/corretora/contratos
2. Backend monta PDF com Puppeteer + SHA-256 hash + token QR único
3. contrato entra em status="draft" → gera signed_pdf_url provisório
4. Envia para ClickSign via contratoSignerService (provider configurável)
5. ClickSign envia e-mail ao produtor → status="sent"
6. Produtor assina na plataforma ClickSign
7. Webhook POST /api/webhooks/clicksign → status="signed" + hash final registrado
8. Verificação pública: /api/public/verificar-contrato/:token lê o QR
   e confirma integridade (hash do PDF == registrado)
```

### Proteções
- PDF impresso tem **QR Code + últimos 8 chars do SHA-256** no rodapé.
- Webhook valida assinatura HMAC do ClickSign.
- Em dev: `CONTRATO_SIGNER_PROVIDER=stub` usa mock local.
- Status change grava em `subscription_events` e `admin_audit_logs`.

