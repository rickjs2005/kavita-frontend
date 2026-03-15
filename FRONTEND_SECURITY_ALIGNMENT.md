# FRONTEND_SECURITY_ALIGNMENT.md
Auditoria de segurança e alinhamento com backend — Kavita Frontend (Next.js)
Data: 2026-03-15

---

## 1. DIAGNÓSTICO — O QUE JÁ ESTAVA CORRETO

A base do frontend já estava bem implementada antes desta auditoria. As seguintes propriedades de segurança foram **verificadas e confirmadas** como corretas:

### API Client (`src/lib/apiClient.ts`)
- `credentials: "include"` apenas para URLs `/api` — omitido para `/uploads` (sem credential leakage em assets)
- CSRF token injetado automaticamente em POST/PUT/PATCH/DELETE com cache de 10min e deduplicação
- Parse seguro: fallback JSON→texto, sem lançar em corpo vazio
- Todos os erros HTTP envolvidos em `ApiError` com status, code, message normalizados
- Compat com campos `message`/`mensagem` do backend

### AuthContext + AdminAuthContext
- Zod validation (`safeParse`) antes de popular state — rejeita payloads malformados
- Permissões e role **sempre** de `/api/admin/me`, nunca do localStorage
- Race condition prevenida via `inflightRef` no AdminAuthContext
- Logout limpa state local imediatamente (não bloqueante)

### CartContext
- `CartApiItemSchema` rejeita `valor_unitario = 0`, NaN, Infinity
- Itens inválidos descartados silenciosamente (não cachados)
- Dados de usuário e guest isolados por chave no localStorage

### XSS
- Zero usos de `dangerouslySetInnerHTML` em todo o projeto
- `sanitizeUrl()` aplicada antes de redirecionamentos (checkout, pagamento)
- Conteúdo de notícias renderizado como texto puro (JSX auto-escape)

### CSP e Headers
- CSP completa para `/admin/*` com `unsafe-eval` removido em produção
- HSTS em produção; X-Frame-Options DENY no admin
- Middleware protege `/admin/*` via cookie HttpOnly sem ler localStorage

---

## 2. MUDANÇAS APLICADAS NESTA AUDITORIA

### FIX 1 — `src/utils/useUpload.ts` (P0)

**Problema:** URL hardcoded `http://localhost:5000/api/upload`, sem credentials, sem schema validation, sem tratamento de erro. Dead code de exemplo misturado no arquivo (linhas 20-35 eram pseudocódigo com `throw new Error("Function not implemented.")`).

**Risco real:** Upload para localhost em produção sempre falharia. Sem cookie de auth (403). Path inválido iria pro banco sem validação.

**Patch:**
- Reescrito para usar `apiClient.post()` com `skipContentType: true` (FormData)
- Credentials e CSRF injetados automaticamente pelo apiClient
- Resposta validada via `strictParse(UploadResponseSchema, raw)`
- States `uploading` e `error` para UI
- `endpoint` e `fieldName` configuráveis pelo caller
- Dead code removido

**Novo uso:**
```typescript
const { upload, uploading, error } = useUpload();
const result = await upload(file, "/api/admin/produtos", "images");
// result.url ou result.path garantidos pelo schema
```

---

### FIX 2 — `src/services/shippingQuote.ts` (P1)

**Problema:** `Number(data?.price || 0)` mascara preço inválido ou ausente com `0`. Backend quebrado seria aceito como frete grátis.

**Patch:**
- Reescrito para usar `apiClient.get()`
- `ShippingQuoteSchema` adicionado em `src/lib/schemas/api.ts`
- `strictParse(ShippingQuoteSchema, raw)` — lança `SchemaError` se `price` for inválido
- Removidas 8 linhas de coerção manual

---

### FIX 3 — `next.config.ts` — CSP em rotas públicas (P1)

**Problema:** Sem `form-action`, formulários públicos podiam submeter dados para domínios externos.

