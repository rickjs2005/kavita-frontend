import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeClient from "@/components/home/HomeClient";

/**
 * HomeClient é um componente puramente estático (Server Component pattern):
 * recebe `categories` e `shop` como props, sem fetch interno.
 * Os testes validam a renderização baseada nos props.
 */

type PublicCategory = { id: number; name: string; slug: string };
type PublicShopSettings = {
  store_name: string;
  logo_url: string;
  contact_email?: string;
  footer_tagline?: string;
  [key: string]: any;
};

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

// Captura props de Footer (shop) para asserts
const footerSpy = vi.fn();
vi.mock("@/components/layout/Footer", () => ({
  default: function FooterMock(props: any) {
    footerSpy(props);
    const shop = props?.shop ?? {};
    return (
      <div data-testid="Footer">
        <div data-testid="Footer.store_name">
          {String(shop.store_name ?? "")}
        </div>
        <div data-testid="Footer.logo_url">{String(shop.logo_url ?? "")}</div>
        <div data-testid="Footer.contact_email">
          {String(shop.contact_email ?? "")}
        </div>
        <div data-testid="Footer.footer_tagline">
          {String(shop.footer_tagline ?? "")}
        </div>
      </div>
    );
  },
}));

const defaultShop: PublicShopSettings = {
  store_name: "Kavita",
  logo_url: "/logo.png",
  contact_email: "",
  footer_tagline: "",
};

const defaultHero = {
  hero_video_url: "",
  hero_video_path: "",
  hero_image_url: "",
  hero_image_path: "",
  title: "",
  subtitle: "",
  button_label: "Saiba Mais",
  button_href: "/drones",
};

describe("HomeClient (src/components/home/HomeClient.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("positivo: renderiza estrutura base e mostra mensagem quando categories.length === 0", () => {
    render(<HomeClient categories={[]} shop={defaultShop} hero={defaultHero} />);

    // Componentes base
    expect(screen.getByTestId("HeroSection")).toBeInTheDocument();
    expect(screen.getByTestId("DestaquesSection")).toBeInTheDocument();
    expect(screen.getByTestId("ServicosSection")).toBeInTheDocument();
    expect(screen.getByTestId("TrustBar")).toBeInTheDocument();
    expect(screen.getByTestId("Footer")).toBeInTheDocument();

    // Mensagem de vazio (UI do catálogo)
    expect(
      screen.getByText("Nenhuma categoria ativa encontrada."),
    ).toBeInTheDocument();

    // Não deve renderizar cards de categoria
    expect(screen.queryAllByTestId("ProdutosPorCategoria")).toHaveLength(0);
  });

  it("positivo: quando categories.length > 0, renderiza nome, link 'Ver todos' e chama ProdutosPorCategoria com slug e limit=12", () => {
    const categories: PublicCategory[] = [
      { id: 1, name: "medicamentos", slug: "medicamentos" },
      { id: 2, name: "pets", slug: "pets" },
    ];

    render(<HomeClient categories={categories} shop={defaultShop} hero={defaultHero} />);

    // Não deve mostrar mensagem de vazio
    expect(
      screen.queryByText("Nenhuma categoria ativa encontrada."),
    ).not.toBeInTheDocument();

    // Renderiza títulos das categorias
    expect(screen.getByText("medicamentos")).toBeInTheDocument();
    expect(screen.getByText("pets")).toBeInTheDocument();

    // Links "Ver todos" por categoria
    const verTodosLinks = screen.getAllByRole("link", { name: "Ver todos" });
    expect(verTodosLinks).toHaveLength(2);

    expect(verTodosLinks[0]).toHaveAttribute(
      "href",
      "/categorias/medicamentos",
    );
    expect(verTodosLinks[1]).toHaveAttribute("href", "/categorias/pets");

    // ProdutosPorCategoria: 1 por categoria
    const ppcs = screen.getAllByTestId("ProdutosPorCategoria");
    expect(ppcs).toHaveLength(2);
    expect(ppcs[0]).toHaveAttribute("data-categoria", "medicamentos");
    expect(ppcs[0]).toHaveAttribute("data-limit", "12");
    expect(ppcs[1]).toHaveAttribute("data-categoria", "pets");
    expect(ppcs[1]).toHaveAttribute("data-limit", "12");

    expect(produtosPorCategoriaSpy).toHaveBeenCalledTimes(2);
    expect(produtosPorCategoriaSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ categoria: "medicamentos", limit: 12 }),
    );
    expect(produtosPorCategoriaSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ categoria: "pets", limit: 12 }),
    );
  });

  it("positivo: repassa shop para Footer", () => {
    const shop: PublicShopSettings = {
      store_name: "Kavita X",
      logo_url: "/custom-logo.png",
      contact_email: "suporte@kavita.com.br",
      footer_tagline: "Nova tagline vinda do backend",
    };

    render(<HomeClient categories={[]} shop={shop} hero={defaultHero} />);

    expect(screen.getByTestId("Footer.store_name")).toHaveTextContent(
      "Kavita X",
    );
    expect(screen.getByTestId("Footer.logo_url")).toHaveTextContent(
      "/custom-logo.png",
    );
    expect(screen.getByTestId("Footer.contact_email")).toHaveTextContent(
      "suporte@kavita.com.br",
    );
    expect(screen.getByTestId("Footer.footer_tagline")).toHaveTextContent(
      "Nova tagline vinda do backend",
    );

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
      }),
    );
  });

  it("positivo: quando env não existe, HomeClient ainda renderiza sem fetch", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    render(<HomeClient categories={[]} shop={defaultShop} hero={defaultHero} />);

    // Componente estático - deve renderizar sem precisar de fetch
    expect(screen.getByTestId("Footer")).toBeInTheDocument();
    expect(screen.getByTestId("HeroSection")).toBeInTheDocument();
  });
});
