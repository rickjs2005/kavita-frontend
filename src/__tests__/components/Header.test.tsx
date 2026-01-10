import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Header from "@/components/layout/Header";
import type { PublicShopSettings } from "@/server/data/shopSettings";

// --------------------
// Mocks (Next + UI)
// --------------------

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  // se algum dia usar router/redirect aqui, já fica padronizado
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

// next/image vira <img> para facilitar assert de src/alt
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={String(src)} alt={String(alt)} {...props} />
  ),
}));

// next/dynamic: retorna componente stub imediatamente (evita SSR=false e lazy)
vi.mock("next/dynamic", () => ({
  default: () => {
    const Dynamic = () => <div data-testid="searchbar">SearchBar</div>;
    return Dynamic;
  },
}));

// Componentes internos do Header: mock simples e estável
const mainNavSpy = vi.fn();

vi.mock("@/components/layout/MainNavCategories", () => ({
  default: ({ categories }: any) => {
    mainNavSpy(categories);
    return (
      <nav aria-label="MainNavCategories" data-testid="main-nav">
        {Array.isArray(categories) ? categories.length : 0}
      </nav>
    );
  },
}));

vi.mock("@/components/ui/UserMenu", () => ({
  default: () => <div data-testid="user-menu">UserMenu</div>,
}));

vi.mock("@/components/cart/CartCar", () => ({
  default: ({ isCartOpen }: any) => (
    <div data-testid="cartcar" data-open={isCartOpen ? "1" : "0"}>
      CartCar
    </div>
  ),
}));