**Patch:**
```
Content-Security-Policy: form-action 'self'; object-src 'none'; frame-ancestors 'self'
```
Adicionado à configuração de headers `/:path*`. Não quebra recursos de terceiros — apenas bloqueia form hijacking e plugins legados.

---

### FIX 4 — `src/components/ui/SearchBar.tsx` (P1)

**Problema:** `fetch(url, { credentials: "include" })` sempre — sem lógica condicional do apiClient.

**Patch:**
- Removida variável `API_BASE` e `getApiBase()`
- Migrado para `apiClient.get()` com abort signal
- Falha por request isolada (`.catch(() => null)`) — um endpoint falhando não cancela o outro

---

### FIX 5 — `src/lib/schemas/api.ts` (P1)

**Adicionados:**
- `ShippingQuoteSchema` + `ShippingQuote` type
- `UploadResponseSchema` corrigido: `.refine()` que garante ao menos `url` OU `path` presente

---

## 3. CONTRATO COM O BACKEND

| Endpoint | Schema | Campos obrigatórios |
|----------|--------|---------------------|
| GET `/api/users/me` | `AuthUserSchema` | `id` (int>0), `nome`, `email` |
| POST `/api/login` | `LoginResponseSchema` | `id` OU `user.id` |
| GET `/api/admin/me` | `AdminUserSchema` | `id`, `nome`, `email`, `role`, `permissions[]` |
| GET `/api/cart` | `CartGetResponseSchema` | `items[]` |
| GET `/api/shipping/quote` | `ShippingQuoteSchema` | **`price` (número finito ≥ 0)** |
| POST `/api/checkout` | `CheckoutResponseSchema` | `pedido_id` (int>0) |
| POST `/api/payment/start` | `PaymentResponseSchema` | `init_point` ou `sandbox_init_point` (URLs) |
| POST upload endpoints | `UploadResponseSchema` | `url` OU `path` (string não vazia) |

Formatos de erro aceitos: `{ code, message }` (AppError) e `{ mensagem }` (legado).

---

## 4. ARQUIVOS ALTERADOS

| Arquivo | Mudança |
|---------|---------|
| `src/utils/useUpload.ts` | Reescrito: apiClient, schema, estados, sem dead code |
| `src/services/shippingQuote.ts` | Reescrito: apiClient, ShippingQuoteSchema |
| `src/components/ui/SearchBar.tsx` | Migrado para apiClient; abort signal corrigido |
| `src/lib/schemas/api.ts` | ShippingQuoteSchema + fix UploadResponseSchema |
| `next.config.ts` | CSP parcial nas rotas públicas |
| `FRONTEND_SECURITY_ALIGNMENT.md` (novo) | Este documento |

---

## 5. CHECKLIST FINAL

### P0 — Concluído
- [x] useUpload: sem hardcoded URL, com apiClient, com schema validation
- [x] AuthContext: Zod validation, sem fallback frouxo
- [x] AdminAuthContext: server-truth, sem localStorage para permissões
- [x] CartContext: preço=0 rejeitado, itens inválidos descartados
- [x] Sem dangerouslySetInnerHTML
- [x] URL sanitization antes de redirecionamentos

### P1 — Concluído
- [x] shippingQuote: Zod schema, sem coerção `|| 0`
- [x] SearchBar: apiClient, credentials condicional
- [x] CSP pública: form-action + object-src + frame-ancestors
- [x] ShippingQuoteSchema em schemas/api.ts

### P2 — Pendente (decisão arquitetural)
- [ ] Nonce-based CSP para remover `unsafe-inline` (requer middleware.ts com nonce por request)
- [ ] Rich text rendering: se news content precisar renderizar HTML, criar `<SafeHtml>` com sanitização no frontend
- [ ] Remover `axios` das dependencies (não é usado, leftover)

---

## 6. O QUE DEPENDE DO BACKEND

