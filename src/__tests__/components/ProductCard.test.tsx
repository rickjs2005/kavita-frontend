import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// Importante: API_BASE é lido no module init do ProductCard
process.env.NEXT_PUBLIC_API_URL = "http://api.test";

// =======================
// Mocks
// =======================

// next/link -> <a> (filtra props problemáticas como prefetch)
vi.mock("next/link", () => {
  return {
    default: ({ href, children, prefetch, ...rest }: any) => (
      <a href={typeof href === "string" ? href : href?.pathname} {...rest}>
        {children}
      </a>
    ),
  };
});

// next/image -> <img> (filtra props problemáticas como fill)
vi.mock("next/image", () => {
  return {
    default: (props: any) => {
      const { src, alt, fill, sizes, priority, quality, ...rest } = props;
      return <img src={String(src)} alt={alt} {...rest} />;
    },
  };
});

// lucide Heart -> svg simples (preserva fill)
vi.mock("lucide-react", () => ({
  Heart: (props: any) => <svg data-testid="heart-icon" {...props} />,
}));

// resolveStockValue (controle por teste)
const resolveStockValueMock = vi.fn();
vi.mock("@/utils/stock", async () => {
  return {
    resolveStockValue: (...args: any[]) => resolveStockValueMock(...args),
  };
});

// AddToCartButton (captura props)
const addToCartSpy = vi.fn();
vi.mock("@/components/buttons/AddToCartButton", () => {
  return {
    default: (props: any) => {
      addToCartSpy(props);
      return (
        <button
          type="button"
          data-testid="add-to-cart"
          disabled={Boolean(props.disabled)}
        >
          Add
        </button>
      );
    },
  };
});

// useAuth (controle por teste)
let currentUser: any = null;
vi.mock("@/context/AuthContext", () => {
  return {
    useAuth: () => ({ user: currentUser }),
  };
});

// =======================
// Helpers
// =======================
function baseProduct(overrides: Partial<any> = {}) {
  return {
    id: 105,
    name: "Produto Teste",
    description: "Descrição do produto",
    price: 100,
    image: "/uploads/p1.png",
    images: ["/uploads/p2.png"],
    ...overrides,
  };
}

function mockLocationHref() {
  Object.defineProperty(window, "location", {
    value: { href: "http://localhost/" },
    writable: true,
    configurable: true,
  });
}

// fallback robusto (evita ambiguidade com o botão AddToCart)
function getFavoriteButtonRobust() {
  const allButtons = screen.getAllByRole("button");
  const fav = allButtons.find((b) => b.hasAttribute("aria-pressed"));
  if (!fav) throw new Error("Botão de favorito não encontrado (aria-pressed).");
  return fav;
}

