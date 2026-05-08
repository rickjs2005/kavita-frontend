// src/__tests__/components/mercado-do-cafe/CorretoraFilters.test.tsx
//
// Fluxo crítico: filtros da listagem pública de corretoras.
// Filtros aplicam via push pra URL — qualquer regressão silenciosa
// no formato dos query params quebra a busca por cidade/categoria.
//
// Cobertura focada em comportamento:
//   - Dropdown de cidade lista as cidades passadas
//   - Selecionar cidade dispara router.push com ?city=X
//   - Chip de tipo de café dispara push com ?tipo_cafe=X
//   - Toggle de chip ativo limpa o filtro
//   - "Limpar filtros" só aparece quando há filtro ativo

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CorretoraFilters } from "@/components/mercado-do-cafe/CorretoraFilters";

// next/navigation: mock router.push + searchParams vazio por default
const pushMock = vi.fn();
const searchParamsGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => searchParamsGet(key),
  }),
}));

const CITIES = ["Manhuaçu", "Caratinga", "Simonésia"];

describe("CorretoraFilters — fluxo crítico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsGet.mockImplementation(() => null);
  });

  it("dropdown de cidade lista as cidades passadas em props", () => {
    render(<CorretoraFilters cities={CITIES} />);

    const select = screen.getByLabelText(/Filtrar por cidade/i);
    const options = Array.from(
      select.querySelectorAll("option"),
    ) as HTMLOptionElement[];
    const optionValues = options.map((o) => o.value);

    expect(optionValues).toContain(""); // "Todas as cidades"
    for (const c of CITIES) {
      expect(optionValues).toContain(c);
    }
  });

  it("selecionar cidade dispara router.push com query string contendo city=X", () => {
    render(<CorretoraFilters cities={CITIES} />);

    const select = screen.getByLabelText(/Filtrar por cidade/i);
    fireEvent.change(select, { target: { value: "Manhuaçu" } });

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("/mercado-do-cafe/corretoras");
    expect(url).toContain("city=Manhua");
  });

  it("clicar em chip de tipo de café dispara push com tipo_cafe=valor", () => {
    render(<CorretoraFilters cities={CITIES} />);

    const chip = screen.getByRole("button", {
      name: /Arábica especial/i,
    });
    fireEvent.click(chip);

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).toContain("tipo_cafe=arabica_especial");
  });

  it("clicar de novo no chip ativo limpa o filtro (toggle)", () => {
    // Cenário: usuário começa com filtro ativo via URL e clica para
    // remover. O push subsequente NÃO deve conter o param removido.
    searchParamsGet.mockImplementation((key: string) =>
      key === "tipo_cafe" ? "arabica_especial" : null,
    );

    render(<CorretoraFilters cities={CITIES} />);

    const chip = screen.getByRole("button", {
      name: /Arábica especial/i,
    });
    fireEvent.click(chip);

    expect(pushMock).toHaveBeenCalledTimes(1);
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).not.toContain("tipo_cafe=");
  });

  it("'Limpar filtros' aparece só quando há filtro ativo e dispara push para URL limpa", () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === "city" ? "Manhuaçu" : null,
    );

    render(<CorretoraFilters cities={CITIES} />);

    const clear = screen.getByRole("button", { name: /Limpar filtros/i });
    fireEvent.click(clear);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0]).toBe("/mercado-do-cafe/corretoras");
  });

  it("sem nenhum filtro ativo, 'Limpar filtros' NÃO renderiza", () => {
    render(<CorretoraFilters cities={CITIES} />);

    expect(
      screen.queryByRole("button", { name: /Limpar filtros/i }),
    ).not.toBeInTheDocument();
  });

  it("toggle 'Só destaques' dispara push com featured=1", () => {
    render(<CorretoraFilters cities={CITIES} />);

    const toggle = screen.getByRole("button", { name: /destaques/i });
    fireEvent.click(toggle);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0]).toContain("featured=1");
  });
});
