import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProdutoForm from "@/components/admin/produtos/produtoform";

import {
  mockGlobalFetch,
  mockGlobalFormData,
  makeFetchResponse,
  mockObjectUrl,
  flushMicrotasks,
  MockFormData,
} from "../../testUtils";

function getInputByPlaceholder(placeholder: string) {
  return screen.getByPlaceholderText(placeholder) as HTMLInputElement;
}

async function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: /adicionar produto|salvar alterações/i }));
  await flushMicrotasks();
}

function fillRequiredInAddModeExceptCategory(opts?: { name?: string; price?: string; qty?: string }) {
  fireEvent.change(getInputByPlaceholder("Ex.: Ração Premium 10kg"), {
    target: { value: opts?.name ?? "Produto X" },
  });

  fireEvent.change(getInputByPlaceholder("Ex.: 200,00"), {
    target: { value: opts?.price ?? "200,00" },
  });

  fireEvent.change(getInputByPlaceholder("Ex.: 10"), {
    target: { value: opts?.qty ?? "10" },
  });
}

function fillBaseValidInEditMode(opts?: { name?: string; price?: string; qty?: string }) {
  fireEvent.change(getInputByPlaceholder("Ex.: Ração Premium 10kg"), {
    target: { value: opts?.name ?? "Produto Editado OK" },
  });

  fireEvent.change(getInputByPlaceholder("Ex.: 200,00"), {
    target: { value: opts?.price ?? "200,00" },
  });

  fireEvent.change(getInputByPlaceholder("Ex.: 10"), {
    target: { value: opts?.qty ?? "10" },
  });
}

function getShippingQtyInput(): HTMLInputElement {
  const label = screen.getByText(/Frete grátis a partir de/i);
  const container = label.closest("div");
  if (!container) throw new Error("Container de qty não encontrado");
  const input = container.querySelector("input");
  if (!input) throw new Error("Input de qty não encontrado");
  return input as HTMLInputElement;
}

function getShippingPrazoInput(): HTMLInputElement {
  const label = screen.getByText(/Prazo do produto \(dias\)/i);
  const container = label.closest("div");
  if (!container) throw new Error("Container de prazo não encontrado");
  const input = container.querySelector("input");
  if (!input) throw new Error("Input de prazo não encontrado");
  return input as HTMLInputElement;
}