describe("ProductCard (src/components/ProductCard.tsx)", () => {
  beforeEach(() => {
    currentUser = null;
    addToCartSpy.mockClear();
    resolveStockValueMock.mockReset();
    mockLocationHref();

    // fetch padrão: promoção = 404 (sem JSON, sem console.error)
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: any) => {
        const u = String(url);
        if (u.includes("/api/public/promocoes/")) {
          return new Response(null, { status: 404 });
        }
        // qualquer outra rota que não deveria ser chamada: 404
        return new Response(null, { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renderiza links e imagem de capa normalizada", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(10);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);

    // Assert
    const cardLink = screen.getByRole("link", {
      name: /ver detalhes de produto teste/i,
    });
    expect(cardLink).toHaveAttribute("href", "/produtos/105");

    const titleLink = screen.getByRole("link", { name: "Produto Teste" });
    expect(titleLink).toHaveAttribute("href", "/produtos/105");

    // Há 2 links com "Ver detalhes" (card + botão). Teste ambos de forma estável:
    const verDetalhesLinks = screen.getAllByRole("link", {
      name: /ver detalhes/i,
    });
    expect(verDetalhesLinks.length).toBeGreaterThanOrEqual(2);
    verDetalhesLinks.forEach((a) =>
      expect(a).toHaveAttribute("href", "/produtos/105")
    );

    const img = screen.getByRole("img", { name: "Produto Teste" });
    expect(img).toHaveAttribute("src", "http://api.test/uploads/p1.png");

    expect(screen.getByTestId("add-to-cart")).not.toBeDisabled();
    expect(addToCartSpy).toHaveBeenCalled();
  });

  it("usa placeholder quando não há imagens válidas", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(10);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(
      <ProductCard product={baseProduct({ image: null, images: [] }) as any} />
    );

    // Assert
    const img = screen.getByRole("img", { name: "Produto Teste" });
    expect(img).toHaveAttribute("src", "/placeholder.png");
  });

  it("exibe badge 'Esgotado' e desabilita AddToCart quando estoque <= 0", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(0);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);

    // Assert
    expect(screen.getByText("Esgotado")).toBeInTheDocument();
    expect(screen.getByTestId("add-to-cart")).toBeDisabled();
  });

  it("exibe badge de frete grátis simples quando shipping_free=1 e shipping_free_from_qty=null", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(
      <ProductCard
        product={
          baseProduct({
            shipping_free: 1,
            shipping_free_from_qty: null,
          }) as any
        }
      />
    );

    // Assert
    expect(screen.getByText("Frete grátis")).toBeInTheDocument();
  });

  it("exibe badge de frete grátis por quantidade quando shipping_free_from_qty é número", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(
      <ProductCard
        product={
          baseProduct({
            shipping_free: 1,
            shipping_free_from_qty: 5,
          }) as any
        }
      />
    );

    // Assert
    expect(
      screen.getByText(/Frete grátis a partir de 5/i)
    ).toBeInTheDocument();
  });

  it("exibe avaliação (⭐) apenas quando rating_avg > 0 e rating_count > 0", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(
      <ProductCard
        product={
          baseProduct({
            rating_avg: 4.25,
            rating_count: 2,
          }) as any
        }
      />
    );

    // Assert
    const starLine = screen.getByText(/⭐\s*4\.3/i);
    expect(starLine).toBeInTheDocument();

    const ratingRow = starLine.closest("div");
    expect(ratingRow).toBeTruthy();

    const scope = within(ratingRow as HTMLElement);
    expect(scope.getByText(/2/)).toBeInTheDocument();
    expect(scope.getByText(/avalia/i)).toBeInTheDocument();
  });

  it("não exibe avaliação quando rating_count=0 (negativo)", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(
      <ProductCard
        product={
          baseProduct({
            rating_avg: 4.5,
            rating_count: 0,
          }) as any
        }
      />
    );

    // Assert
    expect(screen.queryByText(/⭐/i)).not.toBeInTheDocument();
  });

  it("busca promoção e, quando houver desconto, mostra '-X% OFF' e usa preço final no AddToCartButton", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);

    (global.fetch as any) = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes("/api/public/promocoes/105")) {
        return new Response(
          JSON.stringify({ original_price: 100, final_price: 80 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(null, { status: 404 });
    });

    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct({ price: 100 }) as any} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/-20% OFF/i)).toBeInTheDocument();
    });

    expect(screen.getByText("R$ 80,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();

    const lastCall =
      addToCartSpy.mock.calls[addToCartSpy.mock.calls.length - 1]?.[0];
    expect(lastCall.product.price).toBe(80);
  });

  it("quando promoção retorna 404, não mostra badge de desconto e mantém preço base", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct({ price: 123.45 }) as any} />);

    // Assert
    expect(screen.queryByText(/OFF/i)).not.toBeInTheDocument();
    expect(screen.getByText("R$ 123,45")).toBeInTheDocument();
  });

  it("favorito: sem user redireciona para /login e NÃO chama /api/favorites", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = null;

    const fetchSpy = vi.fn(async (url: any) => {
      // promoção 404 (normal)
      if (String(url).includes("/api/public/promocoes/"))
        return new Response(null, { status: 404 });
      // se chamar favorites, devolve 200
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);
    const favBtn = getFavoriteButtonRobust();
    fireEvent.click(favBtn);

    // Assert
    expect(window.location.href).toBe("/login");

    // Não pode chamar favorites
    const favoritesCalls = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes("/api/favorites")
    );
    expect(favoritesCalls.length).toBe(0);
  });

  it("favorito: com user mas sem token não chama /api/favorites (negativo)", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = { id: 1 }; // sem token

    const fetchSpy = vi.fn(async (url: any) => {
      if (String(url).includes("/api/public/promocoes/"))
        return new Response(null, { status: 404 });
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);
    const favBtn = getFavoriteButtonRobust();
    fireEvent.click(favBtn);

    // Assert
    const favoritesCalls = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes("/api/favorites")
    );
    expect(favoritesCalls.length).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("favorito: POST adiciona favorito com Authorization e body correto; alterna aria-pressed", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = { id: 1, token: "tok_test" };

    const fetchSpy = vi.fn(async (url: any, init?: RequestInit) => {
      const u = String(url);
      if (u.includes("/api/public/promocoes/"))
        return new Response(null, { status: 404 });
      if (u.endsWith("/api/favorites")) return new Response(null, { status: 200 });
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);
    const favBtn = getFavoriteButtonRobust();

    expect(favBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(favBtn);

    // Assert (toggle otimista)
    await waitFor(() => {
      expect(favBtn).toHaveAttribute("aria-pressed", "true");
    });

    const calls = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes("/api/favorites")
    );
    const [url, init] = calls[calls.length - 1] as [string, RequestInit];

    expect(url).toBe("http://api.test/api/favorites");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer tok_test",
    });
    expect(init.body).toBe(JSON.stringify({ productId: 105 }));
  });

  it("favorito: DELETE remove favorito quando initialIsFavorite=true", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = { id: 1, token: "tok_test" };

    const fetchSpy = vi.fn(async (url: any) => {
      const u = String(url);
      if (u.includes("/api/public/promocoes/"))
        return new Response(null, { status: 404 });
      if (u.includes("/api/favorites/105"))
        return new Response(null, { status: 200 });
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} initialIsFavorite={true} />);
    const favBtn = getFavoriteButtonRobust();

    await waitFor(() => {
      expect(favBtn).toHaveAttribute("aria-pressed", "true");
    });

    fireEvent.click(favBtn);

    // Assert
    await waitFor(() => {
      expect(favBtn).toHaveAttribute("aria-pressed", "false");
    });

    const calls = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes("/api/favorites/105")
    );
    const [url, init] = calls[calls.length - 1] as unknown as [string, RequestInit];

    expect(url).toBe("http://api.test/api/favorites/105");
    expect(init.method).toBe("DELETE");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer tok_test",
    });
  });

  it("favorito: se fetch retornar !ok, faz rollback do estado (negativo)", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = { id: 1, token: "tok_test" };

    const fetchSpy = vi.fn(async (url: any) => {
      const u = String(url);
      if (u.includes("/api/public/promocoes/"))
        return new Response(null, { status: 404 });
      if (u.includes("/api/favorites")) return new Response(null, { status: 500 });
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);
    const favBtn = getFavoriteButtonRobust();

    expect(favBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(favBtn);

    // Assert: toggle otimista -> true e rollback -> false
    await waitFor(() => {
      expect(favBtn).toHaveAttribute("aria-pressed", "false");
    });

    expect(errSpy).toHaveBeenCalled();
  });
});
