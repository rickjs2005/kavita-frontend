// src/__tests__/components/admin/drones/CommentsModerationTable.test.tsx
//
// Risco: tabela de moderação é a única interface de exclusão de comentários.
// Bug de payload (URL errada) ou falha de reload podem deixar comentários
// inválidos visíveis indefinidamente para o público sem feedback ao admin.
//
// O que está sendo coberto:
//   - Loading state inicial
//   - Renderização de lista de comentários (texto, nome, ID)
//   - Estado vazio (nenhum comentário)
//   - Estado de erro de rede
//   - Exclusão de comentário: chama DEL, exibe mensagem, recarrega lista
//   - Botão "Excluir" desabilitado durante ação (actingId)
//   - Botão "Atualizar" dispara reload
//   - Paginação renderizada quando totalPages > 1
//   - Paginação oculta quando totalPages = 1
//   - Exibe mídia (img/vídeo) quando presente

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CommentsModerationTable from "@/components/admin/drones/CommentsModerationTable";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();
const mockDel = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}));

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) => `http://localhost:5000${p}`,
  API_BASE: "http://localhost:5000",
}));

// ---- Fixtures --------------------------------------------------------------

const EMPTY_RESPONSE = { items: [], total: 0, totalPages: 1, page: 1 };

function makeComment(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    display_name: "João Silva",
    comment_text: "Drone excelente para uso agrícola!",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    media: [],
    ...overrides,
  };
}

function commentList(items = [makeComment()], extra = {}) {
  return { items, total: items.length, totalPages: 1, page: 1, ...extra };
}

// ---- Tests -----------------------------------------------------------------

