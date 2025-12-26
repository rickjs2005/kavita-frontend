import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminAuthProvider, useAdminAuth, type AdminRole } from "@/context/AdminAuthContext";
import { createMockStorage, mockGlobalFetch, flushMicrotasks } from "@/__tests__/testUtils";

// --------------------
// Mocks (obrigatórios)
// --------------------
const routerReplaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: routerReplaceMock,
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

const handleApiErrorMock = vi.fn();
vi.mock("@/lib/handleApiError", () => ({
  handleApiError: (...args: any[]) => handleApiErrorMock(...args),
}));

// --------------------
// Helpers de UI
// --------------------
function Consumer() {
  const ctx = useAdminAuth();

  return (
    <div>
      <div data-testid="isAdmin">{String(ctx.isAdmin)}</div>
      <div data-testid="role">{ctx.role ?? ""}</div>
      <div data-testid="nome">{ctx.nome ?? ""}</div>
      <div data-testid="permissions">{ctx.permissions.join(",")}</div>

      <div data-testid="can-orders-view">{String(ctx.hasPermission("orders:view"))}</div>
      <div data-testid="hasRole-gerente">{String(ctx.hasRole("gerente"))}</div>
      <div data-testid="hasRole-any">{String(ctx.hasRole(["suporte", "gerente"]))}</div>

      <button
        type="button"
        onClick={() =>
          ctx.markAsAdmin({
            role: "gerente",
            nome: "Rick",
            permissions: ["orders:view", "products:edit"],
          })
        }
      >
        mark
      </button>

      <button type="button" onClick={() => ctx.markAsAdmin(undefined)}>
        mark-empty
      </button>

      <button type="button" onClick={() => ctx.logout()}>
        logout
      </button>

      <button
        type="button"
        onClick={() =>
          ctx.markAsAdmin({
            role: "master",
            nome: "Root",
            permissions: [],
          })
        }
      >
        mark-master
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AdminAuthProvider>
      <Consumer />
    </AdminAuthProvider>
  );
}

