import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ClimaTable from "@/components/admin/kavita-news/clima/ClimaTable";
import type { ClimaItem } from "@/types/kavita-news";

// Determinístico (evita variação por timezone/locale e simplifica asserts)
vi.mock("@/utils/kavita-news/clima", async () => {
  const actual = await vi.importActual<any>("@/utils/kavita-news/clima");
  return {
    ...actual,
    formatDateTimeBR: (v: any) => (v ? "DATA_FMT" : "—"),
  };
});

function makeRow(partial: Partial<ClimaItem> & any) {
  return {
    id: 1,
    city_name: "Caratinga",
    uf: "MG",
    slug: "caratinga",
    ibge_id: "3110000",
    station_lat: "-19.789010",
    station_lon: "-42.141230",
    mm_24h: "12.3",
    mm_7d: "55.7",
    last_update_at: "2025-12-19T13:31:51.000Z",
    ativo: 1,
    ...partial,
  } as any;
}

describe("ClimaTable", () => {
  it("renderiza cabeçalho, total e estado vazio", () => {
    render(
      <ClimaTable
        rows={[]}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    );

    expect(screen.getByText("Cidades cadastradas")).toBeInTheDocument();
    expect(screen.getByText(/Total:/i)).toHaveTextContent("Total: 0");

    // Estado vazio aparece em mobile e desktop ao mesmo tempo (classes Tailwind não ocultam em jsdom)
    expect(screen.getAllByText("Nenhuma cidade cadastrada.").length).toBeGreaterThanOrEqual(1);

    const atualizar = screen.getByRole("button", { name: "Atualizar" });
    expect(atualizar).toBeDisabled();
  });

  it("se onSyncAll existir, botão Atualizar chama onSyncAll; caso contrário, faz fallback para onReload", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const onSyncAll = vi.fn();

    const rows = [makeRow({ id: 1 })];

    const { rerender } = render(
      <ClimaTable
        rows={rows}
        loading={false}
        errorMsg={null}
        onReload={onReload}
        onSyncAll={onSyncAll}
        syncingAll={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    );

    await user.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(onSyncAll).toHaveBeenCalledTimes(1);
    expect(onReload).not.toHaveBeenCalled();

    rerender(
      <ClimaTable
        rows={rows}
        loading={false}
        errorMsg={null}
        onReload={onReload}
        // sem onSyncAll
        syncingAll={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    );

    await user.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("renderiza uma linha e dispara onEdit/onDelete; respeita deletingId (texto 'Excluindo...')", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const rows = [makeRow({ id: 7, city_name: "Santana do Manhuaçu", slug: "santana-do-manhuacu" })];

    const { rerender } = render(
      <ClimaTable
        rows={rows}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        deletingId={null}
      />
    );

    // “Editar” e “Excluir” existem tanto em cards (mobile) quanto na tabela (desktop).
    // Vamos clicar no primeiro conjunto encontrado (estável o suficiente).
    const editarButtons = screen.getAllByRole("button", { name: "Editar" });
    const excluirButtons = screen.getAllByRole("button", { name: "Excluir" });

    await user.click(editarButtons[0]);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));

    await user.click(excluirButtons[0]);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(7);

    // deletingId muda label para “Excluindo...”
    rerender(
      <ClimaTable
        rows={rows}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        deletingId={7}
      />
    );

    expect(screen.getAllByText("Excluindo...").length).toBeGreaterThanOrEqual(1);
  });

  it("quando syncingAll=true, desabilita ações por linha e botão Atualizar mostra 'Sincronizando...'", () => {
    const rows = [makeRow({ id: 1 })];

    render(
      <ClimaTable
        rows={rows}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onSyncAll={vi.fn()}
        syncingAll={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={vi.fn()}
        deletingId={null}
        syncingId={null}
      />
    );

    const atualizar = screen.getByRole("button", { name: /Sincronizando/i });
    expect(atualizar).toBeDisabled();

    // Ações de linha desabilitadas (Editar/Excluir/Sync)
    const editarButtons = screen.getAllByRole("button", { name: "Editar" });
    const excluirButtons = screen.getAllByRole("button", { name: /Excluir|Excluindo\.\.\./i });
    const syncButtons = screen.getAllByRole("button", { name: /Sync/i });

    expect(editarButtons[0]).toBeDisabled();
    expect(excluirButtons[0]).toBeDisabled();
    expect(syncButtons[0]).toBeDisabled();
  });

  it("mostra errorMsg quando fornecido", () => {
    render(
      <ClimaTable
        rows={[makeRow({ id: 1 })]}
        loading={false}
        errorMsg="Falha ao carregar."
        onReload={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    );

    expect(screen.getByText("Falha ao carregar.")).toBeInTheDocument();
  });

  it("quando onSync existe, clicar em Sync chama onSync(id) e respeita syncingId (texto 'Sincronizando...')", async () => {
    const user = userEvent.setup();
    const onSync = vi.fn();

    const rows = [makeRow({ id: 99 })];

    const { rerender } = render(
      <ClimaTable
        rows={rows}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={onSync}
        deletingId={null}
        syncingId={null}
      />
    );

    const syncButtons = screen.getAllByRole("button", { name: "Sync" });
    await user.click(syncButtons[0]);
    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onSync).toHaveBeenCalledWith(99);

    rerender(
      <ClimaTable
        rows={rows}
        loading={false}
        errorMsg={null}
        onReload={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={onSync}
        deletingId={null}
        syncingId={99}
      />
    );

    expect(screen.getAllByText("Sincronizando...").length).toBeGreaterThanOrEqual(1);
  });
});
