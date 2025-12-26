import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { useState } from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ClimaForm from "@/components/admin/kavita-news/clima/ClimaForm";
import type { ClimaEditMode, ClimaFormState, ClimaItem } from "@/types/kavita-news";

vi.mock("@/components/buttons/LoadingButton", () => {
  return {
    default: (props: any) => {
      const { isLoading, onClick, className, children } = props;
      return (
        <button type="button" onClick={onClick} className={className} disabled={!!isLoading}>
          {children}
        </button>
      );
    },
  };
});

// normalizeSlug determinístico
vi.mock("@/utils/kavita-news/clima", async () => {
  const actual = await vi.importActual<any>("@/utils/kavita-news/clima");
  return {
    ...actual,
    normalizeSlug: (s: string) => {
      const base = String(s || "").trim();
      if (!base) return "";
      return "slug-normalizado";
    },
  };
});

type WrapperProps = {
  initialEditMode?: ClimaEditMode;
  mode?: "create" | "edit";
  editing?: ClimaItem | null;
  saving?: boolean;
  onSubmit?: () => void;
  onCancelEdit?: () => void;
  onStartCreate?: () => void;
  onBuscarIbge?: (q: { uf: string; city: string }) => void;
  onSuggestStations?: (uf: string, q: string, limit?: number) => Promise<any[]>;
};

function makeInitialForm(): ClimaFormState {
  return {
    city_name: "",
    uf: "",
    slug: "",
    mm_24h: "",
    mm_7d: "",
    source: "",
    last_update_at: "",
    ativo: true,
    ...( {
      ibge_id: "",
      station_code: "",
      station_lat: "",
      station_lon: "",
      station_distance: "",
      station_source: "",
    } as any ),
  };
}

function Wrapper(props: WrapperProps) {
  const [editMode, setEditMode] = useState<ClimaEditMode>(props.initialEditMode ?? "manual");
  const [form, setForm] = useState<ClimaFormState>(makeInitialForm());

  return (
    <ClimaForm
      editMode={editMode}
      setEditMode={setEditMode}
      mode={props.mode ?? "create"}
      editing={props.editing ?? null}
      form={form}
      setForm={setForm}
      saving={props.saving ?? false}
      onSubmit={props.onSubmit ?? vi.fn()}
      onCancelEdit={props.onCancelEdit ?? vi.fn()}
      onStartCreate={props.onStartCreate ?? vi.fn()}
      onBuscarIbge={props.onBuscarIbge}
      onSuggestStations={props.onSuggestStations}
    />
  );
}

function mockFetchOkJson(data: any) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

