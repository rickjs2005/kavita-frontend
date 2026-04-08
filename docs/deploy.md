# Deploy e CI — Frontend Kavita

Como o frontend é construído, testado e publicado.

---

## Sumário

- [Build de produção](#build-de-produção)
- [Docker](#docker)
- [Variáveis de ambiente em produção](#variáveis-de-ambiente-em-produção)
- [CI (Integração Contínua)](#ci-integração-contínua)
- [CD (Deploy Contínuo)](#cd-deploy-contínuo)
- [Diferenças entre dev e produção](#diferenças-entre-dev-e-produção)
- [Validação pós-deploy](#validação-pós-deploy)

---

## Build de produção

```bash
npm run build    # Gera o build em .next/
npm run start    # Inicia o servidor de produção (porta 3000)
```

O `next.config.ts` usa `output: "standalone"` — o build gera um `server.js` auto-contido em `.next/standalone/` que inclui apenas os `node_modules` necessários. Isso é otimizado para Docker (sem `npm ci` no runtime).

---

## Docker

O projeto tem um Dockerfile multi-stage pronto para produção.

### Stages

| Stage | Base | O que faz |
|-------|------|-----------|
| `deps` | `node:20-slim` | `npm ci --ignore-scripts` — instala dependências |
| `builder` | `node:20-slim` | Copia deps + código, roda `npm run build` |
| `runtime` | `node:20-slim` | Copia apenas `.next/standalone`, `.next/static` e `public` |

### Build da imagem

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.kavita.com \
  --build-arg NEXT_PUBLIC_SITE_URL=https://kavita.com \
  --build-arg NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx \
  --build-arg NEXT_PUBLIC_APP_ENV=production \
  -t kavita-frontend .
```

> **Importante:** Variáveis `NEXT_PUBLIC_*` são inlined no JavaScript durante o build. Elas **não** podem ser alteradas no runtime — precisam ser passadas como `--build-arg` no `docker build`.

### Executar

```bash
docker run -p 3000:3000 kavita-frontend
```

### Healthcheck

O Dockerfile inclui healthcheck automático:
- Intervalo: 30s
- Timeout: 5s
- Start period: 15s
- Verifica: `fetch('http://localhost:3000/')` retorna status < 500

### Segurança do container

- Roda como usuário não-root (`kavita`, UID 1001)
- Imagem base `node:20-slim` (mínima)
- Sem `npm ci` no runtime (apenas o standalone output)

---

## Variáveis de ambiente em produção

Todas as variáveis `NEXT_PUBLIC_*` são baked no build — não são lidas no runtime.

| Variável | Obrigatória | Valor em produção |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | Sim | URL do backend Express (ex: `https://api.kavita.com`) |
| `NEXT_PUBLIC_API_BASE` | Sim | `/api` (geralmente não muda) |
| `NEXT_PUBLIC_SITE_URL` | Sim | URL pública do frontend (ex: `https://kavita.com`) |
| `NEXT_PUBLIC_APP_URL` | Sim | Igual ao `SITE_URL` |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Para checkout | Chave pública do MercadoPago |
| `NEXT_PUBLIC_APP_ENV` | Sim | `production` |

### O que muda com `NEXT_PUBLIC_APP_ENV=production`

O `next.config.ts` usa essa variável (via `isDev`) para:
- **Remover `unsafe-eval`** do CSP `script-src` (necessário apenas em dev para hot reload)
- **Adicionar `upgrade-insecure-requests`** ao CSP (força HTTPS)
- **Adicionar HSTS** (`Strict-Transport-Security: max-age=31536000; includeSubDomains`)
- **Remover IPs locais** (`localhost`, `127.0.0.1`) dos `img-src` e `connect-src`

---

## CI (Integração Contínua)

Arquivo: `.github/workflows/ci.yml`

### Quando roda

- Push para `main`
- Pull requests para `main`
- Manual (`workflow_dispatch`)

### Steps

| Step | Comando | Comportamento |
|------|---------|---------------|
| Install | `npm ci` | Clean install |
| Lint | `npm run lint` | **Non-blocking** (`\|\| true`) — falhas de lint não quebram CI |
| Color tokens | `npm run lint:colors` | Valida consistência de design tokens |
| Testes | `npm run test:run` | Roda todos os testes |
| Build | `npm run build` | Build de produção completo |
| Audit | `npm audit --audit-level=critical` | Só bloqueia em vulnerabilidades críticas |

### Observações

- Node 20, ubuntu-latest
- `NEXT_TELEMETRY_DISABLED=1` — desativa telemetria do Next.js
- Concurrency: cancela runs anteriores do mesmo branch
- Timeout: 20 minutos

> **Realidade atual:** O lint roda como non-blocking (`|| true`). Os ~46 testes falhando por mocks desatualizados passam no CI porque o Vitest não usa exit code de falha para testes esperados. O build é o gate real — se tipar errado, o build falha.

---

## CD (Deploy Contínuo)

Arquivo: `.github/workflows/cd.yml`

### Quando roda

- Push para `main` (após CI passar)
- Manual com escolha de ambiente (`staging` ou `production`)

### Pipeline

```
1. CI passa (workflow_call para ci.yml)
2. Build da imagem Docker com build-args do ambiente
3. Push para GitHub Container Registry (ghcr.io)
4. Tags: SHA curto (ex: a1b2c3d) + nome do ambiente (staging/production)
```

### Registry

- **Registry:** `ghcr.io/<owner>/kavita-frontend`
- **Auth:** `GITHUB_TOKEN` (automático)
- **Tags geradas:**
  - `ghcr.io/<owner>/kavita-frontend:a1b2c3d` (commit SHA)
  - `ghcr.io/<owner>/kavita-frontend:staging` ou `production`

### Variáveis de ambiente no CD

As variáveis `NEXT_PUBLIC_*` para o build são lidas de **GitHub Variables** (`vars.*`):

| Variable | Onde configurar |
|----------|-----------------|
| `NEXT_PUBLIC_API_URL` | Repository → Settings → Variables |
| `NEXT_PUBLIC_SITE_URL` | Repository → Settings → Variables |
| `NEXT_PUBLIC_APP_URL` | Repository → Settings → Variables |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Repository → Settings → Variables |

Se não configuradas, usam defaults de localhost (útil para staging local).

---

## Diferenças entre dev e produção

| Aspecto | Dev (`npm run dev`) | Produção (`npm run build && start` / Docker) |
|---------|--------------------|--------------------------------------------|
| CSP `script-src` | Inclui `'unsafe-eval'` (hot reload) | Remove `'unsafe-eval'` |
| CSP extras | — | `upgrade-insecure-requests` |
| HSTS | Desativado | `max-age=31536000; includeSubDomains` |
| `images.remotePatterns` | Inclui `localhost`, `127.0.0.1` | Apenas host derivado de `NEXT_PUBLIC_API_URL` |
| Image optimization | `unoptimized: true` (sem sharp) | Otimização habilitada |
| Error overlay | Ativo (Next.js dev overlay) | Desativado |
| Source maps | Disponíveis | Não expostas ao cliente |

Veja `next.config.ts` (linhas 60-184) para detalhes de CSP e headers.

---

## Validação pós-deploy

Após deploy, verifique:

| Check | Como | Esperado |
|-------|------|----------|
| Home carrega | Acesse a URL pública | Hero + categorias visíveis |
| Imagens carregam | Veja cards de produto | Fotos do backend renderizam |
| Admin acessível | Acesse `/admin/login` | Tela de login |
| HTTPS funciona | Acesse via `https://` | Sem mixed content warnings |
| CSP não bloqueia | Console do browser | Zero erros de CSP |
| Healthcheck Docker | `docker inspect --format='{{.State.Health.Status}}'` | `healthy` |
