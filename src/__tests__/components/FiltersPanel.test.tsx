import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FiltersPanel, type FiltersState } from "@/components/search/FiltersPanel";

type Category = { id: number; name: string; slug?: string; total_products?: number };

function renderControlled({
  categories = [],
  categoriesLoading = false,
  initialValue,
  stickyActions = false,
  applyLabel,
}: {
  categories?: Category[];
  categoriesLoading?: boolean;
  initialValue: FiltersState;
  stickyActions?: boolean;
  applyLabel?: string;
}) {
  const onChangeSpy = vi.fn();
  const onClearSpy = vi.fn();
  const onApplySpy = vi.fn();

  function Harness() {
    const [value, setValue] = React.useState<FiltersState>(initialValue);

    const onChange = (patch: Partial<FiltersState>) => {
      onChangeSpy(patch);
      setValue((prev) => ({ ...prev, ...patch }));
    };

    const onClear = () => {
      onClearSpy();
      setValue({
        q: "",
        categories: [],
        minPrice: null,
        maxPrice: null,
        promo: false,
      });
    };

    const onApply = () => {
      onApplySpy();
    };

    return (
      <FiltersPanel
        categories={categories}
        categoriesLoading={categoriesLoading}
        value={value}
        onChange={onChange}
        onClear={onClear}
        onApply={onApply}
        stickyActions={stickyActions}
        applyLabel={applyLabel}
      />
    );
  }

  render(<Harness />);

  return { onChangeSpy, onClearSpy, onApplySpy };
}

