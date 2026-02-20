// src/__tests__/components/Header.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ============ Mocks Next ============
const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const SearchBarMock = () => <div data-testid="searchbar" />;
    return SearchBarMock;
  },
}));

// ============ Mocks Contextos ============
const mockUseCart = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// ============ Mocks Componentes Filhos ============
vi.mock("@/components/cart/CartCar", () => ({
  __esModule: true,
  default: ({ isCartOpen }: any) => <div data-testid="cartcar">{String(!!isCartOpen)}</div>,
}));

vi.mock("@/components/ui/UserMenu", () => ({
  __esModule: true,
  default: () => <div data-testid="usermenu" />,
}));

vi.mock("@/components/layout/MainNavCategories", () => ({
  __esModule: true,
  default: ({ categories }: any) => (
    <div data-testid="mainnav">{Array.isArray(categories) ? categories.length : "x"}</div>
  ),
}));

import Header from "@/components/layout/Header";

describe("Header (src/components/layout/Header.tsx)", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };

    mockUsePathname.mockReturnValue("/");
    mockUseCart.mockReturnValue({ cartItems: [] });
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.restoreAllMocks();
  });

  it("não deve renderizar em rotas excluídas (ex: /checkout)", () => {
    mockUsePathname.mockReturnValue("/checkout");
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });

  it("não deve renderizar em rotas /admin/* excluídas (ex: /admin)", () => {
    mockUsePathname.mockReturnValue("/admin");
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });

  it("deve usar logo de drone quando rota começa com /drones", () => {
    mockUsePathname.mockReturnValue("/drones/t100");
    render(<Header shop={{ store_name: "Kavita", logo_url: "/uploads/x.png" } as any} />);

    const img = screen.getByAltText("Kavita") as HTMLImageElement;
    expect(img.src).toContain("/kavita-drone.png");
  });

  it("deve usar shop.logo_url absoluto sem prefixar", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header shop={{ store_name: "Minha Loja", logo_url: "https://cdn.site.com/logo.png" } as any} />);

    const img = screen.getByAltText("Minha Loja") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("https://cdn.site.com/logo.png");
  });

  it("deve prefixar shop.logo_url relativo com NEXT_PUBLIC_API_URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";
    mockUsePathname.mockReturnValue("/");

    render(<Header shop={{ store_name: "Minha Loja", logo_url: "/uploads/logo.png" } as any} />);

    const img = screen.getByAltText("Minha Loja") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("http://localhost:5000/uploads/logo.png");
  });

  it("badge do carrinho: mostra quando cartItems.length > 0 e some quando 0", async () => {
    mockUseCart.mockReturnValue({ cartItems: [{ id: 1 }, { id: 2 }] });

    const { rerender } = render(<Header />);
    expect(screen.getByText("2")).toBeInTheDocument();

    // agora muda mock e rerender (não deixa DOM antigo acumulado)
    mockUseCart.mockReturnValue({ cartItems: [] });
    rerender(<Header />);

    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("menu mobile: abre ao clicar no botão e fecha ao clicar no X", async () => {
    const u = userEvent.setup();
    render(<Header />);

    await u.click(screen.getByLabelText("Abrir menu"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // existem 2 "Fechar menu" (backdrop e botão X)
    const closeButtons = screen.getAllByLabelText("Fechar menu");
    const closeX = closeButtons[1]; // o segundo geralmente é o X dentro do aside
    await u.click(closeX);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menu mobile: fecha com ESC", async () => {
    const u = userEvent.setup();
    render(<Header />);

    await u.click(screen.getByLabelText("Abrir menu"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menu mobile: fecha ao clicar fora (backdrop)", async () => {
    const u = userEvent.setup();
    render(<Header />);

    await u.click(screen.getByLabelText("Abrir menu"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // clica no backdrop (primeiro "Fechar menu")
    const closeButtons = screen.getAllByLabelText("Fechar menu");
    const backdrop = closeButtons[0];
    await u.click(backdrop);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menu mobile: quando NÃO autenticado, mostra link de login", async () => {
    const u = userEvent.setup();
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });

    render(<Header />);

    await u.click(screen.getByLabelText("Abrir menu"));
    expect(screen.getByText(/Faça login/i)).toBeInTheDocument();
    expect(screen.getByText("Login / Meus Pedidos")).toBeInTheDocument();
  });

  it("menu mobile: quando autenticado, mostra saudação e botão Sair que chama logout", async () => {
    const u = userEvent.setup();
    const logout = vi.fn();

    mockUseAuth.mockReturnValue({
      user: { nome: "Rick" },
      logout,
    });

    render(<Header />);

    await u.click(screen.getByLabelText("Abrir menu"));

    expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
    expect(screen.getByText("Rick")).toBeInTheDocument();

    await u.click(screen.getByText("Sair"));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("deve filtrar categorias: só passa ativas para MainNavCategories", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <Header
        categories={[
          { id: 1, name: "A", slug: "a", is_active: 1 },
          { id: 2, name: "B", slug: "b", is_active: 0 },
          { id: 3, name: "C", slug: "c", is_active: true },
          { id: 4, name: "D", slug: "d" }, // undefined => ativa
        ]}
      />
    );

    expect(screen.getByTestId("mainnav").textContent).toBe("3");
  });

  it("ao clicar no botão do carrinho, deve abrir CartCar (isCartOpen=true)", async () => {
    const u = userEvent.setup();
    render(<Header />);

    expect(screen.getByTestId("cartcar").textContent).toBe("false");

    await u.click(screen.getByLabelText("Abrir carrinho"));
    expect(screen.getByTestId("cartcar").textContent).toBe("true");
  });
});