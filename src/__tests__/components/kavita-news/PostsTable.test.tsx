import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import PostsTable from "@/components/admin/kavita-news/posts/PostsTable";

type AnyPost = any;

const makePost = (overrides: Partial<AnyPost> = {}): AnyPost => ({
  id: 1,
  title: "Post 1",
  status: "draft",
  slug: "post-1",
  category: "Agro",
  excerpt: "Resumo curto",
  updated_at: "2025-12-22T10:00:00.000Z",
  ...overrides,
});

describe("PostsTable", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onTogglePublish = vi.fn();
  const onPreview = vi.fn();
  const onPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve renderizar skeleton quando isLoading=true (positivo)", () => {
    // Arrange
    render(
      <PostsTable
        items={[makePost()]}
        isLoading={true}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    expect(screen.queryByText("Post 1")).toBeNull();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("deve renderizar empty state quando items.length=0 e isLoading=false (negativo)", () => {
    // Arrange
    render(
      <PostsTable
        items={[]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Assert — duplicado em mobile cards + desktop table.
    expect(
      screen.getAllByText("Nenhum post encontrado.").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("deve renderizar linha com título, slug, status e categoria (positivo)", () => {
    // Arrange
    render(
      <PostsTable
        items={[makePost()]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Assert — campos aparecem em ambas as variantes responsivas
    // (mobile cards + desktop table); usamos getAllByText e validamos
    // ao menos uma ocorrencia por campo.
    expect(screen.getAllByText("Post 1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("post-1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("draft").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Agro").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Resumo curto").length).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByRole("button", { name: "Prévia" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Editar" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Publicar" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: "Excluir" }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("deve usar '-' quando slug/categoria/updated ausentes (negativo)", () => {
    // Arrange
    render(
      <PostsTable
        items={[
          makePost({
            slug: null,
            category: undefined,
            excerpt: null,
            updated_at: null,
          }),
        ]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("deve escolher updated alternativo (updatedAt/atualizado_em) e renderizar data quando válida (positivo)", () => {
    // Arrange
    const iso = "2025-12-21T03:00:00.000Z";
    render(
      <PostsTable
        items={[
          makePost({
            updated_at: null,
            updatedAt: iso,
            excerpt: null,
          }),
        ]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Assert: data aparece em mobile + desktop; validamos pelo menos 1
    expect(
      screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("deve renderizar '-' em updated quando data inválida (negativo)", () => {
    // Arrange
    render(
      <PostsTable
        items={[
          makePost({
            updated_at: "not-a-date",
            excerpt: null,
          }),
        ]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Assert
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("deve chamar callbacks corretos ao clicar nos botões de ação (positivo)", () => {
    // Arrange
    const post = makePost({ id: 99, title: "Post X" });

    render(
      <PostsTable
        items={[post]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Act — botoes aparecem em duplicata (mobile + desktop). Clicamos
    // o primeiro de cada e checamos que cada callback foi chamado.
    fireEvent.click(screen.getAllByRole("button", { name: "Prévia" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Publicar" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);

    // Assert
    expect(onPreview).toHaveBeenCalledWith(post);
    expect(onEdit).toHaveBeenCalledWith(post);
    expect(onTogglePublish).toHaveBeenCalledWith(post);
    expect(onDelete).toHaveBeenCalledWith(post);
  });

  it("deve mostrar botão 'Despublicar' e title 'Despublicar' quando status=published (positivo)", () => {
    // Arrange
    const post = makePost({ status: "published" });

    render(
      <PostsTable
        items={[post]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={1}
        totalPages={1}
        onPageChange={onPageChange}
      />,
    );

    // Assert — duplicado em mobile + desktop; validamos o primeiro
    const buttons = screen.getAllByRole("button", { name: "Despublicar" });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    expect(buttons[0]).toHaveAttribute("title", "Despublicar");
  });

  it("deve desabilitar paginação corretamente e clamped page (negativo/controle)", () => {
    // Arrange
    render(
      <PostsTable
        items={[makePost()]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={999}
        totalPages={0} // deve virar 1 internamente
        onPageChange={onPageChange}
      />,
    );

    // Assert: matcher flexível porque “Página ... de ...” tem spans no meio
    expect(
      screen.getByText((text) => text.includes("Página")),
    ).toBeInTheDocument();

    // Em página 1 de 1, ambos disabled
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("deve paginar: clicar em Próxima chama onPageChange(page+1); Anterior chama (page-1) (positivo)", () => {
    // Arrange
    render(
      <PostsTable
        items={[makePost()]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        onPreview={onPreview}
        page={2}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );

    const prev = screen.getByRole("button", { name: "Anterior" });
    const next = screen.getByRole("button", { name: "Próxima" });

    expect(prev).not.toBeDisabled();
    expect(next).not.toBeDisabled();

    // Act
    fireEvent.click(prev);
    fireEvent.click(next);

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