describe("FiltersPanel", () => {
  const baseValue: FiltersState = {
    q: "",
    categories: [],
    minPrice: null,
    maxPrice: null,
    promo: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza cabeçalho e estado padrão (sem filtros ativos) (positivo)", () => {
    renderControlled({ initialValue: baseValue });

    expect(screen.getByText("Filtros")).toBeInTheDocument();
    expect(screen.getByText("Ajuste para refinar os resultados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Nome ou descrição…")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("9999")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("exibe contagem correta de filtros ativos com pluralização (positivo)", () => {
    const initialValue: FiltersState = {
      q: "milho",
      categories: [2],
      minPrice: 10,
      maxPrice: 99,
      promo: true,
    };

    renderControlled({ initialValue });

    expect(screen.getByText("4 filtros ativos")).toBeInTheDocument();
  });

  it("exibe contagem singular quando apenas 1 filtro está ativo (positivo)", () => {
    renderControlled({ initialValue: { ...baseValue, q: "açaí" } });

    expect(screen.getByText("1 filtro ativo")).toBeInTheDocument();
  });

  it("chama onClear ao clicar em Limpar (positivo)", async () => {
    const user = userEvent.setup();
    const { onClearSpy } = renderControlled({ initialValue: baseValue });

    await user.click(screen.getByRole("button", { name: "Limpar" }));

    expect(onClearSpy).toHaveBeenCalledTimes(1);
  });

  it("atualiza busca (q) chamando onChange com patch correto (positivo)", async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlled({ initialValue: baseValue });

    const input = screen.getByPlaceholderText("Nome ou descrição…");
    await user.type(input, "ração");

    expect(onChangeSpy).toHaveBeenCalledWith({ q: "ração" });
  });

  it("renderiza categorias com total_products e seleciona a primeira category do state (positivo/controle)", () => {
    const categories: Category[] = [
      { id: 1, name: "Medicamentos", total_products: 10 },
      { id: 2, name: "Pets", total_products: 3 },
    ];
    const initialValue: FiltersState = { ...baseValue, categories: [2, 1] };

    renderControlled({ categories, initialValue });

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("2");

    expect(screen.getByRole("option", { name: "Medicamentos (10)" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pets (3)" })).toBeInTheDocument();
  });

  it("ao selecionar categoria > 0 chama onChange com categories=[id] (positivo)", async () => {
    const user = userEvent.setup();
    const categories: Category[] = [
      { id: 1, name: "Medicamentos" },
      { id: 2, name: "Pets" },
    ];
    const { onChangeSpy } = renderControlled({ categories, initialValue: baseValue });

    await user.selectOptions(screen.getByRole("combobox"), "2");

    expect(onChangeSpy).toHaveBeenCalledWith({ categories: [2] });
  });

  it("ao selecionar 'Selecione...' (0) limpa categorias chamando onChange com [] (negativo)", async () => {
    const user = userEvent.setup();
    const categories: Category[] = [{ id: 1, name: "Medicamentos" }];
    const initialValue: FiltersState = { ...baseValue, categories: [1] };

    const { onChangeSpy } = renderControlled({ categories, initialValue });

    await user.selectOptions(screen.getByRole("combobox"), "0");

    expect(onChangeSpy).toHaveBeenCalledWith({ categories: [] });
  });

  it("mostra estado 'Carregando…' quando categoriesLoading=true (positivo)", () => {
    renderControlled({ categoriesLoading: true, initialValue: baseValue });

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
  });

  it("quando não está carregando e não há categorias, mostra 'Nenhuma categoria encontrada.' (negativo)", () => {
    renderControlled({ categories: [], categoriesLoading: false, initialValue: baseValue });

    expect(screen.getByText("Nenhuma categoria encontrada.")).toBeInTheDocument();
  });

  it("minPrice: remove separadores e mantém apenas dígitos (ex: '12,50' => 1250) (positivo)", async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlled({ initialValue: baseValue });

    const minInput = screen.getByPlaceholderText("0");

    await user.clear(minInput);
    await user.type(minInput, " 12,50 ");

    expect(onChangeSpy).toHaveBeenCalledWith({ minPrice: 1250 });
  });

  it("minPrice: ponto também é removido (ex: '12.5' => 125) (positivo/controle)", async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlled({ initialValue: baseValue });

    const minInput = screen.getByPlaceholderText("0");

    await user.clear(minInput);
    await user.type(minInput, "12.5");

    expect(onChangeSpy).toHaveBeenCalledWith({ minPrice: 125 });
  });

  it("minPrice inválido vira null (negativo)", async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlled({ initialValue: baseValue });

    const minInput = screen.getByPlaceholderText("0");

    await user.clear(minInput);
    await user.type(minInput, "abc");

    expect(onChangeSpy).toHaveBeenCalledWith({ minPrice: null });
  });

  it("maxPrice vazio vira null (negativo/controle)", async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlled({
      initialValue: { ...baseValue, maxPrice: 100 },
    });

    const maxInput = screen.getByPlaceholderText("9999");

    await user.clear(maxInput);

    expect(onChangeSpy).toHaveBeenCalledWith({ maxPrice: null });
  });

  it("toggle do checkbox 'Somente promoções' chama onChange com promo=true e depois promo=false (positivo)", async () => {
    const user = userEvent.setup();
    const { onChangeSpy } = renderControlled({ initialValue: baseValue });

    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);
    expect(onChangeSpy).toHaveBeenCalledWith({ promo: true });

    await user.click(checkbox);
    expect(onChangeSpy).toHaveBeenCalledWith({ promo: false });
  });

  it("quando stickyActions=true renderiza botão aplicar e chama onApply ao clicar (positivo)", async () => {
    const user = userEvent.setup();
    const { onApplySpy } = renderControlled({
      initialValue: baseValue,
      stickyActions: true,
    });

    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(onApplySpy).toHaveBeenCalledTimes(1);
  });

  it("quando stickyActions=true usa applyLabel customizado (positivo)", () => {
    renderControlled({
      initialValue: baseValue,
      stickyActions: true,
      applyLabel: "Buscar agora",
    });

    expect(screen.getByRole("button", { name: "Buscar agora" })).toBeInTheDocument();
  });

  it("quando stickyActions=false não renderiza botão aplicar (negativo)", () => {
    renderControlled({ initialValue: baseValue, stickyActions: false });

    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
  });
});
