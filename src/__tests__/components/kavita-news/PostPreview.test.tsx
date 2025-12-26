import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PostPreview from "@/components/admin/kavita-news/posts/PostPreview";

function makePost(overrides: Partial<any> = {}) {
  return {
    id: 1,
    title: "Título do Post",
    status: "draft",
    slug: "meu-post",
    category: "Agro",
    published_at: "2025-12-22T10:00:00.000Z",
    excerpt: "Resumo do post",
    content: "Conteúdo do post",
    ...overrides,
  };
}

describe("PostPreview", () => {
  beforeEach(() => {
    // garante um estado inicial consistente
    document.body.style.overflow = "";
  });

  afterEach(() => {
    // evita “leak” de estado entre testes
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("deve renderizar null quando open=false (negativo)", () => {
    const onClose = vi.fn();
    const post = makePost();

    const { container } = render(
      <PostPreview open={false} post={post as any} onClose={onClose} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("deve renderizar null quando post=null mesmo com open=true (negativo)", () => {
    const onClose = vi.fn();

    const { container } = render(
      <PostPreview open={true} post={null} onClose={onClose} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("deve renderizar header e metadados principais quando open=true e post existe (positivo)", () => {
    const onClose = vi.fn();
    const post = makePost({
      status: "published",
      slug: "slug-123",
      category: "Clima",
      published_at: "2025-12-22",
    });

    render(<PostPreview open={true} post={post as any} onClose={onClose} />);

    // título
    expect(screen.getByText("Título do Post")).toBeInTheDocument();

    // status badge
    expect(screen.getByText("published")).toBeInTheDocument();

    // slug (renderiza como “badge” monoespaçado)
    expect(screen.getByText("slug-123")).toBeInTheDocument();

    // categoria
    expect(screen.getByText(/•\s*Clima/)).toBeInTheDocument();

    // published_at
    expect(screen.getByText(/Publicado em 2025-12-22/)).toBeInTheDocument();

    // botão fechar no header
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();

    // overlay clicável com aria-label
    expect(
      screen.getByRole("button", { name: "Fechar preview" })
    ).toBeInTheDocument();
  });

  it("deve renderizar excerpt e content; e mostrar '(Sem conteúdo)' quando content vazio (positivo/negativo)", () => {
    const onClose = vi.fn();

    // com excerpt e sem content
    const post = makePost({ content: "", excerpt: "Trecho do resumo" });

    render(<PostPreview open={true} post={post as any} onClose={onClose} />);

    expect(screen.getByText("Trecho do resumo")).toBeInTheDocument();
    expect(screen.getByText("(Sem conteúdo)")).toBeInTheDocument();

    // label “Conteúdo”
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("deve fechar ao clicar no overlay (positivo)", () => {
    const onClose = vi.fn();
    const post = makePost();

    render(<PostPreview open={true} post={post as any} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar preview" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("deve fechar ao clicar no botão 'Fechar' do header (positivo)", () => {
    const onClose = vi.fn();
    const post = makePost();

    render(<PostPreview open={true} post={post as any} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("deve fechar ao pressionar Escape quando open=true (positivo) e não fechar para outras teclas (negativo)", () => {
    const onClose = vi.fn();
    const post = makePost();

    render(<PostPreview open={true} post={post as any} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("deve travar scroll do body (overflow=hidden) quando aberto e restaurar ao fechar (positivo)", () => {
    const onClose = vi.fn();
    const post = makePost();

    // define um overflow inicial para validar restore correto
    document.body.style.overflow = "auto";

    const { rerender, unmount } = render(
      <PostPreview open={true} post={post as any} onClose={onClose} />
    );

    expect(document.body.style.overflow).toBe("hidden");

    // fechar via rerender (dispara cleanup do effect)
    rerender(<PostPreview open={false} post={post as any} onClose={onClose} />);
    expect(document.body.style.overflow).toBe("auto");

    // abrir de novo e desmontar
    rerender(<PostPreview open={true} post={post as any} onClose={onClose} />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("deve renderizar imagem de capa usando fallback de campos (cover_image_url | coverUrl | cover_url) (positivo)", () => {
    const onClose = vi.fn();

    // 1) cover_image_url (prioridade)
    const postA = makePost({ cover_image_url: "https://cdn/a.jpg" });
    const { rerender } = render(
      <PostPreview open={true} post={postA as any} onClose={onClose} />
    );

    const imgA = screen.getByRole("img", { name: "Capa" }) as HTMLImageElement;
    expect(imgA.src).toContain("https://cdn/a.jpg");

    // 2) coverUrl
    const postB = makePost({ cover_image_url: null, coverUrl: "https://cdn/b.jpg" });
    rerender(<PostPreview open={true} post={postB as any} onClose={onClose} />);
    const imgB = screen.getByRole("img", { name: "Capa" }) as HTMLImageElement;
    expect(imgB.src).toContain("https://cdn/b.jpg");

    // 3) cover_url
    const postC = makePost({ cover_image_url: null, coverUrl: null, cover_url: "https://cdn/c.jpg" });
    rerender(<PostPreview open={true} post={postC as any} onClose={onClose} />);
    const imgC = screen.getByRole("img", { name: "Capa" }) as HTMLImageElement;
    expect(imgC.src).toContain("https://cdn/c.jpg");
  });

  it("não deve renderizar imagem quando nenhuma URL de capa estiver disponível (negativo)", () => {
    const onClose = vi.fn();
    const post = makePost({ cover_image_url: null, coverUrl: null, cover_url: null });

    render(<PostPreview open={true} post={post as any} onClose={onClose} />);

    expect(screen.queryByRole("img", { name: "Capa" })).toBeNull();
  });
});
