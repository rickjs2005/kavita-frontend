import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("lib/api.ts -> api()", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules(); // importante: garante mocks por teste
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.restoreAllMocks();
  });

  it("deve delegar para apiClient.request com path e init (pass-through)", async () => {
    // Arrange
    const requestMock = vi.fn().mockResolvedValue({ ok: true });

    vi.doMock("../../lib/apiClient", () => ({
      apiClient: {
        request: requestMock,
      },
    }));

    const { api } = await import("../../lib/api");

    const init: RequestInit = {
      method: "POST",
      headers: { "X-Test": "1" },
      body: JSON.stringify({ name: "Produto" }),
      credentials: "include",
    };

    // Act
    const result = await api("/api/ping", init);

    // Assert
    expect(result).toEqual({ ok: true });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("/api/ping", init);
  });

  it("quando init não é passado, deve chamar request com objeto vazio", async () => {
    // Arrange
    const requestMock = vi.fn().mockResolvedValue({ hello: "world" });

    vi.doMock("../../lib/apiClient", () => ({
      apiClient: {
        request: requestMock,
      },
    }));

    const { api } = await import("../../lib/api");

    // Act
    const result = await api("/v1/health");

    // Assert
    expect(result).toEqual({ hello: "world" });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("/v1/health", {});
  });

  it("deve repassar erro lançado pelo apiClient.request", async () => {
    // Arrange
    const requestMock = vi.fn().mockRejectedValue(new Error("HTTP 401"));

    vi.doMock("../../lib/apiClient", () => ({
      apiClient: {
        request: requestMock,
      },
    }));

    const { api } = await import("../../lib/api");

    // Act + Assert
    await expect(api("/api/me")).rejects.toThrow("HTTP 401");
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(requestMock).toHaveBeenCalledWith("/api/me", {});
  });
});
