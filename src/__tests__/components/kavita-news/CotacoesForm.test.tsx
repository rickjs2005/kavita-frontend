import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useState } from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CotacoesForm from "@/components/admin/kavita-news/cotacoes/CotacoesForm";
import type { CotacaoFormState, CotacaoItem } from "@/types/kavita-news";

vi.mock("@/components/buttons/LoadingButton", () => ({
  default: ({ isLoading, onClick, children }: any) => (
    <button type="button" disabled={isLoading} onClick={onClick}>
      {children}
    </button>
  ),
}));

function makeForm(): CotacaoFormState {
  return {
    name: "",
    slug: "" as any,
    type: "",
    price: "",
    unit: "",
    variation_day: "",
    market: "",
    source: "",
    last_update_at: "",
    ativo: true,
  };
}

function Wrapper(props: {
  allowedSlugs?: string[];
  mode?: "create" | "edit";
  editing?: CotacaoItem | null;
  onStartCreate?: () => void;
}) {
  const [form, setForm] = useState(makeForm());

  return (
    <CotacoesForm
      allowedSlugs={props.allowedSlugs ?? ["dolar", "soja"]}
      mode={props.mode ?? "create"}
      editing={props.editing ?? null}
      form={form}
      setForm={setForm}
      saving={false}
      onSubmit={vi.fn()}
      onCancelEdit={vi.fn()}
      onStartCreate={props.onStartCreate ?? vi.fn()}
    />
  );
}

/**
 * No seu form existem vários "combobox" por causa de <input list="...">.
 * Então aqui pegamos explicitamente o <select> do slug.
 */
function getSlugSelect(): HTMLSelectElement {
  const all = screen.getAllByRole("combobox") as HTMLElement[];
  const select = all.find((el) => el.tagName === "SELECT");
  if (!select) throw new Error("Não encontrei o <select> do Slug (padrão).");
  return select as HTMLSelectElement;
}

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      ok: true,
      data: {
        presets: {
          dolar: { name: "Dólar", unit: "R$", type: "cambio" },
        },
        suggestions: {
          units: ["R$", "R$/saca"],
          types: ["cambio"],
          markets: [],
          sources: [],
        },
      },
    }),
  } as any);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CotacoesForm", () => {
  it("renderiza layout base", async () => {
    render(<Wrapper />);

    expect(screen.getByText("Cotações")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Limpar dados/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar/i })).toBeInTheDocument();
  });

  it("Limpar dados reseta formulário e chama onStartCreate", async () => {
    const user = userEvent.setup();
    const onStartCreate = vi.fn();

    render(<Wrapper onStartCreate={onStartCreate} />);

    await user.type(
      screen.getByPlaceholderText(/Dólar comercial, Soja CEPEA, Boi Gordo/i),
      "Teste"
    );

    await user.click(screen.getByRole("button", { name: /Limpar dados/i }));

    await waitFor(() =>
      expect(
        (screen.getByPlaceholderText(/Dólar comercial, Soja CEPEA, Boi Gordo/i) as HTMLInputElement)
          .value
      ).toBe("")
    );

    expect(onStartCreate).toHaveBeenCalledTimes(1);
  });

  it("ao selecionar slug com preset, auto-preenche campos vazios", async () => {
    const user = userEvent.setup();

    render(<Wrapper allowedSlugs={["dolar"]} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await user.selectOptions(getSlugSelect(), "dolar");

    expect(
      (screen.getByPlaceholderText(/Dólar comercial, Soja CEPEA, Boi Gordo/i) as HTMLInputElement)
        .value
    ).toBe("Dólar");

    expect((screen.getByPlaceholderText(/Ex: R\$\//i) as HTMLInputElement).value || "").toContain("R$");
    // Obs: seu placeholder de Unidade é "Ex: R$/saca, R$/@, R$"
    expect(
      (screen.getByPlaceholderText(/Ex: R\$\/saca, R\$\/@, R\$/i) as HTMLInputElement).value
    ).toBe("R$");
  });

  it("Aplicar preset sobrescreve campos manualmente", async () => {
    const user = userEvent.setup();

    render(<Wrapper allowedSlugs={["dolar"]} />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await user.selectOptions(getSlugSelect(), "dolar");

    const nome = screen.getByPlaceholderText(/Dólar comercial, Soja CEPEA, Boi Gordo/i) as HTMLInputElement;
    await user.clear(nome);
    await user.type(nome, "XXX");
    expect(nome.value).toBe("XXX");

    await user.click(screen.getByRole("button", { name: /Aplicar preset do slug/i }));

    expect(
      (screen.getByPlaceholderText(/Dólar comercial, Soja CEPEA, Boi Gordo/i) as HTMLInputElement)
        .value
    ).toBe("Dólar");
  });
});
