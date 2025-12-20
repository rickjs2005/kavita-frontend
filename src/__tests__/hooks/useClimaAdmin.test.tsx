import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useClimaAdmin } from "@/hooks/useClimaAdmin";

vi.mock("@/utils/kavita-news/clima", () => ({
    normalizeSlug: (v: string) =>
        String(v || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-"),
    toNumberOrNull: (v: any) => {
        if (v === "" || v == null) return null;
        const n = Number(String(v).replace(",", "."));
        return Number.isFinite(n) ? n : null;
    },
    parseIbgeId: (v: any) => {
        const s = String(v ?? "").trim();
        if (!s) return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    },
    parseStationCode: (v: any) => {
        const s = String(v ?? "").trim();
        return s || null;
    },
}));

type FetchJson = any;

function mockFetchOnce(status: number, json: FetchJson, opts?: { ok?: boolean }) {
    const ok = opts?.ok ?? (status >= 200 && status < 300);
    (globalThis.fetch as any).mockImplementationOnce(async () => {
        return {
            ok,
            status,
            async json() {
                return json;
            },
        };
    });
}

function findCall(
    predicate: (url: string, init: RequestInit | undefined) => boolean
) {
    const calls = (globalThis.fetch as any).mock.calls as any[];
    for (const c of calls) {
        const url = String(c[0]);
        const init = c[1] as RequestInit | undefined;
        if (predicate(url, init)) return c;
    }
    return null;
}

function countCalls(
    predicate: (url: string, init: RequestInit | undefined) => boolean
) {
    const calls = (globalThis.fetch as any).mock.calls as any[];
    return calls.filter((c) => predicate(String(c[0]), c[1] as any)).length;
}

describe("useClimaAdmin", () => {
    const apiBase = "http://localhost:3000";
    const authOptions = {
        headers: { Authorization: "Bearer token", "X-App": "kavita" },
        credentials: "include" as RequestCredentials,
    };
    const onUnauthorized = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis.fetch as any) = vi.fn();
        (globalThis.confirm as any) = vi.fn();
        onUnauthorized.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("deve carregar lista no mount e preencher rows e sorted (ordenado por city_name)", async () => {
        // Arrange
        const rows = [
            { id: 2, city_name: "Zeta", slug: "zeta", uf: "MG", ativo: 1 },
            { id: 1, city_name: "Alfa", slug: "alfa", uf: "MG", ativo: 1 },
        ];
        mockFetchOnce(200, { ok: true, data: rows });

        // Act
        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );

        // Assert
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.errorMsg).toBeNull();
        expect(result.current.rows).toHaveLength(2);
        expect(result.current.sorted.map((r) => r.city_name)).toEqual(["Alfa", "Zeta"]);

        const getCall = findCall((url, init) => url === `${apiBase}/api/admin/news/clima` && (init?.method ?? "GET") === "GET");
        expect(getCall).not.toBeNull();
    });

    it("load: deve setar errorMsg quando API retorna erro (não-401)", async () => {
        // Arrange (mount load)
        mockFetchOnce(500, { message: "Falhou" }, { ok: false });

        // Act
        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );

        // Assert
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.errorMsg).toBe("Falhou");
        expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it("load: em 401 deve chamar onUnauthorized e não popular errorMsg", async () => {
        // Arrange
        mockFetchOnce(401, { message: "Sessão expirou" }, { ok: false });

        // Act
        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );

        // Assert
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(onUnauthorized).toHaveBeenCalled();
        expect(result.current.errorMsg).toBeNull();
    });

    it("submit: deve validar campos obrigatórios e não chamar fetch quando inválido", async () => {
        // Arrange (mount load OK)
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        // importante: limpar chamadas do mount
        (globalThis.fetch as any).mockClear();

        // Act
        await act(async () => {
            await result.current.submit();
        });

        // Assert
        expect((globalThis.fetch as any)).not.toHaveBeenCalled();
        expect(result.current.errorMsg).toBe("Preencha o nome da cidade.");
    });

    it("submit (create): deve POSTar payload normalizado, recarregar lista e resetar para create", async () => {
        // Arrange
        // mount load
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        // limpar GET do mount (evita confusão de contagem)
        (globalThis.fetch as any).mockClear();

        act(() => {
            result.current.setForm((prev: any) => ({
                ...prev,
                city_name: "Santana do Manhuaçu",
                uf: "mg",
                slug: "Santana do Manhuaçu",
                ibge_id: "3158904",
                station_lat: "-20.28",
                station_lon: "-42.34",
                station_distance: "12",
                mm_24h: "1.5",
                mm_7d: "10",
                source: "OPEN_METEO",
                last_update_at: "2025-12-19T13:31:51.000Z",
                ativo: true,
            }));
        });

        // submit POST
        mockFetchOnce(200, { ok: true, data: { ok: true } });
        // reload (pode ocorrer 1x ou 2x dependendo do fluxo interno / StrictMode)
        mockFetchOnce(200, {
            ok: true,
            data: [
                {
                    id: 1,
                    city_name: "Santana do Manhuaçu",
                    slug: "santana-do-manhuacu",
                    uf: "MG",
                    ativo: 1,
                },
            ],
        });
        // se houver reload extra, garante resposta
        mockFetchOnce(200, { ok: true, data: [] });

        // Act
        await act(async () => {
            await result.current.submit();
        });

        // Assert: existe POST correto
        const postCall = findCall(
            (url, init) =>
                url === `${apiBase}/api/admin/news/clima` &&
                String(init?.method).toUpperCase() === "POST"
        );
        expect(postCall).not.toBeNull();

        const postInit = postCall![1] as any;
        expect(postInit?.headers).toMatchObject({ "Content-Type": "application/json" });

        const body = JSON.parse(postInit.body);
        expect(body.city_name).toBe("Santana do Manhuaçu");
        expect(body.uf).toBe("MG");
        expect(body.slug).toBe("santana-do-manhuaçu");
        expect(body.slug).toMatch(/^santana-do-manhua/);
        expect(body.slug).toContain("-");
        expect(body.ibge_id).toBe(3158904);
        expect(body.mm_24h).toBe(1.5);
        expect(body.mm_7d).toBe(10);
        expect(body.ativo).toBe(1);

        // Assert: houve ao menos 1 GET de reload
        expect(
            countCalls(
                (url, init) =>
                    url === `${apiBase}/api/admin/news/clima` &&
                    (init?.method ?? "GET") === "GET"
            )
        ).toBeGreaterThanOrEqual(1);

        // Estado final
        expect(result.current.mode).toBe("create");
        expect(result.current.editing).toBeNull();
    });

    it("startEdit: deve preencher form a partir do item e setar mode=edit", async () => {
        // Arrange (mount load OK)
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        const item: any = {
            id: 10,
            city_name: "Matipó",
            slug: "matipo",
            uf: "MG",
            ibge_id: 3140902,
            station_code: null,
            station_lat: "-20.283890",
            station_lon: "-42.341110",
            station_distance: "5.2",
            mm_24h: "0.20",
            mm_7d: "101.10",
            source: "OPEN_METEO",
            last_update_at: "2025-12-19T13:31:51.000Z",
            ativo: 0,
        };

        // Act
        act(() => {
            result.current.startEdit(item);
        });

        // Assert
        expect(result.current.mode).toBe("edit");
        expect(result.current.editing?.id).toBe(10);
        expect(result.current.form.city_name).toBe("Matipó");
        expect(result.current.form.uf).toBe("MG");
        expect(result.current.form.ibge_id).toBe("3140902");
        expect(result.current.form.ativo).toBe(false);
    });

    it("remove: quando confirm() retorna false, não deve chamar DELETE", async () => {
        // Arrange (mount load OK)
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        (globalThis.confirm as any).mockReturnValue(false);
        (globalThis.fetch as any).mockClear();

        // Act
        await act(async () => {
            await result.current.remove(123);
        });

        // Assert
        expect(globalThis.confirm).toHaveBeenCalled();
        expect((globalThis.fetch as any)).not.toHaveBeenCalled();
    });

    it("remove: quando confirm() retorna true, deve DELETE e recarregar", async () => {
        // Arrange (mount load OK)
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        // limpar GET do mount
        (globalThis.fetch as any).mockClear();

        (globalThis.confirm as any).mockReturnValue(true);

        // DELETE ok
        mockFetchOnce(200, { ok: true, data: { ok: true } });
        // reload (pode ter extra)
        mockFetchOnce(200, { ok: true, data: [] });
        mockFetchOnce(200, { ok: true, data: [] });

        // Act
        await act(async () => {
            await result.current.remove(55);
        });

        // Assert: existe DELETE correto
        const delCall = findCall(
            (url, init) =>
                url === `${apiBase}/api/admin/news/clima/55` &&
                String(init?.method).toUpperCase() === "DELETE"
        );
        expect(delCall).not.toBeNull();

        // Assert: ao menos 1 GET de reload
        expect(
            countCalls(
                (url, init) =>
                    url === `${apiBase}/api/admin/news/clima` &&
                    (init?.method ?? "GET") === "GET"
            )
        ).toBeGreaterThanOrEqual(1);
    });

    it("sync: deve POST /sync e recarregar lista", async () => {
        // Arrange (mount load OK)
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        // limpar GET do mount
        (globalThis.fetch as any).mockClear();

        // POST sync ok
        mockFetchOnce(200, { ok: true, data: { ok: true } });
        // reload (pode ter extra)
        mockFetchOnce(200, { ok: true, data: [] });
        mockFetchOnce(200, { ok: true, data: [] });

        // Act
        await act(async () => {
            await result.current.sync(99);
        });

        // Assert: existe POST /sync correto
        const syncCall = findCall(
            (url, init) =>
                url === `${apiBase}/api/admin/news/clima/99/sync` &&
                String(init?.method).toUpperCase() === "POST"
        );
        expect(syncCall).not.toBeNull();

        // Assert: ao menos 1 GET de reload
        expect(
            countCalls(
                (url, init) =>
                    url === `${apiBase}/api/admin/news/clima` &&
                    (init?.method ?? "GET") === "GET"
            )
        ).toBeGreaterThanOrEqual(1);
    });

    it("suggestStations: deve retornar [] sem fetch quando UF inválida ou q < 2", async () => {
        // Arrange (mount load OK)
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        (globalThis.fetch as any).mockClear();

        // Act
        const r1 = await result.current.suggestStations("M", "abc");
        const r2 = await result.current.suggestStations("MG", "a");

        // Assert
        expect(r1).toEqual([]);
        expect(r2).toEqual([]);
        expect((globalThis.fetch as any)).not.toHaveBeenCalled();
    });

    it("suggestStations: deve chamar endpoint com encode e retornar array quando ok", async () => {
        // Arrange (mount load OK)
        mockFetchOnce(200, { ok: true, data: [] });

        const { result } = renderHook(() =>
            useClimaAdmin({ apiBase, authOptions, onUnauthorized })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        (globalThis.fetch as any).mockClear();

        const suggestions = [{ name: "Manhuaçu", uf: "MG", lat: "-20.25", lon: "-42.03" }];
        mockFetchOnce(200, { ok: true, data: suggestions });

        // Act
        const out = await result.current.suggestStations("mg", "Manhuaçu", 10);

        // Assert
        expect(out).toEqual(suggestions);

        const stationCall = findCall((url, init) => {
            if (!url.startsWith(`${apiBase}/api/admin/news/clima/stations?`)) return false;
            return (init?.method ?? "GET") === "GET";
        });
        expect(stationCall).not.toBeNull();

        const url = String(stationCall![0]);
        expect(url).toContain("uf=MG");
        expect(url).toContain("q=Manhua%C3%A7u");
        expect(url).toContain("limit=10");
    });
});
