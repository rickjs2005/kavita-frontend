# Troubleshooting — Frontend Kavita

Problemas comuns encontrados durante desenvolvimento e como resolvê-los.

---

## Sumário

- [Setup e ambiente](#setup-e-ambiente)
- [Autenticação](#autenticação)
- [API e requests](#api-e-requests)
- [Imagens e uploads](#imagens-e-uploads)
- [Testes](#testes)
- [Build e deploy](#build-e-deploy)
- [Estilos e design tokens](#estilos-e-design-tokens)
- [CORS e rede](#cors-e-rede)
- [Client vs Server Components](#client-vs-server-components)
- [Performance e re-renders](#performance-e-re-renders)
- [Diferenças entre dev e produção](#diferenças-entre-dev-e-produção)
- [Middleware Edge](#middleware-edge)
- [Admin](#admin)

---

## Setup e ambiente

### Página em branco ao acessar localhost:3000

**Causa provável:** Backend não está rodando.

**Solução:**
1. Verifique se `kavita-backend` está rodando em `localhost:5000`
2. Verifique `.env.local` — `NEXT_PUBLIC_API_URL` deve apontar para o backend
3. Abra o console do browser — procure erros de rede (CORS, connection refused)

### Erro "ECONNREFUSED" no terminal

**Causa:** Backend offline ou porta errada.

**Solução:** Inicie o backend (`cd kavita-backend && npm run dev`) e confirme a porta em `.env.local`.

### ESLint não funciona / erro de flat config

**Causa:** O ESLint usa flat config com flag explícita para Windows.

**Solução:** Use sempre `npm run lint` (nunca `npx eslint` direto). O script inclui `set ESLINT_USE_FLAT_CONFIG=true&&` que é necessário no Windows.

### Hot reload não funciona

**Causa:** Pode ser limite de watchers no sistema.

**Solução:**
- Reinicie `npm run dev`
- No Windows, feche outros processos que monitoram arquivos
- Verifique se não há erros de compilação no terminal

---

## Autenticação

### "Sessão expirada" aparece repetidamente

**Causa:** O backend está retornando 401 em requests. O apiClient detecta e dispara evento `auth:expired`.

**Diagnóstico:**
1. Abra Network tab do DevTools
2. Procure requests com status 401
3. Verifique se o cookie de sessão está sendo enviado (Application → Cookies)
4. Verifique se o backend está validando o cookie corretamente

**Solução:** Faça logout e login novamente. Se persistir, o cookie pode ter expirado no backend.

### Login funciona mas estado não persiste após refresh

**Causa:** O cookie HttpOnly pode não estar sendo setado corretamente pelo backend.

**Diagnóstico:**
1. Após login, verifique Application → Cookies no DevTools
2. Procure o cookie de sessão (ou `adminToken` para admin)
3. Verifique se `SameSite`, `Secure` e `HttpOnly` estão configurados

**Solução:** Problema no backend — o cookie precisa ter `SameSite: Strict` (ou `Lax`) e `HttpOnly: true`.

### Admin redireciona para login mesmo com sessão válida

**Causa:** Pode ser o middleware Edge (`middleware.ts`) rejeitando a request.

**Diagnóstico:**
1. Verifique o console do servidor Next.js — procure `[middleware] Acesso rejeitado sem token`
2. Verifique se o cookie `adminToken` existe em Application → Cookies
3. Verifique se o cookie é enviado em requests para o frontend (não só para o backend)

**Solução:** O cookie `adminToken` precisa ter `path=/` para ser acessível pelo middleware do Next.js.

### useAuth() retorna null em componente dentro do admin (ou painel corretora/produtor)

**Causa:** Cada área da aplicação tem seu próprio provider. Os 4 contextos (`AuthContext`, `AdminAuthContext`, `CorretoraAuthContext`, `ProducerAuthContext`) são independentes e não se cruzam — se você chamar `useAuth()` dentro de `/admin/**`, vai receber `null`.

**Solução:** Use o hook correto para a área onde o componente vive:

| Área | Hook |
|------|------|
| `/` (loja pública), `/checkout`, `/meus-dados` | `useAuth()` |
| `/admin/**` | `useAdminAuth()` |
| `/painel/corretora/**` | `useCorretoraAuth()` |
| `/painel/produtor/**` | `useProducerAuth()` |

---

## API e requests

### CSRF token falha (403 em mutations)

**Causa:** O endpoint `/api/csrf-token` pode não estar acessível ou o token expirou.

**Diagnóstico:**
1. Network tab → procure request para `/api/csrf-token`
2. Verifique se retorna 200 com um token
3. Verifique se o header `x-csrf-token` está sendo enviado nos POSTs subsequentes

**Solução:**
- Se o endpoint não existe no backend: o apiClient ignora silenciosamente (failsafe)
- Se retorna erro: verifique CORS e configuração do backend
- O token tem cache de 10 minutos — forçar refresh: recarregue a página

### Request retorna dados inesperados (campos undefined)

**Causa:** Backend pode ter mudado o formato da resposta sem atualizar o frontend.

**Diagnóstico:**
1. Network tab → examine a response body do endpoint
2. Compare com o schema Zod esperado em `src/lib/schemas/api.ts`
3. Se houver `SchemaError` no console: o Zod detectou a divergência

**Solução:** Atualize o schema Zod e/ou os tipos TypeScript para refletir o novo formato.

### Timeout em requests (AbortError)

**Causa:** Request demorou mais de 15s (timeout padrão do apiClient).

**Diagnóstico:** Console mostra "Request timeout" ou `AbortError`.

**Solução:**
- Se o endpoint é lento: aumente o timeout na chamada específica:
  ```typescript
  apiClient.get("/api/relatorios/vendas", { timeout: 30000 });
  ```
- Se é um problema de rede: verifique a conexão com o backend

---

## Imagens e uploads

### Imagem não carrega (broken image)

**Causa provável:** URL mal formada ou backend não servindo o arquivo.

**Diagnóstico:**
1. Inspecione o elemento → veja a URL do `src`
2. Abra a URL diretamente no browser
3. Se 404: arquivo não existe no backend
4. Se URL estranha: verifique se está usando `absUrl()`

**Solução:**
```typescript
// CORRETO
import { absUrl } from "@/utils/absUrl";
<img src={absUrl(produto.image)} />

// ERRADO — não faça isso
<img src={`${API_BASE}${produto.image}`} />
```

### Upload falha com 403

**Causa:** Falta de cookie de autenticação ou CSRF token.

**Diagnóstico:**
1. Verifique se está logado como admin
2. Verifique se o `useUpload()` está sendo usado corretamente
3. Network tab → verifique se o header `x-csrf-token` está presente

**Solução:** O `useUpload()` usa `apiClient` internamente, que injeta CSRF e credentials automaticamente. Se o problema persistir, verifique a sessão admin.

### Imagem aparece como placeholder

**Causa:** `absUrl()` retorna `/placeholder.png` quando recebe valor inválido (null, undefined, string vazia).

**Diagnóstico:** Verifique o valor do campo de imagem nos dados. Se for null/undefined, o backend não está retornando a imagem.

---

## Testes

### Testes falhando conhecidos (mocks desatualizados)

**Sintoma:** Ao rodar `npm run test:run` pela primeira vez, ~46 testes falham em 8 arquivos.

**Causa:** O `apiClient` foi refatorado para usar default export, mas alguns testes ainda fazem mock da exportação nomeada legada `apiRequest`.

**Arquivos afetados:**
- `src/__tests__/lib/apiClient.csrf.test.ts` — 3 falhas
- `src/__tests__/lib/newsPublicApi.test.ts` — 2 falhas
- `src/__tests__/hooks/useCotacoesAdmin.test.tsx` — 2 falhas
- `src/__tests__/services/api/services/products.test.ts` — falhas por `apiRequest`
- `src/__tests__/components/DeleteButton.test.tsx` — 1 falha
- `src/__tests__/components/ProductCard.test.tsx` — 1 falha
- `src/__tests__/components/admin/ProdutoForm.test.tsx` — 1 falha

**Impacto:** Apenas testes. A aplicação funciona normalmente. Ignore durante onboarding.

**Correção:** Atualizar cada mock para usar o default export:
```typescript
// ANTES (legado — causa falha)
vi.mock("@/lib/apiClient", () => ({ apiRequest: vi.fn() }));

// DEPOIS (correto)
vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
```

---

### Testes falhando por mock de apiClient

**Erro típico:**
```
No "apiRequest" export is defined on the "@/lib/apiClient" mock
```

**Causa:** O mock está usando a exportação nomeada antiga `apiRequest` em vez do default export.

**Solução:**
```typescript
// CORRETO
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// ERRADO — exportação legada
vi.mock("@/lib/apiClient", () => ({
  apiRequest: vi.fn(),
}));
```

### Teste falha com "server-only" error

**Causa:** Componente importa módulo de `src/server/data/` que usa `import "server-only"`.

**Solução:** O mock já está configurado em `vitest.config.ts`. Se falhar, verifique que o alias está mapeado:
```typescript
// vitest.config.ts
resolve: {
  alias: {
    "server-only": "src/__tests__/mocks/server-only.ts",
  },
},
```

### Teste falha por variável de ambiente

**Causa:** Usando `process.env` diretamente em vez de `vi.stubEnv()`.

**Solução:**
```typescript
// CORRETO
vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:5000");

// ERRADO
process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";
```

### Teste de componente falha com "act() warning"

**Causa:** State update acontece fora do ciclo de renderização do React.

**Solução:** Envolva ações assíncronas em `waitFor`:
```typescript
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Carregado")).toBeInTheDocument();
});
```

---

## Build e deploy

### Build falha com "Type error"

**Diagnóstico:** Leia a mensagem de erro — geralmente indica tipo incompatível.

**Ações:**
1. `npm run lint` — corrige problemas simples
2. Verifique se tipos em `src/types/` estão atualizados
3. Verifique se imports estão corretos (Client Component importando server-only module?)

### Build falha com "next.config.ts" error

**Causa provável:** Variável de ambiente não definida.

**Solução:** Verifique que `.env.local` (dev) ou variáveis de ambiente (produção) estão definidas. `NEXT_PUBLIC_API_URL` é usada no `next.config.ts` para configurar `images.remotePatterns`.

### Imagens não carregam em produção

**Causa:** `images.remotePatterns` em `next.config.ts` não inclui o host de produção.

**Solução:** O config deriva automaticamente de `NEXT_PUBLIC_API_URL`. Verifique se a variável está correta no ambiente de produção.

---

## Estilos e design tokens

### Cor não aparece / classe Tailwind não funciona

**Causa:** Cor definida em CSS var mas não mapeada no Tailwind config, ou vice-versa.

**Diagnóstico:**
1. Verifique se a CSS var existe em `src/app/globals.css` (`:root`)
2. Verifique se está mapeada em `tailwind.config.ts` (`theme.extend.colors`)
3. Rode `node scripts/check-color-tokens.mjs` para validar consistência

**Solução:** Adicione a cor nas duas camadas. Consulte [COLORS.md](../COLORS.md) para o processo completo.

### Tailwind purge removendo classe

**Causa:** Classe gerada dinamicamente não é detectada pelo Tailwind.

**Solução:** Não construa classes dinamicamente com template literals:
```typescript
// ERRADO — Tailwind não detecta
className={`bg-${color}-500`}

// CORRETO — classes completas
className={color === "green" ? "bg-green-500" : "bg-red-500"}
```

---

## CORS e rede

### Erro de CORS no browser (blocked by CORS policy)

**Sintoma:** Console mostra `Access to fetch at 'http://localhost:5000/...' from origin 'http://localhost:3000' has been blocked by CORS policy`.

**Causa:** O backend não está configurado para aceitar requests do frontend, ou está offline.

**Diagnóstico:**
1. Verifique se o backend está rodando (`http://localhost:5000` responde?)
2. Verifique se o backend tem CORS habilitado para `http://localhost:3000`
3. Verifique se `.env.local` aponta para a URL correta do backend

**Solução:**
- Se o backend está offline: inicie-o
- Se está rodando mas CORS falha: verifique a configuração de CORS no Express (`kavita-backend`). A origin `http://localhost:3000` precisa estar na whitelist
- Se funciona no browser mas falha em outro contexto: verifique se não há proxy ou firewall bloqueando

### Request funciona no browser mas falha no servidor (RSC)

**Sintoma:** Página RSC (Server Component) não consegue buscar dados, mas a mesma URL funciona no browser.

**Causa:** RSC roda no servidor Node.js — não tem cookies do browser nem a mesma rede. Se o backend aceita requests apenas de `localhost` mas o server do Next.js resolve como `127.0.0.1` (ou vice-versa), o CORS pode falhar.

**Diagnóstico:**
1. Verifique o log do terminal Next.js — procure erros de fetch
2. Verifique se `NEXT_PUBLIC_API_URL` usa `localhost` ou `127.0.0.1` — tente trocar
3. Server data fetchers (`src/server/data/`) não enviam cookies — se o endpoint requer auth, o fetch vai falhar

**Solução:** Server data fetchers devem acessar apenas endpoints públicos (`/api/public/*`). Se o endpoint requer autenticação, o fetch precisa ser no cliente via `apiClient`.

---

## Client vs Server Components

### Componente não renderiza / hooks não funcionam

**Sintoma:** `useEffect`, `useState`, `useContext` dão erro: `Error: useState/useEffect is not a function` ou `React Context is not available`.

**Causa:** O componente está sendo tratado como Server Component (padrão no App Router) mas usa hooks de cliente.

**Solução:** Adicione `"use client"` na primeira linha do arquivo:
```tsx
"use client";  // ← obrigatório se o componente usa hooks, state ou event handlers

import { useState } from "react";
// ...
```

### Import de `server/data/` em Client Component

**Sintoma:** Erro de build: `This module can only be used from a Server Component` ou similar.

**Causa:** Um Client Component (`"use client"`) está importando um módulo de `src/server/data/` que usa `import "server-only"`.

**Diagnóstico:** Leia a stack trace do erro — ela mostra qual import está errado.

**Solução:** Server data fetchers só podem ser importados em Server Components (`page.tsx` sem `"use client"`). Para buscar os mesmos dados no cliente, use um hook com `apiClient`:
```tsx
// ERRADO — Client Component importando server-only
"use client";
import { fetchPublicCategories } from "@/server/data/categories"; // ← vai quebrar

// CORRETO — use apiClient no cliente
"use client";
import apiClient from "@/lib/apiClient";
const categories = await apiClient.get("/api/public/categorias");
```

### Página RSC mostrando dados desatualizados

**Sintoma:** Dados alterados no admin não aparecem na página pública.

**Causa:** A página usa `revalidate` (ISR) e está servindo a versão cacheada.

**Diagnóstico:** Verifique o `export const revalidate = X` no `page.tsx`. Se é 300 (5 minutos), os dados podem levar até 5 minutos para atualizar.

**Solução:** Aguarde o tempo de revalidate. Em desenvolvimento, `npm run dev` não cacheia — o problema aparece mais em `npm run build && npm start`.

---

## Performance e re-renders

### Componente re-renderiza excessivamente

**Sintoma:** A UI trava ou fica lenta. React DevTools Profiler mostra muitos re-renders.

**Causas comuns no projeto:**
1. **Objeto criado inline como prop:** `<Child style={{ color: "red" }} />` cria novo objeto a cada render
2. **Callback sem useCallback:** `<Child onClick={() => doSomething()} />` cria nova função a cada render
3. **Context muito amplo:** Componentes que usam `useCart()` re-renderizam a cada mudança no carrinho, mesmo se só precisam de `cartCount`

**Diagnóstico:**
1. Abra React DevTools → Profiler → clique "Record" → interaja → pare
2. Veja quais componentes re-renderizam e com que frequência
3. "Why did this render?" mostra qual prop/state mudou

**Soluções comuns:**
```tsx
// ANTES — novo objeto a cada render
<Child config={{ sort: "name", order: "asc" }} />

// DEPOIS — useMemo para estabilizar
const config = useMemo(() => ({ sort: "name", order: "asc" }), []);
<Child config={config} />
```

### ProductCard faz request individual por promoção (N+1)

**Sintoma:** Na listagem de produtos, cada `ProductCard` chama `useProductPromotion(id)` separadamente — N cards = N requests.

**Causa:** Design atual do hook `useProductPromotion` busca uma promoção por produto. O SWR faz dedup por key mas não batch.

**Mitigação atual:** O hook tem `dedupingInterval: 5min` — segunda visita não refaz o request. Em listas pequenas (<20 itens) o impacto é aceitável.

**Onde investigar:** `src/hooks/useProductPromotion.ts` e `src/components/products/ProductCard.tsx`.

---

## Diferenças entre dev e produção

### Algo funciona em dev mas quebra no build

**Sintoma:** `npm run dev` funciona, `npm run build` falha.

**Causas comuns:**
1. **Tipo incorreto que o TypeScript não checou em dev:** O build roda `tsc` com checagem completa
2. **`process.env` acessado em contexto errado:** Em dev, variáveis podem vazar entre server/client; em build, a separação é estrita
3. **Import dinâmico que não resolve:** `dynamic()` com path variável pode falhar no build

**Diagnóstico:** Leia a mensagem de erro do build. Em 90% dos casos é type error ou import inválido.

### CSP bloqueia recurso em produção mas não em dev

**Sintoma:** Script, imagem ou estilo carrega em `npm run dev` mas é bloqueado em produção. Console mostra `Refused to load... because it violates... Content-Security-Policy`.

**Causa:** A CSP em dev inclui `'unsafe-eval'` (necessário para hot reload do Next.js). Em produção, `'unsafe-eval'` é removido. Também: `upgrade-insecure-requests` é adicionado em produção — bloqueia recursos HTTP em página HTTPS.

**Onde verificar:** `next.config.ts` — a variável `isDev` controla as diferenças:
- Dev: inclui `'unsafe-eval'` em `script-src`
- Produção: remove `'unsafe-eval'`, adiciona `upgrade-insecure-requests` e HSTS

**Solução:** Se o recurso é legítimo, adicione a origin na diretiva CSP correspondente em `next.config.ts`. Se é um script de terceiro, adicione em `script-src`. Se é uma imagem, adicione em `img-src`.

### HSTS ativo em produção

**Sintoma:** Após acessar o site em produção com HTTPS, o browser recusa acessar via HTTP (mesmo em localhost depois).

**Causa:** O header `Strict-Transport-Security: max-age=31536000; includeSubDomains` é enviado apenas em produção. Uma vez que o browser recebe, ele força HTTPS por 1 ano.

**Solução:** Isso é comportamento esperado em produção. Se precisar acessar localhost depois, limpe o HSTS do browser: `chrome://net-internals/#hsts` → Delete domain.

---

## Middleware Edge

### Middleware rejeita request válida para /admin

**Sintoma:** Console do Next.js mostra `[middleware] Acesso rejeitado sem token: /admin/...` mesmo com sessão válida.

**Causa:** O middleware Edge (`middleware.ts`) verifica apenas a **presença** do cookie `adminToken`. Se o cookie não está sendo enviado para o Next.js (path errado, SameSite restritivo), o middleware rejeita.

**Diagnóstico:**
1. DevTools → Application → Cookies → verifique se `adminToken` existe
2. Verifique o `path` do cookie — deve ser `/` (não `/api`)
3. Verifique `SameSite` — deve ser `Lax` ou `Strict` (não `None` sem Secure)

**Solução:** O cookie é setado pelo backend. Verifique a configuração de cookies no Express — `path: "/"` é obrigatório para o middleware do Next.js conseguir ler.

### Middleware não verifica JWT

**Sintoma:** Preocupação de que o middleware Edge não valida a assinatura do token.

**Explicação:** Isso é intencional e documentado. O Edge Runtime do Next.js não suporta as APIs de crypto do Node.js necessárias para verificar JWT. O middleware faz apenas verificação de presença — a validação real (assinatura, expiração, permissões) acontece no backend Express (`verifyAdmin` middleware).

**Onde verificar:** `middleware.ts` (raiz) — o comentário no código explica essa decisão.

---

## Admin

### `alert()` aparece em vez de toast no admin

**Causa:** Código legado. Algumas páginas admin usam `alert()` nativo em vez de `react-hot-toast`.

**Arquivos afetados:**
- `src/app/admin/pedidos/page.tsx` (7 ocorrências)
- `src/app/admin/produtos/page.tsx` (4 ocorrências)
- `src/app/admin/servicos/page.tsx` (2 ocorrências)
- `src/app/admin/equipe/page.tsx` (2 ocorrências)

**Solução:** Ao trabalhar nesses arquivos, substitua `alert(msg)` por `toast.error(msg)` ou `toast.success(msg)`. Não é urgente mas melhora a UX.

---

### Sidebar não mostra todos os links

**Causa:** Permissões insuficientes para o role do admin.

**Diagnóstico:** `AdminSidebar.tsx` filtra links baseado em `hasPermission()`. Verifique o role e as permissões do admin via `GET /api/admin/me`.

**Solução:** Ajuste as permissões do admin no backend. O role `master` vê tudo.

### Ação no admin não reflete no público

**Causa:** Cache de ISR (Incremental Static Regeneration).

**Explicação:** Páginas públicas com `revalidate` (ex: 300s para home) mostram dados cacheados. Após o admin alterar algo, o público pode levar até o tempo de revalidate para atualizar.

**Solução:** Aguarde o tempo de revalidate ou, em produção, use on-demand revalidation do Next.js (requer integração adicional com o backend).

### "Sessão expirada" ao fazer upload no admin

**Causa:** Cookie `adminToken` não está sendo enviado no request de upload.

**Solução:** Verifique que está usando `useUpload()` (que usa `apiClient` internamente). Não use `fetch()` direto para uploads.
