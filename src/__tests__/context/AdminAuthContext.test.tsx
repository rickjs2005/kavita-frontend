// src/__tests__/context/AdminAuthContext.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ Mocks dos módulos importados pelo contexto (usando os mesmos aliases do seu código)
vi.mock("@/lib/apiClient", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/handleApiError", () => ({
  handleApiError: vi.fn(),
}));

vi.mock("@/lib/errors", () => ({
  isApiError: vi.fn(),
}));

import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/handleApiError";
import { isApiError } from "@/lib/errors";

import { AdminAuthProvider, useAdminAuth, type AdminUser } from "@/context/AdminAuthContext";

type MockFn = ReturnType<typeof vi.fn>;

function Harness() {
  const ctx = useAdminAuth();

  return (
    <div>
      <div data-testid="loading">{String(ctx.loading)}</div>

      <div data-testid="isAdmin">{String(ctx.isAdmin)}</div>
      <div data-testid="role">{ctx.role ?? ""}</div>
      <div data-testid="nome">{ctx.nome ?? ""}</div>

      <div data-testid="perm-count">{String(ctx.permissions.length)}</div>

      <div data-testid="hasPerm-x">{String(ctx.hasPermission("x"))}</div>
      <div data-testid="hasRole-master">{String(ctx.hasRole("master"))}</div>
      <div data-testid="hasRole-any">{String(ctx.hasRole(["suporte", "gerente"]))}</div>

      <button
        type="button"
        onClick={() =>
          ctx.markAsAdmin({
            user: { id: 1, nome: "Rick", email: "r@k.com", role: "master", role_id: null },
            permissions: ["x", "y"],
          })
        }
      >
        mark
      </button>

      <button type="button" onClick={() => ctx.markAsAdmin(undefined)}>
        mark-empty
      </button>

      <button type="button" onClick={() => ctx.loadSession({ silent: true })}>
        load-silent
      </button>

      <button type="button" onClick={() => ctx.loadSession({ silent: false })}>
        load-loud
      </button>

      <button type="button" onClick={() => ctx.logout()}>
        logout
      </button>

      <button type="button" onClick={() => ctx.logout({ redirectTo: "/admin/login" })}>
        logout-redirect
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AdminAuthProvider>
      <Harness />
    </AdminAuthProvider>
  );
}

function makeAdminMeResponse(overrides?: Partial<AdminUser> & { permissions?: string[] }) {
  return {
    id: overrides?.id ?? 10,
    nome: overrides?.nome ?? "Admin",
    email: overrides?.email ?? "admin@k.com",
    role: overrides?.role ?? "gerente",
    role_id: overrides?.role_id ?? 2,
    permissions: overrides?.permissions ?? ["x"],
  };
}

