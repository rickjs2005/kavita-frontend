// src/__tests__/components/ServicosSection.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";

// Ajuste o import se seu path for diferente:
import ServicosSection from "../../components/layout/ServicosSection";

/**
 * next/link mock (renderiza <a />)
 */
vi.mock("next/link", () => {
  return {
    default: function LinkMock({
      href,
      children,
      ...props
    }: {
      href: unknown;
      children: React.ReactNode;
    }) {
      return (
        <a href={typeof href === "string" ? href : String(href)} {...props}>
          {children}
        </a>
      );
    },
  };
});

/**
 * ServiceCard mock para asserts estáveis
 * IMPORTANTE: o caminho precisa bater com o import real do ServicosSection.
 */
type ServiceCardProps = {
  servico?: { nome?: string; images?: unknown };
  href?: unknown;
  readOnly?: boolean;
};

const ServiceCardMock = vi.fn((props: ServiceCardProps) => {
  const nome = props?.servico?.nome ?? "SEM_NOME";
  const imagesLen = Array.isArray(props?.servico?.images) ? props.servico!.images!.length : "NA";

  return (
    <div data-testid="service-card">
      <div data-testid="service-card-name">{nome}</div>
      <div data-testid="service-card-href">{String(props?.href ?? "")}</div>
      <div data-testid="service-card-readonly">{String(!!props?.readOnly)}</div>
      <div data-testid="service-card-images-len">{String(imagesLen)}</div>
    </div>
  );
});

vi.mock("../../components/layout/ServiceCard", () => {
  return {
    default: function ServiceCardProxy(props: ServiceCardProps) {
      return ServiceCardMock(props);
    },
  };
});

/**
 * ResizeObserver mock como CLASSE (construtor real).
 * Também fornece trigger manual para simular resize.
 *
 * ✅ Corrige ESLint @typescript-eslint/no-this-alias:
 * - não fazemos lastRO = this
 * - guardamos só uma função "lastROTrigger"
 */
let lastROTrigger: (() => void) | null = null;

class ResizeObserverMock {
  private cb: ResizeObserverCallback;
  private elements: Element[] = [];

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;

    // guarda função de trigger sem "aliasar" this em variável
    lastROTrigger = () => {
      const entries = this.elements.map((el) => ({ target: el })) as unknown as ResizeObserverEntry[];
      // 2º parâmetro é opcional; passamos undefined
      this.cb(entries, undefined as unknown as ResizeObserver);
    };
  }

  observe = (el: Element) => {
    this.elements.push(el);
  };

  disconnect = () => {
    this.elements = [];
  };

  // mantemos para compatibilidade (não precisa usar no teste)
  trigger = () => {
    lastROTrigger?.();
  };
}

/**
 * AbortController mock (valida cleanup abort)
 */
const abortSpy = vi.fn();
class AbortControllerMock {
  signal: { __mockSignal: true };

  constructor() {
    this.signal = { __mockSignal: true };
  }

  abort() {
    abortSpy();
  }
}

function mockFetchOkJson(payload: unknown) {
  globalThis.fetch = vi.fn(() => {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve(JSON.stringify(payload)),
    } as unknown as Response);
  }) as unknown as typeof fetch;
}

function mockFetchOkText(text: string) {
  globalThis.fetch = vi.fn(() => {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve(text),
    } as unknown as Response);
  }) as unknown as typeof fetch;
}

function mockFetchFail(text: string, status = 500) {
  globalThis.fetch = vi.fn(() => {
    return Promise.resolve({
      ok: false,
      status,
      statusText: "ERR",
      text: () => Promise.resolve(text),
    } as unknown as Response);
  }) as unknown as typeof fetch;
}

