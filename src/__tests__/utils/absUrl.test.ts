import { describe, it, expect, vi, beforeEach } from "vitest";

async function loadAbsUrlWithEnv(apiUrl?: string) {
  vi.resetModules();
  vi.unstubAllEnvs();

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
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl(null as any)).toBe("/placeholder.png");
    });

    it("retorna '/placeholder.png' para undefined", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl(undefined as any)).toBe("/placeholder.png");
    });

    it("retorna '/placeholder.png' para string vazia", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("")).toBe("/placeholder.png");
    });

    it("retorna '/placeholder.png' para string com apenas espaços", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("   ")).toBe("/placeholder.png");
    });
  });

  describe("Data URLs", () => {
    it("não altera data URLs (base64)", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const data = "data:image/png;base64,AAAA";
      expect(absUrl(data)).toBe(data);
    });

    it("não altera data URLs (SVG)", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const data = "data:image/svg+xml,%3Csvg%3E%3C/svg%3E";
      expect(absUrl(data)).toBe(data);
    });

    it("mantém data URLs mesmo com espaços", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const data = "  data:image/png;base64,AAAA  ";
      expect(absUrl(data)).toBe("data:image/png;base64,AAAA");
    });
  });

  describe("URLs absolutas (http/https)", () => {
    it("não altera URLs absolutas https", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const url = "https://cdn.site.com/img.png";
      expect(absUrl(url)).toBe(url);
    });

    it("não altera URLs absolutas http", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const url = "http://cdn.site.com/img.png";
      expect(absUrl(url)).toBe(url);
    });

    it("não altera URLs com query params", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const url = "https://cdn.site.com/img.png?size=large&format=webp";
      expect(absUrl(url)).toBe(url);
    });

    it("ignora case em http/https", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const url = "HTTP://cdn.site.com/img.png";
      expect(absUrl(url)).toBe(url);
    });
  });

  describe("Caminhos com barra inicial (/)", () => {
    it("trata '/produtos' como asset dentro de /uploads", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("/produtos")).toBe("https://api.kavita.com/uploads/produtos");
    });

    it("trata '/ping' como asset dentro de /uploads", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("/ping")).toBe("https://api.kavita.com/uploads/ping");
    });

    it("trata '/api/usuarios' como caminho relativo dentro de /uploads", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("/api/usuarios")).toBe(
        "https://api.kavita.com/uploads/api/usuarios"
      );
    });

    it("normaliza múltiplas barras iniciais", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("///uploads/file.png")).toBe(
        "https://api.kavita.com/uploads/file.png"
      );
    });

    it("funciona com caminho vazio após barra", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("/")).toBe("https://api.kavita.com/uploads/");
    });
  });

  describe("Caminhos com 'uploads/'", () => {
    it("prefixa com API para 'uploads/...'", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("uploads/a.png")).toBe("https://api.kavita.com/uploads/a.png");
    });

    it("funciona com uploads/ com subdirs", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("uploads/2024/janeiro/file.jpg")).toBe(
        "https://api.kavita.com/uploads/2024/janeiro/file.jpg"
      );
    });

    it("trata /uploads/ com barra inicial como uploads/", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("/uploads/file.png")).toBe(
        "https://api.kavita.com/uploads/file.png"
      );
    });
  });

  describe("Nomes de arquivo simples (fallback)", () => {
    it("assume /uploads/ para nome de arquivo simples", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("foto.jpg")).toBe("https://api.kavita.com/uploads/foto.jpg");
    });

    it("funciona com subpasta products/", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("products/drone-a.png")).toBe(
        "https://api.kavita.com/uploads/products/drone-a.png"
      );
    });

    it("funciona com subpasta colaboradores/", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("colaboradores/rick.jpg")).toBe(
        "https://api.kavita.com/uploads/colaboradores/rick.jpg"
      );
    });

    it("funciona com subpasta logos/", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("logos/brand.svg")).toBe(
        "https://api.kavita.com/uploads/logos/brand.svg"
      );
    });

    it("funciona com subpasta news/", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("news/banner.png")).toBe(
        "https://api.kavita.com/uploads/news/banner.png"
      );
    });

    it("funciona com subpasta drones/", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("drones/matrice.jpg")).toBe(
        "https://api.kavita.com/uploads/drones/matrice.jpg"
      );
    });

    it("funciona com extensões variadas", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("file.pdf")).toBe("https://api.kavita.com/uploads/file.pdf");
      expect(absUrl("video.mp4")).toBe("https://api.kavita.com/uploads/video.mp4");
      expect(absUrl("doc.docx")).toBe("https://api.kavita.com/uploads/doc.docx");
    });
  });

  describe("Configuração de API_BASE", () => {
    it("usa NEXT_PUBLIC_API_URL quando definido", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://custom-api.com");
      expect(absUrl("/file.png")).toBe("https://custom-api.com/uploads/file.png");
    });

    it("usa fallback http://localhost:5000 quando NEXT_PUBLIC_API_URL não está definido", async () => {
      const absUrl = await loadAbsUrlWithEnv(undefined);
      expect(absUrl("/ping")).toBe("http://localhost:5000/uploads/ping");
    });

    it("usa fallback para arquivo simples também", async () => {
      const absUrl = await loadAbsUrlWithEnv(undefined);
      expect(absUrl("file.jpg")).toBe("http://localhost:5000/uploads/file.jpg");
    });

    it("remove trailing slash de API_BASE", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.com/");
      expect(absUrl("/file.png")).toBe("https://api.com/uploads/file.png");
    });

    it("remove múltiplos trailing slashes", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.com///");
      expect(absUrl("uploads/file.png")).toBe("https://api.com/uploads/file.png");
    });
  });

  describe("Edge cases", () => {
    it("substitui backslashes por forward slashes", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("uploads\\file.png")).toBe(
        "https://api.kavita.com/uploads/file.png"
      );
    });

    it("trimma espaços em branco", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("  /file.png  ")).toBe(
        "https://api.kavita.com/uploads/file.png"
      );
    });

    it("funciona com URLs com hash fragment", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const url = "https://cdn.com/img.png#section";
      expect(absUrl(url)).toBe(url);
    });

    it("funciona com caminhos muito longos", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      const path = "uploads/2024/01/15/folder/subfolder/deep/file.png";
      expect(absUrl(path)).toBe(
        "https://api.kavita.com/uploads/2024/01/15/folder/subfolder/deep/file.png"
      );
    });

    it("funciona com caracteres especiais em nomes de arquivo", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("file-with-dashes.png")).toBe(
        "https://api.kavita.com/uploads/file-with-dashes.png"
      );
      expect(absUrl("file_with_underscores.png")).toBe(
        "https://api.kavita.com/uploads/file_with_underscores.png"
      );
    });
  });

  describe("Integração com contextos reais", () => {
    it("funciona para imagem de produto", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("products/drone-modelo-x.png")).toBe(
        "https://api.kavita.com/uploads/products/drone-modelo-x.png"
      );
    });

    it("funciona para foto de colaborador", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("colaboradores/rick-januario.jpg")).toBe(
        "https://api.kavita.com/uploads/colaboradores/rick-januario.jpg"
      );
    });

    it("funciona para logo de cliente", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("logos/kavita-logo.svg")).toBe(
        "https://api.kavita.com/uploads/logos/kavita-logo.svg"
      );
    });

    it("funciona para banner de notícia", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("news/2024-01-15-release.png")).toBe(
        "https://api.kavita.com/uploads/news/2024-01-15-release.png"
      );
    });

    it("funciona para foto de drone", async () => {
      const absUrl = await loadAbsUrlWithEnv("https://api.kavita.com");
      expect(absUrl("drones/matrice-350-rtk.jpg")).toBe(
        "https://api.kavita.com/uploads/drones/matrice-350-rtk.jpg"
      );
    });
  });
});