describe("context/AdminAuthContext", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    // mock window.location.assign (jsdom)
    // @ts-expect-error - override for test
    delete window.location;
    // @ts-expect-error - override for test
    window.location = { ...originalLocation, assign: vi.fn() };

    // defaults
    (apiClient.get as unknown as MockFn).mockReset();
    (apiClient.post as unknown as MockFn).mockReset();
    (handleApiError as unknown as MockFn).mockReset();
    (isApiError as unknown as MockFn).mockReset();
  });

  afterEach(() => {
    // @ts-expect-error - restore
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  it("useAdminAuth fora do provider deve lançar erro", () => {
    function Bad() {
      useAdminAuth();
      return null;
    }

    expect(() => render(<Bad />)).toThrow("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  });

  it("estado inicial: loading=true, isAdmin=false", () => {
    renderWithProvider();
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("perm-count").textContent).toBe("0");
  });

  it("markAsAdmin deve setar user e permissions; master => hasPermission sempre true", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    await u.click(screen.getByText("mark"));

    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("role").textContent).toBe("master");
    expect(screen.getByTestId("nome").textContent).toBe("Rick");
    expect(screen.getByTestId("perm-count").textContent).toBe("2");

    // master => sempre true
    expect(screen.getByTestId("hasPerm-x").textContent).toBe("true");
    expect(screen.getByTestId("hasRole-master").textContent).toBe("true");
    expect(screen.getByTestId("hasRole-any").textContent).toBe("false");
  });

  it("markAsAdmin(undefined) não deve alterar estado", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    await u.click(screen.getByText("mark-empty"));

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("perm-count").textContent).toBe("0");
  });

  it("hasPermission deve depender do array permissions quando role != master", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    // marca como gerente e permissions ["x"]
    await act(async () => {
      const ctxBtn = screen.getByText("mark");
      // reaproveita botão, mas vamos trocar pra gerente via loadSession (mais real)
      // aqui só garantimos que o master não atrapalhe, então vamos chamar loadSession sucesso
    });

    (apiClient.get as unknown as MockFn).mockResolvedValueOnce(makeAdminMeResponse({ role: "gerente", permissions: ["x"] }));
    await u.click(screen.getByText("load-silent"));

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("role").textContent).toBe("gerente");
    expect(screen.getByTestId("hasPerm-x").textContent).toBe("true"); // perm x existe
  });

  it("loadSession sucesso deve chamar GET /api/admin/me e setar adminUser/permissions", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    (apiClient.get as unknown as MockFn).mockResolvedValueOnce(makeAdminMeResponse({ nome: "João", permissions: ["a", "b"] }));

    await u.click(screen.getByText("load-silent"));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/me");

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(screen.getByTestId("nome").textContent).toBe("João");
    expect(screen.getByTestId("perm-count").textContent).toBe("2");
  });

  it("loadSession deve deduplicar chamadas simultâneas (race control): 2 cliques => 1 GET", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    let resolve!: (v: any) => void;
    const pending = new Promise((r) => (resolve = r));

    (apiClient.get as unknown as MockFn).mockReturnValue(pending);

    // dispara duas vezes antes de resolver
    await u.click(screen.getByText("load-silent"));
    await u.click(screen.getByText("load-silent"));

    expect(apiClient.get).toHaveBeenCalledTimes(1);

    resolve(makeAdminMeResponse({ permissions: ["x"] }));

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
  });

  it("loadSession: 401/403 (ApiError) deve limpar state e NÃO chamar handleApiError mesmo silent=false", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    // primeiro entra admin (pra provar que limpa)
    (apiClient.get as unknown as MockFn).mockResolvedValueOnce(makeAdminMeResponse({ nome: "Admin", permissions: ["x"] }));
    await u.click(screen.getByText("load-silent"));
    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));

    // agora 401
    const err401 = { status: 401 };
    (isApiError as unknown as MockFn).mockReturnValue(true);
    (apiClient.get as unknown as MockFn).mockRejectedValueOnce(err401);

    await u.click(screen.getByText("load-loud"));

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(screen.getByTestId("perm-count").textContent).toBe("0");
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("loadSession: erro inesperado deve limpar state e chamar handleApiError quando silent=false", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    const err = new Error("boom");
    (isApiError as unknown as MockFn).mockReturnValue(false);
    (apiClient.get as unknown as MockFn).mockRejectedValueOnce(err);

    await u.click(screen.getByText("load-loud"));

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
    expect(handleApiError).toHaveBeenCalledTimes(1);
    expect(handleApiError).toHaveBeenCalledWith(err, {
      fallback: "Erro ao validar sessão do administrador.",
      // debug: true,
    });
  });

  it("loadSession: erro inesperado NÃO deve chamar handleApiError quando silent=true (default)", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    const err = new Error("boom");
    (isApiError as unknown as MockFn).mockReturnValue(false);
    (apiClient.get as unknown as MockFn).mockRejectedValueOnce(err);

    await u.click(screen.getByText("load-silent"));

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("logout: deve chamar POST /api/admin/logout e sempre limpar state", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    // entra admin
    (apiClient.get as unknown as MockFn).mockResolvedValueOnce(makeAdminMeResponse({ nome: "Admin", permissions: ["x"] }));
    await u.click(screen.getByText("load-silent"));
    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));

    (apiClient.post as unknown as MockFn).mockResolvedValueOnce({ ok: true });

    await u.click(screen.getByText("logout"));

    expect(apiClient.post).toHaveBeenCalledWith("/api/admin/logout");

    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("false"));
    expect(screen.getByTestId("perm-count").textContent).toBe("0");
  });

  it("logout: se POST falhar, deve chamar handleApiError e ainda limpar state", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    // entra admin
    (apiClient.get as unknown as MockFn).mockResolvedValueOnce(makeAdminMeResponse({ nome: "Admin", permissions: ["x"] }));
    await u.click(screen.getByText("load-silent"));
    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("true"));

    const err = new Error("logout fail");
    (apiClient.post as unknown as MockFn).mockRejectedValueOnce(err);

    await u.click(screen.getByText("logout"));

    expect(handleApiError).toHaveBeenCalledTimes(1);
    expect(handleApiError).toHaveBeenCalledWith(err, {
      fallback: "Falha ao encerrar sessão de administrador.",
    });

    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("false"));
  });

  it("logout({redirectTo}) deve redirecionar via window.location.assign", async () => {
    renderWithProvider();
    const u = userEvent.setup();

    (apiClient.post as unknown as MockFn).mockResolvedValueOnce({ ok: true });

    await u.click(screen.getByText("logout-redirect"));

    expect(window.location.assign).toHaveBeenCalledWith("/admin/login");
  });
});