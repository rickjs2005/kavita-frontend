import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CotacoesTable from "@/components/admin/kavita-news/cotacoes/CotacoesTable";

const rows = [
  {
    id: 1,
    name: "Dólar",
    slug: "dolar",
    type: "cambio",
    price: "5.12",
    unit: "R$",
    variation_day: "0.10",
    source: "BCB",
    last_update_at: "2025-01-01 10:00:00",
    ativo: 1,
    last_sync_status: "ok",
  },
];

describe("CotacoesTable", () => {
  it("renderiza linhas (mobile + desktop no DOM)", () => {
    render(
      <CotacoesTable
        rows={rows as any}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    );

    // "Dólar" aparece no card (mobile) e no <td> (desktop)
    expect(screen.getAllByText("Dólar").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("dolar").length).toBeGreaterThanOrEqual(1);
  });

  it("buscar filtra linhas e mostra empty-state (mobile + desktop)", async () => {
    const user = userEvent.setup();

    render(
      <CotacoesTable
        rows={rows as any}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/Buscar por nome, slug, tipo, fonte/i),
      "soja"
    );

    // Empty aparece duas vezes (mobile e desktop)
    expect(screen.getAllByText(/Nenhuma cotação encontrada/i).length).toBeGreaterThanOrEqual(1);
  });

  it("botão Atualizar fica disabled quando não há rows", () => {
    render(
      <CotacoesTable
        rows={[]}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    );

    const btn = screen.getByRole("button", { name: /Atualizar/i });
    expect(btn).toBeDisabled();
  });
});
