// src/__tests__/components/drones/RepresentativesSection.test.tsx
//
// Componente reescrito para layout editorial (cards premium com avatar
// de iniciais, badge "Autorizada", CTA "WhatsApp" + ícone Instagram).
// Os testes abaixo refletem a UI/copy atual; intenção mantida.
//
// Cobertura:
//   - Renderização de representantes via prop
//   - Estado vazio sem busca
//   - Nome, cidade/UF, telefone formatado, CNPJ
//   - Link WhatsApp com href wa.me + cta_message_template no payload
//   - Instagram link presente quando URL valida; ausente quando null/javascript:
//   - Campo de busca + botão Buscar presentes
//   - Buscar dispara GET /api/public/drones/representantes com page=1
//   - Termo de busca incluído no GET
//   - Resultado substitui lista da prop
//   - Erro do GET vira mensagem
//   - Estado loading: botão "Buscando…" desabilitado
//   - Paginação visivel quando totalPages > 1; ausente quando = 1

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RepresentativesSection from "@/components/drones/RepresentativesSection";
import type { DronePageSettings, DroneRepresentative } from "@/types/drones";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

// ---- Fixtures --------------------------------------------------------------

function makePage(overrides: Partial<DronePageSettings> = {}): DronePageSettings {
  return {
    hero_title: "Drones Kavita",
    hero_subtitle: null,
    hero_video_path: null,
    hero_image_fallback_path: null,
    cta_title: null,
    cta_message_template: null,
    cta_button_label: null,
    specs_title: null,
    specs_items_json: null,
    features_title: null,
    features_items_json: null,
    benefits_title: null,
    benefits_items_json: null,
    sections_order_json: null,
    models_json: null,
    ...overrides,
  };
}

