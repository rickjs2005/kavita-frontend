import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Mocks hoisted (não sofrem TDZ e ficam acessíveis em qualquer factory de vi.mock)
 */
const mocks = vi.hoisted(() => {
  return {
    usePathname: vi.fn(() => "/admin"),
    redirect: vi.fn(),
    logout: vi.fn(),
    hasPermission: vi.fn<(perm: string) => boolean>(),
  };
});

/**
 * next/link -> renderiza <a> para testes
 */
vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({
      href,
      onClick,
      className,
      children,
      ...rest
    }: {
      href: string;
      onClick?: () => void;
      className?: string;
      children: React.ReactNode;
    }) => (
      <a href={href} onClick={onClick} className={className} {...rest}>
        {children}
      </a>
    ),
  };
});

/**
 * next/navigation (mock estável)
 */
vi.mock("next/navigation", () => {
  return {
    __esModule: true,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: mocks.usePathname,
    redirect: mocks.redirect,
  };
});

/**
 * AdminAuthContext
 */
vi.mock("@/context/AdminAuthContext", () => {
  return {
    __esModule: true,
    useAdminAuth: () => ({
      logout: mocks.logout,
      hasPermission: mocks.hasPermission,
    }),
  };
});

function setPermissions(allowed: Set<string>) {
  mocks.hasPermission.mockImplementation((perm) => allowed.has(perm));
}

async function loadComponent() {
  // Garante que o módulo do componente é avaliado DEPOIS dos mocks
  const mod = await import("@/components/admin/AdminSidebar");
  return mod.default;
}

describe("AdminSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usePathname.mockReturnValue("/admin");
    setPermissions(new Set());
  });

  it("renderiza o topo e sempre mostra o link 'Dashboard' mesmo sem permissões (positivo/controle)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();
    mocks.usePathname.mockReturnValue("/admin");
    setPermissions(new Set());

    // Act
    render(<AdminSidebar />);

    // Assert
    expect(screen.getByText("Kavita")).toBeInTheDocument();
    expect(screen.getByText("Painel Admin")).toBeInTheDocument();

    const dashboard = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboard).toHaveAttribute("href", "/admin");
  });

  it("filtra itens por permissão: não renderiza 'Produtos' quando não tem permission (negativo)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();
    setPermissions(new Set()); // sem products_manage

    // Act
    render(<AdminSidebar />);

    // Assert
    expect(screen.queryByRole("link", { name: /Produtos/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
  });

  it("renderiza itens permitidos quando hasPermission retorna true (positivo)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();
    setPermissions(
      new Set([
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
      ])
    );

    // Act
    render(<AdminSidebar />);

    // Assert
    expect(screen.getByRole("link", { name: /Produtos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Relatórios/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Equipe/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Logs/i })).toBeInTheDocument();
  });

  it("aplica classe 'active' quando pathname é exatamente o href (positivo)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();
    mocks.usePathname.mockReturnValue("/admin/produtos");
    setPermissions(new Set(["products_manage"]));

    // Act
    render(<AdminSidebar />);

    // Assert
    const produtos = screen.getByRole("link", { name: /Produtos/i });
    expect(produtos.className).toContain("bg-emerald-500/15");
    expect(produtos.className).toContain("ring-1");

    const dashboard = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboard.className).not.toContain("bg-emerald-500/15");
  });

  it("aplica classe 'active' quando pathname começa com href (subrota) (positivo)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();
    mocks.usePathname.mockReturnValue("/admin/produtos/123");
    setPermissions(new Set(["products_manage"]));

    // Act
    render(<AdminSidebar />);

    // Assert
    const produtos = screen.getByRole("link", { name: /Produtos/i });
    expect(produtos.className).toContain("bg-emerald-500/15");
    expect(produtos.className).toContain("ring-1");
  });

  it("chama onNavigate ao clicar em um item de navegação (positivo)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    setPermissions(new Set(["products_manage"]));

    render(<AdminSidebar onNavigate={onNavigate} />);

    // Act
    await user.click(screen.getByRole("link", { name: /Produtos/i }));

    // Assert
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("renderiza botão de logout por padrão e chama logout ao clicar (positivo)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();
    const user = userEvent.setup();

    render(<AdminSidebar />);

    // Act
    await user.click(screen.getByRole("button", { name: /Sair/i }));

    // Assert
    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  it("não renderiza botão de logout quando hideLogoutButton=true (negativo)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();

    // Act
    render(<AdminSidebar hideLogoutButton />);

    // Assert
    expect(screen.queryByRole("button", { name: /Sair/i })).not.toBeInTheDocument();
  });

  it("concatena className no container raiz (positivo/controle)", async () => {
    // Arrange
    const AdminSidebar = await loadComponent();

    // Act
    const { container } = render(<AdminSidebar className="test-extra-class" />);
    const root = container.firstElementChild;

    // Assert
    expect(root).toBeTruthy();
    expect(root?.className).toContain("test-extra-class");
  });
});
