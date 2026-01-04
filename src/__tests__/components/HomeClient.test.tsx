import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/**
 * Observação importante:
 * - HomeClient lê API_BASE no escopo do módulo (process.env.NEXT_PUBLIC_API_URL || fallback).
 * - Para testar variações de env, usamos vi.resetModules() + import dinâmico após setar env.
 */

type PublicCategory = { id: number; name: string; slug: string };

// -----------------------------
// Mocks de componentes filhos
// -----------------------------
vi.mock("@/components/layout/HeroSection", () => ({
  default: function HeroSectionMock() {
    return <div data-testid="HeroSection" />;
  },
}));

vi.mock("@/components/products/DestaquesSection", () => ({
  default: function DestaquesSectionMock() {
    return <div data-testid="DestaquesSection" />;
  },
}));

vi.mock("@/components/layout/ServicosSection", () => ({
  default: function ServicosSectionMock() {
    return <div data-testid="ServicosSection" />;
  },
}));

vi.mock("@/components/layout/TrustBar", () => ({
  default: function TrustBarMock() {
    return <div data-testid="TrustBar" />;
  },
}));

// Captura props do ProdutosPorCategoria para asserts (categoria/limit)
const produtosPorCategoriaSpy = vi.fn();
vi.mock("@/components/products/ProdutosPorCategoria", () => ({
  default: function ProdutosPorCategoriaMock(props: any) {
    produtosPorCategoriaSpy(props);
    return (
      <div
        data-testid="ProdutosPorCategoria"
        data-categoria={String(props?.categoria)}
        data-limit={String(props?.limit)}
      />
    );
  },
}));

// Captura props de Footer (shop) para asserts de merge/update
const footerSpy = vi.fn();
vi.mock("@/components/layout/Footer", () => ({
  default: function FooterMock(props: any) {
    footerSpy(props);
    const shop = props?.shop ?? {};
    // Renderiza alguns campos para validação fácil
    return (
      <div data-testid="Footer">
        <div data-testid="Footer.store_name">{String(shop.store_name ?? "")}</div>
        <div data-testid="Footer.logo_url">{String(shop.logo_url ?? "")}</div>
        <div data-testid="Footer.contact_email">{String(shop.contact_email ?? "")}</div>
        <div data-testid="Footer.footer_tagline">{String(shop.footer_tagline ?? "")}</div>
      </div>
    );
  },
}));

// -----------------------------
// Helpers de fetch
// -----------------------------
function mockFetchOkJson(payload: any) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(payload),
  });
}

function mockFetchNotOk(status = 500) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi.fn(),
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function importHomeClient() {
  const mod = await import("@/components/home/HomeClient");
  return mod.default as React.ComponentType<{ categories: PublicCategory[] }>;
}

