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

// Mock do apiClient (vamos controlar o .get no meta)
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
      allowedSlugs={props.allowedSlugs ?? ["dolar", "cafe"]}
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

    // ✅ meta padrão com preset do slug "dolar"
    mockedApi.get = mockedApi.get || (vi.fn() as any);
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
    render(<Wrapper />);

    expect(screen.getByText("Cotações")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Limpar dados/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Salvar$/i })).toBeInTheDocument();

    // aguarda o meta carregar (não é obrigatório pro layout, mas estabiliza)
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
  });

  it("Limpar dados: reseta formulário e chama onStartCreate", async () => {
    const user = userEvent.setup();
    const onStartCreate = vi.fn();

    render(
      <Wrapper
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

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Limpar dados/i }));

    // clearForm é síncrono; só damos um tick pra React aplicar state
    await sleep(10);

    expect(
      (screen.getByPlaceholderText(
        "Ex: Dólar comercial, Soja CEPEA, Boi Gordo...",
      ) as HTMLInputElement).value,
    ).toBe("");

    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("");

    expect(
      (screen.getByPlaceholderText(
        "Ex: cambio, graos, pecuaria, cafe...",
      ) as HTMLInputElement).value,
    ).toBe("");

    expect(
      (screen.getByPlaceholderText("Ex: R$/saca, R$/@, R$") as HTMLInputElement)
        .value,
    ).toBe("");

    expect(
      (screen.getByPlaceholderText("Ex: CEPEA, B3...") as HTMLInputElement).value,
    ).toBe("");

    expect(
      (screen.getByPlaceholderText("Ex: BCB PTAX, CEPEA, B3...") as HTMLInputElement)
        .value,
    ).toBe("");

    expect(onStartCreate).toHaveBeenCalledTimes(1);
  });

  it("ao selecionar slug com preset, auto-preenche campos vazios", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper
        initialForm={{
          // campos vazios: devem ser preenchidos pelo preset
          name: "",
          type: "",
          unit: "",
          market: "",
          source: "",
        }}
      />,
    );

    // ✅ garante que metaPresets já foi carregado
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());

    // select "Slug (padrão)" não tem aria-label, então pegamos o único combobox
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

    // ✅ e como existe preset, o botão aparece
    expect(
      screen.getByRole("button", { name: /Aplicar preset do slug/i }),
    ).toBeInTheDocument();
  });

  it("Aplicar preset sobrescreve campos manualmente", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper
        initialForm={{
          // usuário digitou coisas diferentes do preset
          name: "Nome manual",
          type: "tipo-manual",
          unit: "unid-manual",
          market: "market-manual",
          source: "source-manual",
        }}
      />,
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalled());

    const slugSelect = screen.getByRole("combobox") as HTMLSelectElement;

    // seleciona slug: applySlugPreset NÃO sobrescreve (porque já tem conteúdo)
    await user.selectOptions(slugSelect, "dolar");

    expect(
      (screen.getByPlaceholderText(
        "Ex: Dólar comercial, Soja CEPEA, Boi Gordo...",
      ) as HTMLInputElement).value,
    ).toBe("Nome manual");

    // agora força sobrescrever via botão
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
  });
});
