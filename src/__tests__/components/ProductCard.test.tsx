import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";

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

// SWR mock — controle por teste via swrPromoData
let swrPromoData: any = undefined;
let swrPromoLoading = false;
vi.mock("swr", () => ({
  default: (_key: any, _fetcher: any, _opts?: any) => ({
    data: swrPromoData,
    isLoading: swrPromoLoading,
    error: undefined,
    mutate: vi.fn(),
  }),
}));

// apiClient mock
const apiClientPostMock = vi.fn();
const apiClientDelMock = vi.fn();
const apiClientGetMock = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: any[]) => apiClientGetMock(...args),
    post: (...args: any[]) => apiClientPostMock(...args),
    del: (...args: any[]) => apiClientDelMock(...args),
  },
}));

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
    apiClientPostMock.mockReset();
    apiClientDelMock.mockReset();
    apiClientGetMock.mockReset();
    swrPromoData = undefined;
    swrPromoLoading = false;
    mockLocationHref();
  });

  afterEach(() => {
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
      expect(a).toHaveAttribute("href", "/produtos/105"),
    );

    const img = screen.getByRole("img", { name: "Produto Teste" });
    // absUrl passou a retornar path relativo (proxy via rewrite do Next).
    expect(img).toHaveAttribute("src", "/uploads/p1.png");

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
      <ProductCard product={baseProduct({ image: null, images: [] }) as any} />,
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
      />,
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
      />,
    );

    // Assert — copy mudou para o formato compacto "Frete grátis 5+ un."
    expect(screen.getByText(/Frete grátis 5\+ un\./i)).toBeInTheDocument();
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
      />,
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
      />,
    );

    // Assert
    expect(screen.queryByText(/⭐/i)).not.toBeInTheDocument();
  });

  it("busca promoção e, quando houver desconto, mostra '-X% OFF' e usa preço final no AddToCartButton", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);

    // Seta a promoção antes de renderizar (SWR mockado retorna swrPromoData)
    swrPromoData = { original_price: 100, final_price: 80, discount_percent: 20 };

    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct({ price: 100 }) as any} />);

    // Assert
    expect(screen.getByText(/-20% OFF/i)).toBeInTheDocument();
    expect(screen.getByText("R$ 80,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();

    const lastCall =
      addToCartSpy.mock.calls[addToCartSpy.mock.calls.length - 1]?.[0];
    expect(lastCall.product.price).toBe(80);
  });

  it("quando promoção retorna 404, não mostra badge de desconto e mantém preço base", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    swrPromoData = null; // sem promoção
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

    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);
    const favBtn = getFavoriteButtonRobust();
    fireEvent.click(favBtn);

    // Assert
    expect(window.location.href).toBe("/login");
    expect(apiClientPostMock).not.toHaveBeenCalled();
    expect(apiClientDelMock).not.toHaveBeenCalled();
  });

  it("favorito: com user logado, POST adiciona favorito com body correto e alterna aria-pressed", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = { id: 1 }; // cookie-based auth, sem token necessário

    apiClientPostMock.mockResolvedValueOnce({});

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

    expect(apiClientPostMock).toHaveBeenCalledTimes(1);
    expect(apiClientPostMock).toHaveBeenCalledWith("/api/favorites", {
      productId: 105,
    });
  });

  it("favorito: DELETE remove favorito quando initialIsFavorite=true", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = { id: 1 };

    apiClientDelMock.mockResolvedValueOnce({});

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

    expect(apiClientDelMock).toHaveBeenCalledTimes(1);
    expect(apiClientDelMock).toHaveBeenCalledWith("/api/favorites/105");
  });

  it("favorito: se apiClient lançar erro, faz rollback do estado (negativo)", async () => {
    // Arrange
    resolveStockValueMock.mockReturnValue(5);
    currentUser = { id: 1 };

    apiClientPostMock.mockRejectedValueOnce(new Error("Network error"));

    const ProductCard = (await import("@/components/products/ProductCard"))
      .default;

    // Act
    render(<ProductCard product={baseProduct()} />);
    const favBtn = getFavoriteButtonRobust();

    expect(favBtn).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      fireEvent.click(favBtn);
    });

    // Assert: toggle otimista -> rollback para false
    await waitFor(() => {
      expect(favBtn).toHaveAttribute("aria-pressed", "false");
    });
  });
});