// Contexts
const useCartMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/context/CartContext", () => ({
  useCart: () => useCartMock(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

// --------------------
// Helpers
// --------------------

type AnyShop = PublicShopSettings;

function setPathname(path: string) {
  mockPathname = path;
}

function makeShop(overrides: Partial<AnyShop> = {}): AnyShop {
  // Mantém só o mínimo necessário; cast proposital para evitar
  // acoplamento do teste a campos que não são relevantes aqui.
  return {
    store_name: "Kavita",
    logo_url: "/uploads/logo.png",
    ...overrides,
  } as AnyShop;
}

function renderHeader(opts?: {
  categories?: any[];
  shop?: AnyShop;
  cartItems?: any[];
  user?: any;
  logout?: ReturnType<typeof vi.fn>;
}) {
  const logout = opts?.logout ?? vi.fn();

  useCartMock.mockReturnValue({
    cartItems: opts?.cartItems ?? [],
  });

  useAuthMock.mockReturnValue({
    user: opts?.user ?? null,
    logout,
  });

  const view = render(
    <Header categories={opts?.categories} shop={opts?.shop} />
  );

  return { ...view, logout };
}

describe("Header (src/components/layout/Header.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mainNavSpy.mockClear();
    setPathname("/");

    // define base URL para testes do logo relativo
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    // body overflow baseline
    document.body.style.overflow = "";
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("não renderiza nada em rotas excluídas (ex: /checkout) (negativo)", () => {
    // Arrange
    setPathname("/checkout");

    // Act
    const { container } = renderHeader();

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("renderiza o logo padrão quando shop.logo_url está vazio e não é /drones (positivo)", () => {
    // Arrange
    setPathname("/");

    // Act
    renderHeader({
      shop: makeShop({ logo_url: "   ", store_name: "Minha Loja" }),
    });

    // Assert
    const logo = screen.getByRole("img", { name: "Minha Loja" });
    expect(logo).toHaveAttribute("src", "/images/kavita2.png");
  });

  it("usa logo de drone quando rota começa com /drones (positivo)", () => {
    // Arrange
    setPathname("/drones/qualquer");

    // Act
    renderHeader({
      shop: makeShop({ logo_url: "/uploads/custom.png", store_name: "Kavita" }),
    });

    // Assert
    const logo = screen.getByRole("img", { name: "Kavita" });
    expect(logo).toHaveAttribute("src", "/images/drone/kavita-drone.png");
  });

  it("resolve logo relativo com NEXT_PUBLIC_API_URL (positivo)", () => {
    // Arrange
    setPathname("/");

    // Act
    renderHeader({
      shop: makeShop({ logo_url: "/uploads/logo-novo.png", store_name: "Loja X" }),
    });

    // Assert
    const logo = screen.getByRole("img", { name: "Loja X" });
    expect(logo).toHaveAttribute("src", "http://api.test/uploads/logo-novo.png");
  });

  it("não prefixa quando logo_url já é absoluto (http) (positivo)", () => {
    // Arrange
    setPathname("/");

    // Act
    renderHeader({
      shop: makeShop({
        logo_url: "https://cdn.exemplo.com/logo.png",
        store_name: "Loja CDN",
      }),
    });

    // Assert
    const logo = screen.getByRole("img", { name: "Loja CDN" });
    expect(logo).toHaveAttribute("src", "https://cdn.exemplo.com/logo.png");
  });

  it("mostra badge com quantidade do carrinho quando cartItems.length > 0 (positivo) e não mostra quando 0 (negativo)", () => {
    // Arrange
    setPathname("/");

    // Act (positivo)
    const { rerender } = renderHeader({
      cartItems: [{ id: 1 }, { id: 2 }, { id: 3 }],
      shop: makeShop(),
    });

    // Assert (positivo)
    expect(screen.getByText("3")).toBeInTheDocument();

    // Act (negativo) - rerender com cart vazio
    useCartMock.mockReturnValue({ cartItems: [] });
    useAuthMock.mockReturnValue({ user: null, logout: vi.fn() });

    rerender(<Header categories={[]} shop={makeShop()} />);

    // Assert (negativo)
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("filtra categories: só passa categorias ativas para MainNavCategories (positivo + negativo)", () => {
    // Arrange
    setPathname("/");

    const categories = [
      { id: 1, name: "Ativa bool", slug: "ativa-bool", is_active: true },
      { id: 2, name: "Inativa bool", slug: "inativa-bool", is_active: false },
      { id: 3, name: "Ativa num", slug: "ativa-num", is_active: 1 },
      { id: 4, name: "Inativa num", slug: "inativa-num", is_active: 0 },
      { id: 5, name: "Sem flag", slug: "sem-flag" }, // por regra: ativa
    ];

    // Act
    renderHeader({ categories, shop: makeShop() });

    // Assert
    expect(mainNavSpy).toHaveBeenCalledTimes(1);
    const passed = mainNavSpy.mock.calls[0][0];
    const slugs = passed.map((c: any) => c.slug);

    expect(slugs).toEqual(["ativa-bool", "ativa-num", "sem-flag"]);
    expect(slugs).not.toContain("inativa-bool");
    expect(slugs).not.toContain("inativa-num");
  });

  it("menu mobile: abre ao clicar, trava scroll, fecha com ESC (positivo)", () => {
    // Arrange
    setPathname("/");

    // Act
    renderHeader({ shop: makeShop() });

    const openBtn = screen.getByRole("button", { name: "Abrir menu" });
    fireEvent.click(openBtn);

    // Assert (aberto e overflow travado)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Act (ESC)
    fireEvent.keyDown(document, { key: "Escape" });

    // Assert (fechado e overflow reset)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("menu mobile: quando autenticado, mostra saudação e botão Sair que chama logout (positivo)", () => {
    // Arrange
    setPathname("/");

    // Act
    const { logout } = renderHeader({
      shop: makeShop(),
      user: { nome: "Rick" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));

    // Assert
    expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
    expect(screen.getByText("Rick")).toBeInTheDocument();

    const sair = screen.getByRole("button", { name: "Sair" });
    fireEvent.click(sair);

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("menu mobile: quando não autenticado, mostra link de login e o texto de acompanhamento (negativo/positivo)", () => {
    // Arrange
    setPathname("/");

    // Act
    renderHeader({ shop: makeShop(), user: null });
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));

    // Assert
    expect(screen.getByText(/Faça login/i)).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: /Faça login/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
