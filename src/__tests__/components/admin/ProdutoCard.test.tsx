import React from "react";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  quantity: number | string;
  image?: string | null;
  images?: string[];
};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Ração Premium",
    description: "Descrição do produto",
    price: 200,
    quantity: 10,
    image: "/uploads/capa.jpg",
    images: ["/uploads/1.jpg", "/uploads/2.jpg"],
    ...overrides,
  };
}

/**
 * Import dinâmico + resetModules para garantir que o componente
 * leia o env stubado (caso ele capture a baseURL no load do módulo).
 */
async function loadProdutoCard() {
  vi.resetModules();
  const mod = await import("@/components/admin/produtos/produtocard");
  return mod.default;
}

describe("ProdutoCard", () => {
  beforeAll(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://test.local");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza nome, descrição, preço formatado e quantidade (positivo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct({ price: 200, quantity: 10 });

    render(<ProdutoCard produto={produto} />);

    expect(screen.getByRole("heading", { name: /ração premium/i })).toBeInTheDocument();
    expect(screen.getByText(/descrição do produto/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?200/)).toBeInTheDocument();
    expect(screen.getByText(/Qtde:\s*10/i)).toBeInTheDocument();
  });

  it("mostra badge 'Sem estoque' quando qty <= 0 (positivo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct({ quantity: 0 });

    render(<ProdutoCard produto={produto} />);
    expect(screen.getByText(/sem estoque/i)).toBeInTheDocument();
  });

  it("não mostra descrição quando produto.description é null/undefined (negativo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct({ description: null });

    render(<ProdutoCard produto={produto} />);
    expect(screen.queryByText(/descrição do produto/i)).not.toBeInTheDocument();
  });

  it("normaliza imagem relativa para URL absoluta e renderiza miniaturas quando há mais de 1 imagem (positivo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct({
      image: "/uploads/capa.jpg",
      images: ["/uploads/1.jpg", "/uploads/2.jpg"],
    });

    render(<ProdutoCard produto={produto} />);

    const capa = screen.getByRole("img", { name: /ração premium/i }) as HTMLImageElement;
    expect(capa.src).toBe("http://test.local/uploads/capa.jpg");

    const mini1 = screen.getByRole("img", { name: /miniatura 1/i }) as HTMLImageElement;
    const mini2 = screen.getByRole("img", { name: /miniatura 2/i }) as HTMLImageElement;

    expect(mini1.src).toBe("http://test.local/uploads/1.jpg");
    expect(mini2.src).toBe("http://test.local/uploads/2.jpg");
  });

  it("faz fallback para /placeholder.png quando imagem dispara onError (negativo/controle)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct({ image: "/uploads/capa.jpg" });

    render(<ProdutoCard produto={produto} />);

    const capa = screen.getByRole("img", { name: /ração premium/i }) as HTMLImageElement;
    fireEvent.error(capa);

    expect(capa.src).toContain("/placeholder.png");
  });

  it("chama onEditar ao clicar em 'Editar' (positivo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct();
    const onEditar = vi.fn();

    render(<ProdutoCard produto={produto} onEditar={onEditar} />);
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));

    expect(onEditar).toHaveBeenCalledTimes(1);
    expect(onEditar).toHaveBeenCalledWith(produto);
  });

  it("não chama onRemover quando readOnly=true (negativo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct();
    const onRemover = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ProdutoCard produto={produto} onRemover={onRemover} readOnly />);

    // aceita botão com texto ou emoji (desde que tenha nome acessível)
    const btn = screen.getByRole("button", { name: /remover|excluir|🗑️/i });
    expect(btn).toBeDisabled();

    fireEvent.click(btn);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onRemover).not.toHaveBeenCalled();
  });

  it("não remove se usuário cancelar o confirm (negativo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct();
    const onRemover = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<ProdutoCard produto={produto} onRemover={onRemover} />);

    const btn = screen.getByRole("button", { name: /remover|excluir|🗑️/i });
    fireEvent.click(btn);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(onRemover).not.toHaveBeenCalled();
  });

  it("remove: pede confirm, seta estado 'Removendo...' durante await e volta ao final (positivo)", async () => {
    const ProdutoCard = await loadProdutoCard();
    const produto = makeProduct();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    let resolvePromise!: () => void;
    const onRemover = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(<ProdutoCard produto={produto} onRemover={onRemover} />);

    const actionBtn = screen.getByRole("button", { name: /remover|excluir|🗑️/i });
    fireEvent.click(actionBtn);

    expect(onRemover).toHaveBeenCalledWith(produto.id);

    // durante o await, aparece "Removendo..." e fica disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /removendo/i })).toBeDisabled();
    });

    // resolve dentro de act para flush do React
    await act(async () => {
      resolvePromise();
    });

    // volta ao estado normal: some o "Removendo..."
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /removendo/i })).not.toBeInTheDocument();
    });

    // e o botão de ação volta a existir (texto ou emoji)
    expect(screen.getByRole("button", { name: /remover|excluir|🗑️/i })).toBeInTheDocument();
  });
});
