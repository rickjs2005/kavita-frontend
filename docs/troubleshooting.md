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

### useAuth() retorna null em componente dentro do admin

**Causa:** Dentro do layout admin, apenas `AdminAuthContext` está disponível. `AuthContext` é o contexto da loja.

**Solução:** Use `useAdminAuth()` em componentes admin. Os dois contextos são independentes.

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

## Admin

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
