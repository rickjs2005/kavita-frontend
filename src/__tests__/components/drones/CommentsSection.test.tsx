// src/__tests__/components/drones/CommentsSection.test.tsx
//
// CommentsSection passou por reescrita visual de "comentarios" para
// "relatos" (linguagem mais editorial). Os textos, placeholders, alt
// images e mensagens mudaram — os smokes abaixo refletem essa UI atual.
//
// Cobertura mantida (mesmos 18 cenarios):
//   - Renderizacao de header e badge de quantidade
//   - Renderizacao de relatos (nome, texto)
//   - Estado vazio
//   - Midia IMAGE -> <img>, midia VIDEO -> <video>
//   - Validacao: texto vazio -> mensagem de erro
//   - Submit envia POST com FormData (text + opcionalmente model_key)
//   - Mensagem de sucesso, callback onCreated
//   - Erro 401/403 -> CTA "Entrar" no banner amber
//   - Estado "Enviando…" desabilita o botao

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CommentsSection from "@/components/drones/CommentsSection";
import type { DroneComment } from "@/types/drones";

// ---- Mocks -----------------------------------------------------------------

const mockPost = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) => `http://localhost:5000${p}`,
  API_BASE: "http://localhost:5000",
}));

// ---- Fixtures --------------------------------------------------------------

function makeComment(overrides: Record<string, unknown> = {}): DroneComment {
  return {
    id: 1,
    display_name: "Ana Lima",
    comment_text: "Drone excelente, entrega rápida!",
    status: "APPROVED",
    created_at: "2026-01-15T10:00:00Z",
    media: [],
    ...overrides,
  } as DroneComment;
}

// O placeholder do textarea agora e uma frase longa; usar regex pra
// pegar o inicio mantem o teste robusto a ajustes de copy.
const RELATO_PLACEHOLDER = /^Escreva seu relato/i;

// ---- Tests -----------------------------------------------------------------

