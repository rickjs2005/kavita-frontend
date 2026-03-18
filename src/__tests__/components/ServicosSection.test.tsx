// src/__tests__/components/ServicosSection.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";

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
 */
type ServiceCardProps = {
  servico?: { nome?: string; images?: unknown };
  href?: unknown;
  readOnly?: boolean;
};

const ServiceCardMock = vi.fn((props: ServiceCardProps) => {
  const nome = props?.servico?.nome ?? "SEM_NOME";
  const imagesLen = Array.isArray(props?.servico?.images)
    ? props.servico!.images!.length
    : "NA";

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
 * Mock de apiClient — a produção usa apiClient.get() (não fetch direto)
 */
const apiClientGetMock = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: any[]) => apiClientGetMock(...args),
  },
}));

/**
 * ResizeObserver mock como CLASSE (construtor real).
 */
let lastROTrigger: (() => void) | null = null;

class ResizeObserverMock {
  private cb: ResizeObserverCallback;
  private elements: Element[] = [];

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;

    lastROTrigger = () => {
      const entries = this.elements.map((el) => ({
        target: el,
      })) as unknown as ResizeObserverEntry[];
      this.cb(entries, undefined as unknown as ResizeObserver);
    };
  }

  observe = (el: Element) => {
    this.elements.push(el);
  };

  disconnect = () => {
    this.elements = [];
  };

  trigger = () => {
    lastROTrigger?.();
  };
}

describe("ServicosSection (src/components/layout/ServicosSection.tsx)", () => {
  beforeEach(() => {
    ServiceCardMock.mockClear();
    apiClientGetMock.mockReset();
    lastROTrigger = null;

    // ResizeObserver precisa ser construtor real
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      ResizeObserverMock;

    // scrollBy (jsdom pode não ter)
    if (!HTMLElement.prototype.scrollBy) {
      (HTMLElement.prototype as any).scrollBy = vi.fn();
    } else {
      vi.spyOn(HTMLElement.prototype as any, "scrollBy").mockImplementation(
        () => {},
      );
    }
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    lastROTrigger = null;
  });

  it("renderiza header e links fixos e mostra skeletons durante loading (positivo/controle)", async () => {
    // Arrange: apiClient pendente
    let resolveApiCall: ((value: any) => void) | undefined;
    apiClientGetMock.mockReturnValueOnce(
      new Promise<any>((res) => {
        resolveApiCall = res;
      }),
    );

    // Act
    const { container } = render(<ServicosSection />);

    // Assert (header)
    expect(
      screen.getByRole("heading", { name: "Serviços" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Rede de serviços do campo/i)).toBeInTheDocument();

    // links
    expect(
      screen.getByRole("link", { name: /Ver todos os profissionais/i }),
    ).toHaveAttribute("href", "/servicos");
    expect(
      screen.getByRole("link", { name: /Quero prestar serviços/i }),
    ).toHaveAttribute("href", "/trabalhe-conosco");

    // Skeletons: 3 cards * (imagem + 2 linhas) = 9 blocos animate-pulse
    const skeletonBlocks = container.querySelectorAll(".animate-pulse");
    expect(skeletonBlocks.length).toBe(9);

    // resolve p/ não deixar promise pendurada
    resolveApiCall?.([]);

    await waitFor(() => {
      expect(apiClientGetMock).toHaveBeenCalledTimes(1);
    });
  });

  it("faz GET em /api/public/servicos e renderiza lista com ServiceCard; normaliza images (positivo)", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce([
      { id: 1, nome: "Veterinário", images: ["a.png"] },
      { id: 2, nome: "Técnico em irrigação" }, // sem images -> []
    ]);

    // Act
    render(<ServicosSection />);

    // Assert — verificamos que apiClient foi chamado com o path correto
    await waitFor(() => expect(apiClientGetMock).toHaveBeenCalledTimes(1));
    const [path] = apiClientGetMock.mock.calls[0];
    expect(path).toMatch(/\/api\/public\/servicos$/);

    // cards
    await waitFor(() => {
      expect(screen.getAllByTestId("service-card").length).toBe(2);
    });

    expect(screen.getByText("Veterinário")).toBeInTheDocument();
    expect(screen.getAllByTestId("service-card-href")[0]).toHaveTextContent(
      "/servicos/1",
    );
    expect(screen.getAllByTestId("service-card-readonly")[0]).toHaveTextContent(
      "true",
    );
    expect(
      screen.getAllByTestId("service-card-images-len")[0],
    ).toHaveTextContent("1");

    expect(screen.getByText("Técnico em irrigação")).toBeInTheDocument();
    expect(screen.getAllByTestId("service-card-href")[1]).toHaveTextContent(
      "/servicos/2",
    );
    expect(
      screen.getAllByTestId("service-card-images-len")[1],
    ).toHaveTextContent("0");
  });

  it("normaliza payload quando API retorna em chaves (ex: data.items) (positivo)", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce({
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
    expect(screen.getByTestId("service-card-href")).toHaveTextContent(
      "/servicos/10",
    );
    expect(screen.getByTestId("service-card-images-len")).toHaveTextContent(
      "0",
    );
  });

  it("quando fetch ok retorna vazio, mostra mensagem 'Nenhum serviço cadastrado ainda.' (negativo/sem resultados)", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce([]);

    // Act
    render(<ServicosSection />);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(/Nenhum serviço cadastrado ainda\./i),
      ).toBeInTheDocument();
    });
    expect(ServiceCardMock).not.toHaveBeenCalled();
  });

  it("quando fetch falha, mostra mensagem de erro amigável (negativo)", async () => {
    // Arrange — apiClient.get lança erro (simula res.ok=false)
    const { ApiError } = await import("@/lib/errors");
    apiClientGetMock.mockRejectedValueOnce(
      new ApiError({ status: 500, message: "Internal Server Error" }),
    );

    // Silencia console.error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    render(<ServicosSection />);

    // Assert: formatApiError usa err.message quando é ApiError,
    // portanto exibe "Internal Server Error" (não o fallback)
    await waitFor(() => {
      expect(
        screen.getByText("Internal Server Error"),
      ).toBeInTheDocument();
    });
    expect(ServiceCardMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("quando há overflow, exibe botões e clicar chama scrollBy com dx esperado (positivo)", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce([
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

    const scroller = container.querySelector(
      ".overflow-x-auto",
    ) as HTMLElement | null;
    expect(scroller).toBeTruthy();

    // força overflow
    Object.defineProperty(scroller!, "clientWidth", {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(scroller!, "scrollWidth", {
      value: 700,
      configurable: true,
    });

    // dispara ResizeObserver check
    expect(lastROTrigger).toBeTruthy();
    lastROTrigger?.();

    const btnPrev = await screen.findByRole("button", {
      name: /Voltar lista de serviços/i,
    });
    const btnNext = await screen.findByRole("button", {
      name: /Avançar lista de serviços/i,
    });

    fireEvent.click(btnPrev);
    expect(scrollBySpy).toHaveBeenCalledWith({
      left: -320,
      behavior: "smooth",
    });

    fireEvent.click(btnNext);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: 320, behavior: "smooth" });
  });

  it("no unmount, não lança erro (cleanup do efeito) (controle)", async () => {
    // Arrange: promise pendente (nunca resolve)
    apiClientGetMock.mockReturnValueOnce(new Promise(() => {}));

    // Act
    const { unmount } = render(<ServicosSection />);

    // Não deve lançar ao desmontar
    expect(() => unmount()).not.toThrow();
  });
});
