// src/__tests__/motorista/rota-page.test.tsx
//
// Comportamento testado: estado offline + estado vazio da página
// "minha rota de hoje" do motorista. Cobre 5 casos:
//   1. Online com dados — renderiza rota normalmente
//   2. Offline + sem cache — OfflineEmptyState e zero toast
//   3. Offline + cache válido — usa cache + toast informativo
//   4. Online + erro de API — toast.error 1x
//   4b. Offline + sem cache + erro de API — sem toast (estado vazio cobre)
//
// Por que findBy* em vez de waitFor+getBy*:
//   findBy* tem retry interno e roda dentro de act() automaticamente.
//   Substitui o padrão "await waitFor(() => expect(getByText).inDoc)"
//   que dispara warnings de act() em React 19 quando o effect que
//   atualiza o estado (apiClient.get → setRota) resolve fora de
//   uma boundary explícita.
//
// Cleanup do DOM entre testes é responsabilidade do vitest.setup.ts
// (afterEach(cleanup) global). Aqui só restauramos navigator.onLine.

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

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

// Import estático em vez de dynamic. Razão: dynamic import (`await
// import(...)`) só faz sentido se for combinado com vi.resetModules()
// para forçar re-import "fresh". Sem isso, retorna o módulo cacheado
// igual ao import estático — mas com side-effect de timing (cada
// `await import` vira microtask extra). No pool de threads do Vitest
// pré-fix, o cache de módulos vazava entre arquivos, e o dynamic
// import + ordering com outras suítes causava timeout intermitente
// no Caso 1. Static import + pool:'forks' (vitest.config.ts) elimina
// ambas as variáveis.
//
// O `vi.mock` hoisted continua aplicando os mocks ANTES deste import
// — comportamento idêntico ao dynamic import original, sem race.
import MotoristaRotaPage from "@/app/motorista/rota/page";

function renderPage() {
  return render(<MotoristaRotaPage />);
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

    renderPage();

    // findByText: aguarda a resolução do useEffect→load() que dispara
    // setRota. Diferente de getByText, roda em act() interno e tem
    // timeout próprio (default 1000ms) — sem precisar de waitFor.
    expect(
      await screen.findByText(/Rota de 2026-04-27/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Norte · ABC-1234/)).toBeInTheDocument();

    // Estado offline NÃO deve renderizar nem nenhum toast disparar
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

    renderPage();

    // findByText resolve quando o estado offline-sem-cache estabiliza
    // após o reject + setLoading(false). Garante que a assertion roda
    // depois das atualizações finais — evita pegar DOM intermediário.
    expect(
      await screen.findByText(
        /Você está sem internet e ainda não temos dados/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tentar novamente/i }),
    ).toBeInTheDocument();

    // ZERO toasts — nem erro nem info (decisão de produto: o
    // OfflineEmptyState já comunica tudo que precisa)
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockToastFn).not.toHaveBeenCalled();
  });

  it("Caso 3 — offline + cache: renderiza rota normal, sem toast.error, com toast informativo 1x", async () => {
    setNavigatorOnline(false);
    mockUseOnlineStatus.mockReturnValue(false);
    mockGet.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    mockReadCachedRota.mockReturnValue(fakeRota);

    renderPage();

    expect(
      await screen.findByText(/Rota de 2026-04-27/),
    ).toBeInTheDocument();

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

    renderPage();

    // "Sem rota para hoje" é o estado vazio padrão (online, sem rota
    // atribuída, com erro). Aguardar esse texto sincroniza com o
    // término do load(); o toast.error é chamado durante o catch
    // antes do setRota(null), então quando o texto aparece o toast
    // já foi disparado.
    expect(
      await screen.findByText(/Sem rota para hoje/i),
    ).toBeInTheDocument();
    expect(mockToastError).toHaveBeenCalledTimes(1);
    // OfflineEmptyState NÃO renderiza quando online
    expect(
      screen.queryByText(/Você está sem internet/i),
    ).not.toBeInTheDocument();
  });

  it("Caso 4b — offline + sem cache + erro de API: toast.error NÃO chamado", async () => {
    setNavigatorOnline(false);
    mockUseOnlineStatus.mockReturnValue(false);
    mockGet.mockRejectedValueOnce(new Error("boom"));
    mockReadCachedRota.mockReturnValue(null);

    renderPage();

    expect(
      await screen.findByText(
        /Você está sem internet e ainda não temos dados/i,
      ),
    ).toBeInTheDocument();
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
