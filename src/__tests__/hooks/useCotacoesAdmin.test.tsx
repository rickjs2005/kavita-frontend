import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCotacoesAdmin } from "@/hooks/useCotacoesAdmin";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// apiClient builds URLs with NEXT_PUBLIC_API_URL as base.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function mockFetchOnce(status: number, json: any, ok?: boolean) {
  (globalThis.fetch as any).mockImplementationOnce(async () => ({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    headers: new Headers({ "content-type": "application/json" }),
    async json() {
      return json;
    },
    async text() {
      return JSON.stringify(json);
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

/** Provide enough mock responses for the initial load() + meta call */
function mockInitialLoad(rows: any[] = []) {
  // CSRF token fetch (apiClient fetches this for GET too on first call? No — only for mutations)
  // Actually apiClient does NOT auto-fetch CSRF for GET, but load() now also fetches /meta.
  // load() does: GET /cotacoes then GET /meta
  mockFetchOnce(200, { ok: true, data: rows });
  mockFetchOnce(200, { ok: true, data: { allowed_slugs: ["soja", "milho"], presets: {}, suggestions: {} } });
}

describe("useCotacoesAdmin", () => {
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
    const rows = [
      { id: 2, name: "Soja", slug: "soja", type: "CEPEA", ativo: 1 },
      { id: 1, name: "Milho", slug: "milho", type: "CEPEA", ativo: 1 },
    ];
    mockInitialLoad(rows);

    const { result } = renderHook(() =>
      useCotacoesAdmin({ onUnauthorized }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.errorMsg).toBeNull();

    const getCall = findCall(
      (url) => url.includes("/api/admin/news/cotacoes") && !url.includes("/meta"),
    );
    expect(getCall).toBeTruthy();
  });

  it("load: erro não-401/403 deve setar errorMsg", async () => {
    mockFetchOnce(500, { ok: false, message: "Erro interno" }, false);

    const { result } = renderHook(() =>
      useCotacoesAdmin({ onUnauthorized }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.errorMsg).toBeTruthy();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("load: 401 deve chamar onUnauthorized", async () => {
    mockFetchOnce(401, { ok: false, message: "Não autorizado." }, false);

    const { result } = renderHook(() =>
      useCotacoesAdmin({ onUnauthorized }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it("startEdit: deve preencher form usando item e entrar em modo edit", async () => {
    mockInitialLoad();

    const { result } = renderHook(() =>
      useCotacoesAdmin({ onUnauthorized }),
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

    act(() => {
      result.current.startEdit(item);
    });

    expect(result.current.mode).toBe("edit");
    expect(result.current.editing?.id).toBe(10);
    expect(result.current.form.name).toBe("Café");
    expect(result.current.form.slug).toBe("cafe");
    expect(result.current.form.ativo).toBe(false);
  });

  it("sync: deve distinguir provider ok de provider erro", async () => {
    const toast = await import("react-hot-toast");
    mockInitialLoad();

    const { result } = renderHook(() =>
      useCotacoesAdmin({ onUnauthorized }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    (globalThis.fetch as any).mockClear();

    // O apiClient agora prefetch o CSRF token antes de POST/PUT/PATCH/DELETE.
    // Mock 404 = falha silenciosa (apiClient segue sem header CSRF).
    mockFetchOnce(404, {});
    // POST /sync — provider succeeded
    mockFetchOnce(200, {
      ok: true,
      data: { id: 3, price: 5.12 },
      meta: { provider: { ok: true }, took_ms: 100 },
    });
    // reload after sync (list + meta)
    mockInitialLoad();

    await act(async () => {
      await result.current.sync(3);
    });

    expect(toast.default.success).toHaveBeenCalledWith(
      expect.stringContaining("atualizado"),
    );
  });

  it("sync: provider erro deve mostrar toast.error", async () => {
    const toast = await import("react-hot-toast");
    mockInitialLoad();

    const { result } = renderHook(() =>
      useCotacoesAdmin({ onUnauthorized }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    (globalThis.fetch as any).mockClear();

    // CSRF prefetch (silent fail) — ver justificativa no teste anterior.
    mockFetchOnce(404, {});
    // POST /sync — provider failed (HTTP 200 but provider.ok=false)
    mockFetchOnce(200, {
      ok: true,
      data: { id: 3, price: null },
      meta: { provider: { ok: false, message: "Provider desabilitado" }, took_ms: 50 },
    });
    // reload after sync
    mockInitialLoad();

    await act(async () => {
      await result.current.sync(3);
    });

    expect(toast.default.error).toHaveBeenCalledWith(
      expect.stringContaining("Provider desabilitado"),
    );
  });

  it("syncAll: deve POST /sync-all e mostrar contagem", async () => {
    mockInitialLoad();

    const { result } = renderHook(() =>
      useCotacoesAdmin({ onUnauthorized }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    (globalThis.fetch as any).mockClear();

    // POST sync-all — 2 ok, 1 error
    mockFetchOnce(200, {
      ok: true,
      data: { total: 3, ok: 2, error: 1, items: [] },
    });
    // reload
    mockInitialLoad();

    await act(async () => {
      await result.current.syncAll();
    });

    const syncAllCall = findCall(
      (url, init) =>
        url.includes("/api/admin/news/cotacoes/sync-all") &&
        String(init?.method).toUpperCase() === "POST",
    );
    expect(syncAllCall).toBeTruthy();
  });
});
