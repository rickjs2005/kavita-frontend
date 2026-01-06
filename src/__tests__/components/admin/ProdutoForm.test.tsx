import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProdutoForm from "@/components/admin/produtos/produtoform";
import {
  MockFormData,
  makeFetchResponse,
  mockGlobalFetch,
  mockGlobalFormData,
  mockObjectUrl,
} from "@/__tests__/testUtils";

type ProdutoEditado = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  category_id: number | string;
  image?: string | null;
  images?: string[];
  shipping_free?: number | boolean | null;
  shipping_free_from_qty?: number | null;
};

function renderSut(opts?: {
  API_BASE?: string;
  produtoEditado?: ProdutoEditado | null;
  onProdutoAdicionado?: () => void;
  onLimparEdicao?: () => void;
}) {
  const onProdutoAdicionado = opts?.onProdutoAdicionado ?? vi.fn();
  const onLimparEdicao = opts?.onLimparEdicao ?? vi.fn();

  const view = render(
    <ProdutoForm
      API_BASE={opts?.API_BASE}
      produtoEditado={opts?.produtoEditado}
      onProdutoAdicionado={onProdutoAdicionado}
      onLimparEdicao={onLimparEdicao}
    />
  );

  return {
    ...view,
    onProdutoAdicionado: onProdutoAdicionado as unknown as ReturnType<typeof vi.fn>,
    onLimparEdicao: onLimparEdicao as unknown as ReturnType<typeof vi.fn>,
  };
}

function fillBasicFieldsWithoutCategory() {
  const nameInput = screen.getByPlaceholderText(/ex\.\:\s*ração premium 10kg/i);
  const priceInput = screen.getByPlaceholderText(/ex\.\:\s*200,00/i);
  const qtyInput = screen.getByPlaceholderText(/ex\.\:\s*10/i);

  fireEvent.change(nameInput, { target: { value: "  Produto Teste  " } });
  fireEvent.change(priceInput, { target: { value: "R$ 1.234,56" } });
  fireEvent.change(qtyInput, { target: { value: "10" } });

  return { nameInput, priceInput, qtyInput };
}

