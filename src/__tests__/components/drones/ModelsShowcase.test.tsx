// src/__tests__/components/drones/ModelsShowcase.test.tsx
//
// Fluxo crítico: vitrine dos modelos DJI Agras na landing. É a seção
// que decide se o visitante pula direto para WhatsApp ou para o
// detalhe (/drones/[id]). Quebrar isso = perda de funil de qualificação.
//
// Cobertura focada em comportamento:
//   - Não renderiza nada quando entries = [] (defensivo)
//   - Renderiza um card por modelo
//   - section tem id="drones-models" (ancoragem do CTA do hero)
//   - Callbacks de "abrir modelo" / "falar com rep" são disparados

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModelsShowcase, {
  type ModelShowcaseEntry,
} from "@/components/drones/ModelsShowcase";

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) => `http://localhost:5000${p}`,
  API_BASE: "http://localhost:5000",
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: any) => {
    const resolvedSrc = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolvedSrc} alt={alt} {...rest} />;
  },
}));

function makeEntry(
  overrides: Partial<ModelShowcaseEntry> = {},
): ModelShowcaseEntry {
  return {
    model: {
      key: "t25p",
      label: "T25P",
      is_active: 1,
      sort_order: 1,
      card_media_url: null,
      card_media_path: null,
      card_media_type: null,
    } as any,
    badge: "Pequenas e médias operações",
    tagline: "Compacto e ágil",
    description: "Ideal para áreas até 25 ha.",
    specs: [
      { label: "Tanque", value: "20L" },
      { label: "Largura", value: "7m" },
    ],
    ...overrides,
  };
}

describe("ModelsShowcase — fluxo crítico", () => {
  it("não renderiza nada quando entries está vazio", () => {
    const { container } = render(
      <ModelsShowcase
        entries={[]}
        onOpenModel={vi.fn()}
        onTalkToRepGeneric={vi.fn()}
        onTalkToRepForModel={vi.fn()}
      />,
    );
    // section não monta — primeiro filho é null
    expect(container.firstChild).toBeNull();
  });

  it("renderiza um card para cada entry passado", () => {
    // Os cards expõem `model.label` e `description` — `tagline` é
    // recebida mas atualmente não é renderizada pelo ModelShowcaseCard.
    // Validar via description é mais estável (texto editorial específico
    // do card), e via aria-label do botão (que inclui o label do modelo).
    const entries = [
      makeEntry({
        model: { key: "t25p", label: "T25P" } as any,
        description: "Para áreas até 25 ha.",
      }),
      makeEntry({
        model: { key: "t70p", label: "T70P" } as any,
        description: "Para operações de médio porte.",
      }),
      makeEntry({
        model: { key: "t100", label: "T100" } as any,
        description: "Para grandes áreas.",
      }),
    ];

    render(
      <ModelsShowcase
        entries={entries}
        onOpenModel={vi.fn()}
        onTalkToRepGeneric={vi.fn()}
        onTalkToRepForModel={vi.fn()}
      />,
    );

    // 3 botões "Ver modelo X" — um por entry
    expect(
      screen.getByRole("button", { name: /Ver modelo T25P/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ver modelo T70P/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ver modelo T100/i }),
    ).toBeInTheDocument();
    // Descrições editoriais distintas
    expect(screen.getByText("Para áreas até 25 ha.")).toBeInTheDocument();
    expect(screen.getByText("Para grandes áreas.")).toBeInTheDocument();
  });

  it("section tem id='drones-models' (ancoragem do hero)", () => {
    const { container } = render(
      <ModelsShowcase
        entries={[makeEntry()]}
        onOpenModel={vi.fn()}
        onTalkToRepGeneric={vi.fn()}
        onTalkToRepForModel={vi.fn()}
      />,
    );

    // O CTA "Conheça os modelos" do HeroSection aponta pra
    // #drones-models — invariante de ancoragem da landing.
    expect(container.querySelector("#drones-models")).toBeInTheDocument();
  });

  it("clicar no card dispara onOpenModel com a key do modelo", () => {
    // O card é um único botão grande que cobre toda a tile e dispara
    // `onOpen(key)`. Esse é o caminho de qualificação: clica no modelo
    // → vai pra /drones/[id]. Não há botão dedicado de WA no card v3.
    const onOpen = vi.fn();
    render(
      <ModelsShowcase
        entries={[
          makeEntry({
            model: { key: "t70p", label: "T70P" } as any,
          }),
        ]}
        onOpenModel={onOpen}
        onTalkToRepGeneric={vi.fn()}
        onTalkToRepForModel={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Ver modelo T70P/i }),
    );

    expect(onOpen).toHaveBeenCalledWith("t70p");
  });
});