describe("HomeClient (src/components/home/HomeClient.tsx)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env (mantendo referência, padrão seguro)
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    // Cleanup global.fetch entre testes
    // @ts-expect-error - fetch pode ser undefined
    delete global.fetch;
    process.env = ORIGINAL_ENV;
  });

  it("positivo: renderiza estrutura base e mostra mensagem quando categories.length === 0", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    vi.resetModules();

    global.fetch = mockFetchNotOk(500) as any;

    const HomeClient = await importHomeClient();

    render(<HomeClient categories={[]} />);

    // Componentes base
    expect(screen.getByTestId("HeroSection")).toBeInTheDocument();
    expect(screen.getByTestId("DestaquesSection")).toBeInTheDocument();
    expect(screen.getByTestId("ServicosSection")).toBeInTheDocument();
    expect(screen.getByTestId("TrustBar")).toBeInTheDocument();
    expect(screen.getByTestId("Footer")).toBeInTheDocument();

    // Mensagem de vazio (UI do catálogo)
    expect(
      screen.getByText("Nenhuma categoria ativa encontrada.")
    ).toBeInTheDocument();

    // Não deve renderizar cards de categoria
    expect(screen.queryAllByTestId("ProdutosPorCategoria")).toHaveLength(0);

    // Deve chamar fetch para /api/config (mesmo que não-ok não atualize estado)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith("http://api.test/api/config", {
      method: "GET",
      headers: { "Cache-Control": "no-store" },
    });
  });

  it("positivo: quando categories.length > 0, renderiza nome, link 'Ver todos' e chama ProdutosPorCategoria com slug e limit=12", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    vi.resetModules();

    global.fetch = mockFetchNotOk(500) as any;

    const HomeClient = await importHomeClient();

    const categories: PublicCategory[] = [
      { id: 1, name: "medicamentos", slug: "medicamentos" },
      { id: 2, name: "pets", slug: "pets" },
    ];

    render(<HomeClient categories={categories} />);

    // Não deve mostrar mensagem de vazio
    expect(
      screen.queryByText("Nenhuma categoria ativa encontrada.")
    ).not.toBeInTheDocument();

    // Renderiza títulos das categorias
    expect(screen.getByText("medicamentos")).toBeInTheDocument();
    expect(screen.getByText("pets")).toBeInTheDocument();

    // Links "Ver todos" por categoria
    const verTodosLinks = screen.getAllByRole("link", { name: "Ver todos" });
    expect(verTodosLinks).toHaveLength(2);

    expect(verTodosLinks[0]).toHaveAttribute("href", "/categorias/medicamentos");
    expect(verTodosLinks[1]).toHaveAttribute("href", "/categorias/pets");

    // ProdutosPorCategoria: 1 por categoria
    const ppcs = screen.getAllByTestId("ProdutosPorCategoria");
    expect(ppcs).toHaveLength(2);
    expect(ppcs[0]).toHaveAttribute("data-categoria", "medicamentos");
    expect(ppcs[0]).toHaveAttribute("data-limit", "12");
    expect(ppcs[1]).toHaveAttribute("data-categoria", "pets");
    expect(ppcs[1]).toHaveAttribute("data-limit", "12");

    // E também garantimos que nosso spy capturou props corretas
    expect(produtosPorCategoriaSpy).toHaveBeenCalledTimes(2);
    expect(produtosPorCategoriaSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ categoria: "medicamentos", limit: 12 })
    );
    expect(produtosPorCategoriaSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ categoria: "pets", limit: 12 })
    );
  });

  it("positivo: fetch ok -> mescla dados do backend e repassa shop atualizado para Footer", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    vi.resetModules();

    // Backend devolve parcial (simulando config pública)
    const backendData = {
      store_name: "Kavita X",
      logo_url: "/custom-logo.png",
      contact_email: "suporte@kavita.com.br",
      footer_tagline: "Nova tagline vinda do backend",
    };

    global.fetch = mockFetchOkJson(backendData) as any;

    const HomeClient = await importHomeClient();

    render(<HomeClient categories={[]} />);

    // Primeiro render: defaults
    expect(screen.getByTestId("Footer.store_name")).toHaveTextContent("Kavita");
    expect(screen.getByTestId("Footer.logo_url")).toHaveTextContent("/logo.png");

    // Após fetch: atualiza shop
    await waitFor(() => {
      expect(screen.getByTestId("Footer.store_name")).toHaveTextContent("Kavita X");
    });

    expect(screen.getByTestId("Footer.logo_url")).toHaveTextContent("/custom-logo.png");
    expect(screen.getByTestId("Footer.contact_email")).toHaveTextContent("suporte@kavita.com.br");
    expect(screen.getByTestId("Footer.footer_tagline")).toHaveTextContent(
      "Nova tagline vinda do backend"
    );

    // Chamada do fetch (URL + headers)
    expect(global.fetch).toHaveBeenCalledWith("http://api.test/api/config", {
      method: "GET",
      headers: { "Cache-Control": "no-store" },
    });

    // Footer foi chamado com props incluindo shop
    expect(footerSpy).toHaveBeenCalled();
    const lastFooterCall = footerSpy.mock.calls.at(-1)?.[0];
    expect(lastFooterCall).toEqual(
      expect.objectContaining({
        shop: expect.objectContaining({
          store_name: "Kavita X",
          logo_url: "/custom-logo.png",
          contact_email: "suporte@kavita.com.br",
          footer_tagline: "Nova tagline vinda do backend",
        }),
      })
    );
  });

  it("negativo: fetch retorna não-ok -> mantém defaults no Footer (não faz setShop)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    vi.resetModules();

    global.fetch = mockFetchNotOk(401) as any;

    const HomeClient = await importHomeClient();

    render(<HomeClient categories={[]} />);

    // aguarda fetch ser chamado
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Mantém defaults
    expect(screen.getByTestId("Footer.store_name")).toHaveTextContent("Kavita");
    expect(screen.getByTestId("Footer.logo_url")).toHaveTextContent("/logo.png");
  });

  it("negativo: fetch lança erro -> mantém defaults no Footer (silencioso)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    vi.resetModules();

    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as any;

    const HomeClient = await importHomeClient();

    render(<HomeClient categories={[]} />);

    // aguarda tentativa de fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Mantém defaults
    expect(screen.getByTestId("Footer.store_name")).toHaveTextContent("Kavita");
    expect(screen.getByTestId("Footer.logo_url")).toHaveTextContent("/logo.png");
  });

  it("negativo (estável): se desmontar antes do fetch resolver, não deve ocorrer warning de setState após unmount", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    vi.resetModules();

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // fetch com resolução controlada
    const d = deferred<any>();
    global.fetch = vi.fn().mockReturnValue(d.promise) as any;

    const HomeClient = await importHomeClient();

    const { unmount } = render(<HomeClient categories={[]} />);

    // desmonta imediatamente (alive=false no cleanup)
    unmount();

    // Resolve depois (simula resposta tardia)
    d.resolve({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ store_name: "Late Update" }),
    });

    // flush microtasks
    await Promise.resolve();
    await Promise.resolve();

    // Não queremos warning de update após unmount
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("positivo: quando env não existe, usa fallback http://localhost:5000 para chamar /api/config", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.resetModules();

    global.fetch = mockFetchNotOk(500) as any;

    const HomeClient = await importHomeClient();

    render(<HomeClient categories={[]} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/config", {
      method: "GET",
      headers: { "Cache-Control": "no-store" },
    });
  });
});
