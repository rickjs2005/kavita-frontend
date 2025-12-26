import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import PostsToolbar from "@/components/admin/kavita-news/posts/PostsToolbar";

describe("PostsToolbar", () => {
  const onChangeQ = vi.fn();
  const onChangeStatus = vi.fn();
  const onClickNew = vi.fn();
  const onClickRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar input, select e botão Novo Post (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
      />
    );

    // Assert
    expect(
      screen.getByPlaceholderText("Buscar por título, slug, tag...")
    ).toBeInTheDocument();

    expect(screen.getByRole("combobox")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Novo Post" })
    ).toBeInTheDocument();
  });

  it("deve controlar o valor do input via prop q (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q="milho"
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
      />
    );

    // Assert
    const input = screen.getByPlaceholderText(
      "Buscar por título, slug, tag..."
    ) as HTMLInputElement;

    expect(input.value).toBe("milho");
  });

  it("deve chamar onChangeQ ao digitar no input (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
      />
    );

    const input = screen.getByPlaceholderText(
      "Buscar por título, slug, tag..."
    );

    // Act
    fireEvent.change(input, { target: { value: "soja" } });

    // Assert
    expect(onChangeQ).toHaveBeenCalledWith("soja");
  });

  it("deve controlar o valor do select via prop status (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="published"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
      />
    );

    // Assert
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("published");
  });

  it("deve chamar onChangeStatus ao alterar o select (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
      />
    );

    const select = screen.getByRole("combobox");

    // Act
    fireEvent.change(select, { target: { value: "draft" } });

    // Assert
    expect(onChangeStatus).toHaveBeenCalledWith("draft");
  });

  it("não deve renderizar botão Atualizar quando onClickRefresh não for passado (negativo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
      />
    );

    // Assert
    expect(
      screen.queryByRole("button", { name: "Atualizar" })
    ).toBeNull();
  });

  it("deve renderizar botão Atualizar quando onClickRefresh existir (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
        onClickRefresh={onClickRefresh}
      />
    );

    // Assert
    expect(
      screen.getByRole("button", { name: "Atualizar" })
    ).toBeInTheDocument();
  });

  it("deve chamar onClickRefresh ao clicar em Atualizar (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
        onClickRefresh={onClickRefresh}
      />
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    // Assert
    expect(onClickRefresh).toHaveBeenCalledTimes(1);
  });

  it("deve desabilitar botão Atualizar e trocar texto quando isLoading=true (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
        onClickRefresh={onClickRefresh}
        isLoading={true}
      />
    );

    // Assert
    const btn = screen.getByRole("button", { name: "Atualizando..." });
    expect(btn).toBeDisabled();
  });

  it("deve chamar onClickNew ao clicar em Novo Post (positivo)", () => {
    // Arrange
    render(
      <PostsToolbar
        q=""
        status="all"
        onChangeQ={onChangeQ}
        onChangeStatus={onChangeStatus}
        onClickNew={onClickNew}
      />
    );

    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Novo Post" })
    );

    // Assert
    expect(onClickNew).toHaveBeenCalledTimes(1);
  });
});
