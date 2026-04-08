# Guia de Testes — Frontend Kavita

Como escrever testes para componentes, hooks e utilitários seguindo os padrões reais do projeto.

---

## Sumário

- [Setup e comandos](#setup-e-comandos)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Mocks comuns](#mocks-comuns)
- [Testar um utilitário](#testar-um-utilitário)
- [Testar um componente](#testar-um-componente)
- [Testar um hook com SWR](#testar-um-hook-com-swr)
- [Testar erros de autenticação (401/403)](#testar-erros-de-autenticação-401403)
- [Helpers compartilhados (testUtils)](#helpers-compartilhados-testutils)
- [Convenções do projeto](#convenções-do-projeto)
- [Problemas conhecidos](#problemas-conhecidos)

---

## Setup e comandos

```bash
npm run test              # Modo watch
npm run test:run          # Execução única
npm run test:coverage     # Com cobertura

# Arquivo específico
npx vitest run src/__tests__/utils/pricing.test.ts

# Padrão de nome
npx vitest run src/__tests__/hooks/useAdminResource
```

**Framework:** Vitest + jsdom + @testing-library/react

**Configuração:** `vitest.config.ts` já inclui:
- `clearMocks: true` — limpa mocks entre testes automaticamente
- `restoreMocks: true` — restaura implementações originais
- `mockReset: true` — reseta estado dos mocks
- Alias `@/` → `src/`
- Alias `server-only` → mock vazio

---

## Estrutura de arquivos

Testes ficam em `src/__tests__/` e espelham a estrutura de `src/`:

```
src/__tests__/
├── components/           # Testes de componentes
│   ├── EmptyState.test.tsx
│   ├── ProductCard.test.tsx
│   └── admin/
│       └── ProdutoForm.test.tsx
├── hooks/                # Testes de hooks
│   ├── useAdminResource.test.tsx
│   └── useFetchProducts.test.tsx
├── utils/                # Testes de utilitários
│   ├── pricing.test.ts
│   └── absUrl.test.ts
├── lib/                  # Testes de infraestrutura
│   ├── errors.test.ts
│   └── apiClient.csrf.test.ts
├── context/              # Testes de contextos
│   └── AdminAuthContext.test.tsx
├── server/data/          # Testes de server fetchers
│   └── categories.test.ts
├── testUtils.ts          # Helpers compartilhados
└── mocks/
    └── server-only.ts    # Mock do import "server-only"
```

---

## Mocks comuns

Estes são os mocks que você vai usar repetidamente. O projeto já tem padrões estabelecidos para cada um.

### apiClient

```typescript
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
```

> **Sempre** use `default` com métodos nomeados. O erro mais comum do projeto (~46 testes falhando) é usar a exportação nomeada legada `apiRequest`.

### next/navigation

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));
```

### next/link

```typescript
vi.mock("next/link", () => ({
  default: ({ href, children, prefetch, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...rest}>
      {children}
    </a>
  ),
}));
```

### next/image

```typescript
vi.mock("next/image", () => ({
  default: (props: any) => {
    const { src, alt, fill, sizes, priority, quality, ...rest } = props;
    return <img src={String(src)} alt={alt} {...rest} />;
  },
}));
```

### Contextos (AuthContext, CartContext)

```typescript
// Variável controlada fora do mock — muda entre testes
let currentUser: any = null;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: currentUser }),
}));

// Resetar em beforeEach
beforeEach(() => {
  currentUser = null;
});
```

### react-hot-toast

```typescript
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
```

---

## Testar um utilitário

Utilitários puros (`src/utils/`) são os testes mais simples — sem mocks, sem render, sem async.

### Template

```typescript
// src/__tests__/utils/meuUtil.test.ts
import { describe, it, expect } from "vitest";
import { minhaFuncao } from "@/utils/meuUtil";

describe("minhaFuncao", () => {
  it("retorna X quando recebe Y", () => {
    expect(minhaFuncao("entrada")).toBe("saida-esperada");
  });

  it("retorna fallback para valor inválido", () => {
    expect(minhaFuncao(null)).toBe("fallback");
    expect(minhaFuncao(undefined)).toBe("fallback");
    expect(minhaFuncao("")).toBe("fallback");
  });
});
```

### Exemplo real — pricing.test.ts

```typescript
import { computeProductPrice } from "@/utils/pricing";

describe("computeProductPrice", () => {
  it("sem promoção: retorna preço original", () => {
    const r = computeProductPrice(100, null);
    expect(r.finalPrice).toBe(100);
    expect(r.hasDiscount).toBe(false);
  });

  it("com promoção: calcula desconto", () => {
    const r = computeProductPrice(100, { preco_promocional: 80 });
    expect(r.finalPrice).toBe(80);
    expect(r.discountPercent).toBeCloseTo(20);
  });
});
```

### Quando a função depende de variável de ambiente

```typescript
import { vi } from "vitest";

it("usa API_URL da env", () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://meu-server:5000");
  // ... testar comportamento
});
// vi.stubEnv é limpo automaticamente pelo vitest (restoreMocks: true)
```

> **Nunca** use `process.env.X = "valor"` direto. Use `vi.stubEnv()`.

---

## Testar um componente

### Template básico

```typescript
// src/__tests__/components/MeuComponente.test.tsx
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