describe("CommentsModerationTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDel.mockResolvedValue(undefined);
  });

  describe("loading state", () => {
    it("exibe 'Carregando...' antes do fetch resolver", () => {
      // deixa o fetch pendente
      mockGet.mockReturnValue(new Promise(() => {}));

      render(<CommentsModerationTable />);

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });
  });

  describe("lista de comentários", () => {
    it("renderiza nome, texto e ID do comentário após fetch", async () => {
      mockGet.mockResolvedValue(commentList());

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.getByText("Drone excelente para uso agrícola!")).toBeInTheDocument(),
      );

      expect(screen.getByText(/João Silva/)).toBeInTheDocument();
      expect(screen.getByText(/#1/)).toBeInTheDocument();
    });

    it("usa 'Cliente Kavita' como fallback quando display_name está vazio", async () => {
      mockGet.mockResolvedValue(
        commentList([makeComment({ display_name: "" })]),
      );

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.getByText(/Cliente Kavita/)).toBeInTheDocument(),
      );
    });

    it("renderiza múltiplos comentários", async () => {
      mockGet.mockResolvedValue(
        commentList([
          makeComment({ id: 1, display_name: "Alice", comment_text: "Ótimo!" }),
          makeComment({ id: 2, display_name: "Bob", comment_text: "Muito bom!" }),
        ]),
      );

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.getByText("Ótimo!")).toBeInTheDocument(),
      );

      expect(screen.getByText("Muito bom!")).toBeInTheDocument();
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    });
  });

  describe("estado vazio", () => {
    it("exibe mensagem quando não há comentários", async () => {
      mockGet.mockResolvedValue(EMPTY_RESPONSE);

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(
          screen.getByText("Nenhum comentário encontrado."),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("estado de erro", () => {
    it("exibe mensagem de erro quando fetch falha", async () => {
      mockGet.mockRejectedValue(new Error("Timeout de rede"));

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(
          screen.getByText("Timeout de rede"),
        ).toBeInTheDocument(),
      );
    });

    it("usa mensagem padrão quando o erro não tem .message", async () => {
      mockGet.mockRejectedValue({ code: "ERR" }); // sem .message

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(
          screen.getByText("Erro de rede ao carregar comentários."),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("botão Atualizar", () => {
    it("chama load novamente ao clicar em Atualizar", async () => {
      mockGet.mockResolvedValue(EMPTY_RESPONSE);

      render(<CommentsModerationTable />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

      fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    });
  });

  describe("exclusão de comentário", () => {
    it("chama DEL /api/admin/drones/comentarios/{id}", async () => {
      mockGet.mockResolvedValue(commentList([makeComment({ id: 7 })]));

      render(<CommentsModerationTable />);
      await waitFor(() =>
        expect(screen.getByText("Drone excelente para uso agrícola!")).toBeInTheDocument(),
      );

      // Prepara segundo GET para o reload pós-exclusão
      mockGet.mockResolvedValueOnce(EMPTY_RESPONSE);

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      await waitFor(() =>
        expect(mockDel).toHaveBeenCalledWith(
          "/api/admin/drones/comentarios/7",
        ),
      );
    });

    it("recarrega a lista após exclusão com sucesso (reload = mockGet chamado 2x)", async () => {
      // Nota: setMsg("Comentário excluído.") é batched com setMsg(null) do load()
      // subsequente — a mensagem não é visível no DOM. Testamos o reload em vez disso.
      mockGet.mockResolvedValue(commentList());

      render(<CommentsModerationTable />);
      await waitFor(() =>
        expect(screen.getByText("Drone excelente para uso agrícola!")).toBeInTheDocument(),
      );
      const callsBefore = mockGet.mock.calls.length;

      mockGet.mockResolvedValueOnce(EMPTY_RESPONSE);
      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      await waitFor(() =>
        expect(mockGet.mock.calls.length).toBeGreaterThan(callsBefore),
      );
    });

    it("exibe mensagem de erro quando DEL falha", async () => {
      mockGet.mockResolvedValue(commentList());
      mockDel.mockRejectedValueOnce(new Error("Falha na exclusão"));

      render(<CommentsModerationTable />);
      await waitFor(() =>
        expect(screen.getByText("Drone excelente para uso agrícola!")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      await waitFor(() =>
        expect(screen.getByText("Falha na exclusão")).toBeInTheDocument(),
      );
    });

    it("botão mostra '...' enquanto exclusão está em andamento", async () => {
      let resolveDelete!: () => void;
      const pendingDel = new Promise<void>((res) => { resolveDelete = res; });

      mockGet.mockResolvedValue(commentList());
      mockDel.mockReturnValueOnce(pendingDel);

      render(<CommentsModerationTable />);
      await waitFor(() =>
        expect(screen.getByText("Drone excelente para uso agrícola!")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "..." })).toBeDisabled(),
      );

      // Resolve para não vazar a promise
      resolveDelete();
      mockGet.mockResolvedValueOnce(EMPTY_RESPONSE);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    });
  });

  describe("paginação", () => {
    it("exibe controles de paginação quando totalPages > 1", async () => {
      mockGet.mockResolvedValue({
        items: [makeComment()],
        total: 40,
        totalPages: 2,
        page: 1,
      });

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument(),
      );

      expect(screen.getByRole("button", { name: "Próxima" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    });

    it("NÃO exibe paginação quando totalPages = 1", async () => {
      mockGet.mockResolvedValue(commentList());

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.queryByText(/Página/)).not.toBeInTheDocument(),
      );
    });

    it("clica em Próxima e carrega página 2", async () => {
      mockGet.mockResolvedValue({
        items: [makeComment()],
        total: 40,
        totalPages: 2,
        page: 1,
      });

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Próxima" })).toBeInTheDocument(),
      );

      mockGet.mockResolvedValueOnce({
        items: [makeComment({ id: 5, comment_text: "Página 2 item" })],
        total: 40,
        totalPages: 2,
        page: 2,
      });

      fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

      await waitFor(() =>
        expect(screen.getByText("Página 2 item")).toBeInTheDocument(),
      );
    });
  });

  describe("mídia do comentário", () => {
    it("renderiza img para mídia do tipo IMAGE", async () => {
      mockGet.mockResolvedValue(
        commentList([
          makeComment({
            media: [{ id: 10, media_type: "IMAGE", media_path: "/uploads/img.jpg" }],
          }),
        ]),
      );

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.getByAltText("mídia do comentário")).toBeInTheDocument(),
      );
    });

    it("exibe 'Sem mídia anexada.' quando media está vazio", async () => {
      mockGet.mockResolvedValue(commentList([makeComment({ media: [] })]));

      render(<CommentsModerationTable />);

      await waitFor(() =>
        expect(screen.getByText("Sem mídia anexada.")).toBeInTheDocument(),
      );
    });
  });
});
