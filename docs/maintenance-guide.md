# Guia de Manutenção — Frontend Kavita

Como adicionar features, módulos e manter o projeto ao longo do tempo.

---

## Sumário

- [Adicionar nova página pública](#adicionar-nova-página-pública)
- [Adicionar novo módulo admin (CRUD)](#adicionar-novo-módulo-admin-crud)
- [Adicionar novo campo em formulário existente](#adicionar-novo-campo-em-formulário-existente)
- [Adicionar novo módulo com upload de imagens](#adicionar-novo-módulo-com-upload-de-imagens)
- [Adicionar nova cor / design token](#adicionar-nova-cor--design-token)
- [Adicionar novo endpoint da API](#adicionar-novo-endpoint-da-api)
- [Adicionar schema Zod para novo endpoint](#adicionar-schema-zod-para-novo-endpoint)
- [Atualizar dependências](#atualizar-dependências)
- [Checklist de review](#checklist-de-review)
- [Regras de projeto](#regras-de-projeto)

---

## Adicionar nova página pública

**Exemplo:** Criar uma página `/parceiros` para listar parceiros.

### Passo a passo

#### 1. Criar o tipo

```typescript
// src/types/parceiro.ts
export interface Parceiro {
  id: number;
  nome: string;
  logo: string;
  descricao: string;
  url: string;
  ativo: boolean;
}
```

#### 2. Criar o server data fetcher (se dados forem públicos e estáticos)

```typescript
// src/server/data/parceiros.ts
import "server-only";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchPublicParceiros(): Promise<Parceiro[]> {
  try {
    const res = await fetch(`${API}/api/public/parceiros`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}
```

> **Nota:** Server data fetchers usam `process.env.NEXT_PUBLIC_API_URL` diretamente (não `API_BASE` de `@/utils/absUrl`). Isso é intencional — `absUrl` é um utilitário client-side para normalizar URLs de imagem, não para construir URLs de API em contexto de servidor. A regra "nunca use `process.env` inline" se aplica apenas a Client Components.

#### 3. Criar a página (RSC)

```typescript
// src/app/parceiros/page.tsx
import { fetchPublicParceiros } from "@/server/data/parceiros";
import ParceirosClient from "./ParceirosClient";

export const revalidate = 300;

export default async function ParceirosPage() {
  const parceiros = await fetchPublicParceiros();
  return <ParceirosClient parceiros={parceiros} />;
}
```

#### 4. Criar o Client Component

```typescript
// src/app/parceiros/ParceirosClient.tsx
"use client";

import { absUrl } from "@/utils/absUrl";
import type { Parceiro } from "@/types/parceiro";

interface Props {
  parceiros: Parceiro[];
}

export default function ParceirosClient({ parceiros }: Props) {
  if (parceiros.length === 0) {
    return <EmptyState message="Nenhum parceiro cadastrado." />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {parceiros.map((p) => (
        <div key={p.id} className="bg-white rounded-lg p-4">
          <img src={absUrl(p.logo)} alt={p.nome} />
          <h3 className="text-lg font-semibold">{p.nome}</h3>
          <p className="text-gray-600">{p.descricao}</p>
        </div>
      ))}
    </div>
  );
}
```

#### 5. (Opcional) Adicionar loading skeleton

```typescript
// src/app/parceiros/loading.tsx
export default function ParceirosLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse" />
      ))}
    </div>
  );
}
```

#### 6. Adicionar link na navegação (se necessário)

Edite `Header.tsx` ou `Footer.tsx` conforme o caso.

#### 7. Escrever testes

```typescript
// src/__tests__/components/ParceirosClient.test.tsx
```

---

## Adicionar novo módulo admin (CRUD)

**Exemplo:** Criar gestão de parceiros no admin (`/admin/parceiros`).

### Passo a passo

#### 1. Criar a página admin

```typescript
// src/app/admin/parceiros/page.tsx
"use client";

import { useAdminResource } from "@/hooks/useAdminResource";
import type { Parceiro } from "@/types/parceiro";

export default function AdminParceirosPage() {
  const { items, loading, saving, error, create, update, remove, refetch } =
    useAdminResource<Parceiro>({ endpoint: "/api/admin/parceiros" });

  // UI: listagem + formulário de criação/edição
}
```

`useAdminResource<T>` já fornece:
- **items**: array de T
- **loading/saving/error**: estados
- **create(payload)**: POST
- **update(id, payload)**: PUT
- **remove(id)**: DELETE com confirm
- **refetch()**: recarregar lista
- Auth handling: 401/403 → redirect para login

#### 2. Criar componentes admin (se necessário)

```
src/components/admin/parceiros/
├── ParceiroCard.tsx   # Card na listagem
└── ParceiroForm.tsx   # Formulário de criação/edição
```

#### 3. Adicionar link na sidebar

Edite `src/components/admin/AdminSidebar.tsx`:
```typescript
{
  label: "Parceiros",
  href: "/admin/parceiros",
  icon: UsersIcon,
  permission: "partners_manage", // permissão necessária
}
```

#### 4. (Se tem upload) Registrar subpasta em absUrl

Se o módulo tem imagens, adicione o prefixo em `src/utils/absUrl.ts`:

```typescript
// Adicionar "parceiros/" à lista de prefixos conhecidos
const KNOWN_PREFIXES = ["products/", "colaboradores/", "logos/", ..., "parceiros/"];
```

#### Checklist do novo módulo admin

- [ ] Tipo em `src/types/`
- [ ] Página em `src/app/admin/<modulo>/page.tsx`
- [ ] Componentes em `src/components/admin/<modulo>/`
- [ ] Link na sidebar com permissão correta
- [ ] Se tem upload: prefixo em `absUrl.ts`
- [ ] Testes em `src/__tests__/`

---

## Adicionar novo campo em formulário existente

**Exemplo:** Adicionar campo "peso" ao formulário de produto.

### Passo a passo

1. **Tipo:** Adicione o campo em `src/types/product.ts`:
   ```typescript
   peso?: number; // em kg
   ```

2. **Formulário:** Adicione o input em `src/components/admin/produtos/produtoform.tsx`

3. **Validação (se Zod):** Atualize o schema correspondente

4. **Exibição:** Se o campo aparece na área pública, atualize o componente de detalhe

5. **Testes:** Atualize testes existentes que fazem mock do produto

---

## Adicionar novo módulo com upload de imagens

### Uso do hook useUpload

```typescript
import { useUpload } from "@/utils/useUpload";

function MeuFormulario() {
  const { upload, uploading, error } = useUpload();

  const handleFile = async (file: File) => {
    const result = await upload(file, "/api/admin/parceiros", "logo");
    if (result) {
      setLogoPath(result.url || result.path);
    }
  };
}
```

### Registrar subpasta em absUrl

Edite `src/utils/absUrl.ts` e adicione o novo prefixo de subpasta para que `absUrl()` monte a URL correta:

```typescript
// Dentro da lista de prefixos conhecidos:
"parceiros/"
```

### Exibir a imagem

```typescript
import { absUrl } from "@/utils/absUrl";

<img src={absUrl(parceiro.logo)} alt={parceiro.nome} />
```

---

## Adicionar nova cor / design token

Processo completo documentado em [COLORS.md](../COLORS.md). Resumo:

1. Adicione a CSS var em `src/app/globals.css`:
   ```css
   :root {
     --color-novo-token: #hexvalue;
   }
   ```

2. Mapeie em `tailwind.config.ts`:
   ```typescript
   "novo-token": "var(--color-novo-token)",
   ```

3. Use nos componentes:
   ```tsx
   className="bg-novo-token text-novo-token"
   ```

4. Atualize `COLORS.md` com o novo token no catálogo.

5. Rode `node scripts/check-color-tokens.mjs` para validar consistência.

---

## Adicionar novo endpoint da API

### Em Client Component (hook ou componente)

```typescript
import apiClient from "@/lib/apiClient";

// GET
const data = await apiClient.get<MeuTipo>("/api/public/novo-endpoint");

// POST
const result = await apiClient.post<{ id: number }>("/api/admin/novo-endpoint", payload);
```

### Em Server Component (RSC)

```typescript
// src/server/data/novoModulo.ts
import "server-only";

export async function fetchNovoDado(): Promise<MeuTipo[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/novo-endpoint`, {
    cache: "no-store",
  });
  // ...
}
```

### Registrar constante (recomendado)

Adicione em `src/services/api/endpoints.ts` para evitar strings espalhadas.

---

## Adicionar schema Zod para novo endpoint

Quando o endpoint retorna dados críticos (auth, pagamento, checkout), adicione validação:

```typescript
// src/lib/schemas/api.ts

import { z } from "zod";

export const MeuNovoSchema = z.object({
  id: z.coerce.number().int().positive(),
  nome: z.string().min(1),
  valor: z.coerce.number().finite().nonnegative(),
});

export type MeuNovoDado = z.infer<typeof MeuNovoSchema>;
```

### Uso

```typescript
import { strictParse, safeParseSilent, MeuNovoSchema } from "@/lib/schemas/api";

// Em operações críticas (lança erro se inválido)
const dado = strictParse(MeuNovoSchema, response);

// Em listas (retorna null para itens inválidos)
const item = safeParseSilent(MeuNovoSchema, rawItem);
```

---

## Atualizar dependências

```bash
# Verificar atualizações disponíveis
npm outdated

# Atualizar dependências patch/minor
npm update

# Após atualizar
npm run test:run     # Verificar se testes passam
npm run build        # Verificar se build funciona
npm run lint         # Verificar lint
```

### Dependências sensíveis (cuidado extra)

| Pacote | Risco | Verificação |
|--------|-------|-------------|
| `next` | Breaking changes no App Router | Testar todas as rotas |
| `react` / `react-dom` | APIs de hooks podem mudar | Testar componentes com state |
| `swr` | Config de cache pode mudar | Testar hooks de fetch |
| `zod` | API de schemas pode mudar | Rodar testes de schemas |
| `tailwindcss` | Utilitários podem ser renomeados | Verificar UI visualmente |

---

## Checklist de review

Antes de submeter qualquer PR, verifique:

### Código
- [ ] Usa `apiClient` (nunca `fetch()` direto em componentes)
- [ ] Usa `absUrl()` para URLs de imagem (nunca concatenação manual)
- [ ] Importa `API_BASE` de `@/utils/absUrl` (nunca `process.env` inline)
- [ ] Não importa `src/server/data/` em Client Components
- [ ] Não usa hex hardcoded em Tailwind (usa design tokens)
- [ ] Não tem `console.log` de debug
- [ ] Não usa Axios
- [ ] Erros tratados com `try/catch` e `isApiError()`
- [ ] Tipos TypeScript definidos (sem `any` desnecessário)

### UI
- [ ] Loading state visível durante operações assíncronas
- [ ] Erro exibido ao usuário de forma amigável
- [ ] Empty state quando lista está vazia
- [ ] Responsivo (mobile e desktop)

### Testes
- [ ] Testes existentes continuam passando (`npm run test:run`)
- [ ] Novos componentes/hooks têm testes
- [ ] Mocks usam `default` export do apiClient

---

## Regras de projeto

Estas regras existem para prevenir regressões. Todas são enforcement — não sugestões.

| Regra | Motivo |
|-------|--------|
| `apiClient` para todo HTTP | Credentials, CSRF, timeout, error handling automáticos |
| `absUrl()` para imagens | Trata todos os formatos (path, URL, backslash, data:) |
| `API_BASE` importado | Evita divergência entre env vars em diferentes contextos |
| `server/data/` é server-only | Previne import acidental em Client Components |
| Design tokens para cores | Consistência visual, manutenção centralizada |
| Sem `console.log` em produção | Poluição de console em produção |
| Sem Axios | Completamente removido; apiClient é o padrão único |
| `vi.stubEnv()` em testes | Evita mutação de process.env que afeta outros testes |
