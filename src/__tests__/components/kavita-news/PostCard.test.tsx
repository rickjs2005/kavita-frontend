import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicPost } from "@/lib/newsPublicApi";
import { PostCard } from "@/components/news/PostCard";

// PostCard foi reescrito para layout dark-glass premium. Mudanças:
//   - Selo virou "Kavita News" simples (sem emoji 🌾/📰 no texto)
//   - Fallback de capa exibe "Sem capa" + emoji 📰
//   - Categoria e exibida sem prefixo "Categoria:" (so o nome ou "Geral")
//   - absUrl agora retorna path relativo, nao URL absoluta
//   - Excerpt fallback: "Resumo indisponível no momento."

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: any;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function makeItem(partial: Partial<PublicPost> = {}): PublicPost {
  return {
    id: 1,
    slug: "materia-teste",
    title: "Produção agrícola cresce no Brasil",
    excerpt: "Resumo da matéria sobre crescimento agrícola.",
    category: "Agro",
    tags: "agro,soja",
    cover_image_url: "https://cdn.exemplo.com/capa.jpg",
    published_at: "2025-12-19T00:00:00.000Z",
    ...partial,
  } as PublicPost;
}

describe("PostCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza link com href e aria-label corretos", () => {
    const item = makeItem({ slug: "abc", title: "Matéria ABC" });
    render(<PostCard item={item} />);

    const link = screen.getByRole("link", {
      name: "Abrir matéria: Matéria ABC",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/posts/abc");
    expect(link.textContent).toContain("Matéria ABC");
  });

  it("renderiza imagem de capa quando coverUrl existir", () => {
    const item = makeItem({
      cover_image_url: "https://site.com/imagem teste.jpg",
    });
    render(<PostCard item={item} />);

    const img = screen.getByRole("img", {
      name: "Capa da matéria: Produção agrícola cresce no Brasil",
    });
    // encodeURI aplicado ao path absoluto.
    expect(img).toHaveAttribute("src", "https://site.com/imagem%20teste.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("resolve URL relativa via absUrl (path relativo, sem prefixar API URL)", () => {
    // absUrl agora retorna sempre path relativo (proxy via Next rewrite).
    const item = makeItem({ cover_image_url: "/uploads/capas/capa 1.jpg" });
    render(<PostCard item={item} />);

    const img = screen.getByRole("img", { name: /Capa da matéria:/ });
    expect(img).toHaveAttribute("src", "/uploads/capas/capa%201.jpg");
  });

  it("exibe fallback visual 'Sem capa' quando nao houver imagem", () => {
    const item = makeItem({
      cover_image_url: null,
      cover_image: null,
      cover_url: null,
    });
    render(<PostCard item={item} />);

    expect(screen.getByText("Sem capa")).toBeInTheDocument();
    expect(screen.getByText("📰")).toBeInTheDocument();
  });

  it("renderiza selo 'Kavita News' (sem emoji embutido no texto)", () => {
    const item = makeItem({ category: "Agro", title: "Safra de soja" });
    render(<PostCard item={item} />);
    // Antes existiam variantes 🌾/📰 dentro do selo. Agora o selo
    // e apenas "Kavita News" + bullet animado decorativo.
    expect(screen.getByText("Kavita News")).toBeInTheDocument();
  });

  it("renderiza excerpt quando existir", () => {
    const item = makeItem({ excerpt: "Texto resumido da matéria." });
    render(<PostCard item={item} />);
    expect(screen.getByText("Texto resumido da matéria.")).toBeInTheDocument();
  });

  it("renderiza fallback de excerpt quando estiver vazio", () => {
    const item = makeItem({ excerpt: "" });
    render(<PostCard item={item} />);
    expect(
      screen.getByText("Resumo indisponível no momento."),
    ).toBeInTheDocument();
  });

  it("renderiza categoria e fallback 'Geral' (sem prefixo 'Categoria:')", () => {
    const withCategory = makeItem({ category: "Clima", slug: "x1" });
    const { unmount } = render(<PostCard item={withCategory} />);
    expect(screen.getByText("Clima")).toBeInTheDocument();
    expect(screen.queryByText(/Categoria:/i)).not.toBeInTheDocument();
    unmount();

    const withoutCategory = makeItem({
      category: null as any,
      slug: "x2",
      title: "Sem categoria",
    });
    render(<PostCard item={withoutCategory} />);
    expect(screen.getByText("Geral")).toBeInTheDocument();
  });

  it("formata data publicada com Intl.DateTimeFormat pt-BR", () => {
    const dtSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(function () {
        return { format: () => "19/12/2025" } as any;
      } as any);

    const item = makeItem({ published_at: "2025-12-19T00:00:00.000Z" });
    render(<PostCard item={item} />);

    expect(screen.getByText("19/12/2025")).toBeInTheDocument();
    expect(dtSpy).toHaveBeenCalled();
  });

  it("renderiza string original quando published_at for inválida", () => {
    const item = makeItem({ published_at: "data-invalida" as any });
    render(<PostCard item={item} />);
    expect(screen.getByText("data-invalida")).toBeInTheDocument();
  });
});
