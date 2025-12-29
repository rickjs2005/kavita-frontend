import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import PromocoesHero from "@/components/products/DestaquesSection";

// ---------- Mocks padrão ----------
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * Mock de next/image:
 * remove props inválidas para DOM (ex: fill boolean),
 * evitando warnings do React.
 */
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, fill: _fill, ...props }: any) => <img alt={alt} {...props} />,
}));

const apiMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
}));

// ---------- Helpers ----------
const baseProduct = {
  id: 1,
  name: "Produto Teste",
  description: "Descrição do produto",
  original_price: 150,
  final_price: 100,
  discount_percent: 33,
  image: "uploads/produto.jpg",
  // meio-dia UTC evita “voltar um dia” no -03:00
  ends_at: "2025-12-31T12:00:00Z",
};

async function flushEffects() {
  // garante que o useEffect async que chama api() rode e aplique setState
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // IMPORTANTE: timers reais por padrão, para findBy/waitFor não travarem
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PromocoesHero (DestaquesSection)", () => {
  it("não renderiza nada quando API retorna lista vazia (negativo)", async () => {
    apiMock.mockResolvedValueOnce([]);

    const { container } = render(<PromocoesHero />);
    await flushEffects();

    expect(container.firstChild).toBeNull();
  });

  it("busca promoções na API correta (contrato)", async () => {
    apiMock.mockResolvedValueOnce([baseProduct]);

    render(<PromocoesHero />);

    // com timers reais, findByText é estável
    await screen.findByText("Produtos em Promoção");

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock).toHaveBeenCalledWith("/api/public/promocoes");
  });

  it("renderiza produto em promoção com nome, preço e desconto (positivo)", async () => {
    apiMock.mockResolvedValueOnce([baseProduct]);

    render(<PromocoesHero />);
    await screen.findByText("Produtos em Promoção");

    // nome aparece em mais de um lugar
    expect(screen.getAllByText("Produto Teste").length).toBeGreaterThan(0);

    expect(screen.getByText("R$ 100.00")).toBeInTheDocument();
    expect(screen.getByText("-33% OFF")).toBeInTheDocument();
  });

  it("exibe preço original riscado quando há desconto (positivo)", async () => {
    apiMock.mockResolvedValueOnce([baseProduct]);

    render(<PromocoesHero />);
    await screen.findByText("Produtos em Promoção");

    expect(screen.getByText("R$ 150.00")).toBeInTheDocument();
  });

  it("renderiza data de validade formatada (positivo)", async () => {
    apiMock.mockResolvedValueOnce([baseProduct]);

    render(<PromocoesHero />);
    await screen.findByText("Produtos em Promoção");

    const line = screen.getByText(/Válido até/i);
    expect(line.textContent).toMatch(/\b\d{2}\/\d{2}\b/);
    expect(line.textContent).toContain("31/12");
  });

  it("renderiza link correto para o produto (positivo)", async () => {
    apiMock.mockResolvedValueOnce([baseProduct]);

    render(<PromocoesHero />);
    await screen.findByText("Produtos em Promoção");

    const link = screen.getByRole("link", { name: /Ver oferta/i });
    expect(link).toHaveAttribute("href", "/produtos/1");
  });

  it("usa placeholder quando produto não possui imagem (negativo)", async () => {
    apiMock.mockResolvedValueOnce([{ ...baseProduct, image: null }]);

    render(<PromocoesHero />);
    await screen.findByText("Produtos em Promoção");

    const img = screen.getByAltText("Produto Teste") as HTMLImageElement;
    expect(img.src).toContain("via.placeholder.com");
  });

  it("renderiza bolinhas de navegação quando há mais de uma promoção (positivo)", async () => {
    apiMock.mockResolvedValueOnce([
      baseProduct,
      { ...baseProduct, id: 2, name: "Produto 2", image: "uploads/p2.jpg" },
    ]);

    render(<PromocoesHero />);
    await screen.findByText("Produtos em Promoção");

    const dots = screen.getAllByRole("button", { name: /Ir para promoção/i });
    expect(dots).toHaveLength(2);
  });

  it("permite navegar manualmente clicando nas bolinhas (positivo)", async () => {
    apiMock.mockResolvedValueOnce([
      baseProduct,
      { ...baseProduct, id: 2, name: "Produto 2", image: "uploads/p2.jpg" },
    ]);

    render(<PromocoesHero />);
    await screen.findByText("Produtos em Promoção");

    const dot2 = screen.getByRole("button", { name: "Ir para promoção 2" });

    act(() => {
      fireEvent.click(dot2);
    });

    expect(screen.getAllByText("Produto 2").length).toBeGreaterThan(0);
  });

  it("faz autoplay das promoções após o intervalo (positivo)", async () => {
    // fake timers SOMENTE aqui
    vi.useFakeTimers();

    apiMock.mockResolvedValueOnce([
      baseProduct,
      { ...baseProduct, id: 2, name: "Produto 2", image: "uploads/p2.jpg" },
    ]);

    render(<PromocoesHero />);
    await flushEffects();

    // agora já renderizou
    expect(screen.getAllByText("Produto Teste").length).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getAllByText("Produto 2").length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it("não inicia autoplay quando há apenas uma promoção (negativo)", async () => {
    // fake timers SOMENTE aqui
    vi.useFakeTimers();

    apiMock.mockResolvedValueOnce([baseProduct]);

    render(<PromocoesHero />);
    await flushEffects();

    act(() => {
      vi.advanceTimersByTime(12000);
    });

    expect(screen.getAllByText("Produto Teste").length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it("não quebra quando API lança erro (negativo/robustez)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    apiMock.mockRejectedValueOnce(new Error("Erro API"));

    const { container } = render(<PromocoesHero />);
    await flushEffects();

    expect(container.firstChild).toBeNull();

    // aqui o componente faz console.error no catch
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });
});
