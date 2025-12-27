import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import ServiceCard from "@/components/admin/servicos/ServiceCard";

// Tipo compatível com o componente (nome obrigatório)
type Service = {
  id: number;
  nome: string;
  cargo: string;
  descricao?: string | null;
  especialidade_nome?: string | null;
  especialidade_id?: number | null;
  whatsapp?: string | null;
  imagem?: string | null;
  images?: string[] | null;
};

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 1,
    nome: "João da Silva",
    cargo: "Veterinário",
    descricao: "Atendimento clínico e reprodução.",
    especialidade_nome: "Bovinos",
    especialidade_id: 10,
    whatsapp: "(31) 99999-1111",
    imagem: "/uploads/capa.jpg",
    images: ["/uploads/1.jpg", "/uploads/2.jpg"],
    ...overrides,
  };
}

describe("ServiceCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve retornar null quando servico não é informado", () => {
    // negativo (runtime): componente trata !servico
    const { container } = render(<ServiceCard servico={null as any} />);
    expect(container.firstChild).toBeNull();
  });

  it("deve renderizar informações principais e link do WhatsApp formatado", () => {
    const servico = makeService({
      whatsapp: "31999991111",
      imagem: "http://cdn.exemplo.com/capa.jpg",
      images: [],
    });

    render(<ServiceCard servico={servico as any} />);

    expect(
      screen.getByRole("heading", { name: /joão da silva/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/Cargo:/i)).toBeInTheDocument();
    expect(screen.getByText(/Veterinário/i)).toBeInTheDocument();

    expect(screen.getByText(/Atendimento clínico/i)).toBeInTheDocument();
    expect(screen.getByText(/Bovinos/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /WhatsApp:/i });
    expect(link).toHaveAttribute("href", "https://wa.me/31999991111");
    expect(
      screen.getByText(/WhatsApp:\s*\(31\)\s*99999-1111/i)
    ).toBeInTheDocument();
  });

  it("deve criar miniaturas quando existir mais de 1 imagem e alternar imagem ativa ao clicar", async () => {
    const servico = makeService({
      imagem: "/uploads/capa.jpg",
      images: ["/uploads/capa.jpg", "/uploads/extra.jpg"], // inclui duplicada p/ dedupe
    });

    const { container } = render(<ServiceCard servico={servico as any} />);

    const mainImg = screen.getByRole("img", {
      name: /joão da silva/i,
    }) as HTMLImageElement;

    expect(screen.getByText(/2 foto\(s\)/i)).toBeInTheDocument();

    const thumb1 = screen.getByRole("img", { name: /Miniatura 1/i }) as HTMLImageElement;
    const thumb2 = screen.getByRole("img", { name: /Miniatura 2/i }) as HTMLImageElement;

    const btnThumb2 = thumb2.closest("button");
    expect(btnThumb2).toBeTruthy();

    const beforeSrc = mainImg.getAttribute("src");
    fireEvent.click(btnThumb2!);

    await waitFor(() => {
      const afterSrc = mainImg.getAttribute("src");
      expect(afterSrc).not.toEqual(beforeSrc);
      expect(afterSrc).toEqual(thumb2.getAttribute("src"));
    });

    expect(container.querySelector("article")).toBeTruthy();
    expect(thumb1).toBeInTheDocument();
  });

  it("deve aplicar placeholder ao ocorrer erro de carregamento da imagem principal", () => {
    const servico = makeService({ imagem: "/uploads/capa.jpg", images: [] });

    render(<ServiceCard servico={servico as any} />);

    const mainImg = screen.getByRole("img", {
      name: /joão da silva/i,
    }) as HTMLImageElement;

    fireEvent.error(mainImg);

    expect(mainImg.getAttribute("src")).toBe("/placeholder.png");
  });

  it("não deve renderizar botões de ação quando readOnly=true", () => {
    const servico = makeService();

    render(<ServiceCard servico={servico as any} readOnly />);

    expect(screen.queryByRole("button", { name: /Editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remover/i })).not.toBeInTheDocument();
  });

  it("ao clicar em Editar deve chamar onEditar com o serviço", () => {
    const servico = makeService();
    const onEditar = vi.fn();

    render(<ServiceCard servico={servico as any} onEditar={onEditar} />);

    fireEvent.click(screen.getByRole("button", { name: /Editar/i }));

    expect(onEditar).toHaveBeenCalledTimes(1);
    expect(onEditar).toHaveBeenCalledWith(expect.objectContaining({ id: servico.id }));
  });

  it("não deve remover se window.confirm retornar false", () => {
    const servico = makeService();
    const onRemover = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("confirm", vi.fn(() => false));

    render(<ServiceCard servico={servico as any} onRemover={onRemover} />);

    fireEvent.click(screen.getByRole("button", { name: /Remover/i }));

    expect(onRemover).not.toHaveBeenCalled();
  });

  it("deve chamar onRemover com id e mostrar estado 'Removendo...' enquanto aguarda", async () => {
    const servico = makeService();
    let resolvePromise: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });

    const onRemover = vi.fn().mockReturnValue(pending);

    render(<ServiceCard servico={servico as any} onRemover={onRemover} />);

    fireEvent.click(screen.getByRole("button", { name: /Remover/i }));

    expect(onRemover).toHaveBeenCalledTimes(1);
    expect(onRemover).toHaveBeenCalledWith(servico.id);

    expect(screen.getByRole("button", { name: /Removendo/i })).toBeDisabled();

    resolvePromise();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Remover/i })).toBeInTheDocument();
    });
  });

  it("não deve tentar remover se onRemover não foi fornecido", () => {
    const servico = makeService();
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<ServiceCard servico={servico as any} />);

    fireEvent.click(screen.getByRole("button", { name: /Remover/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