function makeRep(overrides: Partial<DroneRepresentative> = {}): DroneRepresentative {
  return {
    id: 1,
    name: "Loja Agro SP",
    whatsapp: "11999999999",
    cnpj: "00.000.000/0001-00",
    instagram_url: null,
    notes: null,
    address_cep: "01310-100",
    address_street: "Av. Paulista",
    address_number: "1000",
    address_neighborhood: "Bela Vista",
    address_city: "São Paulo",
    address_uf: "SP",
    sort_order: 1,
    is_active: 1,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function pagedResp(
  items: DroneRepresentative[],
  extra: Partial<{ page: number; totalPages: number; total: number; limit: number }> = {},
) {
  return {
    items,
    page: 1,
    totalPages: 1,
    total: items.length,
    limit: 12,
    ...extra,
  };
}

// O placeholder usa reticencias unicode "…" (single char) em vez de "...".
const SEARCH_PLACEHOLDER = /^Buscar por nome, cidade ou UF/i;

// ---- Tests -----------------------------------------------------------------

describe("RepresentativesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("estrutura básica", () => {
    it("renderiza heading editorial 'Fale direto com uma loja autorizada'", () => {
      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        /loja autorizada/i,
      );
    });

    it("campo de busca e botão 'Buscar' estão presentes", () => {
      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      expect(
        screen.getByPlaceholderText(SEARCH_PLACEHOLDER),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Buscar" }),
      ).toBeInTheDocument();
    });
  });

  describe("renderização de cards (prop inicial)", () => {
    it("exibe nome e badge 'Autorizada' do representante", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ name: "Agro Norte" })]}
        />,
      );
      expect(screen.getByText("Agro Norte")).toBeInTheDocument();
      // O selo "Autorizada" aparece em mais de um lugar (badge superior +
      // tooltip title). getAllByText evita ambiguidade.
      const selos = screen.getAllByText(/Autorizada/i);
      expect(selos.length).toBeGreaterThanOrEqual(1);
    });

    it("exibe cidade/UF, telefone formatado e CNPJ", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[
            makeRep({
              address_city: "Curitiba",
              address_uf: "PR",
              whatsapp: "41999990000",
              cnpj: "12.345.678/0001-99",
            }),
          ]}
        />,
      );
      // Cidade e UF aparecem juntos com separador "/".
      expect(screen.getByText(/Curitiba\s*\/\s*PR/i)).toBeInTheDocument();
      // Telefone agora e formatado: (41) 99999-0000
      expect(screen.getByText(/\(41\) 99999-0000/)).toBeInTheDocument();
      // CNPJ exibido cru.
      expect(screen.getByText(/12\.345\.678/)).toBeInTheDocument();
    });

    it("exibe notes quando presente", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ notes: "Atende por agendamento." })]}
        />,
      );
      expect(screen.getByText("Atende por agendamento.")).toBeInTheDocument();
    });

    it("link 'WhatsApp' contém href com wa.me e telefone", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ whatsapp: "21988887777" })]}
        />,
      );
      // O CTA agora se chama apenas "WhatsApp" (icone + texto).
      const link = screen.getByRole("link", { name: /WhatsApp/i });
      expect(link.getAttribute("href")).toContain("wa.me/5521988887777");
    });

    it("inclui cta_message_template na URL do WhatsApp quando fornecido", () => {
      render(
        <RepresentativesSection
          page={makePage({ cta_message_template: "Olá! Interesse em drones." })}
          representatives={[makeRep({ whatsapp: "11900000000" })]}
        />,
      );
      const link = screen.getByRole("link", { name: /WhatsApp/i });
      expect(link.getAttribute("href")).toContain(
        encodeURIComponent("Olá! Interesse em drones."),
      );
    });

    it("exibe link Instagram quando instagram_url é uma URL válida", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[
            makeRep({
              instagram_url: "https://instagram.com/kavita_agro",
              name: "Loja XYZ",
            }),
          ]}
        />,
      );
      // O botao do Instagram virou icon-only com aria-label "Instagram de <nome>".
      const link = screen.getByRole("link", { name: /Instagram de Loja XYZ/i });
      expect(link.getAttribute("href")).toBe(
        "https://instagram.com/kavita_agro",
      );
    });

    it("NÃO exibe link Instagram quando instagram_url é null", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ instagram_url: null, name: "Loja X" })]}
        />,
      );
      expect(
        screen.queryByRole("link", { name: /Instagram de Loja X/i }),
      ).not.toBeInTheDocument();
    });

    it("NÃO exibe link Instagram para URL javascript: (XSS bloqueado)", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[
            makeRep({ instagram_url: "javascript:alert(1)", name: "Loja X" }),
          ]}
        />,
      );
      expect(
        screen.queryByRole("link", { name: /Instagram de Loja X/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("estado vazio", () => {
    it("exibe 'Nenhum representante encontrado' quando lista está vazia", () => {
      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      expect(
        screen.getByText(/Nenhum representante encontrado/i),
      ).toBeInTheDocument();
    });

    it("NÃO exibe mensagem de vazio quando há representantes", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep()]}
        />,
      );
      expect(
        screen.queryByText(/Nenhum representante encontrado/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("busca e paginação", () => {
    it("clica Buscar e chama GET com page=1", async () => {
      mockGet.mockResolvedValue(pagedResp([makeRep({ name: "Resultado Busca" })]));
      render(<RepresentativesSection page={makePage()} representatives={[]} />);

      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      expect(mockGet.mock.calls[0][0]).toContain("/api/public/drones/representantes");
      expect(mockGet.mock.calls[0][0]).toContain("page=1");
    });

    it("inclui termo de busca no GET quando campo preenchido", async () => {
      mockGet.mockResolvedValue(pagedResp([]));
      render(<RepresentativesSection page={makePage()} representatives={[]} />);

      fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
        target: { value: "Goiânia" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      expect(mockGet.mock.calls[0][0]).toContain("busca=Goi%C3%A2nia");
    });

    it("substitui lista da prop pelos resultados da busca", async () => {
      mockGet.mockResolvedValue(
        pagedResp([makeRep({ id: 99, name: "Loja Resultado" })]),
      );
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ id: 1, name: "Loja Original" })]}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() =>
        expect(screen.getByText("Loja Resultado")).toBeInTheDocument(),
      );
      expect(screen.queryByText("Loja Original")).not.toBeInTheDocument();
    });

    it("exibe mensagem de erro quando GET falha", async () => {
      mockGet.mockRejectedValueOnce(new Error("Sem conexão"));
      render(<RepresentativesSection page={makePage()} representatives={[]} />);

      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() =>
        expect(screen.getByText("Sem conexão")).toBeInTheDocument(),
      );
    });

    it("botão mostra 'Buscando…' e fica desabilitado durante GET", async () => {
      let resolveGet!: (v: unknown) => void;
      mockGet.mockReturnValueOnce(new Promise((res) => { resolveGet = res; }));

      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      // Reticencias unicode "…" (single char) — nao "..."
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: /Buscando…/ }),
        ).toBeDisabled(),
      );

      resolveGet(pagedResp([]));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Buscar" })).not.toBeDisabled(),
      );
    });

    it("exibe paginação quando totalPages > 1", async () => {
      mockGet.mockResolvedValue(pagedResp([makeRep()], { totalPages: 3, total: 30 }));
      render(<RepresentativesSection page={makePage()} representatives={[]} />);

      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() =>
        expect(screen.getByText(/Página/i)).toBeInTheDocument(),
      );
      // O label "Página 1 de 3" e montado com elementos aninhados (spans).
      // Provamos a paginacao funcional via o botao Proxima e o estado do Anterior.
      expect(
        screen.getByRole("button", { name: /Próxima/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Anterior/i }),
      ).toBeDisabled();
    });

    it("NÃO exibe paginação quando totalPages = 1", async () => {
      mockGet.mockResolvedValue(pagedResp([makeRep()], { totalPages: 1 }));
      render(<RepresentativesSection page={makePage()} representatives={[]} />);

      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() => expect(mockGet).toHaveBeenCalled());
      // Garante que o botao Proxima nao aparece (proxy mais robusto que
      // procurar texto "Página", que pode aparecer em outros contextos).
      expect(
        screen.queryByRole("button", { name: /Próxima/i }),
      ).not.toBeInTheDocument();
    });

    it("NÃO exibe paginação antes de qualquer busca (lista vem da prop)", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep()]}
        />,
      );
      expect(
        screen.queryByRole("button", { name: /Próxima/i }),
      ).not.toBeInTheDocument();
    });
  });
});
