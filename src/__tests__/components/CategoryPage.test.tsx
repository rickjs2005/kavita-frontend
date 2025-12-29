import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CategoryPage from "../../components/products/CategoryPage";
import type { Product } from "@/types/product";

// ---------- Mocks ----------
const mockUseFetchProducts = vi.fn();

vi.mock("@/hooks/useFetchProducts", () => ({
  useFetchProducts: (args: any) => mockUseFetchProducts(args),
}));

vi.mock("@/components/products/ProductCard", () => ({
  __esModule: true,
  default: ({ product }: { product: any }) => (
    <article
      data-testid="product-card"
      aria-label={`product-${String(product?.id ?? "unknown")}`}
    >
      <span>
        {String(
          product?.name ?? product?.title ?? `Produto ${product?.id ?? ""}`
        )}
      </span>
      <span data-testid="third-category">
        {String(product?.third_category ?? "")}
      </span>
    </article>
  ),
}));

// ---------- Helpers ----------
function makeProduct(partial: Partial<Product> & { id: number }): Product {
  return {
    id: partial.id,
    name: (partial as any).name ?? `Produto ${partial.id}`,
    third_category: (partial as any).third_category ?? null,
    ...(partial as any),
  } as Product;
}

function setFetchReturn(opts: { data?: unknown; loading?: boolean; error?: unknown }) {
  mockUseFetchProducts.mockImplementation((_args: any) => ({
    data: opts.data,
    loading: opts.loading ?? false,
    error: opts.error ?? null,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------- Tests ----------
describe("CategoryPage", () => {
  it("chama useFetchProducts com categorySlug=categoria (contrato)", () => {
    setFetchReturn({ data: [], loading: false, error: null });

    render(<CategoryPage categoria="medicamentos" title="Medicamentos" />);

    expect(mockUseFetchProducts).toHaveBeenCalledTimes(1);
    expect(mockUseFetchProducts).toHaveBeenCalledWith({
      categorySlug: "medicamentos",
    });
  });

  it("renderiza estado de loading (positivo)", () => {
    setFetchReturn({ loading: true });

    render(<CategoryPage categoria="pets" title="Pets" />);

    expect(screen.getByText(/Carregando produtos/i)).toBeInTheDocument();
    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
    expect(screen.queryByText(/Nenhum item encontrado/i)).not.toBeInTheDocument();
  });

  it("renderiza estado de erro com mensagem e detalhes (negativo)", () => {
    setFetchReturn({ loading: false, error: "Falha 500" });

    render(<CategoryPage categoria="pragas" title="Pragas" />);

    expect(screen.getByText(/Erro ao carregar produtos/i)).toBeInTheDocument();
    expect(screen.getByText("Falha 500")).toBeInTheDocument();
    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });

  it("renderiza título preferindo `title` quando fornecido (positivo)", () => {
    setFetchReturn({ data: [] });

    render(<CategoryPage categoria="fertilizantes" title="Fertilizantes" />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Fertilizantes");
  });

  it("renderiza o fallback do título para `categoria` quando `title` não existe (positivo)", () => {
    setFetchReturn({ data: [] });

    render(<CategoryPage categoria="outros" />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("outros");
  });

  it("quando não há produtos, mostra empty-state (negativo)", () => {
    setFetchReturn({ data: [] });

    render(<CategoryPage categoria="servicos" title="Serviços" />);

    expect(screen.getByText(/Nenhum item encontrado/i)).toBeInTheDocument();
    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });

  it("aceita data no formato array e renderiza ProductCard para cada item (positivo)", () => {
    const products = [
      makeProduct({ id: 1, third_category: "Suplemento" }),
      makeProduct({ id: 2, third_category: "Hormônio" }),
    ];
    setFetchReturn({ data: products });

    render(<CategoryPage categoria="medicamentos" />);

    const cards = screen.getAllByTestId("product-card");
    expect(cards).toHaveLength(2);
    expect(screen.queryByText(/Nenhum item encontrado/i)).not.toBeInTheDocument();
  });

  it("aceita data no formato { data: [] } e renderiza corretamente (positivo)", () => {
    const products = [
      makeProduct({ id: 10, third_category: "Café" }),
      makeProduct({ id: 11, third_category: "Milho" }),
    ];
    setFetchReturn({ data: { data: products } });

    render(<CategoryPage categoria="agricultura" title="Agricultura" />);

    const cards = screen.getAllByTestId("product-card");
    expect(cards).toHaveLength(2);
  });

  it("não renderiza select quando não existem subcategorias (third_category vazio/nulo) (negativo)", () => {
    const products = [
      makeProduct({ id: 1, third_category: null }),
      makeProduct({ id: 2, third_category: "" as any }),
    ];
    setFetchReturn({ data: products });

    render(<CategoryPage categoria="pets" />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
  });

  it("renderiza select quando há subcategorias e inclui opção 'Todas as Subcategorias' (positivo)", () => {
    const products = [
      makeProduct({ id: 1, third_category: "Bovinos" }),
      makeProduct({ id: 2, third_category: "Bovinos" }),
      makeProduct({ id: 3, third_category: "Equino" }),
    ];
    setFetchReturn({ data: products });

    render(<CategoryPage categoria="medicamentos" title="Medicamentos" />);

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: /Todas as Subcategorias/i })
    ).toBeInTheDocument();

    expect(screen.getByRole("option", { name: "Bovinos" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Equino" })).toBeInTheDocument();
  });

  it("filtra produtos ao selecionar uma subcategoria (positivo) e retorna todos ao limpar", async () => {
    const user = userEvent.setup();

    const products = [
      makeProduct({ id: 1, third_category: "Bovinos" }),
      makeProduct({ id: 2, third_category: "Equino" }),
      makeProduct({ id: 3, third_category: "Bovinos" }),
    ];
    setFetchReturn({ data: products });

    render(<CategoryPage categoria="medicamentos" />);

    expect(screen.getAllByTestId("product-card")).toHaveLength(3);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "Bovinos");

    expect(screen.getAllByTestId("product-card")).toHaveLength(2);

    const categories = screen
      .getAllByTestId("third-category")
      .map((el) => el.textContent);

    expect(categories.every((c) => c === "Bovinos")).toBe(true);

    await user.selectOptions(select, "");
    expect(screen.getAllByTestId("product-card")).toHaveLength(3);
  });

  it("quando os dados mudam e a subcategoria selecionada deixa de existir, a opção some do select e o componente pode cair em empty-state pois o filtro persiste (negativo/consistência)", async () => {
    const user = userEvent.setup();

    // Dataset inicial com Bovinos e Equino
    setFetchReturn({
      data: [
        makeProduct({ id: 1, third_category: "Bovinos" }),
        makeProduct({ id: 2, third_category: "Equino" }),
      ],
    });

    const { rerender } = render(<CategoryPage categoria="medicamentos" />);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "Bovinos");

    // Confirma que filtrou para 1 item
    expect(screen.getAllByTestId("product-card")).toHaveLength(1);
    expect(screen.getByText("Produto 1")).toBeInTheDocument();

    // Backend muda e agora só existe Equino
    setFetchReturn({
      data: [makeProduct({ id: 9, third_category: "Equino" })],
    });

    rerender(<CategoryPage categoria="medicamentos" />);

    // A opção antiga ("Bovinos") some porque subcategorias deriva de products atuais
    expect(
      screen.queryByRole("option", { name: "Bovinos" })
    ).not.toBeInTheDocument();

    // Como o state `selected` permanece "Bovinos", o filtro fica sem resultados => empty-state
    expect(screen.getByText(/Nenhum item encontrado/i)).toBeInTheDocument();
    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });
});
