import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCotacoesAdmin } from "@/hooks/useCotacoesAdmin";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function mockFetchOnce(status: number, json: any, ok?: boolean) {
  (globalThis.fetch as any).mockImplementationOnce(async () => ({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    async json() {
      return json;
    },
  }));
}

function findCall(predicate: (url: string, init?: RequestInit) => boolean) {
  const calls = (globalThis.fetch as any).mock.calls as any[];
  return calls.find((c) => predicate(String(c[0]), c[1]));
}

function countCalls(predicate: (url: string, init?: RequestInit) => boolean) {
  const calls = (globalThis.fetch as any).mock.calls as any[];
  return calls.filter((c) => predicate(String(c[0]), c[1])).length;
}

describe("useCotacoesAdmin", () => {
  const apiBase = "http://localhost:3000";
  const authOptions = {
    headers: { Authorization: "Bearer token" },
    credentials: "include" as RequestCredentials,
  };
  const onUnauthorized = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as any) = vi.fn();
    onUnauthorized.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar cotações no mount", async () => {
    // Arrange
    const rows = [
      { id: 2, name: "Soja", slug: "soja", type: "CEPEA", ativo: 1 },
      { id: 1, name: "Milho", slug: "milho", type: "CEPEA", ativo: 1 },
    ];
    mockFetchOnce(200, { ok: true, data: rows, meta: { allowed_slugs: ["soja", "milho"] } });

    // Act
    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );

    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.errorMsg).toBeNull();

    const getCall = findCall(
      (url, init) =>
        url === `${apiBase}/api/admin/news/cotacoes` &&
        (init?.method ?? "GET") === "GET"
    );
    expect(getCall).toBeTruthy();
  });

  it("load: erro não-401/403 deve setar errorMsg", async () => {
    // Arrange
    mockFetchOnce(500, { message: "Erro interno" }, false);

    // Act
    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );

    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.errorMsg).toBe("Erro interno");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("load: 401/403 deve chamar onUnauthorized e setar errorMsg (ex.: 'Não autorizado.')", async () => {
    // Arrange
    mockFetchOnce(401, { message: "Não autorizado." }, false);

    // Act
    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );

    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(onUnauthorized).toHaveBeenCalled();
    expect(result.current.errorMsg).toBe("Não autorizado.");
  });

  it("submit(create): deve POSTar payload (name/slug/type) e recarregar lista", async () => {
    // Arrange – mount
    mockFetchOnce(200, { ok: true, data: [] });

    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    // limpar GET do mount
    (globalThis.fetch as any).mockClear();

    // preencher campos obrigatórios do hook: name, slug, type
    act(() => {
      result.current.setForm((prev: any) => ({
        ...prev,
        name: "Soja",
        slug: "soja",
        type: "CEPEA",
        price: "100",
        unit: "sc",
        ativo: true,
      }));
    });

    // POST ok
    mockFetchOnce(200, { ok: true, data: { ok: true } });
    // reload (pode ocorrer mais de 1x)
    mockFetchOnce(200, { ok: true, data: [] });
    mockFetchOnce(200, { ok: true, data: [] });

    // Act
    await act(async () => {
      await result.current.submit();
    });

    // Assert – POST existe (não depende de contagem)
    const postCall = findCall(
      (url, init) =>
        url === `${apiBase}/api/admin/news/cotacoes` &&
        String(init?.method).toUpperCase() === "POST"
    );
    expect(postCall).toBeTruthy();

    const postInit = postCall![1] as any;
    const body = JSON.parse(postInit.body);

    expect(body.name).toBe("Soja");
    expect(body.slug).toBe("soja");
    expect(body.type).toBe("CEPEA");
    expect(body.unit).toBe("sc");
    expect(body.ativo).toBe(1);

    // Assert – ao menos 1 GET de reload
    expect(
      countCalls(
        (url, init) =>
          url === `${apiBase}/api/admin/news/cotacoes` &&
          (init?.method ?? "GET") === "GET"
      )
    ).toBeGreaterThanOrEqual(1);

    // volta para create
    expect(result.current.mode).toBe("create");
  });

  it("startEdit: deve preencher form usando item.name e entrar em modo edit", async () => {
    // Arrange
    mockFetchOnce(200, { ok: true, data: [] });

    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const item: any = {
      id: 10,
      name: "Café",
      slug: "cafe",
      type: "CEPEA",
      price: "250",
      unit: "sc",
      variation_day: null,
      market: null,
      source: null,
      last_update_at: null,
      ativo: 0,
    };

    // Act
    act(() => {
      result.current.startEdit(item);
    });

    // Assert
    expect(result.current.mode).toBe("edit");
    expect(result.current.editing?.id).toBe(10);
    expect(result.current.form.name).toBe("Café");
    expect(result.current.form.slug).toBe("cafe");
    expect(result.current.form.type).toBe("CEPEA");
    expect(result.current.form.ativo).toBe(false);
  });

  it("remove: deve DELETE e recarregar (sem confirm)", async () => {
    // Arrange – mount
    mockFetchOnce(200, { ok: true, data: [] });

    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    (globalThis.fetch as any).mockClear();

    // DELETE ok
    mockFetchOnce(200, { ok: true, data: { ok: true } });
    // reload (pode ter extra)
    mockFetchOnce(200, { ok: true, data: [] });
    mockFetchOnce(200, { ok: true, data: [] });

    // Act
    await act(async () => {
      await result.current.remove(9);
    });

    // Assert – DELETE existe
    const delCall = findCall(
      (url, init) =>
        url === `${apiBase}/api/admin/news/cotacoes/9` &&
        String(init?.method).toUpperCase() === "DELETE"
    );
    expect(delCall).toBeTruthy();

    // Assert – ao menos 1 GET de reload
    expect(
      countCalls(
        (url, init) =>
          url === `${apiBase}/api/admin/news/cotacoes` &&
          (init?.method ?? "GET") === "GET"
      )
    ).toBeGreaterThanOrEqual(1);
  });

  it("remove: quando API falha, deve setar errorMsg e finalizar deletingId", async () => {
    // Arrange – mount
    mockFetchOnce(200, { ok: true, data: [] });

    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    (globalThis.fetch as any).mockClear();

    // DELETE falha
    mockFetchOnce(500, { message: "Falha ao excluir." }, false);

    // Act
    await act(async () => {
      await result.current.remove(77);
    });

    // Assert
    expect(result.current.errorMsg).toBe("Falha ao excluir.");
    expect(result.current.deletingId).toBeNull();
  });

  it("sync: deve POST /sync e recarregar lista", async () => {
    // Arrange – mount
    mockFetchOnce(200, { ok: true, data: [] });

    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    (globalThis.fetch as any).mockClear();

    // POST sync ok
    mockFetchOnce(200, { ok: true, data: { ok: true } });
    // reload (pode ter extra)
    mockFetchOnce(200, { ok: true, data: [] });
    mockFetchOnce(200, { ok: true, data: [] });

    // Act
    await act(async () => {
      await result.current.sync(3);
    });

    // Assert
    const syncCall = findCall(
      (url, init) =>
        url === `${apiBase}/api/admin/news/cotacoes/3/sync` &&
        String(init?.method).toUpperCase() === "POST"
    );
    expect(syncCall).toBeTruthy();

    expect(
      countCalls(
        (url, init) =>
          url === `${apiBase}/api/admin/news/cotacoes` &&
          (init?.method ?? "GET") === "GET"
      )
    ).toBeGreaterThanOrEqual(1);
  });

  it("syncAll: deve POST /sync-all e recarregar lista", async () => {
    // Arrange – mount
    mockFetchOnce(200, { ok: true, data: [] });

    const { result } = renderHook(() =>
      useCotacoesAdmin({ apiBase, authOptions, onUnauthorized })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    (globalThis.fetch as any).mockClear();

    // POST syncAll ok
    mockFetchOnce(200, { ok: true, data: { ok: true } });
    // reload (pode ter extra)
    mockFetchOnce(200, { ok: true, data: [] });
    mockFetchOnce(200, { ok: true, data: [] });

    // Act
    await act(async () => {
      await result.current.syncAll();
    });

    // Assert
    const syncAllCall = findCall(
      (url, init) =>
        url === `${apiBase}/api/admin/news/cotacoes/sync-all` &&
        String(init?.method).toUpperCase() === "POST"
    );
    expect(syncAllCall).toBeTruthy();

    expect(
      countCalls(
        (url, init) =>
          url === `${apiBase}/api/admin/news/cotacoes` &&
          (init?.method ?? "GET") === "GET"
      )
    ).toBeGreaterThanOrEqual(1);
  });
});
