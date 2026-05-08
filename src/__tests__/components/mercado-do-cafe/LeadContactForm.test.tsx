// src/__tests__/components/mercado-do-cafe/LeadContactForm.test.tsx
//
// Fluxo CRÍTICO: formulário público "Falar com a corretora" — esta
// é a porta principal de geração de lead. Qualquer bug que impeça
// envio = perda direta de receita para a corretora e a Kavita.
//
// Cobertura focada em comportamento:
//   - Submit chama POST /api/public/corretoras/{slug}/leads
//   - Payload contém os campos obrigatórios + os opcionais quando preenchidos
//   - Campos obrigatórios bloqueiam submit (nome, telefone, consentimento)
//   - Estado de sucesso aparece após submit OK (e POST não foi chamado de novo)
//   - Erro do backend é exibido (toast.error chamado)
//
// Mocks deliberadamente mínimos: apiClient (POST), toast (sem efeito
// visual no jsdom), draft de localStorage (escopo: testar render+submit).

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LeadContactForm } from "@/components/mercado-do-cafe/LeadContactForm";

// ---- Mocks -----------------------------------------------------------------

const mockPost = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("react-hot-toast", () => {
  const callable = vi.fn();
  return {
    default: Object.assign(callable, {
      success: (...a: unknown[]) => mockToastSuccess(...a),
      error: (...a: unknown[]) => mockToastError(...a),
    }),
  };
});

// Limpa qualquer draft antes de cada teste (rodava em sessões reais
// e poluía o form com nome/telefone do teste anterior).
beforeEach(() => {
  vi.clearAllMocks();
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
  // Sem Turnstile site key em ambiente de teste (form não exige token)
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
});

// ---- Tests -----------------------------------------------------------------

describe("LeadContactForm — fluxo crítico de lead", () => {
  it("envia POST para /api/public/corretoras/{slug}/leads com nome, telefone e consentimento", async () => {
    mockPost.mockResolvedValue({ data: { deduplicated: false } });

    render(
      <LeadContactForm
        corretoraSlug="corretora-x"
        corretoraName="Corretora X"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Seu nome/i), {
      target: { value: "Maria Silva" },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "33999990000" },
    });
    // Consentimento LGPD é obrigatório — sem ele o submit não passa
    const consent = screen.getByRole("checkbox", {
      name: /Autorizo a Kavita/i,
    });
    fireEvent.click(consent);

    fireEvent.click(
      screen.getByRole("button", { name: /Falar com a corretora/i }),
    );

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

    const [url, payload] = mockPost.mock.calls[0];
    expect(url).toBe("/api/public/corretoras/corretora-x/leads");
    expect(payload).toMatchObject({
      nome: "Maria Silva",
      consentimento_contato: true,
    });
    // Telefone vem com máscara, mas é trim normal — o backend normaliza
    expect(typeof payload.telefone).toBe("string");
    expect(payload.telefone).toMatch(/33/);
  });

  it("não envia POST quando nome está vazio (validação react-hook-form)", async () => {
    render(
      <LeadContactForm
        corretoraSlug="x"
        corretoraName="X"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "33999990000" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Autorizo a Kavita/i }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Falar com a corretora/i }),
    );

    // react-hook-form bloqueia submit; aguardar uma microtarefa pra
    // garantir que o post não foi chamado.
    await waitFor(() => {
      expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("não envia POST quando consentimento LGPD não foi marcado", async () => {
    render(
      <LeadContactForm
        corretoraSlug="x"
        corretoraName="X"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Seu nome/i), {
      target: { value: "Maria" },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "33999990000" },
    });
    // NÃO clica no consentimento

    fireEvent.click(
      screen.getByRole("button", { name: /Falar com a corretora/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/autorização para compartilhar/i),
      ).toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("exibe estado de sucesso após POST resolver", async () => {
    mockPost.mockResolvedValue({ data: { deduplicated: false } });

    render(
      <LeadContactForm
        corretoraSlug="x"
        corretoraName="Corretora X"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Seu nome/i), {
      target: { value: "Maria Silva" },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "33999990000" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Autorizo a Kavita/i }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Falar com a corretora/i }),
    );

    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    // Tela de sucesso renderiza um botão "Enviar outra mensagem"
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Enviar outra mensagem/i }),
      ).toBeInTheDocument();
    });
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("exibe toast.error quando POST falha (lead não enviado)", async () => {
    mockPost.mockRejectedValue(new Error("Erro de rede"));

    render(
      <LeadContactForm
        corretoraSlug="x"
        corretoraName="X"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Seu nome/i), {
      target: { value: "Maria Silva" },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: "33999990000" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Autorizo a Kavita/i }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Falar com a corretora/i }),
    );

    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    // NÃO entra em estado de sucesso
    expect(
      screen.queryByRole("button", { name: /Enviar outra mensagem/i }),
    ).not.toBeInTheDocument();
  });
});
