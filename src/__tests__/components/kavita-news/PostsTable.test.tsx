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
      />
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
      />
    );

    // Assert
    expect(screen.getByText("Nenhum post encontrado.")).toBeInTheDocument();
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
      />
    );

    // Assert
    expect(screen.getByText("Post 1")).toBeInTheDocument();
    expect(screen.getByText("post-1")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("Agro")).toBeInTheDocument();
    expect(screen.getByText("Resumo curto")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Prévia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
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
      />
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
      />
    );

    // Assert: não amarremos no locale completo; basta confirmar que existe uma data “dd/mm/aaaa”
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
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
      />
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
      />
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Prévia" }));
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

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
      />
    );

    // Assert
    const btn = screen.getByRole("button", { name: "Despublicar" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Despublicar");
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
      />
    );

    // Assert: matcher flexível porque “Página ... de ...” tem spans no meio
    expect(
      screen.getByText((text) => text.includes("Página"))
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
      />
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
