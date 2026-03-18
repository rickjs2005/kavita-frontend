// src/__tests__/components/drones/CommentsSection.test.tsx
//
// Risco: CommentsSection é o único canal público de envio de comentários.
// Falha silenciosa no submit, exibição incorreta de erros de autenticação ou
// perda de callback onCreated podem deixar usuários sem feedback.
//
// O que está sendo coberto:
//   - Renderização do heading e seção "Publicados"
//   - Renderização de comentários (nome, texto)
//   - Estado vazio ("Ainda não há comentários publicados.")
//   - Mídia IMAGE → <img>, mídia VIDEO → <video>
//   - Exibe modelKey quando fornecido
//   - Validação: texto vazio → mensagem de erro
//   - Submit com texto → POST para /api/public/drones/comentarios
//   - Inclui model_key no FormData quando modelKey prop é fornecido
//   - Mensagem de sucesso após POST
//   - Callback onCreated chamado após POST
//   - Erro genérico exibe mensagem de erro
//   - Erro 401 exibe mensagem de login + botão "Fazer login"
//   - Estado "Enviando...": botão desabilitado durante POST

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

// ---- Tests -----------------------------------------------------------------

describe("CommentsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({});
  });

  describe("estrutura básica", () => {
    it("renderiza heading 'Relatos de clientes'", () => {
      render(<CommentsSection comments={[]} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "Relatos de clientes",
      );
    });

    it("renderiza seção 'Publicados'", () => {
      render(<CommentsSection comments={[]} />);
      expect(screen.getByText("Publicados")).toBeInTheDocument();
    });

    it("exibe label modelKey quando fornecido", () => {
      render(<CommentsSection comments={[]} modelKey="agras-t50" />);
      expect(screen.getByText("agras-t50")).toBeInTheDocument();
    });

    it("não exibe label de modelo quando modelKey não é fornecido", () => {
      render(<CommentsSection comments={[]} />);
      expect(screen.queryByText(/Modelo:/)).not.toBeInTheDocument();
    });
  });

  describe("lista de comentários", () => {
    it("renderiza display_name e comment_text do comentário", async () => {
      render(
        <CommentsSection
          comments={[makeComment({ display_name: "Carlos", comment_text: "Ótimo produto!" })]}
        />,
      );
      expect(screen.getByText("Carlos")).toBeInTheDocument();
      expect(screen.getByText("Ótimo produto!")).toBeInTheDocument();
    });

    it("renderiza múltiplos comentários", () => {
      render(
        <CommentsSection
          comments={[
            makeComment({ id: 1, display_name: "A", comment_text: "Bom" }),
            makeComment({ id: 2, display_name: "B", comment_text: "Ótimo" }),
          ]}
        />,
      );
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("exibe 'Ainda não há comentários publicados.' quando lista está vazia", () => {
      render(<CommentsSection comments={[]} />);
      expect(
        screen.getByText("Ainda não há comentários publicados."),
      ).toBeInTheDocument();
    });

    it("aceita array null/undefined sem crash (normaliza para [])", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<CommentsSection comments={null as any} />);
      expect(
        screen.getByText("Ainda não há comentários publicados."),
      ).toBeInTheDocument();
    });
  });

  describe("mídia dos comentários", () => {
    it("renderiza <img> para mídia do tipo IMAGE", () => {
      render(
        <CommentsSection
          comments={[
            makeComment({
              media: [{ id: 1, comment_id: 1, media_type: "IMAGE", media_path: "/uploads/img.jpg", created_at: "2026-01-01T00:00:00Z" }],
            }),
          ]}
        />,
      );
      expect(screen.getByAltText("mídia do comentário")).toBeInTheDocument();
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
    it("textarea e botão Enviar estão presentes", () => {
      render(<CommentsSection comments={[]} />);
      expect(
        screen.getByPlaceholderText("Escreva seu relato..."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
    });

    it("exibe erro 'Digite seu comentário.' ao tentar enviar texto vazio", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() =>
        expect(screen.getByText("Digite seu comentário.")).toBeInTheDocument(),
      );
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("chama POST /api/public/drones/comentarios ao enviar texto válido", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Muito bom o produto!" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
      const [url, formData, options] = mockPost.mock.calls[0];
      expect(url).toBe("/api/public/drones/comentarios");
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get("comment_text")).toBe("Muito bom o produto!");
      expect(options).toMatchObject({ skipContentType: true });
    });

    it("inclui model_key no FormData quando modelKey prop é fornecido", async () => {
      render(<CommentsSection comments={[]} modelKey="agras-t40" />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Excelente!" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get("model_key")).toBe("agras-t40");
    });

    it("não inclui model_key quando modelKey não é fornecido", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Bom!" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
      const formData = mockPost.mock.calls[0][1] as FormData;
      expect(formData.get("model_key")).toBeNull();
    });

    it("exibe mensagem de sucesso após POST bem-sucedido", async () => {
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Adorei!" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() =>
        expect(
          screen.getByText("Comentário enviado com sucesso!"),
        ).toBeInTheDocument(),
      );
    });

    it("chama onCreated após POST bem-sucedido", async () => {
      const onCreated = vi.fn();
      render(<CommentsSection comments={[]} onCreated={onCreated} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Perfeito!" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    });

    it("exibe mensagem de erro genérico quando POST falha", async () => {
      mockPost.mockRejectedValueOnce(new Error("Erro de servidor"));
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() =>
        expect(screen.getByText("Erro de servidor")).toBeInTheDocument(),
      );
    });

    it("exibe mensagem de login e botão 'Fazer login' em erro 401", async () => {
      const apiError = Object.assign(new Error("Não autorizado"), {
        name: "ApiError",
        status: 401,
      });
      mockPost.mockRejectedValueOnce(apiError);
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() =>
        expect(
          screen.getByText(/Você precisa estar logado/),
        ).toBeInTheDocument(),
      );
      expect(screen.getByRole("button", { name: "Fazer login" })).toBeInTheDocument();
    });

    it("exibe mensagem de login e botão 'Fazer login' em erro 403", async () => {
      const apiError = Object.assign(new Error("Proibido"), {
        name: "ApiError",
        status: 403,
      });
      mockPost.mockRejectedValueOnce(apiError);
      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Fazer login" })).toBeInTheDocument(),
      );
    });

    it("botão mostra 'Enviando...' e fica desabilitado durante POST", async () => {
      let resolvePost!: () => void;
      mockPost.mockReturnValueOnce(new Promise((res) => { resolvePost = res; }));

      render(<CommentsSection comments={[]} />);
      fireEvent.change(screen.getByPlaceholderText("Escreva seu relato..."), {
        target: { value: "Relato" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled(),
      );

      resolvePost();
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Enviar" })).not.toBeDisabled(),
      );
    });
  });
});
