import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

import SearchBar from "@/components/ui/SearchBar";

/* =========================
   Mocks obrigatórios
========================= */

// next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// CartContext
const addToCartMock = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    addToCart: addToCartMock,
  }),
}));

// react-icons
vi.mock("react-icons/fa", () => ({
  FaSearch: () => <span data-testid="icon-search" />,
  FaCartPlus: () => <span data-testid="icon-cart" />,
}));

/* =========================
   Helpers
========================= */

const flushMicrotasks = async () => {
  // React/Promises flush (microtasks)
  await Promise.resolve();
  await Promise.resolve();
};

type MockPayload = { ok?: boolean; json?: any };

function makeFetchResponse(payload: MockPayload) {
  return {
    ok: payload.ok ?? true,
    json: async () => payload.json,
  };
}

function mockFetchByEndpoint(params: { products: MockPayload; servicos: MockPayload }) {
  (global.fetch as any) = vi.fn(async (url: string) => {
    const u = String(url);

    if (u.includes("/products/search")) return makeFetchResponse(params.products);
    if (u.includes("/public/servicos")) return makeFetchResponse(params.servicos);

    return makeFetchResponse({ ok: true, json: { data: [] } });
  });
}

function createDeferred<T = any>() {
  let resolve!: (v: T) => void;
  let reject!: (e: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function typeAndRunDebounce(q: string) {
  const input = screen.getByRole("textbox", { name: "Buscar" });

  // dropdown só aparece com focus
  await act(async () => {
    fireEvent.focus(input);
  });

  await act(async () => {
    fireEvent.change(input, { target: { value: q } });
  });

  // roda o debounce (350ms) e deixa Promises assentarem
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
    await flushMicrotasks();
  });

  // flush extra para garantir que setResults/setOpen renderizam
  await act(async () => {
    await flushMicrotasks();
  });

  return input as HTMLInputElement;
}

describe("SearchBar (src/components/SearchBar.tsx)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    pushMock.mockClear();
    addToCartMock.mockClear();

    // default: fetch vazio
    mockFetchByEndpoint({
      products: { ok: true, json: { data: [] } },
      servicos: { ok: true, json: { data: [] } },
    });
  });

  afterEach(async () => {
    // importante: drenar timers do useEffect do componente dentro de act
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
      await flushMicrotasks();
    });

    cleanup();
    vi.useRealTimers();
  });

  it("renderiza input e botão de pesquisa (controle)", () => {
    render(<SearchBar />);

    expect(screen.getByRole("textbox", { name: "Buscar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pesquisar" })).toBeInTheDocument();
  });

  it("não dispara busca se query estiver vazia (negativo)", async () => {
    render(<SearchBar />);

    const input = screen.getByRole("textbox", { name: "Buscar" });

    await act(async () => {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "   " } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
      await flushMicrotasks();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("dispara busca após debounce e renderiza resultados (produto + serviço)", async () => {
    // Arrange
    mockFetchByEndpoint({
      products: {
        ok: true,
        json: { products: [{ id: 1, name: "Produto A", price: 10, images: ["a.jpg"] }] },
      },
      servicos: {
        ok: true,
        json: { data: [{ id: 2, nome: "Serviço B", preco: 20, imagem: "b.jpg" }] },
      },
    });

    render(<SearchBar />);

    // Act
    await typeAndRunDebounce("tes");

    // Assert (sem waitFor/findByText com fake timers)
    expect(screen.getByText("Produto A")).toBeInTheDocument();
    expect(screen.getByText("Serviço B")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("mostra estado de carregamento enquanto busca (positivo)", async () => {
    // Arrange: promises pendentes para segurar loading=true
    const prodDef = createDeferred<any>();
    const servDef = createDeferred<any>();

    (global.fetch as any) = vi.fn((url: string) => {
      const u = String(url);
      if (u.includes("/products/search")) return prodDef.promise;
      if (u.includes("/public/servicos")) return servDef.promise;
      return Promise.resolve(makeFetchResponse({ ok: true, json: { data: [] } }));
    });

    render(<SearchBar />);

    const input = screen.getByRole("textbox", { name: "Buscar" });

    // Act
    await act(async () => {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "abc" } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
      await flushMicrotasks();
    });

    // Assert (open=true via focus + loading=true)
    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    // Cleanup: resolve para não deixar pendurado
    prodDef.resolve(makeFetchResponse({ ok: true, json: { data: [] } }));
    servDef.resolve(makeFetchResponse({ ok: true, json: { data: [] } }));

    await act(async () => {
      await flushMicrotasks();
    });
  });

  it("mostra mensagem de nenhum resultado quando API retorna vazio (negativo)", async () => {
    // Arrange
    mockFetchByEndpoint({
      products: { ok: true, json: { data: [] } },
      servicos: { ok: true, json: { data: [] } },
    });

    render(<SearchBar />);

    // Act
    await typeAndRunDebounce("zzz");

    // Assert
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
  });

  it("navega para produto ao clicar em um item (positivo)", async () => {
    // Arrange
    mockFetchByEndpoint({
      products: { ok: true, json: { data: [{ id: 10, name: "Produto X", price: 30 }] } },
      servicos: { ok: true, json: { data: [] } },
    });

    render(<SearchBar />);

    // Act
    await typeAndRunDebounce("prod");

    // o item é <p> dentro do <li> com onMouseDown no <li>.
    // mousedown no texto bubble -> li
    await act(async () => {
      fireEvent.mouseDown(screen.getByText("Produto X"));
    });

    // Assert
    expect(pushMock).toHaveBeenCalledWith("/produtos/10");
  });

  it("adiciona produto ao carrinho ao clicar no ícone (positivo)", async () => {
    // Arrange
    mockFetchByEndpoint({
      products: { ok: true, json: { data: [{ id: 5, name: "Produto Carrinho", price: 99 }] } },
      servicos: { ok: true, json: { data: [] } },
    });

    render(<SearchBar />);

    // Act
    await typeAndRunDebounce("cart");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));
    });

    // Assert
    expect(addToCartMock).toHaveBeenCalledTimes(1);
    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        name: "Produto Carrinho",
        quantity: 1,
      })
    );
  });

  it("tecla Enter navega para /busca quando nenhum item está selecionado (positivo)", async () => {
    render(<SearchBar />);

    const input = screen.getByRole("textbox", { name: "Buscar" });

    await act(async () => {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "banana" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(pushMock).toHaveBeenCalledWith("/busca?q=banana");
  });

  it("Escape fecha a lista (negativo)", async () => {
    // Arrange
    mockFetchByEndpoint({
      products: { ok: true, json: { data: [{ id: 1, name: "Item Escape", price: 10 }] } },
      servicos: { ok: true, json: { data: [] } },
    });

    render(<SearchBar />);

    // Act
    const input = await typeAndRunDebounce("esc");
    expect(screen.getByText("Item Escape")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(input, { key: "Escape" });
    });

    // Assert
    expect(screen.queryByText("Item Escape")).not.toBeInTheDocument();
  });

  it("ArrowDown/ArrowUp não quebram e mantém resultados visíveis (controle)", async () => {
    // Arrange
    mockFetchByEndpoint({
      products: {
        ok: true,
        json: {
          data: [
            { id: 1, name: "Item 1", price: 10 },
            { id: 2, name: "Item 2", price: 20 },
          ],
        },
      },
      servicos: { ok: true, json: { data: [] } },
    });

    render(<SearchBar />);

    // Act
    const input = await typeAndRunDebounce("it");
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowUp" });
    });

    // Assert estável
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
});