describe("ProdutoForm (components/admin/ProdutoForm.tsx)", () => {
  let fetchMock: ReturnType<typeof mockGlobalFetch>;
  let restoreFormData: ReturnType<typeof mockGlobalFormData>;
  let restoreObjectUrl: ReturnType<typeof mockObjectUrl>;

  beforeEach(() => {
    fetchMock = mockGlobalFetch();
    restoreFormData = mockGlobalFormData();
    restoreObjectUrl = mockObjectUrl();
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreFormData?.();
    restoreObjectUrl?.();
  });

  it("renderiza modo Adicionar e bloqueia submit com validação (nome obrigatório)", async () => {
    render(<ProdutoForm API_BASE="http://localhost:5000" />);

    // ✅ “Adicionar Produto” aparece no heading e no botão.
    // Para evitar ambiguidade, validamos o modo via heading.
    expect(screen.getByRole("heading", { name: "Adicionar Produto" })).toBeInTheDocument();

    // preenche preço/qty, mas não nome
    fireEvent.change(getInputByPlaceholder("Ex.: 200,00"), { target: { value: "200,00" } });
    fireEvent.change(getInputByPlaceholder("Ex.: 10"), { target: { value: "10" } });

    await submitForm();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Informe o nome do produto.")).toBeInTheDocument();
  });

  it("modo Adicionar: sempre valida categoria antes de validar preço (como no código)", async () => {
    render(<ProdutoForm API_BASE="http://localhost:5000" />);

    fillRequiredInAddModeExceptCategory({ price: "0" });

    await submitForm();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Selecione uma categoria.")).toBeInTheDocument();
  });

  it("modo edição: valida preço > 0 (normalização) e não chama fetch", async () => {
    const produtoEditado = {
      id: 10,
      name: "Produto Editado",
      price: 10,
      quantity: 1,
      category_id: 2,
    };

    render(
      <ProdutoForm API_BASE="http://localhost:5000" produtoEditado={produtoEditado as any} />
    );

    expect(screen.getByText("Editar Produto")).toBeInTheDocument();

    fillBaseValidInEditMode({ price: "0" });

    await submitForm();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Informe um preço válido.")).toBeInTheDocument();
  });

  it("modo edição: valida frete grátis por quantidade quando shippingFree=true e qty inválida (0)", async () => {
    const produtoEditado = {
      id: 10,
      name: "Produto Editado",
      price: 10,
      quantity: 1,
      category_id: 2,
      shipping_free: 1,
      shipping_free_from_qty: null,
      shipping_prazo_dias: null,
      image: "/img/a.jpg",
      images: [],
    };

    render(
      <ProdutoForm API_BASE="http://localhost:5000" produtoEditado={produtoEditado as any} />
    );

    expect(screen.getByText("Editar Produto")).toBeInTheDocument();

    fillBaseValidInEditMode({ price: "10", qty: "1" });

    // "0" vira "", então usamos "00" => mantém string, Number("00")=0 => inválido
    const qtyInput = getShippingQtyInput();
    fireEvent.change(qtyInput, { target: { value: "00" } });

    await submitForm();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Frete grátis por quantidade: informe um número válido (ex: 10).")
    ).toBeInTheDocument();
  });

  it("PUT (edição): envia FormData, keepImages conforme removidas, e credenciais include; exibe sucesso", async () => {
    const onLimparEdicao = vi.fn();

    const produtoEditado = {
      id: 99,
      name: "Produto Editado",
      description: "desc",
      price: 10,
      quantity: 5,
      category_id: 7,
      image: "/img/1.jpg",
      images: ["/img/2.jpg", "/img/2.jpg"],
      shipping_free: true,
      shipping_free_from_qty: 12,
      shipping_prazo_dias: 4,
    };

    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        ok: true,
        status: 200,
        contentType: "application/json",
        json: { ok: true },
      })
    );

    render(
      <ProdutoForm
        API_BASE="http://localhost:5000"
        produtoEditado={produtoEditado as any}
        onLimparEdicao={onLimparEdicao}
      />
    );

    // tenta remover /img/2.jpg (se estiver na UI)
    const img2Abs = "http://localhost:5000/img/2.jpg";
    const allButtons = screen.getAllByRole("button");
    const btnWithImg2 = allButtons.find((b) => b.querySelector(`img[src="${img2Abs}"]`));

    if (btnWithImg2) {
      fireEvent.click(btnWithImg2);
      expect(screen.getByText("Remover")).toBeInTheDocument();
    }

    fillBaseValidInEditMode({ name: "Produto Editado 2", price: "10", qty: "5" });

    const prazoInput = getShippingPrazoInput();
    fireEvent.change(prazoInput, { target: { value: "3" } });

    await submitForm();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:5000/api/admin/produtos/99");
    expect(init?.method).toBe("PUT");
    expect(init?.credentials).toBe("include");

    const fd = init?.body as unknown as MockFormData;
    expect(fd).toBeInstanceOf(MockFormData);

    expect(fd.get("name")).toBe("Produto Editado 2");
    expect(fd.get("category_id")).toBe("7");
    expect(fd.get("price")).toBe("10");
    expect(fd.get("quantity")).toBe("5");

    expect(fd.get("shippingFree")).toBe("1");
    expect(fd.get("shippingFreeFromQtyStr")).toBe("12");
    expect(fd.get("shippingPrazoDiasStr")).toBe("3");

    const keepImagesRaw = fd.get("keepImages") as string;
    const keepImages = JSON.parse(keepImagesRaw);
    expect(Array.isArray(keepImages)).toBe(true);
    expect(keepImages).toContain("/img/1.jpg");

    expect(await screen.findByText("Produto atualizado com sucesso.")).toBeInTheDocument();
    expect(onLimparEdicao).toHaveBeenCalledTimes(1);
  });

  it("modo edição: 401/403 usa safeText(JSON) e exibe mensagem do backend (e chama fetch)", async () => {
    const produtoEditado = {
      id: 55,
      name: "Produto Editado",
      price: 10,
      quantity: 1,
      category_id: 2,
    };

    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        ok: false,
        status: 403,
        contentType: "application/json",
        json: { message: "Sem permissão (RBAC)" },
      })
    );

    render(
      <ProdutoForm API_BASE="http://localhost:5000" produtoEditado={produtoEditado as any} />
    );

    fillBaseValidInEditMode({ name: "Produto Editado OK", price: "10", qty: "1" });

    await submitForm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Sem permissão (RBAC)")).toBeInTheDocument();
  });

  it("modo edição: 500 exibe 'Falha ao atualizar (500).' e body text quando não-JSON (e chama fetch)", async () => {
    const produtoEditado = {
      id: 56,
      name: "Produto Editado",
      price: 10,
      quantity: 1,
      category_id: 2,
    };

    fetchMock.mockResolvedValueOnce(
      makeFetchResponse({
        ok: false,
        status: 500,
        contentType: "text/plain",
        text: "Explodiu no servidor",
      })
    );

    render(
      <ProdutoForm API_BASE="http://localhost:5000" produtoEditado={produtoEditado as any} />
    );

    fillBaseValidInEditMode({ name: "Produto Editado OK", price: "10", qty: "1" });

    await submitForm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Falha ao atualizar \(500\)\./i)).toBeInTheDocument();
    expect(await screen.findByText(/Explodiu no servidor/i)).toBeInTheDocument();
  });

  it("botão Limpar reseta campos e não chama fetch", async () => {
    render(<ProdutoForm API_BASE="http://localhost:5000" />);

    fillRequiredInAddModeExceptCategory({ name: "Produto X", price: "200,00", qty: "10" });

    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getInputByPlaceholder("Ex.: Ração Premium 10kg").value).toBe("");
    expect(getInputByPlaceholder("Ex.: 200,00").value).toBe("");
    expect(getInputByPlaceholder("Ex.: 10").value).toBe("");
  });

  it("upload de imagens: cria preview via URL.createObjectURL e remove ao clicar em 'x'", async () => {
    render(<ProdutoForm API_BASE="http://localhost:5000" />);

    const file = new File(["fake"], "foto.png", { type: "image/png" });

    const label = screen.getByText("Imagens do produto (opcional)");
    const wrapper = label.parentElement as HTMLElement;
    const inputFile = wrapper.querySelector('input[type="file"]') as HTMLInputElement;

    expect(inputFile).toBeInTheDocument();

    fireEvent.change(inputFile, { target: { files: [file] } });

    expect(await screen.findByAltText("Nova imagem 1")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "x" }));

    await waitFor(() => {
      expect(screen.queryByAltText("Nova imagem 1")).not.toBeInTheDocument();
    });
  });

  it("modo edição: botão 'Cancelar edição' chama onLimparEdicao e reseta", async () => {
    const onLimparEdicao = vi.fn();
    const produtoEditado = {
      id: 1,
      name: "Produto Editado",
      price: 10,
      quantity: 1,
      category_id: 2,
    };

    render(
      <ProdutoForm
        API_BASE="http://localhost:5000"
        produtoEditado={produtoEditado as any}
        onLimparEdicao={onLimparEdicao}
      />
    );

    expect(screen.getByText("Editar Produto")).toBeInTheDocument();

    fireEvent.change(getInputByPlaceholder("Ex.: Ração Premium 10kg"), {
      target: { value: "Mudou" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancelar edição" }));

    expect(onLimparEdicao).toHaveBeenCalledTimes(1);
    expect(getInputByPlaceholder("Ex.: Ração Premium 10kg").value).toBe("");
  });
});