// Espera controlada para cobrir debounce do componente sem fake timers
async function sleep(ms: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe("ClimaForm", () => {
  beforeEach(() => {
    // fetch padrão sempre resolve
    global.fetch = vi.fn().mockResolvedValue(mockFetchOkJson([]));
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
    vi.useRealTimers();
  });

  it("renderiza layout base e alterna entre modos Manual e IBGE", async () => {
    const user = userEvent.setup();

    render(<Wrapper initialEditMode="manual" />);

    expect(screen.getByText("Clima")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manual" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "IBGE" })).toBeInTheDocument();

    const slug = screen.getByPlaceholderText("Ex: uberlandia") as HTMLInputElement;
    expect(slug).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "IBGE" }));

    expect(slug).toBeDisabled();
    expect(
      screen.getByText(/Digite o nome da cidade .* preencher automaticamente\./i)
    ).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("Limpar dados: reseta campos e chama onStartCreate (compatibilidade)", async () => {
    const user = userEvent.setup();
    const onStartCreate = vi.fn();

    render(<Wrapper onStartCreate={onStartCreate} />);

    const cidade = screen.getByPlaceholderText("Ex: Uberlândia") as HTMLInputElement;
    await user.type(cidade, "Caratinga");
    expect(cidade.value).toBe("Caratinga");

    await user.click(screen.getByRole("button", { name: /Limpar dados/i }));

    // o componente usa setTimeout(0). Com timers reais, aguardamos um tick.
    await sleep(10);

    expect((screen.getByPlaceholderText("Ex: Uberlândia") as HTMLInputElement).value).toBe("");
    expect((screen.getByPlaceholderText("Ex: MG") as HTMLInputElement).value).toBe("");
    expect((screen.getByPlaceholderText("Ex: uberlandia") as HTMLInputElement).value).toBe("");

    expect(onStartCreate).toHaveBeenCalledTimes(1);
  });

  it("Modo IBGE: carrega base e sugere municípios por nome (debounce)", async () => {
    const user = userEvent.setup();

    (global.fetch as any).mockResolvedValueOnce(
      mockFetchOkJson([
        { "municipio-id": "3106200", "municipio-nome": "Belo Horizonte", "UF-sigla": "MG" },
        { "municipio-id": "3118601", "municipio-nome": "Contagem", "UF-sigla": "MG" },
        { "municipio-id": "3110000", "municipio-nome": "Caratinga", "UF-sigla": "MG" },
      ])
    );

    render(<Wrapper initialEditMode="ibge" />);

    // espera o effect carregar a base
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const cidade = screen.getByPlaceholderText("Ex: Uberlândia") as HTMLInputElement;
    await user.type(cidade, "cara");

    // debounce do componente (250ms ou similar). Usa folga pequena.
    await sleep(350);

    const sugestao = screen.getByRole("button", { name: /Caratinga/i });
    await user.click(sugestao);

    const uf = screen.getByPlaceholderText("Ex: MG") as HTMLInputElement;
    expect(uf.value).toBe("MG");

    const slug = screen.getByPlaceholderText("Ex: uberlandia") as HTMLInputElement;
    expect(slug.value).toBe("slug-normalizado");
  });

  it("Modo IBGE: ao digitar IBGE ID válido (6-8 dígitos), busca município por ID e aplica", async () => {
    const user = userEvent.setup();

    // 1) base
    (global.fetch as any).mockResolvedValueOnce(mockFetchOkJson([]));

    // 2) fetch por ID
    (global.fetch as any).mockResolvedValueOnce(
      mockFetchOkJson({
        id: 3170206,
        nome: "Uberlândia",
        microrregiao: { mesorregiao: { UF: { sigla: "MG" } } },
      })
    );

    render(<Wrapper initialEditMode="ibge" />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const ibgeId = screen.getByPlaceholderText("Ex: 3170206") as HTMLInputElement;
    await user.type(ibgeId, "3170206");

    await sleep(350);

    await waitFor(() => {
      const cidade = screen.getByPlaceholderText("Ex: Uberlândia") as HTMLInputElement;
      expect(cidade.value).toBe("Uberlândia");
    });

    const uf = screen.getByPlaceholderText("Ex: MG") as HTMLInputElement;
    const slug = screen.getByPlaceholderText("Ex: uberlandia") as HTMLInputElement;

    expect(uf.value).toBe("MG");
    expect(slug.value).toBe("slug-normalizado");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("Buscar coordenadas: quando UF/cidade inválidos, mostra hint e não chama provider", async () => {
    const user = userEvent.setup();
    const onSuggestStations = vi.fn().mockResolvedValue([]);

    render(<Wrapper onSuggestStations={onSuggestStations} />);

    await user.click(screen.getByRole("button", { name: /Buscar coordenadas/i }));

    expect(onSuggestStations).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Preencha UF \(2 letras\) e cidade para buscar coordenadas\./i)
    ).toBeInTheDocument();
  });

  it("Buscar coordenadas: aplica automaticamente lat/lon quando retorna lista com coords e o form não tem coords", async () => {
    const user = userEvent.setup();

    const onSuggestStations = vi.fn().mockResolvedValue([
      { name: "Caratinga", uf: "MG", lat: -19.78901, lon: -42.14123 },
      { name: "Caratinga (Centro)", uf: "MG", lat: -19.78, lon: -42.14 },
    ]);

    render(<Wrapper onSuggestStations={onSuggestStations} />);

    await user.type(screen.getByPlaceholderText("Ex: Uberlândia"), "Caratinga");
    await user.type(screen.getByPlaceholderText("Ex: MG"), "mg");

    await user.click(screen.getByRole("button", { name: /Buscar coordenadas/i }));

    expect(onSuggestStations).toHaveBeenCalledWith("MG", "Caratinga", 10);

    expect(await screen.findByText(/Coordenadas sugeridas automaticamente:/i)).toBeInTheDocument();

    const lat = screen.getByPlaceholderText("Ex: -18.920000") as HTMLInputElement;
    const lon = screen.getByPlaceholderText("Ex: -48.260000") as HTMLInputElement;

    expect(lat.value).toMatch(/-19\.7890/);
    expect(lon.value).toMatch(/-42\.1412/);
  });

  it("Buscar coordenadas: se provider falhar, mostra mensagem de falha", async () => {
    const user = userEvent.setup();

    const onSuggestStations = vi.fn().mockRejectedValue(new Error("boom"));
    render(<Wrapper onSuggestStations={onSuggestStations} />);

    await user.type(screen.getByPlaceholderText("Ex: Uberlândia"), "Caratinga");
    await user.type(screen.getByPlaceholderText("Ex: MG"), "MG");

    await user.click(screen.getByRole("button", { name: /Buscar coordenadas/i }));

    expect(
      screen.getByText(/Falha ao buscar coordenadas\. Você pode preencher latitude\/longitude manualmente\./i)
    ).toBeInTheDocument();
  });
});
