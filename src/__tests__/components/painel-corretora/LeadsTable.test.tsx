// src/__tests__/components/painel-corretora/LeadsTable.test.tsx
//
// Fluxo crítico do painel da corretora: leads aparecem e status muda.
// Quebrar isso = corretora não vê produtor que chegou + não consegue
// progredir o pipeline. Receita parada.
//
// Cobertura focada em comportamento:
//   - Empty state quando leads = []
//   - Renderiza nome e telefone do lead
//   - Botão WhatsApp tem href com prefixo 55 e dígitos limpos
//   - Mudar status dispara PATCH /api/corretora/leads/{id} com novo status

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
import type { CorretoraLead } from "@/types/lead";

// ---- Mocks -----------------------------------------------------------------

const mockPatch = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    patch: (...a: unknown[]) => mockPatch(...a),
  },
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("react-hot-toast", () => {
  const callable = vi.fn();
  return {
    default: Object.assign(callable, {
      success: (...a: unknown[]) => mockToastSuccess(...a),
      error: (...a: unknown[]) => mockToastError(...a),
    }),
  };
});

// ---- Fixtures --------------------------------------------------------------

function makeLead(overrides: Partial<CorretoraLead> = {}): CorretoraLead {
  return {
    id: 1,
    corretora_id: 10,
    nome: "Pedro Cafeicultor",
    telefone: "(33) 99999-1234",
    email: null,
    cidade: "Manhuaçu",
    mensagem: null,
    objetivo: null,
    tipo_cafe: null,
    volume_range: null,
    canal_preferido: null,
    corrego_localidade: null,
    safra_tipo: null,
    amostra_status: undefined,
    lote_disponivel: true,
    bebida_classificacao: null,
    pontuacao_sca: null,
    preco_referencia_saca: null,
    status: "new",
    nota_interna: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as CorretoraLead;
}

// ---- Tests -----------------------------------------------------------------

describe("LeadsTable — fluxo crítico do painel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza empty state quando não há leads", () => {
    render(<LeadsTable leads={[]} />);

    expect(
      screen.getByRole("heading", { name: /sala está pronta/i }),
    ).toBeInTheDocument();
    // CTA pra conferir página pública (caminho real do empty state)
    const link = screen.getByRole("link", {
      name: /Ver minha página pública/i,
    });
    expect(link.getAttribute("href")).toBe("/mercado-do-cafe/corretoras");
  });

  it("renderiza nome e telefone do lead", () => {
    render(
      <LeadsTable
        leads={[makeLead({ nome: "João da Silva", telefone: "(33) 98765-4321" })]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "João da Silva" }),
    ).toBeInTheDocument();
    // Telefone aparece em link tel: (renderizado dentro de <a>)
    const telLinks = screen.getAllByRole("link");
    const tel = telLinks.find((l) =>
      l.getAttribute("href")?.startsWith("tel:"),
    );
    expect(tel).toBeDefined();
    expect(tel!.getAttribute("href")).toBe("tel:+5533987654321");
  });

  it("botão WhatsApp tem href wa.me com prefixo 55 e dígitos limpos", () => {
    render(
      <LeadsTable
        leads={[
          makeLead({
            nome: "Pedro",
            telefone: "(33) 99999-1234",
            cidade: "Manhuaçu",
          }),
        ]}
      />,
    );

    // O wa.me é o canal principal de resposta — aceitar formato sujo
    // de telefone e produzir prefixo 55+dígitos é invariante crítica.
    const links = screen.getAllByRole("link");
    const wa = links.find((l) =>
      l.getAttribute("href")?.startsWith("https://wa.me/"),
    );
    expect(wa).toBeDefined();
    expect(wa!.getAttribute("href")).toContain("https://wa.me/5533999991234");
    expect(wa!.getAttribute("href")).toContain("text="); // mensagem pré-formatada
  });

  it("mudar status do lead chama PATCH /api/corretora/leads/{id} com novo status", async () => {
    mockPatch.mockResolvedValue(undefined);
    const onChanged = vi.fn();

    render(
      <LeadsTable
        leads={[makeLead({ id: 7, status: "new" })]}
        onChanged={onChanged}
      />,
    );

    // O componente expõe um <select> de status. Buscar via role
    // "combobox" cobre tanto <select> nativo quanto Combobox custom
    // sem acoplar a um id/aria-label específico.
    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects.find(
      (s) => (s as HTMLSelectElement).value === "new",
    ) as HTMLSelectElement | undefined;
    expect(statusSelect).toBeDefined();

    fireEvent.change(statusSelect!, { target: { value: "contacted" } });

    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(1));
    expect(mockPatch).toHaveBeenCalledWith(
      "/api/corretora/leads/7",
      expect.objectContaining({ status: "contacted" }),
    );

    // Após sucesso, onChanged é disparado pra o pai recarregar a lista
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  });

  it("erro no PATCH dispara toast.error e NÃO chama onChanged", async () => {
    mockPatch.mockRejectedValue(new Error("Falha"));
    const onChanged = vi.fn();

    render(
      <LeadsTable
        leads={[makeLead({ id: 7, status: "new" })]}
        onChanged={onChanged}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects.find(
      (s) => (s as HTMLSelectElement).value === "new",
    ) as HTMLSelectElement | undefined;
    fireEvent.change(statusSelect!, { target: { value: "lost" } });

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(onChanged).not.toHaveBeenCalled();
  });

  // 'within' importado para uso futuro em testes mais específicos por linha
  void within;
});
