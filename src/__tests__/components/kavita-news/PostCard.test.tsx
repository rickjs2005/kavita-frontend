import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicPost } from "@/lib/newsPublicApi";
import { PostCard } from "@/components/news/PostCard";

// Mock de next/link para jsdom
vi.mock("next/link", () => {
  return {
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
  };
});

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
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("deve renderizar link com href e aria-label corretos (positivo)", () => {
    const item = makeItem({ slug: "abc", title: "Matéria ABC" });

    render(<PostCard item={item} />);

    const link = screen.getByRole("link", {
      name: "Abrir matéria: Matéria ABC",
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/posts/abc");
    expect(link.textContent).toContain("Matéria ABC");
  });

  it("deve renderizar imagem de capa quando coverUrl existir (positivo)", () => {
    const item = makeItem({
      cover_image_url: "https://site.com/imagem teste.jpg",
    });

    render(<PostCard item={item} />);

    const img = screen.getByRole("img", {
      name: "Capa da matéria: Produção agrícola cresce no Brasil",
    });

    // encodeURI aplicado
    expect(img).toHaveAttribute("src", "https://site.com/imagem%20teste.jpg");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("deve resolver URL relativa prefixando NEXT_PUBLIC_API_URL (positivo)", () => {
    const item = makeItem({
      cover_image_url: "/uploads/capas/capa 1.jpg",
    });

    render(<PostCard item={item} />);

    const img = screen.getByRole("img", {
      name: /Capa da matéria:/,
    });

    expect(img).toHaveAttribute(
      "src",
      "http://localhost:5000/uploads/capas/capa%201.jpg",
    );
  });

  it("deve exibir fallback visual quando não houver imagem de capa (negativo)", () => {
    const item = makeItem({
      cover_image_url: null,
    });

    // 👇 escape controlado apenas para este cenário
    const extendedItem = {
      ...item,
      cover: null,
      cover_url: null,
      image_url: null,
      thumbnail_url: null,
    } as any;

    render(<PostCard item={extendedItem} />);

    expect(screen.getByText("Sem imagem de capa")).toBeInTheDocument();
    expect(screen.getByText("📰")).toBeInTheDocument();
  });

  it("deve renderizar selo editorial com emoji 🌾 quando contexto for agro (positivo)", () => {
    const item = makeItem({
      category: "Agro",
      title: "Safra de soja bate recorde",
    });

    render(<PostCard item={item} />);

    // Emoji 🌾 vem no selo "🌾 Kavita News"
    expect(screen.getByText(/🌾 Kavita News/)).toBeInTheDocument();
  });

  it("deve usar emoji default 📰 quando não identificar contexto agro (negativo)", () => {
    const item = makeItem({
      category: "Economia",
      tags: "inflacao",
      title: "Inflação desacelera",
    });

    render(<PostCard item={item} />);

    expect(screen.getByText(/📰 Kavita News/)).toBeInTheDocument();
  });

  it("deve renderizar excerpt quando existir (positivo)", () => {
    const item = makeItem({
      excerpt: "Texto resumido da matéria.",
    });

    render(<PostCard item={item} />);

    expect(screen.getByText("Texto resumido da matéria.")).toBeInTheDocument();
  });

  it("deve renderizar fallback de excerpt quando estiver vazio (negativo)", () => {
    const item = makeItem({
      excerpt: "",
    });

    render(<PostCard item={item} />);

    expect(
      screen.getByText("Resumo indisponível no momento."),
    ).toBeInTheDocument();
  });

  it("deve renderizar categoria quando existir e fallback quando não existir (positivo/negativo)", () => {
    const withCategory = makeItem({ category: "Clima" });
    render(<PostCard item={withCategory} />);
    expect(screen.getByText("Categoria: Clima")).toBeInTheDocument();

    const withoutCategory = makeItem({
      category: null as any,
      slug: "x2",
      title: "Sem categoria",
    });
    render(<PostCard item={withoutCategory} />);
    expect(screen.getByText("Categoria: Geral")).toBeInTheDocument();
  });

  it("deve formatar data publicada com Intl.DateTimeFormat pt-BR (positivo/estável)", () => {
    const dtSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(function () {
        return { format: () => "19/12/2025" } as any;
      } as any);

    const item = makeItem({
      published_at: "2025-12-19T00:00:00.000Z",
    });

    render(<PostCard item={item} />);

    expect(screen.getByText("19/12/2025")).toBeInTheDocument();
    expect(dtSpy).toHaveBeenCalled();
  });

  it("deve renderizar string original quando published_at for inválida (negativo)", () => {
    const item = makeItem({
      published_at: "data-invalida" as any,
    });

    render(<PostCard item={item} />);

    expect(screen.getByText("data-invalida")).toBeInTheDocument();
  });

  it("deve não renderizar data quando published_at estiver ausente (controle)", () => {
    const item = makeItem({
      published_at: null as any,
    });

    render(<PostCard item={item} />);

    // Span existe, mas vazio
    const spans = screen.getAllByText((_, el) => el?.tagName === "SPAN");
    const hasDate = spans.some((s) => s.textContent?.includes("202"));
    expect(hasDate).toBe(false);
  });
});
