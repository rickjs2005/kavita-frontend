import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Helper local para mockar Response (evita depender de util compartilhado).
 */
function makeRes(opts: {
  ok: boolean;
  status: number;
  text?: string;
}) {
  return {
    ok: opts.ok,
    status: opts.status,
    async text() {
      return opts.text ?? "";
    },
  } as unknown as Response;
}

describe("fetchShippingQuote (src/services/shippingQuote.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("valida CEP: se não tiver 8 dígitos, lança 'CEP inválido' e não chama fetch", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const mod = await import("@/services/shippingQuote");
    await expect(
      mod.fetchShippingQuote({
        cep: "1234-000", // 7 dígitos
        items: [{ id: 1, quantidade: 1 }],
      })
    ).rejects.toThrow("CEP inválido");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("valida carrinho: após normalizar e filtrar items, se ficar vazio lança 'Carrinho vazio' e não chama fetch", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

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
      })
    ).rejects.toThrow("Carrinho vazio");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("monta URL corretamente com cepDigits e items normalizados/encodeURIComponent; faz GET com cache no-store", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    const fetchSpy = vi.fn().mockResolvedValue(
      makeRes({
        ok: true,
        status: 200,
        text: JSON.stringify({
          price: 10,
          prazo_dias: 5,
          is_free: false,
          ruleApplied: "ZONE",
          cep: "12345678",
        }),
      })
    );
    global.fetch = fetchSpy;

    const mod = await import("@/services/shippingQuote");

    await mod.fetchShippingQuote({
      cep: "12.345-678", // deve virar 12345678
      items: [
        { id: "1" as any, quantidade: "2" as any }, // deve virar numbers
        { id: 2 as any, quantidade: 0 as any }, // deve ser filtrado
      ],
    });

    const expectedItems = [{ id: 1, quantidade: 2 }];
    const expectedUrl =
      "http://api.test/api/shipping/quote" +
      `?cep=${encodeURIComponent("12345678")}` +
      `&items=${encodeURIComponent(JSON.stringify(expectedItems))}`;

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, {
      method: "GET",
      cache: "no-store",
    });
  });

  it("sucesso: normaliza tipos (price number, prazo_dias number|null, is_free boolean) e repassa campos opcionais", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    const payload = {
      price: "19.9", // string -> number
      prazo_dias: "7", // string -> number
      is_free: 1, // truthy -> boolean true
      ruleApplied: "PRODUCT_FREE",
      zone: { uf: "SP" },
      freeItems: [{ id: 10, quantidade: 2 }],
      cep: "12345678",
    };

    const fetchSpy = vi.fn().mockResolvedValue(
      makeRes({ ok: true, status: 200, text: JSON.stringify(payload) })
    );
    global.fetch = fetchSpy;

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

    const fetchSpy = vi.fn().mockResolvedValue(
      makeRes({
        ok: true,
        status: 200,
        text: JSON.stringify({ price: 0, prazo_dias: null, is_free: false }),
      })
    );
    global.fetch = fetchSpy;

    const mod = await import("@/services/shippingQuote");

    const res = await mod.fetchShippingQuote({
      cep: "12345-678",
      items: [{ id: 1, quantidade: 1 }],
    });

    expect(res.prazo_dias).toBeNull();
  });

  it("erro HTTP: se backend retornar JSON com message, lança essa message", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    const fetchSpy = vi.fn().mockResolvedValue(
      makeRes({
        ok: false,
        status: 400,
        text: JSON.stringify({ message: "CEP fora da área atendida." }),
      })
    );
    global.fetch = fetchSpy;

    const mod = await import("@/services/shippingQuote");

    await expect(
      mod.fetchShippingQuote({
        cep: "12345-678",
        items: [{ id: 1, quantidade: 1 }],
      })
    ).rejects.toThrow("CEP fora da área atendida.");
  });

  it("erro HTTP: se body não for JSON, lança o texto; se texto vazio, usa fallback 'Falha ao cotar frete (status).'", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    // Caso 1: texto não-JSON
    const fetchSpy1 = vi.fn().mockResolvedValue(
      makeRes({ ok: false, status: 500, text: "Erro interno" })
    );
    global.fetch = fetchSpy1;

    const mod1 = await import("@/services/shippingQuote");
    await expect(
      mod1.fetchShippingQuote({
        cep: "12345-678",
        items: [{ id: 1, quantidade: 1 }],
      })
    ).rejects.toThrow("Erro interno");

    // Caso 2: texto vazio => fallback
    vi.resetModules();
    const fetchSpy2 = vi.fn().mockResolvedValue(
      makeRes({ ok: false, status: 502, text: "" })
    );
    
    global.fetch = fetchSpy2;

    const mod2 = await import("@/services/shippingQuote");
    await expect(
      mod2.fetchShippingQuote({
        cep: "12345-678",
        items: [{ id: 1, quantidade: 1 }],
      })
    ).rejects.toThrow("Falha ao cotar frete (502).");
  });
});