// 1. Mocks ANTES dos imports do componente
vi.mock("@/lib/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// 2. Import do componente
import MeuComponente from "@/components/MeuComponente";

describe("MeuComponente", () => {
  it("renderiza com props padrão", () => {
    render(<MeuComponente titulo="Teste" />);
    expect(screen.getByText("Teste")).toBeInTheDocument();
  });

  it("mostra empty state quando lista é vazia", () => {
    render(<MeuComponente titulo="Teste" items={[]} />);
    expect(screen.getByText(/nenhum/i)).toBeInTheDocument();
  });
});
```

### Componente com interação

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

it("chama callback ao clicar", async () => {
  const onSelect = vi.fn();
  render(<MeuComponente onSelect={onSelect} />);

  fireEvent.click(screen.getByRole("button", { name: /selecionar/i }));

  expect(onSelect).toHaveBeenCalledTimes(1);
});
```

### Componente que precisa de contexto

Se o componente usa `useAuth()`, `useCart()` ou similar, mocke o contexto:

```typescript
let currentUser: any = null;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: currentUser }),
}));

it("mostra nome do usuário quando logado", () => {
  currentUser = { id: 1, nome: "João", email: "joao@test.com" };
  render(<UserMenu />);
  expect(screen.getByText("João")).toBeInTheDocument();
});

it("mostra botão de login quando não logado", () => {
  currentUser = null;
  render(<UserMenu />);
  expect(screen.getByText(/entrar/i)).toBeInTheDocument();
});
```

### Componente com dynamic import

Alguns componentes usam `dynamic()` do Next.js. Para testar, importe dentro do teste:

```typescript
it("renderiza corretamente", async () => {
  const MeuComponente = (await import("@/components/MeuComponente")).default;
  render(<MeuComponente />);
  expect(screen.getByText("Conteúdo")).toBeInTheDocument();
});
```

### Helper para dados de teste

Crie uma função factory para gerar dados consistentes:

```typescript
function baseProduto(overrides: Partial<any> = {}) {
  return {
    id: 1,
    nome: "Produto Teste",
    preco: 100,
    image: "/uploads/p1.png",
    images: [],
    estoque: 10,
    ativo: true,
    ...overrides,
  };
}

it("mostra badge de esgotado", () => {
  render(<ProductCard product={baseProduto({ estoque: 0 })} />);
  expect(screen.getByText("Esgotado")).toBeInTheDocument();
});
```

---

## Testar um hook com SWR

Hooks que usam `useSWR` precisam de um wrapper com `SWRConfig` para evitar cache entre testes.

### Template

```typescript
// src/__tests__/hooks/useMeuHook.test.tsx
import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SWRConfig } from "swr";

// Mock do apiClient
const mockGet = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: { get: (...a: unknown[]) => mockGet(...a) },
}));

// Wrapper obrigatório para hooks com SWR
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),        // cache isolado por teste
        dedupingInterval: 0,              // sem dedup
        revalidateOnFocus: false,         // sem refetch automático
        shouldRetryOnError: false,        // falha rápida
      }}
    >
      {children}
    </SWRConfig>
  );
}

// Import do hook
import { useMeuHook } from "@/hooks/useMeuHook";

describe("useMeuHook", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("retorna dados do endpoint", async () => {
    mockGet.mockResolvedValueOnce([{ id: 1, nome: "Item" }]);

    const { result } = renderHook(() => useMeuHook(), { wrapper: Wrapper });

    // Espera loading terminar
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([{ id: 1, nome: "Item" }]);
    expect(result.current.error).toBeNull();
  });

  it("retorna erro quando API falha", async () => {
    mockGet.mockRejectedValueOnce(new Error("falha de rede"));

    const { result } = renderHook(() => useMeuHook(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("falha de rede");
    expect(result.current.data).toEqual([]);
  });
});
```

### Testar mutations (create/update/delete)

Para hooks que fazem mutations (como `useAdminResource`):

```typescript
const mockPost = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

it("create: faz POST e retorna item criado", async () => {
  mockGet.mockResolvedValueOnce([]);  // listagem inicial
  mockPost.mockResolvedValueOnce({ id: 1, nome: "Novo" });

  const { result } = renderHook(
    () => useAdminResource<Item>({ endpoint: "/api/admin/items" }),
    { wrapper: Wrapper }
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  let created: Item;
  await act(async () => {
    created = await result.current.create({ nome: "Novo" });
  });

  expect(created!).toEqual({ id: 1, nome: "Novo" });
  expect(mockPost).toHaveBeenCalledWith("/api/admin/items", { nome: "Novo" });
});
```

---

## Testar erros de autenticação (401/403)

O projeto tem tratamento especial para 401/403 — o hook faz logout silencioso e redireciona. Teste isso explicitamente:

```typescript
import { ApiError } from "@/lib/errors";

const mockLogout = vi.fn();
vi.mock("@/context/AdminAuthContext", () => ({
  useAdminAuth: () => ({ logout: mockLogout }),
}));

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

it("401: faz logout silencioso e redireciona", async () => {
  mockGet.mockRejectedValueOnce(
    new ApiError({ status: 401, message: "Unauthorized" })
  );

  const { result } = renderHook(
    () => useAdminResource<Item>({ endpoint: "/api/admin/items" }),
    { wrapper: Wrapper }
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(mockLogout).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/admin/login");
});
```

---

## Helpers compartilhados (testUtils)

O projeto tem helpers em `src/__tests__/testUtils.ts`:

| Helper | Para quê |
|--------|---------|
| `createMockStorage()` | Mock de localStorage/sessionStorage |
| `installMockStorage()` | Instala o mock no globalThis |
| `MockFormData` | Class mock para FormData (uploads) |
| `mockGlobalFormData()` | Instala MockFormData no globalThis |
| `mockObjectUrl()` | Mock de URL.createObjectURL/revokeObjectURL |
| `makeFetchResponse()` | Cria Response mock para testes de fetch |

### Exemplo — mock de localStorage

```typescript
import { installMockStorage } from "../testUtils";

const { storage, cleanup } = installMockStorage();

afterEach(cleanup);

it("salva no localStorage", () => {
  // ... ação que salva
  expect(storage.getItem("cartItems_guest")).toBeDefined();
});
```

---

## Convenções do projeto

| Convenção | Detalhe |
|-----------|---------|
| Localização | `src/__tests__/` espelha `src/` |
| Naming | `NomeDoModulo.test.ts` ou `.test.tsx` |
| Mocks | `vi.mock()` sempre antes dos imports |
| Env vars | `vi.stubEnv()` (nunca `process.env` direto) |
| server-only | Já mapeado automaticamente via alias em `vitest.config.ts` |
| Coverage | Exclui `src/app/**` (páginas RSC — testar via integração) |
| Padrão AAA | Arrange → Act → Assert em cada teste |
| Floats | `toBeCloseTo()` para valores decimais |
| Texto na tela | `screen.getByText()` ou `screen.getByRole()` |
| Async | `waitFor()` para estados eventuais, `act()` para mutations |

### O que testar

| Tipo | O que testar | O que não testar |
|------|-------------|-----------------|
| Utilitário | Entradas/saídas, edge cases, null/undefined | Implementação interna |
| Componente | Renderização, interação, estados (loading/error/empty) | Estilo CSS, layout pixel-perfect |
| Hook | Retorno de dados, loading/error, mutations, auth errors | Cache interno do SWR |
| Context | Estado inicial, transições, cleanup | Implementação de sub-hooks |

---

## Problemas conhecidos

~46 testes falham atualmente por mocks desatualizados. Veja [troubleshooting](./troubleshooting.md#testes-falhando-conhecidos-mocks-desatualizados) para detalhes.

Ao escrever testes novos, use sempre o padrão `default` export para o mock do apiClient (como mostrado nos templates acima). Não use `apiRequest` — é a exportação legada que causa as falhas.
