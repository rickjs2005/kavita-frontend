import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Mocks hoisted (estáveis)
 */
const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/admin"),
  redirect: vi.fn(),
  logout: vi.fn(),
  hasPermission: vi.fn<(perm: string) => boolean>(),
}));

/**
 * next/link → <a>
 */
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    onClick,
    className,
    children,
    ...rest
  }: any) => (
    <a href={href} onClick={onClick} className={className} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * next/navigation
 */
vi.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: mocks.usePathname,
  redirect: mocks.redirect,
}));

/**
 * AdminAuthContext
 */
vi.mock("@/context/AdminAuthContext", () => ({
  __esModule: true,
  useAdminAuth: () => ({
    logout: mocks.logout,
    hasPermission: mocks.hasPermission,
  }),
}));

/**
 * IMPORT ESTÁTICO — chave para evitar timeout
 */
import AdminSidebar from "@/components/admin/AdminSidebar";

function setPermissions(perms: string[]) {
  mocks.hasPermission.mockImplementation((perm) => perms.includes(perm));
}

describe("AdminSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usePathname.mockReturnValue("/admin");
    setPermissions([]);
  });

  it("renderiza topo e sempre mostra Dashboard (controle)", () => {
    render(<AdminSidebar />);

    expect(screen.getByText("Kavita")).toBeInTheDocument();
    expect(screen.getByText("Painel Admin")).toBeInTheDocument();

    const dashboard = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/admin");
  });

  it("não renderiza 'Produtos' sem permissão (negativo)", () => {
    setPermissions([]);

    render(<AdminSidebar />);

    expect(
      screen.queryByRole("link", { name: /Produtos/i })
    ).not.toBeInTheDocument();
  });

  it("renderiza itens permitidos quando hasPermission retorna true (positivo)", () => {
    setPermissions([
      "products_manage",
      "orders_view",
      "settings_manage",
      "reports_view",
      "admins_manage",
      "logs_view",
      "services_manage",
      "customers_view",
      "carts_view",
      "coupons_manage",
      "highlights_manage",
      "roles_permissions_manage",
    ]);

    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: /Produtos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pedidos/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Configurações/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Relatórios/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Equipe/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Logs/i })).toBeInTheDocument();
  });

  it("aplica classe active quando pathname é exatamente o href", () => {
    mocks.usePathname.mockReturnValue("/admin/produtos");
    setPermissions(["products_manage"]);

    render(<AdminSidebar />);

    const produtos = screen.getByRole("link", { name: /Produtos/i });
    expect(produtos.className).toContain("bg-emerald-500/15");
    expect(produtos.className).toContain("ring-1");
  });

  it("aplica classe active quando pathname começa com href (subrota)", () => {
    mocks.usePathname.mockReturnValue("/admin/produtos/123");
    setPermissions(["products_manage"]);

    render(<AdminSidebar />);

    const produtos = screen.getByRole("link", { name: /Produtos/i });
    expect(produtos.className).toContain("bg-emerald-500/15");
  });

  it("chama onNavigate ao clicar em item", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    setPermissions(["products_manage"]);

    render(<AdminSidebar onNavigate={onNavigate} />);

    await user.click(screen.getByRole("link", { name: /Produtos/i }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("renderiza botão Sair e chama logout", async () => {
    const user = userEvent.setup();

    render(<AdminSidebar />);

    await user.click(screen.getByRole("button", { name: /Sair/i }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  it("não renderiza logout quando hideLogoutButton=true", () => {
    render(<AdminSidebar hideLogoutButton />);

    expect(
      screen.queryByRole("button", { name: /Sair/i })
    ).not.toBeInTheDocument();
  });

  it("concatena className no container raiz", () => {
    const { container } = render(
      <AdminSidebar className="test-extra-class" />
    );

    expect(container.firstElementChild?.className).toContain(
      "test-extra-class"
    );
  });
});