describe("CommentsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({});
  });

  describe("estrutura básica", () => {
    it("renderiza heading editorial 'Relatos de quem opera no campo'", () => {
      render(<CommentsSection comments={[]} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        /Relatos/i,
      );
    });

    it("renderiza badge com contagem de relatos publicados", () => {
      render(<CommentsSection comments={[]} />);
      // 0 -> "0 relatos publicados"
      expect(screen.getByText(/0 relatos publicados/i)).toBeInTheDocument();
    });

    it("renderiza heading do formulário de envio", () => {
      // Antes era "Publicados"; agora a sub-secao do form se chama
      // "Compartilhe sua experiencia".
      render(<CommentsSection comments={[]} />);
      expect(
        screen.getByText(/Compartilhe sua experiência/i),
      ).toBeInTheDocument();
    });

    it("não exibe label de modelo quando modelKey não é fornecido", () => {
      render(<CommentsSection comments={[]} />);
      expect(screen.queryByText(/Modelo:/)).not.toBeInTheDocument();
    });
  });

  describe("lista de relatos", () => {
    it("renderiza display_name e comment_text do relato", async () => {
      render(
        <CommentsSection
          comments={[makeComment({ display_name: "Carlos", comment_text: "Ótimo produto!" })]}
        />,
      );
      expect(screen.getByText("Carlos")).toBeInTheDocument();
      expect(screen.getByText("Ótimo produto!")).toBeInTheDocument();
    });

    it("renderiza múltiplos relatos", () => {
      render(
        <CommentsSection
          comments={[
            makeComment({ id: 1, display_name: "Aline", comment_text: "Bom" }),
            makeComment({ id: 2, display_name: "Bruno", comment_text: "Ótimo" }),
          ]}
        />,
      );
      expect(screen.getByText("Aline")).toBeInTheDocument();
      expect(screen.getByText("Bruno")).toBeInTheDocument();
    });

    it("exibe estado vazio 'Ainda sem relatos publicados' quando lista vazia", () => {
      render(<CommentsSection comments={[]} />);
      expect(
        screen.getByText(/Ainda sem relatos publicados/i),
      ).toBeInTheDocument();
    });

    it("aceita array null/undefined sem crash (normaliza para [])", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<CommentsSection comments={null as any} />);
      expect(
        screen.getByText(/Ainda sem relatos publicados/i),
      ).toBeInTheDocument();
    });
  });

  describe("mídia dos relatos", () => {
    it("renderiza <img> para mídia do tipo IMAGE", () => {
      render(
        <CommentsSection
          comments={[
            makeComment({
              display_name: "Ana Lima",
              media: [{ id: 1, comment_id: 1, media_type: "IMAGE", media_path: "/uploads/img.jpg", created_at: "2026-01-01T00:00:00Z" }],
            }),
          ]}
        />,
      );
      // Alt agora inclui o nome do autor: "Mídia do relato de {nome}".
      expect(
        screen.getByAltText(/Mídia do relato de Ana Lima/i),
      ).toBeInTheDocument();
    });

    it("renderiza <video> para mídia do tipo VIDEO", () => {
      render(
        <CommentsSection
          comments={[
            makeComment({
              media: [{ id: 2, comment_id: 1, media_type: "VIDEO", media_path: "/uploads/vid.mp4", created_at: "2026-01-01T00:00:00Z" }],
            }),
          ]}
        />,
      );
      expect(document.querySelector("video")).toBeInTheDocument();
    });
  });

  describe("formulário de envio", () => {
    it("textarea e botão 'Enviar relato' estão presentes", () => {
      render(<CommentsSection comments={[]} />);
      expect(
        screen.getByPlaceholderText(RELATO_PLACEHOLDER),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Enviar relato/i }),
      ).toBeInTheDocument();
    });

    it("exibe erro 'Digite seu relato antes de enviar' ao tentar enviar texto vazio", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() =>
        expect(
          screen.getByText(/Digite seu relato antes de enviar/i),
        ).toBeInTheDocument(),
      );
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("chama POST /api/public/drones/comentarios ao enviar texto válido", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Muito bom o produto!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
      const [url, formData, options] = mockPost.mock.calls[0];
      expect(url).toBe("/api/public/drones/comentarios");
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get("comment_text")).toBe("Muito bom o produto!");
      expect(options).toMatchObject({ skipContentType: true });
    });

    it("inclui model_key no FormData quando modelKey prop é fornecido", async () => {
      render(<CommentsSection comments={[]} modelKey="agras-t40" />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Excelente!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get("model_key")).toBe("agras-t40");
    });

    it("não inclui model_key quando modelKey não é fornecido", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Bom!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get("model_key")).toBeNull();
    });

    it("exibe mensagem de sucesso após POST bem-sucedido", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Adorei!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() =>
        expect(
          // Nova copy: "Relato enviado! Vai aparecer na lista apos aprovacao."
          screen.getByText(/Relato enviado/i),
        ).toBeInTheDocument(),
      );
    });

    it("chama onCreated após POST bem-sucedido", async () => {
      const onCreated = vi.fn();
      render(<CommentsSection comments={[]} onCreated={onCreated} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Perfeito!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    });

    it("exibe mensagem de erro genérico quando POST falha", async () => {
      mockPost.mockRejectedValueOnce(new Error("Erro de servidor"));
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() =>
        expect(screen.getByText(/Erro de servidor/i)).toBeInTheDocument(),
      );
    });

    it("exibe mensagem de login e botão 'Entrar' em erro 401", async () => {
      const apiError = Object.assign(new Error("Não autorizado"), {
        name: "ApiError",
        status: 401,
      });
      mockPost.mockRejectedValueOnce(apiError);
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() =>
        expect(
          screen.getByText(/Você precisa estar logado/),
        ).toBeInTheDocument(),
      );
      expect(
        screen.getByRole("button", { name: /Entrar/i }),
      ).toBeInTheDocument();
    });

    it("exibe mensagem de login e botão 'Entrar' em erro 403", async () => {
      const apiError = Object.assign(new Error("Proibido"), {
        name: "ApiError",
        status: 403,
      });
      mockPost.mockRejectedValueOnce(apiError);
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /Entrar/i }),
        ).toBeInTheDocument(),
      );
    });

    it("botão mostra 'Enviando…' e fica desabilitado durante POST", async () => {
      let resolvePost!: () => void;
      mockPost.mockReturnValueOnce(new Promise((res) => { resolvePost = res; }));

      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText(RELATO_PLACEHOLDER), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Enviar relato/i }));

      // O componente usa reticencias unicode "…" enquanto envia.
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /Enviando…/ }),
        ).toBeDisabled(),
      );

      resolvePost();
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /Enviar relato/i }),
        ).not.toBeDisabled(),
      );
    });
  });
});
