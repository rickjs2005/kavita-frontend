import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Mock de apiClient (a produção usa apiClient.get, não fetch direto).
 * Cada teste configura o retorno via apiGetMock.
 */
const apiGetMock = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: any[]) => apiGetMock(...args),
  },
}));

describe("fetchShippingQuote (src/services/shippingQuote.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_API_URL;
    apiGetMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("valida CEP: se não tiver 8 dígitos, lança 'CEP inválido' e não chama apiClient.get", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    const mod = await import("@/services/shippingQuote");
    await expect(
      mod.fetchShippingQuote({
        cep: "1234-000", // 7 dígitos
        items: [{ id: 1, quantidade: 1 }],
      }),
    ).rejects.toThrow("CEP inválido");

    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it("valida carrinho: após normalizar e filtrar items, se ficar vazio lança 'Carrinho vazio' e não chama apiClient.get", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    const mod = await import("@/services/shippingQuote");

    await expect(
      mod.fetchShippingQuote({
        cep: "12345-678",
        // tudo inválido (id <= 0, quantidade <= 0, NaN)
        items: [
          { id: 0 as any, quantidade: 1 },
          { id: 1, quantidade: 0 as any },
          { id: "x" as any, quantidade: 2 as any },
        ],
      }),
    ).rejects.toThrow("Carrinho vazio");

    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it("monta URL corretamente com cepDigits e items normalizados/encodeURIComponent; faz GET", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    apiGetMock.mockResolvedValueOnce({
      price: 10,
      prazo_dias: 5,
      is_free: false,
      ruleApplied: "ZONE",
      cep: "12345678",
    });

    const mod = await import("@/services/shippingQuote");

    await mod.fetchShippingQuote({
      cep: "12.345-678", // deve virar 12345678
      items: [
        { id: "1" as any, quantidade: "2" as any }, // deve virar numbers
        { id: 2 as any, quantidade: 0 as any }, // deve ser filtrado
      ],
    });

    const expectedItems = [{ id: 1, quantidade: 2 }];
    const expectedPath =
      "/api/shipping/quote" +
      `?cep=${encodeURIComponent("12345678")}` +
      `&items=${encodeURIComponent(JSON.stringify(expectedItems))}`;

    expect(apiGetMock).toHaveBeenCalledTimes(1);
    expect(apiGetMock).toHaveBeenCalledWith(
      expectedPath,
      expect.anything(),
    );
  });

  it("sucesso: normaliza tipos (price number, prazo_dias number|null, is_free boolean) e repassa campos opcionais", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    const payload = {
      price: 19.9,
      prazo_dias: 7,
      is_free: true,
      ruleApplied: "PRODUCT_FREE",
      zone: { uf: "SP" },
      freeItems: [{ id: 10, quantidade: 2 }],
      cep: "12345678",
    };

    apiGetMock.mockResolvedValueOnce(payload);

    const mod = await import("@/services/shippingQuote");

    const res = await mod.fetchShippingQuote({
      cep: "12345-678",
      items: [{ id: 10, quantidade: 2 }],
    });

    expect(res).toEqual({
      price: 19.9,
      prazo_dias: 7,
      is_free: true,
      ruleApplied: "PRODUCT_FREE",
      zone: { uf: "SP" },
      freeItems: [{ id: 10, quantidade: 2 }],
      cep: "12345678",
    });
  });

  it("sucesso: se prazo_dias vier null/undefined, retorna null", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    apiGetMock.mockResolvedValueOnce({
      price: 0,
      prazo_dias: null,
      is_free: false,
    });

    const mod = await import("@/services/shippingQuote");

    const res = await mod.fetchShippingQuote({
      cep: "12345-678",
      items: [{ id: 1, quantidade: 1 }],
    });

    expect(res.prazo_dias).toBeNull();
  });

  it("erro HTTP: se apiClient.get lançar, a função também lança", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    const err = Object.assign(new Error("CEP fora da área atendida."), {
      status: 400,
    });
    apiGetMock.mockRejectedValueOnce(err);

    const mod = await import("@/services/shippingQuote");

    await expect(
      mod.fetchShippingQuote({
        cep: "12345-678",
        items: [{ id: 1, quantidade: 1 }],
      }),
    ).rejects.toThrow("CEP fora da área atendida.");
  });

  it("erro HTTP: se apiClient.get lançar com mensagem genérica, a função propaga", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    apiGetMock.mockRejectedValueOnce(new Error("Erro interno"));

    const mod = await import("@/services/shippingQuote");

    await expect(
      mod.fetchShippingQuote({
        cep: "12345-678",
        items: [{ id: 1, quantidade: 1 }],
      }),
    ).rejects.toThrow("Erro interno");
  });
});
