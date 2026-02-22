// src/__tests__/lib/http.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// mock do apiClient (sem dependências novas)
vi.mock("../../lib/apiClient", () => {
  return {
    apiClient: {
      request: vi.fn(),
    },
  };
});

import { apiPublic } from "../../lib/http";
import { apiClient } from "../../lib/apiClient";

type RequestMock = ReturnType<typeof vi.fn>;

describe("src/lib/api/http.ts -> apiPublic()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve chamar apiClient.request com o path e options vazias quando init não for passado", async () => {
    // Arrange
    (apiClient.request as unknown as RequestMock).mockResolvedValueOnce({ ok: true });

    // Act
    const res = await apiPublic("/news");

    // Assert
    expect(res).toEqual({ ok: true });
    expect(apiClient.request).toHaveBeenCalledTimes(1);
    expect(apiClient.request).toHaveBeenCalledWith("/news", {});
  });

  it("deve repassar init para apiClient.request (ex: method/body/headers)", async () => {
    // Arrange
    (apiClient.request as unknown as RequestMock).mockResolvedValueOnce({ created: true });

    const init: RequestInit = {
      method: "POST",
      body: JSON.stringify({ title: "abc" }),
      headers: { "Content-Type": "application/json", "X-Test": "1" },
      credentials: "include",
    };

    // Act
    const res = await apiPublic("/news", init);

    // Assert
    expect(res).toEqual({ created: true });
    expect(apiClient.request).toHaveBeenCalledTimes(1);
    expect(apiClient.request).toHaveBeenCalledWith("/news", init);
  });

  it("deve clonar init para não depender de mutações externas (garante spread)", async () => {
    // Arrange
    (apiClient.request as unknown as RequestMock).mockResolvedValueOnce({ ok: true });

    const init: RequestInit = { method: "GET", headers: { "X-Test": "1" } };

    // Act
    await apiPublic("/health", init);

    // Assert
    const [, passedInit] = (apiClient.request as any).mock.calls[0];
    expect(passedInit).not.toBe(init); // foi clonado via {...init}
    expect(passedInit).toEqual(init); // mas com mesmo conteúdo
  });

  it("se init for undefined, deve passar {} (não undefined)", async () => {
    // Arrange
    (apiClient.request as unknown as RequestMock).mockResolvedValueOnce({ ok: true });

    // Act
    await apiPublic("/ping", undefined);

    // Assert
    expect(apiClient.request).toHaveBeenCalledWith("/ping", {});
  });
});