describe("AdminAuthContext (AdminAuthProvider + useAdminAuth)", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  let fetchMock: ReturnType<typeof mockGlobalFetch>;
  let localStorageMock: ReturnType<typeof createMockStorage>;
  let sessionStorageMock: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    vi.clearAllMocks();

    // env (pode não afetar se o módulo leu no import-time, mas não atrapalha)
    process.env.NEXT_PUBLIC_API_URL = "http://test-api.local";

    // fetch
    fetchMock = mockGlobalFetch();

    // storage
    localStorageMock = createMockStorage();
    sessionStorageMock = createMockStorage();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock.storage,
      configurable: true,
    });

    Object.defineProperty(window, "sessionStorage", {
      value: sessionStorageMock.storage,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    }
  });

  it("deve lançar erro se useAdminAuth for usado fora do Provider (negativo)", () => {
    function BadConsumer() {
      useAdminAuth();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      "useAdminAuth deve ser usado dentro de AdminAuthProvider"
    );
  });

  it("markAsAdmin(undefined) não deve alterar estado (negativo)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 1,
        nome: "Server",
        email: "server@kavita.com",
        role: "leitura",
        role_id: 1,
        permissions: [],
      }),
    } as any);

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("mark-empty"));

    expect(screen.getByTestId("role").textContent).toBe("leitura");
    expect(screen.getByTestId("nome").textContent).toBe("Server");
  });

  it("markAsAdmin deve setar estado e persistir localStorage (positivo)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 1,
        nome: "Server",
        email: "server@kavita.com",
        role: "leitura",
        role_id: 1,
        permissions: [],
      }),
    } as any);

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("mark"));

    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("role").textContent).toBe("gerente");
    expect(screen.getByTestId("nome").textContent).toBe("Rick");
    expect(screen.getByTestId("permissions").textContent).toContain("orders:view");

    expect(window.localStorage.setItem).toHaveBeenCalledWith("adminRole", "gerente");
    expect(window.localStorage.setItem).toHaveBeenCalledWith("adminNome", "Rick");
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "adminPermissions",
      JSON.stringify(["orders:view", "products:edit"])
    );
  });

  it("hasPermission: role=master deve retornar true para qualquer perm (positivo)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 10,
        nome: "Server",
        email: "server@kavita.com",
        role: "leitura",
        role_id: 1,
        permissions: [],
      }),
    } as any);

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("mark-master"));

    expect(screen.getByTestId("can-orders-view").textContent).toBe("true");
  });

  it("hasPermission: não-master deve depender do array permissions (positivo/negativo)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 2,
        nome: "Server",
        email: "server@kavita.com",
        role: "leitura",
        role_id: 1,
        permissions: [],
      }),
    } as any);

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("mark"));

    expect(screen.getByTestId("can-orders-view").textContent).toBe("true");

    const ctxPermText = screen.getByTestId("permissions").textContent ?? "";
    expect(ctxPermText.includes("does:not:exist")).toBe(false);
  });

  it("hasRole deve funcionar para string e array (positivo/negativo)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 2,
        nome: "Server",
        email: "server@kavita.com",
        role: "leitura",
        role_id: 1,
        permissions: [],
      }),
    } as any);

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("mark"));

    expect(screen.getByTestId("hasRole-gerente").textContent).toBe("true");
    expect(screen.getByTestId("hasRole-any").textContent).toBe("true");
    expect(screen.getByTestId("role").textContent).not.toBe("suporte");
  });

  it("useEffect: deve carregar cache do localStorage (visual) e depois limpar tudo em 401", async () => {
    localStorageMock.setStore({
      adminRole: "gerente",
      adminNome: "CacheNome",
      adminPermissions: JSON.stringify(["orders:view"]),
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as any);

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("role").textContent).toBe("");
    expect(screen.getByTestId("nome").textContent).toBe("");
    expect(screen.getByTestId("permissions").textContent).toBe("");

    expect(window.localStorage.removeItem).toHaveBeenCalledWith("adminRole");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("adminNome");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("adminPermissions");
  });

  it("useEffect: /api/admin/me ok deve marcar admin e persistir (positivo)", async () => {
    const serverRole: AdminRole = "suporte";
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 99,
        nome: "Admin Server",
        email: "admin@kavita.com",
        role: serverRole,
        role_id: 3,
        permissions: ["orders:view"],
      }),
    } as any);

    renderWithProvider();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));

    expect(screen.getByTestId("role").textContent).toBe("suporte");
    expect(screen.getByTestId("nome").textContent).toBe("Admin Server");
    expect(screen.getByTestId("permissions").textContent).toBe("orders:view");

    expect(window.localStorage.setItem).toHaveBeenCalledWith("adminRole", "suporte");
    expect(window.localStorage.setItem).toHaveBeenCalledWith("adminNome", "Admin Server");
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "adminPermissions",
      JSON.stringify(["orders:view"])
    );
  });

  it("useEffect: /api/admin/me não-ok deve chamar handleApiError e não setar admin (negativo)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as any);

    renderWithProvider();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(handleApiErrorMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
  });

  it("useEffect: /api/admin/me throw deve chamar handleApiError (negativo)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network down"));

    renderWithProvider();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(handleApiErrorMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
  });

  it("logout: deve chamar /api/admin/logout, limpar storage, resetar estado e router.replace (positivo)", async () => {
    // /me ok
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 1,
        nome: "Admin",
        email: "admin@kavita.com",
        role: "gerente",
        role_id: 2,
        permissions: ["orders:view"],
      }),
    } as any);

    // /logout ok
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as any);

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));

    // Act
    fireEvent.click(screen.getByText("logout"));

    // Assert (efeitos síncronos do logout)
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("adminRole");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("adminNome");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("adminPermissions");

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("role").textContent).toBe("");
    expect(screen.getByTestId("nome").textContent).toBe("");
    expect(screen.getByTestId("permissions").textContent).toBe("");

    expect(routerReplaceMock).toHaveBeenCalledWith("/admin/login");

    // Efeito assíncrono do fetch logout
    await flushMicrotasks();

    // Em vez de travar o host, valide a chamada correta
    const logoutCall = fetchMock.mock.calls.find(
      (c) => typeof c[0] === "string" && (c[0] as string).endsWith("/api/admin/logout")
    );

    expect(logoutCall, "deveria ter chamado /api/admin/logout").toBeTruthy();
    expect(logoutCall![1]).toEqual({
      method: "POST",
      credentials: "include",
    });
  });

  it("logout: se /logout falhar, deve chamar handleApiError mas ainda limpar e redirecionar (negativo resiliente)", async () => {
    // /me ok
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 1,
        nome: "Admin",
        email: "admin@kavita.com",
        role: "gerente",
        role_id: 2,
        permissions: ["orders:view"],
      }),
    } as any);

    // /logout falha
    fetchMock.mockRejectedValueOnce(new Error("Logout failed"));

    renderWithProvider();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));

    // Act
    fireEvent.click(screen.getByText("logout"));

    // Assert: mesmo com falha, limpa e redireciona
    expect(routerReplaceMock).toHaveBeenCalledWith("/admin/login");
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");

    await waitFor(() => expect(handleApiErrorMock).toHaveBeenCalledTimes(1));
  });
});