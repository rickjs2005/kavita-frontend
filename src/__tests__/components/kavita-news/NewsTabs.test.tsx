import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Ajuste o import se o seu caminho real for diferente.
// Recomendado: manter o componente em src/components/news/NewsTabs.tsx
import NewsTabs, { type NewsTabKey } from "@/components/admin/kavita-news/NewsTabs";

describe("NewsTabs", () => {
  it("renderiza título, subtítulo e instrução", () => {
    const onChange = vi.fn();

    render(<NewsTabs active={"clima"} onChange={onChange} />);

    expect(screen.getByText("Kavita News")).toBeInTheDocument();
    expect(screen.getByText("Gestão de conteúdo")).toBeInTheDocument();
    expect(
      screen.getByText("Use as abas para alternar entre os módulos.")
    ).toBeInTheDocument();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renderiza as 3 abas como botões acessíveis", () => {
    const onChange = vi.fn();

    render(<NewsTabs active={"clima"} onChange={onChange} />);

    const clima = screen.getByRole("button", { name: /clima/i });
    const cotacoes = screen.getByRole("button", { name: /cotações/i });
    const posts = screen.getByRole("button", { name: /posts/i });

    expect(clima).toBeInTheDocument();
    expect(cotacoes).toBeInTheDocument();
    expect(posts).toBeInTheDocument();

    // Semântica: todos devem ser type="button" (não submit)
    expect(clima).toHaveAttribute("type", "button");
    expect(cotacoes).toHaveAttribute("type", "button");
    expect(posts).toHaveAttribute("type", "button");
  });

  it("aplica classes corretas para aba ativa e inativa", () => {
    const onChange = vi.fn();

    render(<NewsTabs active={"cotacoes"} onChange={onChange} />);

    const clima = screen.getByRole("button", { name: /clima/i });
    const cotacoes = screen.getByRole("button", { name: /cotações/i });
    const posts = screen.getByRole("button", { name: /posts/i });

    // Classe “assinatura” do estado ativo (do próprio componente)
    expect(cotacoes.className).toContain("bg-emerald-500/10");
    expect(cotacoes.className).toContain("text-emerald-200");
    expect(cotacoes.className).toContain("border-emerald-500/50");

    // Inativas devem conter o estilo base de inativo
    expect(clima.className).toContain("border-slate-800");
    expect(clima.className).toContain("text-slate-200");
    expect(posts.className).toContain("border-slate-800");
    expect(posts.className).toContain("text-slate-200");
  });

  it("dispara onChange com a key correta ao clicar em cada aba", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<NewsTabs active={"clima"} onChange={onChange} />);

    const cotacoes = screen.getByRole("button", { name: /cotações/i });
    const posts = screen.getByRole("button", { name: /posts/i });

    await user.click(cotacoes);
    await user.click(posts);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, "cotacoes" satisfies NewsTabKey);
    expect(onChange).toHaveBeenNthCalledWith(2, "posts" satisfies NewsTabKey);
  });

  it("permite clicar na aba já ativa e ainda assim chama onChange (comportamento atual)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<NewsTabs active={"posts"} onChange={onChange} />);

    const posts = screen.getByRole("button", { name: /posts/i });
    await user.click(posts);

    // O componente não bloqueia clique na aba ativa; valida comportamento real
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("posts");
  });
});