describe("ProdutoForm", () => {
  let restoreFormData: (() => void) | null = null;
  let restoreObjectUrl: (() => void) | null = null;
  let fetchMock: ReturnType<typeof mockGlobalFetch>;

  beforeEach(() => {
    vi.restoreAllMocks();
    restoreFormData = mockGlobalFormData();
    restoreObjectUrl = mockObjectUrl();
    fetchMock = mockGlobalFetch();
  });

  afterEach(() => {
    restoreFormData?.();
    restoreObjectUrl?.();
  });

  it("renderiza modo Adicionar Produto e bloqueia submit com validação (nome obrigatório)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderSut({ API_BASE: "http://localhost:5000" });

    // Act
    await user.click(screen.getByRole("button", { name: /adicionar produto/i }));

    // Assert: usar role para não conflitar H2 vs botão
    expect(
      screen.getByRole("heading", { name: /adicionar produto/i })
    ).toBeInTheDocument();

    expect(screen.getByText("Informe o nome do produto.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valida categoria obrigatória (fluxo Adicionar) e não chama fetch", async () => {
    // Arrange
    const user = userEvent.setup();
    renderSut({ API_BASE: "http://localhost:5000" });

    fillBasicFieldsWithoutCategory();

    // Act
    await user.click(screen.getByRole("button", { name: /adicionar produto/i }));

    // Assert
    expect(screen.getByText("Selecione uma categoria.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valida preço > 0 (normalização de moeda) e não chama fetch (em modo edição para passar categoria)", async () => {
    // Arrange
    const user = userEvent.setup();
    const API_BASE = "http://localhost:5000";

    const produtoEditado: ProdutoEditado = {
      id: 77,
      name: "Prod Edit",
      description: "",
      price: 10,
      quantity: 1,
      category_id: 1, // garante validação de categoria OK
      images: [],
      shipping_free: 0,
      shipping_free_from_qty: null,
    };

    renderSut({ API_BASE, produtoEditado });

    // força preço inválido
    const priceInput = screen.getByPlaceholderText(/ex\.\:\s*200,00/i);
    fireEvent.change(priceInput, { target: { value: "R$ 0,00" } });

    // Act
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    // Assert
    expect(screen.getByText("Informe um preço válido.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

 it("frete grátis: ao digitar 0 no 'a partir de', o campo é normalizado para vazio (sem limite) e o submit prossegue", async () => {
  // Arrange
  const user = userEvent.setup();
  const API_BASE = "http://localhost:5000";

  const produtoEditado: ProdutoEditado = {
    id: 10,
    name: "Prod Edit",
    description: "",
    price: 10,
    quantity: 1,
    category_id: 1,
    images: [],
    shipping_free: 0,
    shipping_free_from_qty: null,
  };

  renderSut({ API_BASE, produtoEditado });
  expect(screen.getByRole("heading", { name: /editar produto/i })).toBeInTheDocument();

  // Mock fetch OK (senão estoura .ok de undefined)
  fetchMock.mockResolvedValueOnce(
    makeFetchResponse({
      ok: true,
      status: 200,
      contentType: "application/json",
      json: { ok: true },
    })
  );

  // Act: habilita frete grátis e digita 0 no input de qty
  await user.click(screen.getByRole("checkbox", { name: /frete grátis \(este produto\)/i }));

  const qtyInput = screen.getByPlaceholderText(/ex\.\:\s*3/i) as HTMLInputElement;
  await user.clear(qtyInput);
  await user.type(qtyInput, "0");

  // Normalização esperada: "0" vira vazio (sem limite)
  expect(qtyInput.value).toBe("");

  await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

  // Assert: submit prossegue e envia payload consistente
  expect(fetchMock).toHaveBeenCalledTimes(1);

  const [, calledOpts] = fetchMock.mock.calls[0];
  expect(calledOpts.method).toBe("PUT");
  expect(calledOpts.credentials).toBe("include");
  expect(calledOpts.body).toBeInstanceOf(MockFormData);

  const fd = calledOpts.body as unknown as MockFormData;

  // shippingFree ativo
  expect(fd.get("shippingFree")).toBe("1");

  // qty deve ir vazio (sem limite) ou não existir (dependendo do código)
  const qtyStr = fd.get("shippingFreeFromQtyStr");
  expect(qtyStr === "" || qtyStr === null).toBe(true);

  // não deve aparecer a mensagem de "qty inválida"
  expect(
    screen.queryByText(/frete grátis por quantidade: informe um número válido/i)
  ).not.toBeInTheDocument();
});

  it("PUT (edição): envia FormData com campos normalizados, keepImages, e credenciais; exibe sucesso e reseta", async () => {
    // Arrange
    const user = userEvent.setup();
    const API_BASE = "http://localhost:5000";

    const produtoEditado: ProdutoEditado = {
      id: 99,
      name: "Prod Edit",
      description: "Desc",
      price: 10.5,
      quantity: 3,
      category_id: 1,
      image: "/img1.jpg",
      images: ["/img2.jpg"],
      shipping_free: 1,
      shipping_free_from_qty: 5,
    };

    const { container, onProdutoAdicionado, onLimparEdicao } = renderSut({
      API_BASE,
      produtoEditado,
    });

    // Confere modo edição
    expect(screen.getByRole("heading", { name: /editar produto/i })).toBeInTheDocument();

    // input file (label não está associado -> query estável)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();

    const f1 = new File(["a"], "a.png", { type: "image/png" });
    await user.upload(fileInput!, [f1]);

    // marca 1 imagem existente para remoção
    const existingBtns = screen.getAllByRole("button", { name: /imagem existente/i });
    expect(existingBtns.length).toBeGreaterThanOrEqual(1);
    await user.click(existingBtns[0]);

    // Mock fetch OK
    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        contentType: "application/json",
        json: { ok: true },
      })
    );

    // Act
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    // Assert fetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOpts] = fetchMock.mock.calls[0];

    expect(calledUrl).toBe(`${API_BASE}/api/admin/produtos/99`);
    expect(calledOpts.method).toBe("PUT");
    expect(calledOpts.credentials).toBe("include");
    expect(calledOpts.body).toBeInstanceOf(MockFormData);

    const fd = calledOpts.body as unknown as MockFormData;

    expect(fd.get("name")).toBe("Prod Edit");
    expect(fd.get("description")).toBe("Desc");
    expect(fd.get("price")).toBe("10.5");
    expect(fd.get("quantity")).toBe("3");
    expect(fd.get("category_id")).toBe("1");

    expect(fd.get("shippingFree")).toBe("1");
    expect(fd.get("shippingFreeFromQtyStr")).toBe("5");

    const keepRaw = fd.get("keepImages");
    expect(typeof keepRaw).toBe("string");
    const kept = JSON.parse(String(keepRaw)) as string[];
    expect(kept).toHaveLength(1);

    const images = fd.getAll("images");
    expect(images).toHaveLength(1);
    expect(images[0]).toBe(f1);

    expect(screen.getByText(/produto atualizado com sucesso/i)).toBeInTheDocument();
    expect(onProdutoAdicionado).toHaveBeenCalledTimes(1);
    expect(onLimparEdicao).toHaveBeenCalledTimes(1);
  });

  it("401/403 (edição): usa safeText(JSON) e exibe mensagem do backend", async () => {
    // Arrange
    const user = userEvent.setup();
    const API_BASE = "http://localhost:5000";

    const produtoEditado: ProdutoEditado = {
      id: 101,
      name: "Prod Edit",
      description: "",
      price: 10,
      quantity: 1,
      category_id: 1,
      images: [],
      shipping_free: 0,
      shipping_free_from_qty: null,
    };

    renderSut({ API_BASE, produtoEditado });

    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        ok: false,
        status: 401,
        contentType: "application/json",
        json: { message: "Token expirado" },
      })
    );

    // Act
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    // Assert
    expect(await screen.findByText("Token expirado")).toBeInTheDocument();
  });

  it("500 (edição): exibe 'Falha ao atualizar (500).' e body text", async () => {
    // Arrange
    const user = userEvent.setup();
    const API_BASE = "http://localhost:5000";

    const produtoEditado: ProdutoEditado = {
      id: 202,
      name: "Prod Edit",
      description: "",
      price: 10,
      quantity: 1,
      category_id: 1,
      images: [],
      shipping_free: 0,
      shipping_free_from_qty: null,
    };

    renderSut({ API_BASE, produtoEditado });

    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        ok: false,
        status: 500,
        contentType: "text/plain",
        text: "boom",
      })
    );

    // Act
    await user.click(screen.getByRole("button", { name: /salvar alterações/i }));

    // Assert
    expect(await screen.findByText(/falha ao atualizar \(500\)/i)).toBeInTheDocument();
    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });

  it("botão 'Limpar' reseta campos e não chama fetch", async () => {
    // Arrange
    const user = userEvent.setup();
    renderSut({ API_BASE: "http://localhost:5000" });

    const { nameInput } = fillBasicFieldsWithoutCategory();
    expect((nameInput as HTMLInputElement).value).not.toBe("");

    // Act
    await user.click(screen.getByRole("button", { name: /limpar/i }));

    // Assert
    expect((nameInput as HTMLInputElement).value).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
