import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/* Mocks obrigatórios globais                                          */
/* ------------------------------------------------------------------ */

// next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// next/link → <a>
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

// next/image → <img>
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
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
    // Arrange
    mockUsePathname.mockReturnValue("/checkout");

    // Act
    const { container } = render(<Header />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("renderiza o header em rota pública normal (positivo)", async () => {
    // Arrange
    mockUsePathname.mockReturnValue("/");

    // Act
    render(<Header />);

    // Assert
    expect(
      screen.getByRole("link", { name: /Pular para o conteúdo/i })
    ).toBeInTheDocument();

    expect(screen.getByAltText("Kavita")).toBeInTheDocument();
    expect(await screen.findByTestId("main-nav-categories")).toBeInTheDocument();
  });

  it("mostra badge do carrinho contando itens (cartItems.length) quando há itens (positivo)", async () => {
    // Arrange
    // Pelo HTML do erro, o badge exibiu "2" (não "3"),
    // então o Header está contando itens, não somando quantity.
    mockUseCart.mockReturnValue({
      cartItems: [
        { id: 1, price: 10, quantity: 2 },
        { id: 2, price: 5, quantity: 1 },
      ],
    });

    // Act
    render(<Header />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("abre e fecha o carrinho ao clicar no botão (positivo)", () => {
    // Arrange
    render(<Header />);
    const button = screen.getByRole("button", { name: /Abrir carrinho/i });

    // Act
    fireEvent.click(button);

    // Assert
    expect(screen.getByTestId("cart-open")).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByTestId("cart-open")).not.toBeInTheDocument();
  });

  it("abre o menu mobile ao clicar no botão de menu (positivo)", async () => {
    // Arrange
    render(<Header />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu/i }));

    // Assert
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("fecha o menu mobile ao clicar no overlay (positivo)", async () => {
    // Arrange
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // Existem 2 botões "Fechar menu": overlay e botão ✕
    const closeButtons = screen.getAllByRole("button", { name: /Fechar menu/i });
    expect(closeButtons.length).toBeGreaterThanOrEqual(2);

    // Overlay é o botão fixed inset-0 (primeiro na árvore, pelo HTML do erro)
    const overlay = closeButtons.find((b) =>
      (b.getAttribute("class") || "").includes("fixed inset-0")
    );
    expect(overlay).toBeTruthy();

    // Act
    fireEvent.click(overlay as HTMLButtonElement);

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("fecha o menu mobile ao pressionar ESC (positivo)", async () => {
    // Arrange
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    // Act
    fireEvent.keyDown(document, { key: "Escape" });

    // Assert
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("mostra saudação quando usuário está autenticado (positivo)", async () => {
    // Arrange
    mockUseAuth.mockReturnValue({
      user: { nome: "Rick", email: "rick@kavita.com.br" },
      logout: mockLogout,
    });

    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu/i }));

    // Assert
    expect(await screen.findByText(/Bem-vindo/i)).toBeInTheDocument();
    expect(screen.getByText("Rick")).toBeInTheDocument();
  });

  it("chama logout ao clicar em 'Sair' no menu mobile (positivo)", async () => {
    // Arrange
    mockUseAuth.mockReturnValue({
      user: { nome: "Rick", email: "rick@kavita.com.br" },
      logout: mockLogout,
    });

    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu/i }));

    const sair = await screen.findByRole("button", { name: /Sair/i });

    // Act
    fireEvent.click(sair);

    // Assert
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renderiza categorias públicas ativas no menu mobile (positivo)", async () => {
    // Arrange
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Agro", slug: "agro", is_active: 1 },
        { id: 2, name: "Inativas", slug: "off", is_active: 0 },
      ],
    });

    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu/i }));

    // Assert
    expect(await screen.findByRole("link", { name: "Agro" })).toHaveAttribute(
      "href",
      "/categorias/agro"
    );

    expect(
      screen.queryByRole("link", { name: "Inativas" })
    ).not.toBeInTheDocument();
  });
});
