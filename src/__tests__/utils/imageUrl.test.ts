import { describe, it, expect, vi, beforeEach } from "vitest";

// imageUrl.ts foi removido e consolidado em absUrl.ts.
// Este arquivo cobre os casos historicos do resolveImageUrl, ja agora
// contra o novo absUrl que retorna sempre path relativo (ver
// absUrl.test.ts para o detalhamento da mudanca).

async function loadAbsUrl(apiUrl?: string) {
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

describe("absUrl (anteriormente resolveImageUrl)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("retorna '/placeholder.png' para null/undefined/empty", async () => {
    const absUrl = await loadAbsUrl("http://172.20.10.9:5000");
    expect(absUrl(null as unknown as string)).toBe("/placeholder.png");
    expect(absUrl(undefined as unknown as string)).toBe("/placeholder.png");
    expect(absUrl("")).toBe("/placeholder.png");
  });

  it("não altera data URLs", async () => {
    const absUrl = await loadAbsUrl("http://172.20.10.9:5000");
    const data = "data:image/png;base64,AAAA";
    expect(absUrl(data)).toBe(data);
  });

  it("não altera URLs absolutas http/https", async () => {
    const absUrl = await loadAbsUrl("http://172.20.10.9:5000");
    const url = "https://cdn.site.com/img.png";
    expect(absUrl(url)).toBe(url);
  });

  it("para caminhos que começam com '/', mantém path relativo (/uploads/...)", async () => {
    // Antes prefixava com NEXT_PUBLIC_API_URL. Agora o rewrite do
    // next.config.ts faz o proxy pro backend transparentemente.
    const absUrl = await loadAbsUrl("http://172.20.10.9:5000");
    expect(absUrl("/uploads/logo.png")).toBe("/uploads/logo.png");
  });

  it("para caminhos que começam com 'uploads/', mantém relativo", async () => {
    const absUrl = await loadAbsUrl("http://172.20.10.9:5000");
    expect(absUrl("uploads/foto.jpg")).toBe("/uploads/foto.jpg");
  });

  it("fallback: assume /uploads/<arquivo> para nomes de arquivo simples", async () => {
    const absUrl = await loadAbsUrl("http://172.20.10.9:5000");
    expect(absUrl("foto.jpg")).toBe("/uploads/foto.jpg");
  });

  it("converte barras invertidas para barras normais", async () => {
    const absUrl = await loadAbsUrl("http://172.20.10.9:5000");
    expect(absUrl("uploads\\logos\\logo.png")).toBe("/uploads/logos/logo.png");
  });

  it("ignora NEXT_PUBLIC_API_URL — comportamento independente de env", async () => {
    const absUrl = await loadAbsUrl(undefined);
    expect(absUrl("uploads/img.png")).toBe("/uploads/img.png");
  });
});
