import { describe, it, expect, vi, beforeEach } from "vitest";

async function loadResolveImageUrlWithEnv(apiUrl?: string) {
  vi.resetModules();
  vi.unstubAllEnvs();

  if (apiUrl !== undefined) {
    vi.stubEnv("NEXT_PUBLIC_API_URL", apiUrl);
  } else {
    // força como "undefined" (módulo cai no default)
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
  }

  const mod = await import("@/utils/imageUrl");
  return mod.resolveImageUrl as (raw?: string | null) => string;
}

describe("resolveImageUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("retorna /placeholder.png para null/undefined/empty", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");

    // Act
    const r1 = resolveImageUrl(null as any);
    const r2 = resolveImageUrl(undefined as any);
    const r3 = resolveImageUrl("");

    // Assert
    expect(r1).toBe("/placeholder.png");
    expect(r2).toBe("/placeholder.png");
    expect(r3).toBe("/placeholder.png");
  });

  it("não altera data URLs", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");
    const data = "data:image/png;base64,AAAA";

    // Act
    const result = resolveImageUrl(data);

    // Assert
    expect(result).toBe(data);
  });

  it("não altera URLs absolutas http/https", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");
    const url = "https://cdn.site.com/img.png";

    // Act
    const result = resolveImageUrl(url);

    // Assert
    expect(result).toBe(url);
  });

  it("para caminhos que começam com '/', prefixa com API", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");
    const path = "/uploads/logo.png";

    // Act
    const result = resolveImageUrl(path);

    // Assert
    expect(result).toBe("http://172.20.10.9:5000/uploads/logo.png");
  });

  it("para caminhos que começam com 'uploads/', prefixa com API", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");
    const path = "uploads/foto.jpg";

    // Act
    const result = resolveImageUrl(path);

    // Assert
    expect(result).toBe("http://172.20.10.9:5000/uploads/foto.jpg");
  });

  it("fallback: assume uploads/<arquivo> para nomes de arquivo simples", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");
    const file = "foto.jpg";

    // Act
    const result = resolveImageUrl(file);

    // Assert
    expect(result).toBe("http://172.20.10.9:5000/uploads/foto.jpg");
  });

  it("converte barras invertidas para barras normais", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");
    const path = "uploads\\logos\\logo.png";

    // Act
    const result = resolveImageUrl(path);

    // Assert
    expect(result).toBe("http://172.20.10.9:5000/uploads/logos/logo.png");
  });

  it("quando NEXT_PUBLIC_API_URL não estiver definido, usa default http://localhost:5000", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv(undefined);

    // Act
    const result = resolveImageUrl("uploads/img.png");

    // Assert
    expect(result).toBe("http://localhost:5000/uploads/img.png");
  });

  it("caminhos /images/ são servidos do frontend (sem prefixo API)", async () => {
    // Arrange
    const resolveImageUrl = await loadResolveImageUrlWithEnv("http://172.20.10.9:5000");
    const path = "/images/drone/fallback-hero1.jpg";

    // Act
    const result = resolveImageUrl(path);

    // Assert
    expect(result).toBe("/images/drone/fallback-hero1.jpg");
  });
});
