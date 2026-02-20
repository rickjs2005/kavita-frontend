import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

async function importModule() {
  return import("@/server/data/shopSettings");
}

describe("fetchPublicShopSettings (src/server/data/shopSettings.ts)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process, "env", {
      value: { ...ORIGINAL_ENV },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // @ts-expect-error teste: delete fetch global no cleanup
    delete global.fetch;
    Object.defineProperty(process, "env", {
      value: ORIGINAL_ENV,
      writable: true,
      configurable: true,
    });
  });

  it("positivo: res.ok=false => retorna fallback default", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    }) as any;

    const { fetchPublicShopSettings } = await importModule();

    // Act
    const result = await fetchPublicShopSettings();

    // Assert
    expect(global.fetch).toHaveBeenCalledWith("http://api.test/api/config", { cache: "no-store" });
    expect(result.store_name).toBe("Kavita");
    expect(result.footer).toBeDefined();
    expect(result.footer_links).toBeDefined();
  });

  it("positivo: sucesso flat + footer_links JSON string válido", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        store_name: "  Minha Loja  ",
        logo_url: " /logo.png ",
        footer_tagline: "  Tagline  ",
        contact_whatsapp: "  31999999999 ",
        contact_email: "  contato@loja.com ",
        cnpj: "  00.000.000/0001-00 ",
        social_instagram_url: " https://instagram.com/x ",
        social_whatsapp_url: " https://wa.me/5531 ",
        address_city: "  BH ",
        address_state: " MG ",
        address_street: " Rua A ",
        address_neighborhood: " Centro ",
        address_zip: " 30000-000 ",
        footer_partner_cta_enabled: "1",
        footer_partner_cta_title: "  Parceiros ",
        footer_partner_cta_text: "  Seja parceiro ",
        footer_partner_cta_href: "  /parcerias ",
        footer_links: JSON.stringify([{ label: "  Home  ", href: "  /  ", highlight: true }]),
      }),
    }) as any;

    const { fetchPublicShopSettings } = await importModule();

    // Act
    const result = await fetchPublicShopSettings();

    // Assert (trim + normalização)
    expect(result.store_name).toBe("Minha Loja");
    expect(result.logo_url).toBe("/logo.png");
    expect(result.footer_tagline).toBe("Tagline");
    expect(result.footer?.tagline).toBe("Tagline");
    expect(result.footer?.contact_email).toBe("contato@loja.com");
    expect(result.footer?.contact_whatsapp).toBe("31999999999");

    // Links parseados
    expect(result.footer_links).toEqual([{ label: "Home", href: "/", highlight: true }]);
    expect(result.footer?.links).toEqual(result.footer_links);

    // Partner CTA montado (linha 204)
    expect(result.footer?.partner_cta).toEqual(
      expect.objectContaining({
        enabled: true,
        title: "Parceiros",
        text: "Seja parceiro",
        href: "/parcerias",
      })
    );
  });

  it("positivo: compat legacy footer.* quando flat não vem", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        footer: {
          tagline: "  Tagline Legacy ",
          contact_whatsapp: "  31999999999 ",
          contact_email: "  legacy@loja.com ",
          links: [{ label: "  Contato  ", href: " /contato " }],
          partner_cta: { enabled: 1, title: "  T  ", text: "  X  ", href: " /p " },
        },
      }),
    }) as any;

    const { fetchPublicShopSettings } = await importModule();

    // Act
    const result = await fetchPublicShopSettings();

    // Assert
    expect(result.store_name).toBe("Kavita"); // fallback
    expect(result.footer_tagline).toBe("Tagline Legacy");
    expect(result.footer?.tagline).toBe("Tagline Legacy");
    expect(result.footer_links).toEqual([{ label: "Contato", href: "/contato" }]);
    expect(result.footer?.links).toEqual(result.footer_links);
    expect(result.footer?.partner_cta?.enabled).toBe(true);
  });

  it("negativo: footer_links JSON inválido -> parseLinks retorna [] (linhas 88–92)", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        store_name: "Loja",
        footer_links: "{invalid-json",
      }),
    }) as any;

    const { fetchPublicShopSettings } = await importModule();

    // Act
    const result = await fetchPublicShopSettings();

    // Assert: não quebra; links caem para fallback (defaultPublicSettings)
    expect(result.store_name).toBe("Loja");
    expect(Array.isArray(result.footer_links)).toBe(true);
    expect(result.footer?.links).toEqual(result.footer_links);
  });

  it("negativo: partner_cta_enabled='0' -> toBool retorna false (linhas 74–76) e partner_cta é montado (linha 204)", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        store_name: "Loja",
        footer_partner_cta_enabled: "0", // cobre toBool false
        footer_partner_cta_title: "Parceiros",
        footer_partner_cta_text: "Texto",
        footer_partner_cta_href: "/parcerias",
      }),
    }) as any;

    const { fetchPublicShopSettings } = await importModule();

    // Act
    const result = await fetchPublicShopSettings();

    // Assert
    expect(result.footer?.partner_cta).toEqual(
      expect.objectContaining({
        enabled: false,
        title: "Parceiros",
        text: "Texto",
        href: "/parcerias",
      })
    );
  });

  it("negativo: fetch/json lança erro -> retorna fallback (linha 309)", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as any;

    const { fetchPublicShopSettings } = await importModule();

    // Act
    const result = await fetchPublicShopSettings();

    // Assert: fallback
    expect(result.store_name).toBe("Kavita");
    expect(result.footer).toBeDefined();
    expect(result.footer_links).toBeDefined();
  });
});