- **`price` em `/api/shipping/quote` deve ser número finito** — frontend agora rejeita `null`/`undefined` ao invés de aceitar 0 silenciosamente
- **Upload deve retornar `url` OU `path`** — `UploadResponseSchema` exige ao menos um dos dois
- **Formato de erro `{ code, message }`** — já implementado no errorHandler.js do backend

---

## 7. SERVER-SIDE FETCH (RSC) — NÃO É VULNERABILIDADE

Páginas como `/app/drones/[id]/page.tsx` e `/app/categorias/[category]/page.tsx` usam `fetch()` direto em React Server Components com `API_BASE` via `process.env.NEXT_PUBLIC_API_URL`. Isso é **correto** porque:
- RSC rodando no servidor não tem cookies de browser para enviar
- Comunicação servidor→servidor não precisa do apiClient do browser
- Não há risco de credential leakage ou CSRF em contexto de servidor

---

## 1. Arquivos Alterados

| Arquivo | Tipo de mudança |
|---|---|
| `src/lib/schemas/api.ts` | **NOVO** — schemas Zod para todas as responses críticas |
| `src/context/AuthContext.tsx` | P0: schema validation, remoção do email fallback, migração para apiClient |
| `src/context/AdminAuthContext.tsx` | P0: schema validation do `/api/admin/me` antes de popular state |
| `src/context/CartContext.tsx` | P0: schema validation de items, rejeição de preço=0, isApiError |
| `src/hooks/useFetchServicos.ts` | P1: remoção de API_BASE local, usa `@/utils/absUrl` |
| `src/app/checkout/page.tsx` | P0: schema validation de CheckoutResponse/CouponPreview, sanitizeUrl no redirect, `catch(err: unknown)` |
| `src/types/auth.ts` | Removidos tipos permissivos (AuthUser com token/string id) |
| `next.config.ts` | P1: headers de segurança para TODAS as rotas, CSP separada dev/prod, HSTS em produção |
| `src/__tests__/context/AuthContext.test.tsx` | Atualizado para novo mock (apiClient) e novo comportamento |
| `src/__tests__/context/CartContext.test.tsx` | Atualizado para apiClient, novo formato de response, novo teste de preço=0 |

---

## 2. Schemas Criados (`src/lib/schemas/api.ts`)

| Schema | Validação |
|---|---|
| `AuthUserSchema` | `id` (int positivo), `nome` (min 1), `email` (email válido) — rejeita nulos/strings |
| `LoginResponseSchema` + `extractAuthUser()` | Extrai e valida usuário do envelope do login |
| `AdminUserSchema` | `id`, `nome`, `email`, `role`, `permissions[]` — fonte única para AdminAuthContext |
| `CartApiItemSchema` | `produto_id` (int+), `valor_unitario` (float positivo), coerção de string→number |
| `CartGetResponseSchema` | Envelope do GET /api/cart |
| `CheckoutResponseSchema` | `pedido_id` (int positivo) |
| `PaymentResponseSchema` | `init_point` (URL válida) |
| `CouponPreviewSchema` | `success`, `desconto` (>= 0), `total_original`/`total_com_desconto` |
| `UploadResponseSchema` | `url`, `path`, `filename` |
| `OrderSchema` | `id`, `status`, `total`, `itens[]` |
| `ApiErrorBodySchema` | Envelope padrão de erro |
| `SchemaError` | Novo tipo de erro para violações de contrato |

### Helpers utilitários

- `strictParse(schema, data)` — lança `SchemaError` se inválido (use em operações críticas)
- `safeParseSilent(schema, data)` — retorna `null` se inválido (use em listas, itens individuais)

---

## 3. Contextos Corrigidos

### AuthContext.tsx

**Antes (vulnerável):**
```typescript
// Bug P0: email do FORMULÁRIO usado como fallback se backend retornar null
email: rawUser.email ?? email,  // email = parâmetro do login()

// Sem validação de shape
const rawUser = data?.user ?? data;
if (!rawUser?.id) { /* ... */ }
```

