import { describe, it, expect, vi, beforeEach } from "vitest";

async function loadAbsUrlWithEnv(apiUrl?: string) {
  vi.resetModules();
  vi.unstubAllEnvs();

  if (apiUrl !== undefined) {
    vi.stubEnv("NEXT_PUBLIC_API_URL", apiUrl);
  } else {
    // força como "undefined" (módulo cai no default)
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
  }

  const mod = await import("@/utils/absUrl");
  return mod.absUrl as (raw?: string | null) => string;
}

describe("absUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("retorna string vazia para null/undefined/empty", async () => {
    // Arrange
    const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");

    // Act
    const r1 = absUrl(null as any);
    const r2 = absUrl(undefined as any);
    const r3 = absUrl("");

    // Assert
    expect(r1).toBe("");
    expect(r2).toBe("");
    expect(r3).toBe("");
  });

  it("não altera data URLs", async () => {
    // Arrange
    const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
    const data = "data:image/png;base64,AAAA";

    // Act
    const result = absUrl(data);

    // Assert
    expect(result).toBe(data);
  });

  it("não altera URLs absolutas http/https", async () => {
    // Arrange
    const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
    const url = "https://cdn.site.com/img.png";

    // Act
    const result = absUrl(url);

    // Assert
    expect(result).toBe(url);
  });

  it("para caminhos que começam com '/', prefixa com API", async () => {
    // Arrange
    const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
    const path = "/produtos";

    // Act
    const result = absUrl(path);

    // Assert
    expect(result).toBe("https://api.kavita.com/produtos");
  });

  it("para caminhos que começam com 'uploads', prefixa com API + '/'", async () => {
    // Arrange
    const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
    const path = "uploads/a.png";

    // Act
    const result = absUrl(path);

    // Assert
    expect(result).toBe("https://api.kavita.com/uploads/a.png");
  });

  it("fallback: assume uploads/<arquivo>", async () => {
    // Arrange
    const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
    const file = "foto.jpg";

    // Act
    const result = absUrl(file);

    // Assert
    expect(result).toBe("https://api.kavita.com/uploads/foto.jpg");
  });

  it("quando NEXT_PUBLIC_API_URL não estiver definido, usa default http://localhost:5000", async () => {
    // Arrange
    const absUrl = await loadAbsUrlWithEnv(undefined);

    // Act
    const result = absUrl("/ping");

    // Assert
    expect(result).toBe("http://localhost:5000/ping");
  });
});
