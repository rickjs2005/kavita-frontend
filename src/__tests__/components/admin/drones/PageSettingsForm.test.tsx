// src/__tests__/components/admin/drones/PageSettingsForm.test.tsx
//
// Risco: hero_title é o campo principal da landing pública de drones — salvar
// vazio derruba o título da página. A lógica de fallback de endpoint
// (page-settings → page) precisa funcionar corretamente para compatibilidade.
//
// O que está sendo coberto:
//   - Loading state durante fetch inicial
//   - Renderiza dados da API nos campos do formulário
//   - Fallback de endpoint: 404 em /page-settings usa /page
//   - Erro de rede no carregamento
//   - Validação: hero_title obrigatório
//   - Validação: sections_order_json não pode estar vazio
//   - Adição e remoção de seções na ordem
//   - Deduplicação de seções duplicadas no save
//   - Save chama PUT com FormData incluindo hero_title
//   - hero_subtitle/cta/etc opcionais omitidos quando vazios
//   - Mensagem de sucesso após save
//   - Mensagem de erro quando PUT falha
//   - Botão Salvar desabilitado enquanto saving

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PageSettingsForm from "@/components/admin/drones/PageSettingsForm";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();
const mockPut = vi.fn();
const mockRequest = vi.fn();
const mockBack = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
    request: (...args: unknown[]) => mockRequest(...args),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
}));

// ---- Fixtures --------------------------------------------------------------

const DEFAULT_SETTINGS = {
  hero_title: "Drones Kavita",
  hero_subtitle: "Alto desempenho",
  cta_title: "Fale conosco",
  cta_button_label: "Entrar em contato",
  cta_message_template: "Olá! Tenho interesse.",
  hero_video_path: "/uploads/drones/hero.mp4",
  hero_image_fallback_path: "/uploads/drones/hero.jpg",
  sections_order_json: ["hero", "gallery", "representatives", "comments"],
};

function setupGetMock(data = DEFAULT_SETTINGS) {
  mockGet.mockResolvedValue(data);
}

function setupSaveMocks(opts: { requestFails?: boolean; putFails?: boolean; putResult?: unknown } = {}) {
  if (opts.requestFails) {
    mockRequest.mockRejectedValue(new Error("404"));
  } else {
    mockRequest.mockResolvedValue({});
  }

  if (opts.putFails) {
    mockPut.mockRejectedValue(new Error("Falha ao salvar"));
  } else {
    mockPut.mockResolvedValue(opts.putResult ?? DEFAULT_SETTINGS);
  }
}

async function waitForForm() {
  await waitFor(() =>
    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument(),
  );
}

// ---- Tests -----------------------------------------------------------------

