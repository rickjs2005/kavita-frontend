import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do apiClient
vi.mock("../../lib/apiClient", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  },
}));

import api from "../../lib/axiosClient";
import apiClient from "../../lib/apiClient";

type MockFn = ReturnType<typeof vi.fn>;

describe("src/lib/axiosClient.ts (deprecated wrapper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("api.get deve delegar para apiClient.get", async () => {
    (apiClient.get as unknown as MockFn).mockResolvedValueOnce({ ok: true });

    const result = await api.get("/test", { headers: { "X-Test": "1" } });

    expect(apiClient.get).toHaveBeenCalledWith("/test", {
      headers: { "X-Test": "1" },
    });

    expect(result).toEqual({ ok: true });
  });

  it("api.post deve delegar para apiClient.post", async () => {
    (apiClient.post as unknown as MockFn).mockResolvedValueOnce({ created: true });

    const result = await api.post("/create", { name: "Produto" }, { credentials: "include" });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/create",
      { name: "Produto" },
      { credentials: "include" }
    );

    expect(result).toEqual({ created: true });
  });

  it("api.put deve delegar para apiClient.put", async () => {
    (apiClient.put as unknown as MockFn).mockResolvedValueOnce({ updated: true });

    const result = await api.put("/update/1", { name: "Novo" });

    expect(apiClient.put).toHaveBeenCalledWith("/update/1", { name: "Novo" }, undefined);

    expect(result).toEqual({ updated: true });
  });

  it("api.patch deve delegar para apiClient.patch", async () => {
    (apiClient.patch as unknown as MockFn).mockResolvedValueOnce({ patched: true });

    const result = await api.patch("/patch/1", { status: "ok" });

    expect(apiClient.patch).toHaveBeenCalledWith("/patch/1", { status: "ok" }, undefined);

    expect(result).toEqual({ patched: true });
  });

  it("api.delete deve delegar para apiClient.del", async () => {
    (apiClient.del as unknown as MockFn).mockResolvedValueOnce({ deleted: true });

    const result = await api.delete("/delete/1", { headers: { Authorization: "Bearer x" } });

    expect(apiClient.del).toHaveBeenCalledWith("/delete/1", {
      headers: { Authorization: "Bearer x" },
    });

    expect(result).toEqual({ deleted: true });
  });
});