describe("ServicosSection (src/components/layout/ServicosSection.tsx)", () => {
  beforeEach(() => {
    ServiceCardMock.mockClear();
    abortSpy.mockClear();
    lastROTrigger = null;

    // ResizeObserver precisa ser construtor real
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;

    // AbortController
    (globalThis as unknown as { AbortController: unknown }).AbortController = AbortControllerMock as unknown;

    // scrollBy (jsdom pode não ter)
    if (!HTMLElement.prototype.scrollBy) {
      (HTMLElement.prototype as any).scrollBy = vi.fn();
    } else {
      vi.spyOn(HTMLElement.prototype as any, "scrollBy").mockImplementation(() => {});
    }
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    lastROTrigger = null;
  });

  it("renderiza header e links fixos e mostra skeletons durante loading (positivo/controle)", async () => {
    // Arrange: fetch pendente
    let resolveFetch: ((value: Response) => void) | undefined;

    globalThis.fetch = vi.fn(() => {
      return new Promise<Response>((res) => {
        resolveFetch = res;
      });
    }) as unknown as typeof fetch;

    // Act
    const { container } = render(<ServicosSection />);

    // Assert (header)
    expect(screen.getByRole("heading", { name: "Serviços" })).toBeInTheDocument();
    expect(screen.getByText(/Rede de serviços do campo/i)).toBeInTheDocument();

    // links
    expect(screen.getByRole("link", { name: /Ver todos os profissionais/i })).toHaveAttribute("href", "/servicos");
    expect(screen.getByRole("link", { name: /Quero prestar serviços/i })).toHaveAttribute(
      "href",
      "/trabalhe-conosco"
    );

    // Skeletons: 3 cards * (imagem + 2 linhas) = 9 blocos animate-pulse
    const skeletonBlocks = container.querySelectorAll(".animate-pulse");
    expect(skeletonBlocks.length).toBe(9);

    // resolve fetch p/ não deixar promise pendurada
    resolveFetch?.({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "[]",
    } as unknown as Response);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("faz fetch em /api/public/servicos e renderiza lista com ServiceCard; normaliza images (positivo)", async () => {
    // Arrange
    mockFetchOkJson([
      { id: 1, nome: "Veterinário", images: ["a.png"] },
      { id: 2, nome: "Técnico em irrigação" }, // sem images -> []
    ]);

    // Act
    render(<ServicosSection />);

    // Assert fetch params
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    const [url, init] = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0] as [
      unknown,
      RequestInit | undefined
    ];

    expect(String(url)).toMatch(/\/api\/public\/servicos$/);
    expect(init?.cache).toBe("no-store");
    expect((init as { signal?: unknown } | undefined)?.signal).toMatchObject({ __mockSignal: true });

    // cards
    await waitFor(() => {
      expect(screen.getAllByTestId("service-card").length).toBe(2);
    });

    expect(screen.getByText("Veterinário")).toBeInTheDocument();
    expect(screen.getAllByTestId("service-card-href")[0]).toHaveTextContent("/servicos/1");
    expect(screen.getAllByTestId("service-card-readonly")[0]).toHaveTextContent("true");
    expect(screen.getAllByTestId("service-card-images-len")[0]).toHaveTextContent("1");

    expect(screen.getByText("Técnico em irrigação")).toBeInTheDocument();
    expect(screen.getAllByTestId("service-card-href")[1]).toHaveTextContent("/servicos/2");
    expect(screen.getAllByTestId("service-card-images-len")[1]).toHaveTextContent("0");
  });

  it("normaliza payload quando API retorna em chaves (ex: data.items) (positivo)", async () => {
    // Arrange
    mockFetchOkJson({
      data: {
        items: [{ id: 10, nome: "Eletricista rural", images: null }],
      },
    });

    // Act
    render(<ServicosSection />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("service-card").length).toBe(1);
    });

    expect(screen.getByText("Eletricista rural")).toBeInTheDocument();
    expect(screen.getByTestId("service-card-href")).toHaveTextContent("/servicos/10");
    expect(screen.getByTestId("service-card-images-len")).toHaveTextContent("0");
  });

  it("quando fetch ok retorna vazio, mostra mensagem 'Nenhum serviço cadastrado ainda.' (negativo/sem resultados)", async () => {
    // Arrange
    mockFetchOkText("[]");

    // Act
    render(<ServicosSection />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Nenhum serviço cadastrado ainda\./i)).toBeInTheDocument();
    });
    expect(ServiceCardMock).not.toHaveBeenCalled();
  });

  it("quando fetch falha (res.ok=false), mostra mensagem de erro amigável (negativo)", async () => {
    // Arrange
    mockFetchFail("falhou", 500);

    // Silencia console.error caso o componente logue (sem exigir que logue)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    render(<ServicosSection />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Não foi possível carregar os serviços.")).toBeInTheDocument();
    });
    expect(ServiceCardMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("quando há overflow, exibe botões e clicar chama scrollBy com dx esperado (positivo)", async () => {
    // Arrange
    mockFetchOkJson([
      { id: 1, nome: "Serviço 1" },
      { id: 2, nome: "Serviço 2" },
      { id: 3, nome: "Serviço 3" },
    ]);

    const scrollBySpy = vi.spyOn(HTMLElement.prototype as any, "scrollBy");

    // Act
    const { container } = render(<ServicosSection />);

    await waitFor(() => {
      expect(screen.getAllByTestId("service-card").length).toBe(3);
    });

    const scroller = container.querySelector(".overflow-x-auto") as HTMLElement | null;
    expect(scroller).toBeTruthy();

    // força overflow
    Object.defineProperty(scroller!, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(scroller!, "scrollWidth", { value: 700, configurable: true });

    // dispara ResizeObserver check
    expect(lastROTrigger).toBeTruthy();
    lastROTrigger?.();

    const btnPrev = await screen.findByRole("button", { name: /Voltar lista de serviços/i });
    const btnNext = await screen.findByRole("button", { name: /Avançar lista de serviços/i });

    fireEvent.click(btnPrev);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: -320, behavior: "smooth" });

    fireEvent.click(btnNext);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: 320, behavior: "smooth" });
  });

  it("no unmount, executa AbortController.abort (cleanup do efeito) (negativo/controle)", async () => {
    // Arrange: fetch pendente
    globalThis.fetch = vi.fn(() => {
      return new Promise<Response>(() => {});
    }) as unknown as typeof fetch;

    // Act
    const { unmount } = render(<ServicosSection />);
    unmount();

    // Assert
    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});