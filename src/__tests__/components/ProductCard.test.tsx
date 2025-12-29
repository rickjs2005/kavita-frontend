import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import ProductCard from "@/components/products/ProductCard";

// ---- Mocks padrão ----

// next/link -> <a>
vi.mock("next/link", async () => {
  return {
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
    }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

// next/image -> <img>
vi.mock("next/image", async () => {
  return {
    default: ({
      src,
      alt,
      ...rest
    }: {
      src: string;
      alt: string;
      [k: string]: any;
    }) => <img src={String(src)} alt={String(alt)} {...rest} />,
  };
});

// lucide-react (Heart)
vi.mock("lucide-react", () => ({
  Heart: (props: any) => <svg data-testid="heart-icon" {...props} />,
}));

// AddToCartButton stub (para inspecionar props)
const addToCartSpy = vi.fn();
vi.mock("@/components/buttons/AddToCartButton", () => ({
  default: (props: any) => {
    addToCartSpy(props);
    return (
      <button
        type="button"
        data-testid="add-to-cart"
        disabled={!!props.disabled}
      >
        AddToCart
      </button>
    );
  },
}));

// AuthContext
const useAuthMock = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

// resolveStockValue
const resolveStockValueMock = vi.fn();
vi.mock("@/utils/stock", () => ({
  resolveStockValue: (...args: any[]) => resolveStockValueMock(...args),
}));

function makeProduct(overrides: Partial<any> = {}) {
  return {
    id: 10,
    name: "Produto Teste",
    description: "Descrição curta",
    price: 199.9,
    image: "/uploads/p1.png",
    images: ["/uploads/p2.png"],
    ...overrides,
  };
}

type MockFetchResponse = {
  ok: boolean;
  status?: number;
  json?: () => Promise<any>;
};

function mockFetchOnce(resp: MockFetchResponse) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: resp.ok,
    status: resp.status ?? (resp.ok ? 200 : 500),
    json: resp.json ?? (async () => ({})),
  });
}

function normalizeText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function getFavoriteButton() {
  const icon = screen.getByTestId("heart-icon");
  const btn = icon.closest("button");
  if (!btn) throw new Error("Não foi possível localizar o botão de favorito.");
  return btn as HTMLButtonElement;
}

function expectOnlyPromoFetchCalledFor(productId: number) {
  // O componente sempre tenta buscar promoção ao montar.
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [url] = (global.fetch as any).mock.calls[0];
  expect(String(url)).toMatch(new RegExp(`/api/public/promocoes/${productId}$`));
}

