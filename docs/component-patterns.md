# Padroes de Componentes — Frontend Kavita

Como criar componentes, hooks e módulos seguindo os padrões do projeto.

---

## Sumário

- [Estrutura de um componente](#estrutura-de-um-componente)
- [Naming conventions](#naming-conventions)
- [Props e tipos](#props-e-tipos)
- [Componentes reutilizáveis (ui/)](#componentes-reutilizáveis-ui)
- [Padrão de hook de dados](#padrão-de-hook-de-dados)
- [Padrão de hook admin (useAdminResource)](#padrão-de-hook-admin-useadminresource)
- [Formulários](#formulários)
- [Loading, error e empty states](#loading-error-e-empty-states)
- [Notificações (toast)](#notificações-toast)
- [Acessibilidade](#acessibilidade)

---

## Estrutura de um componente

### Template base

```tsx
"use client"; // apenas se for Client Component

import { useState, useCallback } from "react";
import { absUrl } from "@/utils/absUrl";
import type { Product } from "@/types/product";

// ---- Tipos locais ----
interface Props {
  product: Product;
  onSelect?: (id: number) => void;
}

// ---- Constantes (se necessário) ----
const PLACEHOLDER = "/placeholder.png";

// ---- Componente ----
export default function ProductCard({ product, onSelect }: Props) {
  const [imageError, setImageError] = useState(false);

  const handleClick = useCallback(() => {
    onSelect?.(product.id);
  }, [product.id, onSelect]);

  return (
    <article className="bg-white rounded-lg shadow-sm p-4">
      <img
        src={imageError ? PLACEHOLDER : absUrl(product.image)}
        alt={product.nome}
        onError={() => setImageError(true)}
      />
      <h3 className="text-lg font-semibold text-gray-900">{product.nome}</h3>
      <button
        onClick={handleClick}
        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded"
      >
        Ver detalhes
      </button>
    </article>
  );
}
```

### Ordem interna do arquivo

1. `"use client"` (se necessário)
2. Imports (React, libs, componentes internos, tipos)
3. Interface de Props
4. Constantes locais
5. Componente (export default)
6. (Opcional) Sub-componentes locais não exportados

---

## Naming conventions

| Item | Convenção | Exemplo |
|------|-----------|---------|
| Arquivo de componente | PascalCase.tsx | `ProductCard.tsx` |
| Arquivo de hook | camelCase.ts | `useFetchProducts.ts` |
| Arquivo de tipo | camelCase.ts | `product.ts` |
| Arquivo de util | camelCase.ts | `formatters.ts` |
| Componente (export) | PascalCase | `export default function ProductCard` |
| Hook (export) | camelCase com `use` | `export function useFetchProducts` |
| Interface de Props | `Props` (local) | `interface Props { ... }` |
| Tipo exportado | PascalCase | `export type Product = { ... }` |

### Organização por pasta

```
src/components/
├── products/           # Componentes de produto
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── ProductBuyBox.tsx
├── admin/
│   └── produtos/       # Componentes admin de produto
│       ├── ProdutoCard.tsx
│       └── ProdutoForm.tsx
└── ui/                 # Componentes genéricos reutilizáveis
    ├── LoadingState.tsx
    ├── ErrorState.tsx
    └── EmptyState.tsx
```

---

## Props e tipos

### Tipos de domínio em `src/types/`

```typescript
// src/types/product.ts
export interface Product {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  image: string;      // campo singular
  images: string[];   // campo plural (galeria)
  estoque: number;
  ativo: boolean;
  categoria_id: number;
}
```

### Props locais no componente

```typescript
// Dentro do arquivo do componente
interface Props {
  product: Product;
  compact?: boolean;
  onSelect?: (id: number) => void;
}
```

### Quando criar tipo em `src/types/` vs local

- **`src/types/`**: Tipo usado em 2+ arquivos, ou representa entidade do domínio
- **Local no componente**: Props, estado interno, tipos de callback específicos

---

## Componentes reutilizáveis (ui/)

O projeto tem componentes UI genéricos em `src/components/ui/`:

### LoadingState

```tsx
import LoadingState from "@/components/ui/LoadingState";

<LoadingState message="Carregando produtos..." />
```

### ErrorState

```tsx
import ErrorState from "@/components/ui/ErrorState";

<ErrorState
  message="Erro ao carregar produtos"
  variant="default"  // "default" | "dark" | "warning" | "inline"
/>
```

### EmptyState

```tsx
import EmptyState from "@/components/ui/EmptyState";

<EmptyState
  message="Nenhum produto encontrado."
  action={() => router.push("/produtos")}
  actionLabel="Ver todos os produtos"
/>
```

### CustomButton

```tsx
import CustomButton from "@/components/ui/CustomButton";

<CustomButton variant="primary" loading={saving}>
  Salvar
</CustomButton>
```

### Quando criar um componente em ui/

Crie em `ui/` quando o componente:
- Não pertence a nenhum domínio específico
- Pode ser usado em qualquer página (pública ou admin)
- Não tem lógica de negócio
- É puramente visual/interativo

---

## Padrão de hook de dados

### Hook de listagem pública

```typescript
// src/hooks/useFetchParceiros.ts
"use client";

import useSWR from "swr";
import apiClient from "@/lib/apiClient";
import type { Parceiro } from "@/types/parceiro";

export function useFetchParceiros() {
  const { data, error, isLoading, mutate } = useSWR<Parceiro[]>(
    "/api/public/parceiros",
    (url: string) => apiClient.get<Parceiro[]>(url),
    { revalidateOnFocus: false }
  );

  return {
    parceiros: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch: mutate,
  };
}
```

### Uso no componente

```tsx
function ParceirosLista() {
  const { parceiros, loading, error } = useFetchParceiros();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (parceiros.length === 0) return <EmptyState message="Nenhum parceiro." />;

  return parceiros.map((p) => <ParceiroCard key={p.id} parceiro={p} />);
}
```

### Convenções dos hooks

- Retornam objeto com `{ data, loading, error }` (nunca tuple)
- `revalidateOnFocus: false` padrão para evitar refetch desnecessário
- Erros extraídos como string para simplificar a UI
- Dados com fallback para array vazio ou null

---

## Padrão de hook admin (useAdminResource)

O hook genérico `useAdminResource<T>` já resolve o padrão CRUD:

```typescript
const { items, loading, saving, error, create, update, remove, refetch } =
  useAdminResource<Product>({
    endpoint: "/api/admin/produtos",
    successMessage: {
      create: "Produto criado",
      update: "Produto atualizado",
      remove: "Produto removido",
    },
  });
```

### O que ele faz automaticamente

| Operação | Método HTTP | Auth handling |
|----------|------------|---------------|
| `items` (listagem) | GET endpoint | 401/403 → redirect login |
| `create(payload)` | POST endpoint | CSRF + credentials |
| `update(id, payload)` | PUT endpoint/:id | CSRF + credentials |
| `remove(id)` | DELETE endpoint/:id | 409 → sugere desativar |

### Quando NÃO usar useAdminResource

- Quando o CRUD tem lógica muito específica (ex: checkout, pedidos com status)
- Quando precisa de múltiplos endpoints relacionados
- Quando o formato de resposta não segue o padrão `{ data: T[] }` ou `T[]`

---

## Formulários

### Padrão atual

A maioria dos formulários usa `useState` para campos e validação manual:

```typescript
const [form, setForm] = useState({ nome: "", preco: 0 });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async () => {
  const newErrors: Record<string, string> = {};
  if (!form.nome) newErrors.nome = "Nome obrigatório";
  if (form.preco <= 0) newErrors.preco = "Preço inválido";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  await create(form);
};
```

### Com React Hook Form + Zod (formulários mais complexos)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  preco: z.number().positive("Preço deve ser positivo"),
});

type FormData = z.infer<typeof schema>;

function MeuForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => { /* ... */ };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("nome")} />
      {errors.nome && <span className="text-red-500">{errors.nome.message}</span>}
    </form>
  );
}
```

---

## Loading, error e empty states

Todo componente que busca dados deve tratar 3 estados:

```tsx
function MeuComponente() {
  const { data, loading, error } = useFetchAlgo();

  // 1. Loading
  if (loading) return <LoadingState message="Carregando..." />;

  // 2. Error
  if (error) return <ErrorState message={error} />;

  // 3. Empty
  if (!data || data.length === 0) {
    return <EmptyState message="Nenhum resultado encontrado." />;
  }

  // 4. Sucesso
  return <Lista items={data} />;
}
```

### Padrão para operações de save/delete

```tsx
<button
  onClick={handleSave}
  disabled={saving}
  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded disabled:opacity-50"
>
  {saving ? "Salvando..." : "Salvar"}
</button>
```

---

## Notificações (toast)

O projeto usa `react-hot-toast`:

```typescript
import toast from "react-hot-toast";

// Sucesso
toast.success("Produto criado com sucesso");

// Erro
toast.error("Erro ao salvar produto");

// Com duração customizada
toast.error("Sessão expirada. Faça login novamente.", { duration: 5500 });
```

### Regra

- **Área pública e admin**: Use `toast` para feedback de ações
- **Nunca** use `alert()` ou `window.alert()` (bloqueia a thread)

---

## Acessibilidade

### Padrões adotados no projeto

| Prática | Implementação |
|---------|---------------|
| Touch targets | Mínimo 44px (`globals.css`) |
| ARIA labels | Em botões sem texto visível |
| Semantic HTML | `<article>`, `<nav>`, `<main>`, `<section>` |
| Alt text | Em todas as imagens (`alt={produto.nome}`) |
| Keyboard nav | Botões e links acessíveis via Tab |
| Reduced motion | `prefers-reduced-motion` em `globals.css` |
| Focus visible | Outline visível em elementos focados |
| Role dialog | Em modais e menus mobile |

### Ao criar novos componentes

```tsx
// Botão com ícone precisa de aria-label
<button aria-label="Fechar menu" onClick={onClose}>
  <XIcon />
</button>

// Imagens sempre com alt
<img src={absUrl(item.image)} alt={item.nome} />

// Links com contexto
<a href={`/produtos/${id}`} aria-label={`Ver detalhes de ${nome}`}>
  Ver mais
</a>
```
