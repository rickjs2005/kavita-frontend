import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ClimaSection from "@/components/admin/kavita-news/clima/ClimaSection";
import type { ClimaItem } from "@/types/kavita-news";

const mockLoad = vi.fn();
const mockSync = vi.fn();
const mockStartEdit = vi.fn();
const mockRemove = vi.fn();
const mockSubmit = vi.fn();
const mockCancelEdit = vi.fn();
const mockStartCreate = vi.fn();
const mockSuggestStations = vi.fn();

let hookState: any = null;

vi.mock("@/hooks/useClimaAdmin", () => {
  return {
    useClimaAdmin: () => hookState,
  };
});

function baseState(overrides: Partial<any> = {}) {
  return {
    mode: "create",
    editing: null,
    form: {
      city_name: "",
      uf: "",
      slug: "",
      mm_24h: "",
      mm_7d: "",
      source: "",
      last_update_at: "",
      ativo: true,
    },
    setForm: vi.fn(),

    loading: false,
    saving: false,
    errorMsg: null,

    sorted: [] as ClimaItem[],
    deletingId: null,
    syncingId: null,

    load: mockLoad,
    sync: mockSync,
    startEdit: mockStartEdit,
    remove: mockRemove,
    submit: mockSubmit,
    cancelEdit: mockCancelEdit,
    startCreate: mockStartCreate,
    suggestStations: mockSuggestStations,

    ...overrides,
  };
}

describe("ClimaSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState = baseState();
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza título e compõe ClimaForm + ClimaTable", () => {
    render(
      <ClimaSection
        apiBase="http://localhost:3000"
        authOptions={{ headers: { Authorization: "Bearer x" } }}
        onUnauthorized={vi.fn()}
      />
    );

    expect(screen.getByText("Kavita News")).toBeInTheDocument();
    expect(screen.getByText(/Gerencie clima sem mexer/i)).toBeInTheDocument();

    // textos dos componentes filhos
    expect(screen.getByText("Clima")).toBeInTheDocument();
    expect(screen.getByText("Cidades cadastradas")).toBeInTheDocument();
  });

  it("handleSyncAll: sincroniza sequencialmente itens com id e ignora itens sem id; ao final chama load()", async () => {
    const user = userEvent.setup();

    hookState = baseState({
      sorted: [
        { id: 10, city_name: "A", uf: "MG", slug: "a" } as any,
        { city_name: "SemId", uf: "MG", slug: "semid" } as any,
        { id: 20, city_name: "B", uf: "MG", slug: "b" } as any,
      ],
    });

    render(
      <ClimaSection
        apiBase="x"
        authOptions={{}}
        onUnauthorized={vi.fn()}
      />
    );

    // só existe 1 botão "Atualizar" (sem duplicação)
    await user.click(screen.getByRole("button", { name: "Atualizar" }));

    expect(mockSync).toHaveBeenCalledTimes(2);
    expect(mockSync).toHaveBeenNthCalledWith(1, 10);
    expect(mockSync).toHaveBeenNthCalledWith(2, 20);

    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it("quando sorted está vazio, botão Atualizar fica disabled e não chama sync/load", () => {
    hookState = baseState({ sorted: [] });

    render(
      <ClimaSection
        apiBase="x"
        authOptions={{}}
        onUnauthorized={vi.fn()}
      />
    );

    const btn = screen.getByRole("button", { name: "Atualizar" });
    expect(btn).toBeDisabled();

    expect(mockSync).not.toHaveBeenCalled();
    expect(mockLoad).not.toHaveBeenCalled();
  });
});
