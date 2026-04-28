// src/__tests__/components/drones/RepresentativesSection.test.tsx
//
// Risco: RepresentativesSection é o único ponto de busca paginada de
// representantes. Construção errada do link WhatsApp ou falha na busca sem
// feedback ao usuário deixam clientes sem canal de contato.
//
// O que está sendo coberto:
//   - Renderização de representantes via prop (SSR inicial)
//   - Estado vazio sem representantes e sem busca
//   - Nome, cidade/UF, WhatsApp, CNPJ de cada card
//   - Link "Falar no WhatsApp" com href correto
//   - Link Instagram quando instagram_url é válido
//   - Sem link Instagram quando instagram_url é null
//   - notes exibido quando presente
//   - Campo de busca e botão "Buscar" presentes
//   - Buscar aciona GET /api/public/drones/representantes com query params
//   - Erro de busca exibe mensagem
//   - Resultado de busca substitui lista da prop
//   - Paginação visível quando totalPages > 1 após busca
//   - Paginação ausente quando totalPages = 1

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

// sanitizeUrl é determinístico — não precisa de mock

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

// ---- Tests -----------------------------------------------------------------

describe("RepresentativesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("estrutura básica", () => {
    it("renderiza heading 'Representantes'", () => {
      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Representantes");
    });

    it("campo de busca e botão 'Buscar' estão presentes", () => {
      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      expect(
        screen.getByPlaceholderText("Buscar por nome, cidade ou UF..."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
    });
  });

  describe("renderização de cards (prop inicial)", () => {
    it("exibe nome e badge 'Loja autorizada' do representante", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ name: "Agro Norte" })]}
        />,
      );
      expect(screen.getByText("Agro Norte")).toBeInTheDocument();
      expect(screen.getByText("Loja autorizada")).toBeInTheDocument();
    });

    it("exibe cidade, UF, WhatsApp e CNPJ", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[
            makeRep({ address_city: "Curitiba", address_uf: "PR", whatsapp: "41999990000", cnpj: "12.345.678/0001-99" }),
          ]}
        />,
      );
      expect(screen.getByText(/Curitiba.*PR/)).toBeInTheDocument();
      expect(screen.getByText(/41999990000/)).toBeInTheDocument();
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

    it("link 'Falar no WhatsApp' contém href com wa.me e telefone", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ whatsapp: "21988887777" })]}
        />,
      );
      const link = screen.getByRole("link", { name: "Falar no WhatsApp" });
      expect(link.getAttribute("href")).toContain("wa.me/5521988887777");
    });

    it("inclui cta_message_template na URL do WhatsApp quando fornecido", () => {
      render(
        <RepresentativesSection
          page={makePage({ cta_message_template: "Olá! Interesse em drones." })}
          representatives={[makeRep({ whatsapp: "11900000000" })]}
        />,
      );
      const link = screen.getByRole("link", { name: "Falar no WhatsApp" });
      expect(link.getAttribute("href")).toContain(
        encodeURIComponent("Olá! Interesse em drones."),
      );
    });

    it("exibe link Instagram quando instagram_url é uma URL válida", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[
            makeRep({ instagram_url: "https://instagram.com/kavita_agro" }),
          ]}
        />,
      );
      // Dois links Instagram aparecem (info + botão)
      const links = screen.getAllByRole("link", { name: "Instagram" });
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0].getAttribute("href")).toBe(
        "https://instagram.com/kavita_agro",
      );
    });

    it("NÃO exibe link Instagram quando instagram_url é null", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep({ instagram_url: null })]}
        />,
      );
      expect(screen.queryByRole("link", { name: "Instagram" })).not.toBeInTheDocument();
    });

    it("NÃO exibe link Instagram para URL javascript: (XSS bloqueado)", () => {
      render(
        <RepresentativesSection
          page={makePage()}
           
          representatives={[makeRep({ instagram_url: "javascript:alert(1)" })]}
        />,
      );
      expect(screen.queryByRole("link", { name: "Instagram" })).not.toBeInTheDocument();
    });
  });

  describe("estado vazio", () => {
    it("exibe 'Nenhum representante encontrado.' quando lista está vazia", () => {
      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      expect(
        screen.getByText("Nenhum representante encontrado."),
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
        screen.queryByText("Nenhum representante encontrado."),
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

      fireEvent.change(
        screen.getByPlaceholderText("Buscar por nome, cidade ou UF..."),
        { target: { value: "Goiânia" } },
      );
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

    it("botão mostra 'Buscando...' e fica desabilitado durante GET", async () => {
      let resolveGet!: (v: unknown) => void;
      mockGet.mockReturnValueOnce(new Promise((res) => { resolveGet = res; }));

      render(<RepresentativesSection page={makePage()} representatives={[]} />);
      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Buscando..." })).toBeDisabled(),
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
        expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument(),
      );
      expect(screen.getByRole("button", { name: "Próxima" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    });

    it("NÃO exibe paginação quando totalPages = 1", async () => {
      mockGet.mockResolvedValue(pagedResp([makeRep()], { totalPages: 1 }));
      render(<RepresentativesSection page={makePage()} representatives={[]} />);

      fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

      await waitFor(() =>
        expect(screen.queryByText(/Página/)).not.toBeInTheDocument(),
      );
    });

    it("NÃO exibe paginação antes de qualquer busca (lista vem da prop)", () => {
      render(
        <RepresentativesSection
          page={makePage()}
          representatives={[makeRep()]}
        />,
      );
      expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
    });
  });
});
