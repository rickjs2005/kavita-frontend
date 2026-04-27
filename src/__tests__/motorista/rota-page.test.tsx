import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// ---- Mocks (vi.mock is hoisted; closures resolve lazily) -------------------

const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

const mockToastFn = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("react-hot-toast", () => {
  // toast is callable AND has .success / .error properties
  const callable = (...a: unknown[]) => mockToastFn(...a);
  return {
    default: Object.assign(callable, {
      success: (...a: unknown[]) => mockToastSuccess(...a),
      error: (...a: unknown[]) => mockToastError(...a),
    }),
  };
});

const mockUseOnlineStatus = vi.fn();
vi.mock("@/hooks/useOnlineStatus", () => ({
  __esModule: true,
  default: () => mockUseOnlineStatus(),
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

const mockReadCachedRota = vi.fn();
const mockCacheRota = vi.fn();
const mockExecuteWithOffline = vi.fn();
vi.mock("@/lib/rotas/offline", () => ({
  cacheRota: (...a: unknown[]) => mockCacheRota(...a),
  readCachedRota: () => mockReadCachedRota(),
  executeWithOffline: (...a: unknown[]) => mockExecuteWithOffline(...a),
  // OfflineBanner imports these — provide harmless stubs in case the
  // banner mock below somehow doesn't kick in
  readQueue: () => [],
  replayQueue: vi.fn().mockResolvedValue({ processed: 0, remaining: 0 }),
  registerOnlineReplayer: vi.fn(),
  subscribeQueue: () => () => {},
}));

// Replace the persistent top banner with a no-op so it doesn't pull
// real listeners into the test render. Out of scope for this page test.
vi.mock("@/app/motorista/_components/OfflineBanner", () => ({
  __esModule: true,
  default: () => null,
}));

const mockRouterReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockRouterReplace,
    prefetch: vi.fn(),
  }),
  usePathname: () => "/motorista/rota",
}));

// ---- Helpers ---------------------------------------------------------------

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
    writable: true,
  });
}

const fakeRota = {
  id: 42,
  data_programada: "2026-04-27",
  status: "pronta" as const,
  total_entregues: 0,
  total_paradas: 0,
  paradas: [] as never[],
  regiao_label: "Norte",
  veiculo: "ABC-1234",
};

async function renderPage() {
  const { default: Page } = await import("@/app/motorista/rota/page");
  return render(<Page />);
}

// ---- Tests -----------------------------------------------------------------

describe("MotoristaRotaPage — offline empty state behaviour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNavigatorOnline(true);
    mockUseOnlineStatus.mockReturnValue(true);
    mockReadCachedRota.mockReturnValue(null);
  });

  afterEach(() => {
    setNavigatorOnline(true);
  });

  it("Caso 1 — online com dados: renderiza rota normalmente", async () => {
    mockGet.mockResolvedValueOnce(fakeRota);

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Rota de 2026-04-27/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Norte · ABC-1234/)).toBeInTheDocument();

    // No empty state, no error toasts
    expect(
      screen.queryByText(/Você está sem internet/i),
    ).not.toBeInTheDocument();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("Caso 2 — offline + sem cache: renderiza OfflineEmptyState e NÃO dispara toast", async () => {
    setNavigatorOnline(false);
    mockUseOnlineStatus.mockReturnValue(false);
    mockGet.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    mockReadCachedRota.mockReturnValue(null);

    await renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Você está sem internet e ainda não temos dados/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /tentar novamente/i }),
    ).toBeInTheDocument();

    // ZERO toasts — neither error nor info
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockToastFn).not.toHaveBeenCalled();
  });

  it("Caso 3 — offline + cache: renderiza rota normal, sem toast.error, com toast informativo 1x", async () => {
    setNavigatorOnline(false);
    mockUseOnlineStatus.mockReturnValue(false);
    mockGet.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    mockReadCachedRota.mockReturnValue(fakeRota);

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Rota de 2026-04-27/)).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Você está sem internet/i),
    ).not.toBeInTheDocument();
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockToastFn).toHaveBeenCalledTimes(1);
    expect(mockToastFn).toHaveBeenCalledWith(
      expect.stringMatching(/mostrando dados salvos/i),
    );
  });

  it("Caso 4 — online + erro de API: renderiza estado vazio padrão, toast.error chamado exatamente 1x", async () => {
    setNavigatorOnline(true);
    mockUseOnlineStatus.mockReturnValue(true);
    mockGet.mockRejectedValueOnce(new Error("boom"));
    mockReadCachedRota.mockReturnValue(null);

    await renderPage();

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
    // OfflineEmptyState não renderiza quando online
    expect(
      screen.queryByText(/Você está sem internet/i),
    ).not.toBeInTheDocument();
  });

  it("Caso 4b — offline + sem cache + erro de API: toast.error NÃO chamado", async () => {
    setNavigatorOnline(false);
    mockUseOnlineStatus.mockReturnValue(false);
    mockGet.mockRejectedValueOnce(new Error("boom"));
    mockReadCachedRota.mockReturnValue(null);

    await renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Você está sem internet e ainda não temos dados/i),
      ).toBeInTheDocument();
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