**Depois (seguro):**
```typescript
// extractAuthUser() valida via Zod: rejeita id=0, email inválido, campos ausentes
// Se backend retornar shape inesperado: ok=false, state não é populado
let validated = extractAuthUser(data); // lança SchemaError se inválido
```

**Impacto:** Backend é agora a **única fonte de verdade** para email. Não há mais fallback para valor do formulário.

---

### AdminAuthContext.tsx

**Antes (vulnerável):**
```typescript
// Aceitava qualquer shape sem validação
const data = await apiClient.get<{ id, nome, email, role, role_id, permissions }>("/api/admin/me");
const user: AdminUser = { id: data.id, ... }; // sem verificação de tipos runtime
```

**Depois (seguro):**
```typescript
const raw = await apiClient.get<unknown>("/api/admin/me");
const result = AdminUserSchema.safeParse(raw);
if (!result.success) {
  clearState(); // não popula admin state com dados inválidos
  return null;
}
```

---

### CartContext.tsx

**Antes (vulnerável):**
```typescript
// Bug P0: preço R$0 era aceito silenciosamente (fallback=0 mascarava backend quebrado)
price: toNum(it.valor_unitario, 0),  // valor_unitario=null → price=0

// (err as any)?.status — bypassa type safety
const status = (err as any)?.status;
```

**Depois (seguro):**
```typescript
// CartApiItemSchema exige valor_unitario > 0 (z.coerce.number().finite().positive())
// Item com valor inválido é descartado com console.warn (não polui state)
const parsed = safeParseSilent(CartApiItemSchema, raw);
if (!parsed) {
  console.warn("[CartContext] Item ignorado: schema inválido", raw);
  continue;
}

// isApiError() para type safety
if (isApiError(err) && err.status === 409 && err.code === "STOCK_LIMIT") { ... }
```

---

## 4. Fluxos Protegidos

| Fluxo | Proteção aplicada |
|---|---|
| Login usuário | Schema Zod valida response; email fallback eliminado |
| Sessão usuário (refreshUser) | Schema Zod valida /api/users/me; shape inválido → user=null |
| Login admin | Schema Zod valida /api/admin/me; shape inválido → state limpo |
| Sessão admin | permissions sempre do servidor; localStorage nunca lido para auth |
| Carrinho (GET) | CartGetResponseSchema + CartApiItemSchema; preço=0 rejeitado |
| Checkout (POST) | CheckoutResponseSchema valida pedido_id antes de usar |
| Pagamento (redirect) | sanitizeUrl() bloqueia javascript:/data:/vbscript: antes do location.href |
| Cupom (preview) | CouponPreviewSchema valida desconto numérico |
| Error handling | `catch(err: unknown)` + `formatApiError()` em vez de `catch(err: any)` |

---

## 5. CSP e Headers de Segurança

### Antes

- Headers de segurança aplicados **apenas** a `/admin/**`
- Nenhuma proteção em rotas públicas
- `unsafe-eval` presente mesmo em produção (desnecessário)
- IP local `172.20.10.9` hardcoded em produção

### Depois

**Todas as rotas (`/:path*`):**
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-DNS-Prefetch-Control: off
Strict-Transport-Security: max-age=31536000; includeSubDomains [apenas produção]
```

**Admin (`/admin/:path*`) adicional:**
```
X-Frame-Options: DENY
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';          [sem unsafe-eval em produção]
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: <host-da-api>;   [sem IPs locais em produção]
  connect-src 'self' <host-da-api>;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self'