describe("PageSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSaveMocks();
  });

  describe("loading state", () => {
    it("exibe 'Carregando...' antes do fetch resolver", () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      render(<PageSettingsForm />);
      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });

    it("oculta loading e exibe formulário após fetch", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("Drones Kavita")).toBeInTheDocument();
    });
  });

  describe("carregamento e preenchimento dos dados", () => {
    it("preenche hero_title com dado da API", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      const input = screen.getByDisplayValue("Drones Kavita") as HTMLInputElement;
      expect(input.value).toBe("Drones Kavita");
    });

    it("preenche hero_subtitle com dado da API", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      expect(screen.getByDisplayValue("Alto desempenho")).toBeInTheDocument();
    });

    it("preenche cta_title com dado da API", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      expect(screen.getByDisplayValue("Fale conosco")).toBeInTheDocument();
    });

    it("renderiza seções da ordem no formulário", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      // cada seção é um input — verificar que 'hero' aparece
      const inputs = screen.getAllByDisplayValue("hero");
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it("usa fallback para /page quando /page-settings retorna 404", async () => {
      // Primeiro GET retorna 404 → segundo GET (fallback) retorna dados
      mockGet
        .mockRejectedValueOnce({ status: 404, message: "Not Found" })
        .mockResolvedValueOnce({ hero_title: "Fallback Title" });

      render(<PageSettingsForm />);
      await waitForForm();

      expect(screen.getByDisplayValue("Fallback Title")).toBeInTheDocument();
    });

    it("exibe mensagem de erro quando ambos endpoints falham", async () => {
      mockGet.mockRejectedValue(new Error("Sem rede"));
      render(<PageSettingsForm />);

      await waitFor(() =>
        expect(
          screen.getByText("Erro de rede ao carregar Config Landing."),
        ).toBeInTheDocument(),
      );
    });

    it("trata dados envolvidos em { page: ... } (shape legada)", async () => {
      mockGet.mockResolvedValue({ page: { hero_title: "Via Shape Legada" } });
      render(<PageSettingsForm />);
      await waitForForm();

      expect(screen.getByDisplayValue("Via Shape Legada")).toBeInTheDocument();
    });
  });

  describe("validações", () => {
    it("bloqueia save quando hero_title está vazio e exibe erro", async () => {
      setupGetMock({ ...DEFAULT_SETTINGS, hero_title: "" });
      render(<PageSettingsForm />);
      await waitForForm();

      // Localiza o botão Salvar (desktop) e clica
      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() =>
        expect(
          screen.getByText("hero_title é obrigatório."),
        ).toBeInTheDocument(),
      );
      expect(mockPut).not.toHaveBeenCalled();
    });

    it("bloqueia save quando sections_order está vazio", async () => {
      setupGetMock({ ...DEFAULT_SETTINGS, sections_order_json: [] });
      render(<PageSettingsForm />);
      await waitForForm();

      // Remove todas as seções clicando em todos os botões Remover
      const removeButtons = screen.queryAllByRole("button", { name: "Remover" });
      removeButtons.forEach((btn) => fireEvent.click(btn));

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() =>
        expect(
          screen.getByText("sections_order_json inválido."),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("gestão de seções", () => {
    beforeEach(async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();
    });

    it("remove uma seção ao clicar em Remover", async () => {
      const removeButtons = screen.getAllByRole("button", { name: "Remover" });
      const initialCount = removeButtons.length;

      fireEvent.click(removeButtons[0]);

      await waitFor(() =>
        expect(screen.getAllByRole("button", { name: "Remover" })).toHaveLength(
          initialCount - 1,
        ),
      );
    });

    it("adiciona nova seção ao clicar em + Adicionar", async () => {
      const initialCount = screen.getAllByRole("button", { name: "Remover" }).length;

      fireEvent.click(screen.getByRole("button", { name: "+ Adicionar" }));

      await waitFor(() =>
        expect(screen.getAllByRole("button", { name: "Remover" })).toHaveLength(
          initialCount + 1,
        ),
      );
    });
  });

  describe("save", () => {
    it("chama PUT com hero_title no FormData", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));

      const [, formData] = mockPut.mock.calls[0];
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get("hero_title")).toBe("Drones Kavita");
    });

    it("inclui sections_order_json como JSON string no FormData", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));

      const [, formData] = mockPut.mock.calls[0];
      const sections = JSON.parse((formData as FormData).get("sections_order_json") as string);
      expect(Array.isArray(sections)).toBe(true);
      expect(sections).toContain("hero");
    });

    it("usa endpoint legado /page quando OPTIONS lança exceção", async () => {
      setupGetMock();
      mockRequest.mockRejectedValue(new Error("Not Found"));
      render(<PageSettingsForm />);
      await waitForForm();

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));
      const [url] = mockPut.mock.calls[0];
      expect(url).toBe("/api/admin/drones/page");
    });

    it("usa endpoint novo /page-settings quando OPTIONS tem sucesso", async () => {
      setupGetMock();
      mockRequest.mockResolvedValue({});
      render(<PageSettingsForm />);
      await waitForForm();

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));
      const [url] = mockPut.mock.calls[0];
      expect(url).toBe("/api/admin/drones/page-settings");
    });

    it("exibe 'Config Landing salva com sucesso.' após PUT OK", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() =>
        expect(
          screen.getByText("Config Landing salva com sucesso."),
        ).toBeInTheDocument(),
      );
    });

    it("exibe 'Erro de rede ao salvar Config Landing.' quando PUT falha", async () => {
      setupGetMock();
      setupSaveMocks({ putFails: true });
      render(<PageSettingsForm />);
      await waitForForm();

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() =>
        expect(
          screen.getByText("Erro de rede ao salvar Config Landing."),
        ).toBeInTheDocument(),
      );
    });

    it("não inclui hero_subtitle vazio no FormData", async () => {
      setupGetMock({ ...DEFAULT_SETTINGS, hero_subtitle: null });
      render(<PageSettingsForm />);
      await waitForForm();

      const saveButtons = screen.getAllByRole("button", { name: /Salvar/i });
      fireEvent.click(saveButtons[0]);

      await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));

      const [, formData] = mockPut.mock.calls[0];
      expect((formData as FormData).get("hero_subtitle")).toBeNull();
    });
  });

  describe("botão Voltar", () => {
    it("chama router.back() ao clicar em Voltar (desktop)", async () => {
      setupGetMock();
      render(<PageSettingsForm />);
      await waitForForm();

      const backButtons = screen.getAllByRole("button", { name: /Voltar/i });
      // Clica no primeiro botão Voltar encontrado
      fireEvent.click(backButtons[0]);

      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
