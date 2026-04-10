/**
 * FormularioContato.test.tsx
 *
 * Cobertura:
 * - Renderizacao com defaults e config
 * - Submit com sucesso
 * - Erro de API (generico)
 * - Erro de validacao com fields
 * - Rate limit (429)
 * - Loading durante envio
 * - Reset apos sucesso
 * - Nao mostra sucesso falso (so apos resposta OK)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import FormularioContato from "@/app/contato/components/FormularioContato";

// ── Mocks ──────────────────────────────────────────────────────────

const postMock = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: { post: (...args: any[]) => postMock(...args) },
}));

vi.mock("../../../app/contato/trackContatoEvent", () => ({
  trackContatoEvent: vi.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────

function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    nome: "Rick Sanchez",
    email: "rick@example.com",
    telefone: "31999990000",
    assunto: "Duvida sobre pedido",
    mensagem: "Quando chega meu pedido numero 123?",
    ...overrides,
  };

  fireEvent.change(screen.getByLabelText(/Nome completo/i), {
    target: { value: values.nome },
  });
  fireEvent.change(screen.getByLabelText(/E-mail/i), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByLabelText(/WhatsApp/i), {
    target: { value: values.telefone },
  });
  fireEvent.change(screen.getByLabelText(/Assunto/i), {
    target: { value: values.assunto },
  });
  fireEvent.change(screen.getByLabelText(/Mensagem/i), {
    target: { value: values.mensagem },
  });

  return values;
}

function getForm() {
  return screen.getByLabelText(/Nome completo/i).closest("form") as HTMLFormElement;
}

// ── Tests ──────────────────────────────────────────────────────────

describe("FormularioContato", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza titulo, subtitulo e campos principais", () => {
    render(<FormularioContato />);

    expect(screen.getByText(/Fale com a equipe Kavita/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Assunto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensagem/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar mensagem/i })).toBeInTheDocument();
  });

  it("usa textos do config quando fornecido", () => {
    render(
      <FormularioContato
        config={
          {
            form_title: "Titulo customizado",
            form_subtitle: "Subtitulo customizado",
          } as any
        }
      />
    );

    expect(screen.getByText("Titulo customizado")).toBeInTheDocument();
    expect(screen.getByText("Subtitulo customizado")).toBeInTheDocument();
  });

  it("envia com sucesso → mostra tela de sucesso", async () => {
    postMock.mockResolvedValueOnce({ ok: true, data: { id: 1 } });

    render(<FormularioContato />);
    fillForm();

    await act(async () => {
      fireEvent.submit(getForm());
    });

    await waitFor(() => {
      expect(screen.getByText(/Mensagem recebida/i)).toBeInTheDocument();
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(
      "/api/public/contato",
      expect.objectContaining({
        nome: "Rick Sanchez",
        email: "rick@example.com",
        assunto: "Duvida sobre pedido",
      })
    );

    // Form some, sucesso aparece
    expect(screen.queryByLabelText(/Nome completo/i)).not.toBeInTheDocument();
  });

  it("erro generico de API → exibe mensagem de erro, NAO mostra sucesso", async () => {
    postMock.mockRejectedValueOnce(new Error("Network error"));

    render(<FormularioContato />);
    fillForm();

    await act(async () => {
      fireEvent.submit(getForm());
    });

    await waitFor(() => {
      expect(screen.getByText(/Falha na conexao/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Mensagem recebida/i)).not.toBeInTheDocument();
  });

  it("erro 429 (rate limit) → exibe mensagem especifica", async () => {
    const apiError = Object.assign(new Error("Limite atingido"), {
      name: "ApiError",
      status: 429,
      code: "RATE_LIMIT",
    });
    postMock.mockRejectedValueOnce(apiError);

    render(<FormularioContato />);
    fillForm();

    await act(async () => {
      fireEvent.submit(getForm());
    });

    await waitFor(() => {
      expect(screen.getByText(/Limite de envios atingido/i)).toBeInTheDocument();
    });
  });

  it("erro de validacao com fields → exibe erro inline por campo", async () => {
    const apiError = Object.assign(new Error("Dados invalidos"), {
      name: "ApiError",
      status: 400,
      code: "VALIDATION_ERROR",
      details: {
        fields: [{ field: "email", message: "E-mail invalido." }],
      },
    });
    postMock.mockRejectedValueOnce(apiError);

    render(<FormularioContato />);
    fillForm();

    await act(async () => {
      fireEvent.submit(getForm());
    });

    await waitFor(() => {
      expect(screen.getByText("E-mail invalido.")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Mensagem recebida/i)).not.toBeInTheDocument();
  });

  it("durante o envio → botao mostra Enviando e fica desabilitado", async () => {
    let resolvePost: (v: unknown) => void = () => {};
    postMock.mockImplementationOnce(
      () => new Promise((resolve) => { resolvePost = resolve; })
    );

    render(<FormularioContato />);
    fillForm();

    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Enviando/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Enviando/i })).toBeDisabled();

    await act(async () => {
      resolvePost({ ok: true, data: { id: 1 } });
    });
  });

  it("apos sucesso, botao 'Enviar outra mensagem' volta ao formulario", async () => {
    postMock.mockResolvedValueOnce({ ok: true, data: { id: 1 } });

    render(<FormularioContato />);
    fillForm();

    await act(async () => {
      fireEvent.submit(getForm());
    });

    await waitFor(() => {
      expect(screen.getByText(/Mensagem recebida/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Enviar outra mensagem/i }));

    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
  });

  it("aplica mascara no telefone enquanto digita", () => {
    render(<FormularioContato />);

    const input = screen.getByLabelText(/WhatsApp/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "31999990000" } });

    expect(input.value).toMatch(/\(31\) 99999-0000/);
  });
});
