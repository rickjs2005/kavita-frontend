import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ------------------------------------------------------------------ */
/* Mocks globais                                                       */
/* ------------------------------------------------------------------ */

// next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// next/link → <a>
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// next/image → <img> (remove priority!)
vi.mock("next/image", () => ({
  default: ({ priority, ...props }: any) => <img {...props} />,
}));

// dynamic import (SearchBar)
vi.mock("next/dynamic", () => ({
  default: () => {
    const Comp = () => <div data-testid="search-bar" />;
    return Comp;
  },
}));

// CartContext
const mockUseCart = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

// AuthContext
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Componentes filhos
vi.mock("@/components/cart/CartCar", () => ({
  default: ({ isCartOpen }: any) =>
    isCartOpen ? <div data-testid="cart-open" /> : null,
}));

vi.mock("@/components/ui/UserMenu", () => ({
  default: () => <div data-testid="user-menu" />,
}));

vi.mock("@/components/layout/MainNavCategories", () => ({
  default: () => <div data-testid="main-nav-categories" />,
}));

/* ------------------------------------------------------------------ */

import Header from "@/components/layout/Header";

describe("Header (src/components/Header.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUsePathname.mockReturnValue("/");
    mockUseCart.mockReturnValue({ cartItems: [] });
    mockUseAuth.mockReturnValue({ user: null, logout: mockLogout });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("não renderiza o header em rota excluída (ex: /checkout)", () => {
    mockUsePathname.mockReturnValue("/checkout");
    const { container } = render(<Header categories={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza o header em rota pública normal (positivo)", async () => {
    render(<Header categories={[]} />);

    expect(
      screen.getByRole("link", { name: /Pular para o conteúdo/i })
    ).toBeInTheDocument();

    expect(screen.getByAltText("Kavita")).toBeInTheDocument();
    expect(await screen.findByTestId("main-nav-categories")).toBeInTheDocument();
  });

  it("mostra badge do carrinho com quantidade de itens", async () => {
    mockUseCart.mockReturnValue({
      cartItems: [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 },
      ],
    });

    render(<Header categories={[]} />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("abre e fecha o carrinho ao clicar no botão", async () => {
    const user = userEvent.setup();
    render(<Header categories={[]} />);

    const button = screen.getByRole("button", { name: /Abrir carrinho/i });

    await user.click(button);
    expect(screen.getByTestId("cart-open")).toBeInTheDocument();

    await user.click(button);
    expect(screen.queryByTestId("cart-open")).not.toBeInTheDocument();
  });

  it("abre e fecha menu mobile (click + ESC)", async () => {
    const user = userEvent.setup();
    render(<Header categories={[]} />);

    await user.click(screen.getByRole("button", { name: /Abrir menu/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("mostra saudação e chama logout quando autenticado", async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      user: { nome: "Rick", email: "rick@kavita.com.br" },
      logout: mockLogout,
    });

    render(<Header categories={[]} />);

    await user.click(screen.getByRole("button", { name: /Abrir menu/i }));

    expect(await screen.findByText(/Bem-vindo/i)).toBeInTheDocument();
    expect(screen.getByText("Rick")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sair/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renderiza apenas categorias públicas ativas no menu mobile", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Agro", slug: "agro", is_active: 1 },
        { id: 2, name: "Inativas", slug: "off", is_active: 0 },
      ],
    });

    const user = userEvent.setup();
    render(<Header categories={[]} />);

    await user.click(screen.getByRole("button", { name: /Abrir menu/i }));

    const agro = await screen.findByRole("link", { name: "Agro" });
    expect(agro).toHaveAttribute("href", "/categorias/agro");

    expect(
      screen.queryByRole("link", { name: "Inativas" })
    ).not.toBeInTheDocument();
  });
});
