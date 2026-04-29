import { describe, it, expect, vi, beforeEach } from "vitest";

// O modulo absUrl foi refatorado para SEMPRE retornar caminho relativo
// (`API_BASE = ""` hardcoded). O motivo esta documentado no proprio
// modulo: antes era `""` no browser e `http://localhost:5000` no SSR,
// causando hydration mismatch em <img src={absUrl(...)}>. Agora e
// consistente nos dois lados; o next.config.ts faz rewrite interno
// pro backend Express.
//
// Consequencia: NEXT_PUBLIC_API_URL nao influencia mais o resultado
// de absUrl. A env var continua existindo para outras URLs (apiClient,
// uploads admin), mas absUrl ignora completamente.
//
// Para SEO (JSON-LD, OG image, canonical) que precisa de URL absoluta
// real, ha um helper separado `absoluteUrl()` que usa NEXT_PUBLIC_SITE_URL.

async function loadAbsUrl(apiUrl?: string) {
  vi.resetModules();
  vi.unstubAllEnvs();

  // Mantem o stub para garantir isolamento entre testes, mas o resultado
  // de absUrl nao depende mais dessa env.
  if (apiUrl !== undefined) {
    vi.stubEnv("NEXT_PUBLIC_API_URL", apiUrl);
  } else {
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

  describe("Comportamento com valores nulos/vazios", () => {
    it("retorna '/placeholder.png' para null", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl(null as unknown as string)).toBe("/placeholder.png");
    });

    it("retorna '/placeholder.png' para undefined", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl(undefined as unknown as string)).toBe("/placeholder.png");
    });

    it("retorna '/placeholder.png' para string vazia", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("")).toBe("/placeholder.png");
    });

    it("retorna '/placeholder.png' para string com apenas espaços", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("   ")).toBe("/placeholder.png");
    });
  });

  describe("Data URLs", () => {
    it("não altera data URLs (base64)", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const data = "data:image/png;base64,AAAA";
      expect(absUrl(data)).toBe(data);
    });

    it("não altera data URLs (SVG)", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const data = "data:image/svg+xml,%3Csvg%3E%3C/svg%3E";
      expect(absUrl(data)).toBe(data);
    });

    it("mantém data URLs mesmo com espaços", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const data = "  data:image/png;base64,AAAA  ";
      expect(absUrl(data)).toBe("data:image/png;base64,AAAA");
    });
  });

  describe("URLs absolutas (http/https) — passthrough", () => {
    it("não altera URLs absolutas https", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const url = "https://cdn.site.com/img.png";
      expect(absUrl(url)).toBe(url);
    });

    it("não altera URLs absolutas http", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const url = "http://cdn.site.com/img.png";
      expect(absUrl(url)).toBe(url);
    });

    it("não altera URLs com query params", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const url = "https://cdn.site.com/img.png?size=large&format=webp";
      expect(absUrl(url)).toBe(url);
    });

    it("ignora case em http/https", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const url = "HTTP://cdn.site.com/img.png";
      expect(absUrl(url)).toBe(url);
    });
  });

  describe("Caminhos com barra inicial (/)", () => {
    it("trata '/produtos' como asset dentro de /uploads", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("/produtos")).toBe("/uploads/produtos");
    });

    it("trata '/ping' como asset dentro de /uploads", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("/ping")).toBe("/uploads/ping");
    });

    it("trata '/api/usuarios' como caminho relativo dentro de /uploads", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("/api/usuarios")).toBe("/uploads/api/usuarios");
    });

    it("normaliza múltiplas barras iniciais", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("///uploads/file.png")).toBe("/uploads/file.png");
    });

    it("funciona com caminho vazio após barra", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("/")).toBe("/uploads/");
    });
  });

  describe("Caminhos com 'uploads/'", () => {
    it("retorna '/uploads/...' para 'uploads/...'", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("uploads/a.png")).toBe("/uploads/a.png");
    });

    it("funciona com uploads/ com subdirs", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("uploads/2024/janeiro/file.jpg")).toBe(
        "/uploads/2024/janeiro/file.jpg",
      );
    });

    it("trata /uploads/ com barra inicial como uploads/", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("/uploads/file.png")).toBe("/uploads/file.png");
    });
  });

  describe("Nomes de arquivo simples (fallback)", () => {
    it("assume /uploads/ para nome de arquivo simples", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("foto.jpg")).toBe("/uploads/foto.jpg");
    });

    it("funciona com subpasta products/", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("products/drone-a.png")).toBe("/uploads/products/drone-a.png");
    });

    it("funciona com subpasta colaboradores/", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("colaboradores/rick.jpg")).toBe(
        "/uploads/colaboradores/rick.jpg",
      );
    });

    it("funciona com subpasta logos/", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("logos/brand.svg")).toBe("/uploads/logos/brand.svg");
    });

    it("funciona com subpasta news/", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("news/banner.png")).toBe("/uploads/news/banner.png");
    });

    it("funciona com subpasta drones/", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("drones/matrice.jpg")).toBe("/uploads/drones/matrice.jpg");
    });

    it("funciona com extensões variadas", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("file.pdf")).toBe("/uploads/file.pdf");
      expect(absUrl("video.mp4")).toBe("/uploads/video.mp4");
      expect(absUrl("doc.docx")).toBe("/uploads/doc.docx");
    });
  });

  describe("Independência de NEXT_PUBLIC_API_URL", () => {
    it("ignora NEXT_PUBLIC_API_URL — sempre retorna path relativo", async () => {
      const absUrl = await loadAbsUrl("https://custom-api.com");
      expect(absUrl("/file.png")).toBe("/uploads/file.png");
    });

    it("funciona quando NEXT_PUBLIC_API_URL não está definido", async () => {
      const absUrl = await loadAbsUrl(undefined);
      expect(absUrl("/ping")).toBe("/uploads/ping");
    });

    it("funciona com arquivo simples mesmo sem env var", async () => {
      const absUrl = await loadAbsUrl(undefined);
      expect(absUrl("file.jpg")).toBe("/uploads/file.jpg");
    });

    it("ignora trailing slash da env (que sequer é mais usado)", async () => {
      const absUrl = await loadAbsUrl("https://api.com/");
      expect(absUrl("/file.png")).toBe("/uploads/file.png");
    });
  });

  describe("Edge cases", () => {
    it("substitui backslashes por forward slashes", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("uploads\\file.png")).toBe("/uploads/file.png");
    });

    it("trimma espaços em branco", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("  /file.png  ")).toBe("/uploads/file.png");
    });

    it("funciona com URLs com hash fragment", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const url = "https://cdn.com/img.png#section";
      expect(absUrl(url)).toBe(url);
    });

    it("funciona com caminhos muito longos", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      const path = "uploads/2024/01/15/folder/subfolder/deep/file.png";
      expect(absUrl(path)).toBe(
        "/uploads/2024/01/15/folder/subfolder/deep/file.png",
      );
    });

    it("funciona com caracteres especiais em nomes de arquivo", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("file-with-dashes.png")).toBe(
        "/uploads/file-with-dashes.png",
      );
      expect(absUrl("file_with_underscores.png")).toBe(
        "/uploads/file_with_underscores.png",
      );
    });
  });

  describe("Integração com contextos reais", () => {
    it("funciona para imagem de produto", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("products/drone-modelo-x.png")).toBe(
        "/uploads/products/drone-modelo-x.png",
      );
    });

    it("funciona para foto de colaborador", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("colaboradores/rick-januario.jpg")).toBe(
        "/uploads/colaboradores/rick-januario.jpg",
      );
    });

    it("funciona para logo de cliente", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("logos/kavita-logo.svg")).toBe(
        "/uploads/logos/kavita-logo.svg",
      );
    });

    it("funciona para banner de notícia", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("news/2024-01-15-release.png")).toBe(
        "/uploads/news/2024-01-15-release.png",
      );
    });

    it("funciona para foto de drone", async () => {
      const absUrl = await loadAbsUrl("https://api.kavita.com");
      expect(absUrl("drones/matrice-350-rtk.jpg")).toBe(
        "/uploads/drones/matrice-350-rtk.jpg",
      );
    });
  });
});
