import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAdminRouteGuard } from "@/hooks/useAdminRouteGuard";

/**
 * React 18/19 + StrictMode pode montar/desmontar e reexecutar effects 2x em dev/test.
 * Portanto, evite asserts de contagem exata (toHaveBeenCalledTimes(1)) para effects.
 */

const hoisted = vi.hoisted(() => {
  return {
    replace: vi.fn(),
    useAdminAuth: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: hoisted.replace,
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

vi.mock("@/context/AdminAuthContext", () => ({
  useAdminAuth: hoisted.useAdminAuth,
  AdminRole: {},
}));

function expectCalledWithAtLeastOnce<T extends any[]>(
  spy: ReturnType<typeof vi.fn>,
  ...args: T
) {
  const calls = spy.mock.calls;
  const found = calls.some((c) => JSON.stringify(c) === JSON.stringify(args));
  expect(found).toBe(true);
}

describe("useAdminRouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hoisted.hasPermission.mockReset();
    hoisted.hasRole.mockReset();

    // defaults seguros
    hoisted.hasPermission.mockReturnValue(true);
    hoisted.hasRole.mockReturnValue(true);

    hoisted.useAdminAuth.mockReturnValue({
      isAdmin: true,
      hasPermission: hoisted.hasPermission,
      hasRole: hoisted.hasRole,
    });
  });

  it("deve redirecionar e negar acesso quando não é admin", async () => {
    // Arrange
    hoisted.useAdminAuth.mockReturnValue({
      isAdmin: false,
      hasPermission: hoisted.hasPermission,
      hasRole: hoisted.hasRole,
    });

    // Act
    const { result } = renderHook(() => useAdminRouteGuard({}));

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(false);

    expectCalledWithAtLeastOnce(hoisted.replace, "/admin");

    expect(hoisted.hasPermission).not.toHaveBeenCalled();
    expect(hoisted.hasRole).not.toHaveBeenCalled();
  });

  it("deve permitir acesso quando é admin e não há regras (permission/roles)", async () => {
    // Act
    const { result } = renderHook(() => useAdminRouteGuard({}));

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(true);

    expect(hoisted.replace).not.toHaveBeenCalled();
    expect(hoisted.hasPermission).not.toHaveBeenCalled();
    expect(hoisted.hasRole).not.toHaveBeenCalled();
  });

  it("deve permitir quando permission (string) é satisfeita", async () => {
    // Arrange
    hoisted.hasPermission.mockReturnValue(true);

    // Act
    const { result } = renderHook(() =>
      useAdminRouteGuard({ permission: "posts_manage" })
    );

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(true);

    expectCalledWithAtLeastOnce(hoisted.hasPermission, "posts_manage");
    expect(hoisted.replace).not.toHaveBeenCalled();
  });

  it("deve negar e redirecionar quando permission (string) falha", async () => {
    // Arrange
    hoisted.hasPermission.mockReturnValue(false);

    // Act
    const { result } = renderHook(() =>
      useAdminRouteGuard({ permission: "posts_manage" })
    );

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(false);

    expectCalledWithAtLeastOnce(hoisted.hasPermission, "posts_manage");
    expectCalledWithAtLeastOnce(hoisted.replace, "/admin");

    expect(hoisted.hasRole).not.toHaveBeenCalled();
  });

  it("deve exigir TODAS as permissões quando permission é array (short-circuit na primeira falha)", async () => {
    // Arrange
    // Falha em "b" => deve checar "a" e "b" e pode NÃO checar "c" (short-circuit)
    hoisted.hasPermission.mockImplementation((p: string) => p !== "b");

    // Act
    const { result } = renderHook(() =>
      useAdminRouteGuard({ permission: ["a", "b", "c"] })
    );

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(false);

    expectCalledWithAtLeastOnce(hoisted.hasPermission, "a");
    expectCalledWithAtLeastOnce(hoisted.hasPermission, "b");

    // "c" não é obrigatório (no seu hook, não chega a avaliar após falhar)
    // Se quiser travar que NÃO checa "c", use:
    // expect(hoisted.hasPermission.mock.calls.some((c) => c[0] === "c")).toBe(false);

    expectCalledWithAtLeastOnce(hoisted.replace, "/admin");
    expect(hoisted.hasRole).not.toHaveBeenCalled();
  });

  it("deve permitir quando roles é satisfeita", async () => {
    // Arrange
    hoisted.hasRole.mockReturnValue(true);

    // Act
    const { result } = renderHook(() =>
      useAdminRouteGuard({ roles: "admin" as any })
    );

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(true);

    expectCalledWithAtLeastOnce(hoisted.hasRole, "admin");
    expect(hoisted.replace).not.toHaveBeenCalled();
  });

  it("deve negar e redirecionar quando roles falha", async () => {
    // Arrange
    hoisted.hasRole.mockReturnValue(false);

    // Act
    const { result } = renderHook(() =>
      useAdminRouteGuard({ roles: ["admin", "manager"] as any })
    );

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(false);

    expectCalledWithAtLeastOnce(hoisted.hasRole, ["admin", "manager"]);
    expectCalledWithAtLeastOnce(hoisted.replace, "/admin");
  });

  it("deve respeitar redirectTo customizado quando negar acesso", async () => {
    // Arrange
    hoisted.hasPermission.mockReturnValue(false);

    // Act
    const { result } = renderHook(() =>
      useAdminRouteGuard({
        permission: "cats_manage",
        redirectTo: "/admin/login",
      })
    );

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(false);

    expectCalledWithAtLeastOnce(hoisted.hasPermission, "cats_manage");
    expectCalledWithAtLeastOnce(hoisted.replace, "/admin/login");
  });

  it("deve checar permission e role e permitir quando ambos passam", async () => {
    // Arrange
    hoisted.hasPermission.mockReturnValue(true);
    hoisted.hasRole.mockReturnValue(true);

    // Act
    const { result } = renderHook(() =>
      useAdminRouteGuard({
        permission: ["a", "b"],
        roles: ["admin"] as any,
      })
    );

    // Assert
    await waitFor(() => expect(result.current.checking).toBe(false));
    expect(result.current.allowed).toBe(true);

    expect(hoisted.replace).not.toHaveBeenCalled();

    expectCalledWithAtLeastOnce(hoisted.hasPermission, "a");
    expectCalledWithAtLeastOnce(hoisted.hasPermission, "b");
    expectCalledWithAtLeastOnce(hoisted.hasRole, ["admin"]);
  });
});
