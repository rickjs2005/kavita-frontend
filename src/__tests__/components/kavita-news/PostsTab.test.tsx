import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import PostsTab from "@/components/admin/kavita-news/posts/PostsTab"; // mantenha como está no seu projeto

vi.mock("@/utils/kavita-news/posts", () => ({
  listNewsPosts: vi.fn(),
  createNewsPost: vi.fn(),
  updateNewsPost: vi.fn(),
  deleteNewsPost: vi.fn(),
}));

import {
  listNewsPosts,
  updateNewsPost,
  deleteNewsPost,
} from "@/utils/kavita-news/posts";

const makeList = (overrides?: Partial<any>) => ({
  items: [
    {
      id: 1,
      title: "Post 1",
      status: "draft",
      slug: "post-1",
      category: "Agro",
      cover_url: null,
      excerpt: null,
      content: null,
    },
  ],
  totalPages: 3,
  ...overrides,
});

describe("PostsTab (UI real)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listNewsPosts as any).mockResolvedValue(makeList());
    (updateNewsPost as any).mockResolvedValue({});
    (deleteNewsPost as any).mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve buscar e renderizar posts ao montar (positivo)", async () => {
    // Arrange
    render(<PostsTab />);

    // Act + Assert
    await waitFor(() => {
      expect(listNewsPosts).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Post 1")).toBeInTheDocument();
    // tabela real tem cabeçalho "Título"
    expect(screen.getByText("Título")).toBeInTheDocument();
  });

  it("deve aplicar filtro de busca (q) e resetar page para 1 (positivo)", async () => {
    // Arrange
    render(<PostsTab />);

    await screen.findByText("Post 1");

    const input = screen.getByPlaceholderText(
      "Buscar por título, slug, tag..."
    ) as HTMLInputElement;

    // Act
    fireEvent.change(input, { target: { value: "milho" } });

    // Assert: uma nova listagem é disparada com q=milho e page=1
    await waitFor(() => {
      expect(listNewsPosts).toHaveBeenCalled();
      const lastCallArg = (listNewsPosts as any).mock.calls.at(-1)?.[0];
      expect(lastCallArg).toEqual(
        expect.objectContaining({ q: "milho", page: 1 })
      );
    });
  });

  it("deve aplicar filtro de status e resetar page para 1 (positivo)", async () => {
    // Arrange
    render(<PostsTab />);
    await screen.findByText("Post 1");

    // O select real não tem label/aria-label: pegue pelo role combobox
    const select = screen.getByRole("combobox") as HTMLSelectElement;

    // Act
    fireEvent.change(select, { target: { value: "published" } });

    // Assert
    await waitFor(() => {
      const lastCallArg = (listNewsPosts as any).mock.calls.at(-1)?.[0];
      expect(lastCallArg).toEqual(
        expect.objectContaining({ status: "published", page: 1 })
      );
    });
  });

  it("deve chamar refresh ao clicar em 'Atualizar' (positivo)", async () => {
    // Arrange
    render(<PostsTab />);
    await screen.findByText("Post 1");
    const before = (listNewsPosts as any).mock.calls.length;

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    // Assert
    await waitFor(() => {
      expect((listNewsPosts as any).mock.calls.length).toBeGreaterThan(before);
    });
  });

  it("deve excluir post quando confirm=true e atualizar listagem (positivo)", async () => {
    // Arrange
    render(<PostsTab />);
    await screen.findByText("Post 1");

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    // Assert
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(deleteNewsPost).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      // após delete ele chama refresh()
      expect(listNewsPosts).toHaveBeenCalledTimes(2);
    });
  });

  it("não deve excluir post quando confirm=false (negativo)", async () => {
    // Arrange
    (window.confirm as any).mockReturnValue(false);

    render(<PostsTab />);
    await screen.findByText("Post 1");

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    // Assert
    expect(deleteNewsPost).not.toHaveBeenCalled();
  });

  it("deve alternar draft -> published ao clicar em 'Publicar' (positivo)", async () => {
    // Arrange
    render(<PostsTab />);
    await screen.findByText("Post 1");

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    // Assert
    await waitFor(() => {
      expect(updateNewsPost).toHaveBeenCalledTimes(1);
    });

    const [id, payload] = (updateNewsPost as any).mock.calls[0];
    expect(id).toBe(1);
    expect(payload).toEqual(
      expect.objectContaining({
        status: "published",
        publish_now: true,
      })
    );

    await waitFor(() => {
      expect(listNewsPosts).toHaveBeenCalledTimes(2);
    });
  });

  it("deve paginar ao clicar em 'Próxima' quando totalPages > 1 (positivo)", async () => {
    // Arrange
    (listNewsPosts as any).mockResolvedValueOnce(makeList({ totalPages: 3 }));

    render(<PostsTab />);
    await screen.findByText("Post 1");

    const nextBtn = screen.getByRole("button", { name: "Próxima" });
    expect(nextBtn).not.toBeDisabled();

    // Act
    fireEvent.click(nextBtn);

    // Assert: deve buscar page=2
    await waitFor(() => {
      const lastCallArg = (listNewsPosts as any).mock.calls.at(-1)?.[0];
      expect(lastCallArg).toEqual(expect.objectContaining({ page: 2 }));
    });
  });

  it("deve lidar com erro na listagem e mostrar estado vazio (negativo)", async () => {
    // Arrange
    (listNewsPosts as any).mockRejectedValueOnce(new Error("fail"));

    render(<PostsTab />);

    // Act + Assert
    await waitFor(() => {
      expect(listNewsPosts).toHaveBeenCalledTimes(1);
    });

    // UI real: a tabela renderiza mensagem de vazio
    expect(screen.getByText("Nenhum post encontrado.")).toBeInTheDocument();
  });
});
