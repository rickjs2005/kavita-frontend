// src/__tests__/components/painel-corretora/CurrentPlanBadge.test.tsx
//
// Fluxo crítico: badge do plano atual no painel. Mostra ao corretor
// (a) qual plano está pagando, (b) se está em trial e quanto falta,
// (c) se expirou e precisa reativar. Quebrar isso = corretora pode
// achar que está ativa quando não está, ou perder upgrade timing.
//
// Cobertura focada em comportamento:
//   - Busca via GET /api/corretora/plan
//   - Não renderiza nada quando o fetch falha (silent — design do componente)
//   - Exibe nome do plano após fetch
//   - Alerta de trial expirando aparece quando trial_ends_at <= 14 dias
//   - Alerta de plano expirado aparece quando subscription.status='expired'

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CurrentPlanBadge } from "@/components/painel-corretora/CurrentPlanBadge";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...a: unknown[]) => mockGet(...a),
  },
}));

// next/link: renderiza como <a> normal pra inspeção de href
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname ?? "#"} {...rest}>
      {children}
    </a>
  ),
}));

// ---- Helpers ---------------------------------------------------------------

function isoInDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

// ---- Tests -----------------------------------------------------------------

describe("CurrentPlanBadge — fluxo crítico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza nada quando o fetch ainda não resolveu", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // pendente
    const { container } = render(<CurrentPlanBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("não renderiza nada quando o fetch falha (comportamento silencioso)", async () => {
    mockGet.mockRejectedValue(new Error("Erro"));
    const { container } = render(<CurrentPlanBadge />);
    // Nada visível depois da falha — design intencional pra não poluir
    // o painel com erros transientes do endpoint de plano.
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("exibe nome do plano após GET /api/corretora/plan resolver", async () => {
    mockGet.mockResolvedValue({
      plan: { slug: "pro", name: "Pro", price_cents: 9900 },
      status: "active",
      subscription: {
        id: 1,
        status: "active",
        current_period_end: isoInDays(30),
        trial_ends_at: null,
      },
    });

    render(<CurrentPlanBadge />);

    await waitFor(() => {
      expect(screen.getByText(/Plano Pro/i)).toBeInTheDocument();
    });
    // GET na rota canônica
    expect(mockGet).toHaveBeenCalledWith("/api/corretora/plan");
  });

  it("alerta de trial expirando aparece quando trial_ends_at <= 14 dias", async () => {
    mockGet.mockResolvedValue({
      plan: { slug: "pro", name: "Pro", price_cents: 9900 },
      status: "trialing",
      subscription: {
        id: 1,
        status: "trialing",
        current_period_end: null,
        trial_ends_at: isoInDays(7),
      },
    });

    render(<CurrentPlanBadge />);

    await waitFor(() => {
      expect(
        screen.getByText(/teste gratuito termina em/i),
      ).toBeInTheDocument();
    });
    // Link "Ver planos" aponta pra a rota correta de upgrade
    const link = screen.getByRole("link", { name: /Ver planos/i });
    expect(link.getAttribute("href")).toBe("/painel/corretora/planos");
  });

  it("NÃO mostra alerta de trial quando faltam > 14 dias", async () => {
    mockGet.mockResolvedValue({
      plan: { slug: "pro", name: "Pro", price_cents: 9900 },
      status: "trialing",
      subscription: {
        id: 1,
        status: "trialing",
        current_period_end: null,
        trial_ends_at: isoInDays(60),
      },
    });

    render(<CurrentPlanBadge />);

    await waitFor(() => {
      expect(screen.getByText(/Plano Pro/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/teste gratuito termina em/i),
    ).not.toBeInTheDocument();
  });

  it("alerta de plano expirado aparece quando subscription.status='expired'", async () => {
    mockGet.mockResolvedValue({
      plan: { slug: "free", name: "Free", price_cents: 0 },
      status: "expired",
      subscription: {
        id: 1,
        status: "expired",
        current_period_end: isoInDays(-1),
        trial_ends_at: isoInDays(-30),
      },
    });

    render(<CurrentPlanBadge />);

    await waitFor(() => {
      expect(
        screen.getByText(/período de teste expirou/i),
      ).toBeInTheDocument();
    });
  });
});
