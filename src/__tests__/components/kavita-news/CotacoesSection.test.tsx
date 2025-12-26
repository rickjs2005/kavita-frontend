import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CotacoesSection from "@/components/admin/kavita-news/cotacoes/CotacoesSection";

vi.mock("@/hooks/useCotacoesAdmin", () => ({
  useCotacoesAdmin: () => ({
    allowedSlugs: ["dolar"],
    mode: "create",
    editing: null,
    form: {},
    setForm: vi.fn(),
    saving: false,
    submit: vi.fn(),
    cancelEdit: vi.fn(),
    startCreate: vi.fn(),

    sorted: [],
    loading: false,
    errorMsg: null,

    load: vi.fn(),
    syncAll: vi.fn(),
    startEdit: vi.fn(),
    remove: vi.fn(),
    deletingId: null,
    sync: vi.fn(),
    syncingId: null,
  }),
}));

describe("CotacoesSection", () => {
  it("renderiza CotacoesForm e CotacoesTable", () => {
    render(
      <CotacoesSection
        apiBase="http://localhost"
        authOptions={{}}
        onUnauthorized={vi.fn()}
      />
    );

    expect(screen.getByText("Cotações")).toBeInTheDocument();
    expect(screen.getByText("Cotações cadastradas")).toBeInTheDocument();
  });

  it("Atualizar chama syncAll", async () => {
    const user = userEvent.setup();

    render(
      <CotacoesSection
        apiBase="http://localhost"
        authOptions={{}}
        onUnauthorized={vi.fn()}
      />
    );

    await user.click(
      screen.getAllByRole("button", { name: /Atualizar/i })[0]
    );
  });
});
