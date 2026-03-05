import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useState } from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CotacoesForm from "@/components/admin/kavita-news/cotacoes/CotacoesForm";
import type { CotacaoFormState, CotacaoItem } from "@/types/kavita-news";
import apiClient from "@/lib/apiClient";

// Mock do LoadingButton (vira um <button/> simples)
vi.mock("@/components/buttons/LoadingButton", () => {
  return {
    default: (props: any) => {
      const { isLoading, onClick, className, children } = props;
      return (
        <button
          type="button"
          onClick={onClick}
          className={className}
          disabled={!!isLoading}
        >
          {children}
        </button>
      );
    },
  };
});

// Mock do apiClient (controlamos o .get)
vi.mock("@/lib/apiClient", () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

type WrapperProps = {
  allowedSlugs?: string[];
  mode?: "create" | "edit";
  editing?: CotacaoItem | null;
  saving?: boolean;
  onSubmit?: () => void;
  onCancelEdit?: () => void;
  onStartCreate?: () => void;
  initialForm?: Partial<CotacaoFormState>;
};

function makeInitialForm(): CotacaoFormState {
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

function Wrapper(props: WrapperProps) {
  const [form, setForm] = useState<CotacaoFormState>({
    ...makeInitialForm(),
    ...(props.initialForm || {}),
  });

  return (
    <CotacoesForm
      allowedSlugs={props.allowedSlugs ?? []} // ✅ default vazio p/ garantir determinismo
      mode={props.mode ?? "create"}
      editing={props.editing ?? null}
      form={form}
      setForm={setForm}
      saving={props.saving ?? false}
      onSubmit={props.onSubmit ?? vi.fn()}
      onCancelEdit={props.onCancelEdit ?? vi.fn()}
      onStartCreate={props.onStartCreate ?? vi.fn()}
    />
  );
}

async function sleep(ms: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe("CotacoesForm", () => {
  const mockedApi = apiClient as unknown as { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useRealTimers();

    mockedApi.get.mockResolvedValue({
      ok: true,
      data: {
        presets: {
          dolar: {
            name: "Dólar",
            type: "cambio",
            unit: "R$",
            market: "BCB",
            source: "PTAX",
          },
        },
        suggestions: {
          markets: ["BCB"],
          sources: ["PTAX"],
          units: ["R$"],
          types: ["cambio"],
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
    vi.useRealTimers();
  });

  it("renderiza layout base", async () => {
    render(<Wrapper allowedSlugs={[]} />);

    expect(screen.getByText("Cotações")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Limpar dados/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Salvar$/i })).toBeInTheDocument();

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    // ✅ garante que o option do meta apareceu (metaPresets carregou)
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "dolar" })).toBeInTheDocument(),
    );
  });

  it("Limpar dados: reseta formulário e chama onStartCreate", async () => {
    const user = userEvent.setup();
    const onStartCreate = vi.fn();

    render(
      <Wrapper
        allowedSlugs={[]}
        onStartCreate={onStartCreate}
        initialForm={{
          name: "Teste",
          slug: "dolar" as any,
          type: "cambio",
          unit: "R$",
          market: "BCB",
          source: "PTAX",
          price: "5.10",
          variation_day: "0.1",
          last_update_at: "2026-01-01 10:00:00",
          ativo: false,
        }}
      />,
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: /Limpar dados/i }));
    await sleep(10);

    expect(
      (screen.getByPlaceholderText(
        "Ex: Dólar comercial, Soja CEPEA, Boi Gordo...",
      ) as HTMLInputElement).value,
    ).toBe("");

    const slugSelect = screen.getByRole("combobox") as HTMLSelectElement;
    expect(slugSelect.value).toBe("");

    expect(onStartCreate).toHaveBeenCalledTimes(1);
  });

  it("ao selecionar slug com preset, auto-preenche campos vazios", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper
        allowedSlugs={[]} // ✅ sem prop; option só aparece quando meta carregar
        initialForm={{
          name: "",
          type: "",
          unit: "",
          market: "",
          source: "",
        }}
      />,
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "dolar" })).toBeInTheDocument(),
    );

    const slugSelect = screen.getByRole("combobox") as HTMLSelectElement;
    await user.selectOptions(slugSelect, "dolar");

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText(
          "Ex: Dólar comercial, Soja CEPEA, Boi Gordo...",
        ) as HTMLInputElement).value,
      ).toBe("Dólar");
    });

    expect(
      (screen.getByPlaceholderText(
        "Ex: cambio, graos, pecuaria, cafe...",
      ) as HTMLInputElement).value,
    ).toBe("cambio");

    expect(
      (screen.getByPlaceholderText("Ex: R$/saca, R$/@, R$") as HTMLInputElement)
        .value,
    ).toBe("R$");

    expect(
      (screen.getByPlaceholderText("Ex: CEPEA, B3...") as HTMLInputElement).value,
    ).toBe("BCB");

    expect(
      (screen.getByPlaceholderText("Ex: BCB PTAX, CEPEA, B3...") as HTMLInputElement)
        .value,
    ).toBe("PTAX");

    // ✅ botão aparece porque selectedPreset agora existe
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Aplicar preset do slug/i }),
      ).toBeInTheDocument(),
    );
  });

  it("Aplicar preset sobrescreve campos manualmente", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper
        allowedSlugs={[]} // ✅ determinístico
        initialForm={{
          name: "Nome manual",
          type: "tipo-manual",
          unit: "unid-manual",
          market: "market-manual",
          source: "source-manual",
        }}
      />,
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "dolar" })).toBeInTheDocument(),
    );

    const slugSelect = screen.getByRole("combobox") as HTMLSelectElement;
    await user.selectOptions(slugSelect, "dolar");

    // applySlugPreset não sobrescreve o que já foi digitado
    expect(
      (screen.getByPlaceholderText(
        "Ex: Dólar comercial, Soja CEPEA, Boi Gordo...",
      ) as HTMLInputElement).value,
    ).toBe("Nome manual");

    const btn = await screen.findByRole("button", {
      name: /Aplicar preset do slug/i,
    });

    await user.click(btn);

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText(
          "Ex: Dólar comercial, Soja CEPEA, Boi Gordo...",
        ) as HTMLInputElement).value,
      ).toBe("Dólar");
    });

    expect(
      (screen.getByPlaceholderText(
        "Ex: cambio, graos, pecuaria, cafe...",
      ) as HTMLInputElement).value,
    ).toBe("cambio");
  });
});