beforeEach(() => {
  vi.restoreAllMocks();

  useAuthMock.mockReturnValue({ user: null });
  resolveStockValueMock.mockReturnValue(10);

  global.fetch = vi.fn();
  addToCartSpy.mockClear();

  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});

  Object.defineProperty(window, "location", {
    value: { href: "http://localhost/" },
    writable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ProductCard", () => {
  it("renderiza nome, imagem de capa e links de detalhes (positivo)", () => {
    const product = makeProduct({ id: 123, name: "Ração Premium" });

    render(<ProductCard product={product as any} />);

    // Link do título: nome exato (não confunde com aria-label da imagem)
    const titleLink = screen.getByRole("link", { name: "Ração Premium" });
    expect(titleLink).toHaveAttribute("href", "/produtos/123");

    // Link da imagem (aria-label)
    const imgLink = screen.getByRole("link", {
      name: /ver detalhes de ração premium/i,
    });
    expect(imgLink).toHaveAttribute("href", "/produtos/123");

    // CTA "Ver detalhes" (usar regex ancorada para não bater no aria-label do link da imagem)
    const detailsBtn = screen.getByRole("link", { name: /^ver detalhes$/i });
    expect(detailsBtn).toHaveAttribute("href", "/produtos/123");

    // Imagem
    expect(screen.getByAltText("Ração Premium")).toBeInTheDocument();

    // AddToCart (stub)
    expect(screen.getByTestId("add-to-cart")).toBeInTheDocument();
  });

  it("usa placeholder quando não há imagens válidas (negativo/controle)", () => {
    const product = makeProduct({
      image: null,
      images: [],
      name: "Produto sem imagem",
    });

    render(<ProductCard product={product as any} />);

    const img = screen.getByAltText("Produto sem imagem") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/placeholder.png");
  });

  it("mostra badge 'Esgotado' e desabilita AddToCart quando estoque <= 0 (negativo)", () => {
    resolveStockValueMock.mockReturnValue(0);

    const product = makeProduct({ name: "Produto Zerado" });
    render(<ProductCard product={product as any} />);

    expect(screen.getByText(/esgotado/i)).toBeInTheDocument();
    expect(screen.getByTestId("add-to-cart")).toBeDisabled();

    expect(addToCartSpy).toHaveBeenCalled();
    const lastProps = addToCartSpy.mock.calls.at(-1)?.[0];
    expect(lastProps.disabled).toBe(true);
  });

  it("renderiza rating somente quando rating_avg > 0 e rating_count > 0 (positivo/negativo)", () => {
    const productWithRating = makeProduct({
      rating_avg: 4.25,
      rating_count: 2,
      name: "Produto Avaliado",
    });

    const { rerender } = render(<ProductCard product={productWithRating as any} />);

    // Evitar matcher que casa em ancestrais: restringir ao <span> do rating
    const ratingSpans = screen.getAllByText((_, node) => {
      if (!node) return false;
      if (node.tagName !== "SPAN") return false;
      const t = normalizeText(node.textContent ?? "");
      return t.includes("⭐") && t.includes("4.3");
    });
    expect(ratingSpans).toHaveLength(1);

    const ratingSpan = ratingSpans[0];
    const ratingRow = ratingSpan.closest("div");
    expect(ratingRow).toBeTruthy();
    expect(normalizeText(ratingRow!.textContent ?? "")).toMatch(
      /\(\s*2\s*avaliaç/i
    );

    // negativo: rating_count = 0 não deve aparecer
    const productNoRating = makeProduct({
      rating_avg: 4.25,
      rating_count: 0,
      name: "Produto Sem Rating",
    });

    rerender(<ProductCard product={productNoRating as any} />);
    expect(screen.queryByText(/⭐/i)).not.toBeInTheDocument();
  });

  it("faz fetch de promoção e renderiza desconto + preço riscado + preço final (positivo)", async () => {
    const product = makeProduct({ id: 77, price: 200, name: "Produto Promo" });

    mockFetchOnce({
      ok: true,
      json: async () => ({
        original_price: 200,
        final_price: 150,
      }),
    });

    render(<ProductCard product={product as any} />);

    await waitFor(() => {
      expect(screen.getByText(/-.*25%.*off/i)).toBeInTheDocument();
    });

    expect(screen.getByText("R$ 200,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 150,00")).toBeInTheDocument();

    const lastProps = addToCartSpy.mock.calls.at(-1)?.[0];
    expect(lastProps.product.price).toBe(150);
  });

  it("quando promoção retorna não-ok, mantém preço base e não exibe desconto (negativo)", async () => {
    const product = makeProduct({ id: 78, price: 99.9, name: "Produto Sem Promo" });

    mockFetchOnce({ ok: false, status: 404 });

    render(<ProductCard product={product as any} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/off/i)).not.toBeInTheDocument();
    expect(screen.getByText("R$ 99,90")).toBeInTheDocument();
  });

  it("se promoção vier apenas com discount_percent e sem final_price, calcula finalPrice (positivo)", async () => {
    const product = makeProduct({ id: 79, price: 100, name: "Produto % Promo" });

    mockFetchOnce({
      ok: true,
      json: async () => ({
        original_price: 100,
        discount_percent: 10,
        final_price: null,
        promo_price: null,
      }),
    });

    render(<ProductCard product={product as any} />);

    await waitFor(() => {
      expect(screen.getByText(/-.*10%.*off/i)).toBeInTheDocument();
    });

    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 90,00")).toBeInTheDocument();
  });

  it("favoritar: sem usuário redireciona para /login e não faz chamada de favorito (negativo)", async () => {
    useAuthMock.mockReturnValue({ user: null });

    const product = makeProduct({ id: 5, name: "Produto Fav" });

    // promo é chamada ao montar, então devolvemos não-ok
    mockFetchOnce({ ok: false, status: 404 });

    render(<ProductCard product={product as any} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const favBtn = getFavoriteButton();
    fireEvent.click(favBtn);

    expect(window.location.href).toBe("/login");

    // garante que só rolou a call de promo (e não uma segunda de favorito)
    expectOnlyPromoFetchCalledFor(5);
  });

  it("favoritar: usuário sem token não faz chamada de favorito e mantém estado (negativo)", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, token: "" } });

    const product = makeProduct({ id: 6, name: "Produto Sem Token" });

    // promo call
    mockFetchOnce({ ok: false, status: 404 });

    render(<ProductCard product={product as any} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const favBtn = getFavoriteButton();
    expect(favBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(favBtn);

    // mantém estado
    expect(favBtn).toHaveAttribute("aria-pressed", "false");
    expect(console.warn).toHaveBeenCalled();

    // garante que não chamou favorito além da promo
    expectOnlyPromoFetchCalledFor(6);
  });

  it("favoritar: com usuário + token faz POST /api/favorites e envia body/headers (positivo)", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, token: "TOK123" } });

    const product = makeProduct({ id: 7, name: "Produto POST Fav" });

    // 1) promo: não-ok
    mockFetchOnce({ ok: false, status: 404 });
    // 2) favorito: ok
    mockFetchOnce({ ok: true, json: async () => ({ ok: true }) });

    render(<ProductCard product={product as any} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const favBtn = getFavoriteButton();
    fireEvent.click(favBtn);

    // otimista
    expect(favBtn).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    const [url, options] = (global.fetch as any).mock.calls[1];

    expect(String(url)).toMatch(/\/api\/favorites$/);
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer TOK123");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify({ productId: 7 }));
  });

  it("desfavoritar: quando initialIsFavorite=true, faz DELETE /api/favorites/:id (positivo)", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, token: "TOK999" } });

    const product = makeProduct({ id: 8, name: "Produto DELETE Fav" });

    mockFetchOnce({ ok: false, status: 404 }); // promo
    mockFetchOnce({ ok: true, json: async () => ({ ok: true }) }); // delete

    render(<ProductCard product={product as any} initialIsFavorite={true} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const favBtn = getFavoriteButton();
    expect(favBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(favBtn);
    expect(favBtn).toHaveAttribute("aria-pressed", "false");

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    const [url, options] = (global.fetch as any).mock.calls[1];

    expect(String(url)).toMatch(/\/api\/favorites\/8$/);
    expect(options.method).toBe("DELETE");
    expect(options.headers.Authorization).toBe("Bearer TOK999");
  });

  it("se o POST/DELETE falhar (res.ok=false), desfaz o estado de favorito (negativo)", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, token: "TOKERR" } });

    const product = makeProduct({ id: 9, name: "Produto Fav Falha" });

    mockFetchOnce({ ok: false, status: 404 }); // promo
    mockFetchOnce({ ok: false, status: 500 }); // fav fail

    render(<ProductCard product={product as any} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const favBtn = getFavoriteButton();
    expect(favBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(favBtn);
    expect(favBtn).toHaveAttribute("aria-pressed", "true"); // otimista

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    await waitFor(() => {
      expect(favBtn).toHaveAttribute("aria-pressed", "false");
    });

    expect(console.error).toHaveBeenCalled();
  });

  it("previne duplo clique enquanto favLoading=true (estável)", async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, token: "TOKLOAD" } });

    const product = makeProduct({ id: 11, name: "Produto Loading" });

    // 1) promo -> 404
    mockFetchOnce({ ok: false, status: 404 });

    // 2) favorito -> pendente
    let resolveFetch: (v: any) => void = () => {};
    (global.fetch as any).mockImplementationOnce(async () => ({
      ok: false,
      status: 404,
      json: async () => ({}),
    }));
    (global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveFetch = res;
        })
    );

    render(<ProductCard product={product as any} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const favBtn = getFavoriteButton();
    fireEvent.click(favBtn);
    fireEvent.click(favBtn);

    expect(global.fetch).toHaveBeenCalledTimes(2);

    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await waitFor(() => {
      expect(favBtn).not.toBeDisabled();
    });
  });
});