```

**Dev vs Produção separados:**
- `unsafe-eval` apenas em dev (Next.js hot-reload)
- `172.20.10.9` apenas em dev
- HSTS apenas em produção (sem HTTPS local)

---

## 6. XSS — Renderização HTML

- **Nenhum `dangerouslySetInnerHTML`** encontrado no codebase
- **`sanitizeHtml.ts`** já existe com `sanitizeAsText()`, `sanitizeUrl()`, `sanitizeAsTextWithLineBreaks()`
- **Checkout corrigido:** `window.location.href = initPoint` agora passa por `sanitizeUrl()` que bloqueia `javascript:`, `data:`, `vbscript:`

---

## 7. Coerções Perigosas Eliminadas

| Padrão | Antes | Depois |
|---|---|---|
| `email ?? email` (fallback formulário) | `AuthContext.tsx:92` | Removido — schema rejeita email ausente |
| `price: toNum(valor, 0)` (preço=0) | `CartContext.tsx:86` | Schema Zod exige `valor_unitario > 0` |
| `Number(v \|\| 0)` (0 como falsy) | `checkout/page.tsx:105` | `Number(v ?? 0)` — preserva v=0 legítimo |
| `(err as any)?.status` | `CartContext.tsx:305,369` | `isApiError(err)` com type guard |
| `catch (err: any)` em checkout | `checkout/page.tsx:899` | `catch (err: unknown)` + `formatApiError` |

---

## 8. Contrato Frontend × Backend

### Campos obrigatórios validados pelo frontend

| Endpoint | Campos obrigatórios | Rejeitado se |
|---|---|---|
| `GET /api/users/me` | `id` (int+), `nome` (str), `email` (email) | qualquer campo ausente/inválido |
| `POST /api/login` | mesmo acima (em `user` ou top-level) | id=0, email null/inválido, nome ausente |
| `GET /api/admin/me` | `id`, `nome`, `email`, `role`, `permissions[]` | shape inválido |
| `GET /api/cart` | `items[]` (opcional) | itens com `valor_unitario ≤ 0` são descartados |
| `POST /api/checkout` | `pedido_id` (int+) | ausente ou não-positivo |
| `POST /api/checkout/payment` | `init_point` ou `sandbox_init_point` (URL) | URL com protocolo bloqueado |
| `POST /api/checkout/preview-cupom` | `success` (bool) | desconto negativo |

### Campos que podem ser nulos

| Campo | Tipo | Contexto |
|---|---|---|
| `CartApiItem.image` | `string \| null` | Produto sem foto |
| `CartApiItem.stock` | `number \| undefined` | Backend não enviou estoque |
| `AdminUser.role_id` | `number \| null` | Role sem ID associado |
| `SavedAddress.*` | maioria `string \| null` | Endereço parcialmente preenchido |

---

## 9. Dependências do Backend

Para que as validações funcionem corretamente, o backend deve garantir:

### Obrigatório (P0)

- `POST /api/login` → retornar `{ id, nome, email }` ou `{ user: { id, nome, email } }` com `id` sempre inteiro positivo e `email` sempre string válida
- `GET /api/users/me` → mesmo shape acima, sem campos opcionais ausentes em sessão válida
- `GET /api/admin/me` → `{ id, nome, email, role, role_id, permissions: string[] }` — `permissions` NUNCA omitido (usar `[]` se vazio)
- `GET /api/cart` → `{ items: [...] }` com `valor_unitario` sempre numérico positivo (não string, não null)
- `POST /api/checkout` → `{ pedido_id: number }` — inteiro positivo obrigatório

### Recomendado (P1)

- Serializar todos os campos numéricos como números (não strings) — embora o schema já faça coerção, é melhor prática
- `GET /api/cart` → incluir `stock` como número inteiro ≥ 0 em cada item
- `POST /api/checkout/payment` → retornar `init_point` como URL HTTPS válida (nunca `javascript:` ou relativa)

### Pendências (depende de decisão)

- **CSP nonce-based:** Para eliminar `unsafe-inline` completamente, o Next.js precisa de middleware gerando nonce em cada request. Requer migração dos componentes que usam `<style>` inline.
- **HSTS preload:** Após validar que produção usa HTTPS estável, considerar adicionar `; preload` ao HSTS header.
- **Versioning de API:** Os múltiplos fallbacks em `fetchPublicCategories` e `useFetchServicos` indicam que o backend evoluiu sem versionamento. Considerar `/api/v1/` para estabilizar contratos.

---

## 10. Pendências (não resolvidas neste PR)

### Depende do backend

- [ ] Garantir que `valor_unitario` sempre vem como number (não string)
- [ ] Garantir que `GET /api/users/me` nunca retorna `email: null` para sessão válida
- [ ] Endpoint `/api/csrf-token` — implementar se não existir (CSRF token é ignorado silenciosamente hoje)

### Depende de decisão arquitetural

- [ ] CSP nonce-based para eliminar `unsafe-inline` em produção
- [ ] Rate limiting no endpoint `/api/csrf-token` (mitigação atual: cache de 10 min no cliente)
- [ ] Revisar `AdminRole = (string & {})` — o tipo aceita qualquer string, não apenas os roles conhecidos

### Hardening complementar (P2)

- [ ] `absUrl.test.ts` — 2 testes pré-existentes com expectativas inconsistentes com a implementação atual
- [ ] `CartCar.test.tsx` — 4 testes pré-existentes falhando (relacionados a cupom no componente CartCar)
- [ ] `ProductCard.test.tsx` — 1 teste pré-existente falhando (promoção)
- [ ] `ProdutoForm.test.tsx` — 1 teste pré-existente falhando (PUT com keepImages)

---

## 11. Checklist Final

### Corrigido no frontend ✅

- [x] Schema Zod valida responses críticas antes de popular state
- [x] `AuthContext`: email fallback para valor do formulário eliminado
- [x] `AuthContext`: migrado de `api.ts` (legacy) para `apiClient` (padrão único)
- [x] `AdminAuthContext`: shape do `/api/admin/me` validado antes de setar state
- [x] `CartContext`: itens com preço=0 ou inválido descartados (não mascarados)
- [x] `CartContext`: `(err as any)?.status` substituído por `isApiError()`
- [x] `CartContext`: response do GET /api/cart validada via `CartGetResponseSchema`
- [x] `checkout/page.tsx`: `window.location.href` protegido por `sanitizeUrl()`
- [x] `checkout/page.tsx`: response do checkout e payment validadas via schema
- [x] `checkout/page.tsx`: cupom validado via `CouponPreviewSchema`
- [x] `checkout/page.tsx`: `catch (err: any)` → `catch (err: unknown)` + `formatApiError`
- [x] `checkout/page.tsx`: `Number(v || 0)` → `Number(v ?? 0)` (0 legítimo preservado)
- [x] `useFetchServicos.ts`: `API_BASE` local removido, importa de `@/utils/absUrl`
- [x] `next.config.ts`: headers de segurança básicos em todas as rotas (não só admin)
- [x] `next.config.ts`: `unsafe-eval` removido de produção
- [x] `next.config.ts`: IPs locais (`172.20.10.9`) apenas em dev
- [x] `next.config.ts`: HSTS habilitado em produção
- [x] `types/auth.ts`: tipos permissivos removidos (token em AuthUser, id: string|null)
- [x] Testes atualizados para refletir novo comportamento seguro
- [x] Novo teste: rejeição de response incompleta sem email fallback
- [x] Novo teste: rejeição de item com valor_unitario=0

### Depende do backend ⚠️

- [ ] Backend sempre retorna `email` não-nulo para sessão válida
- [ ] Backend serializa `valor_unitario` como number (não string)
- [ ] Backend implementa `/api/csrf-token` (token atual é ignorado silenciosamente)
- [ ] Backend retorna `permissions: []` (nunca omitido) em `/api/admin/me`

### Depende de decisão arquitetural 🔲

- [ ] CSP nonce-based (elimina `unsafe-inline`)
- [ ] API versioning (elimina fallbacks múltiplos)
- [ ] HSTS preload (após estabilizar HTTPS em produção)
