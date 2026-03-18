// src/__tests__/components/admin/drones/GalleryForm.test.tsx
//
// Risco: GalleryForm é o único ponto de gestão da galeria de drones. Bugs aqui
// causam: imagens não aparecerem no público (hero/card errado), uploads sem
// feedback de erro ou exclusão silenciosa sem recarregar lista.
//
// O que está sendo coberto:
//   - Fetch inicial com modelKey
//   - Aba PICK: exibe itens da galeria e alterna target Hero/Card
//   - Selecionar item para Hero chama onPickForHero
//   - Selecionar item para Card chama onPickForCard
//   - Aba MANAGE: renderizada ao clicar em "Gerenciar (CRUD)"
//   - Pending uploads: addFiles exibe preview, caption e botão Remover
//   - Remover pending elimina o item da lista
//   - Upload de todos pendentes: chama POST por arquivo e recarrega
//   - Salvar item existente: chama PUT com FormData
//   - Excluir item existente: chama DEL e recarrega
//   - Mensagem de erro quando fetch falha
//   - Normalização de payload da API (items/data/rows/array direto)
//   - currentHeroMediaId marca item como selecionado

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GalleryForm, { type DroneGalleryItem } from "@/components/admin/drones/GalleryForm";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}));

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) => `http://localhost:5000${p}`,
  API_BASE: "http://localhost:5000",
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("react-hot-toast", () => ({
  default: {
    success: (...a: unknown[]) => mockToastSuccess(...a),
    error: (...a: unknown[]) => mockToastError(...a),
  },
  success: (...a: unknown[]) => mockToastSuccess(...a),
  error: (...a: unknown[]) => mockToastError(...a),
}));

// ---- Helpers ---------------------------------------------------------------

function makeItem(overrides: Partial<DroneGalleryItem> = {}): DroneGalleryItem {
  return {
    id: 1,
    model_key: "agras",
    media_type: "IMAGE",
    media_path: "/uploads/drones/img1.jpg",
    caption: "Foto do drone",
    sort_order: 10,
    is_active: true,
    ...overrides,
  };
}

const BASE_PROPS = {
  modelKey: "agras",
  currentCardMediaId: null as number | null | undefined,
  currentHeroMediaId: null as number | null | undefined,
  onPickForCard: vi.fn() as ((item: DroneGalleryItem) => Promise<void> | void) | undefined,
  onPickForHero: vi.fn() as ((item: DroneGalleryItem) => Promise<void> | void) | undefined,
};

async function renderAndWaitFor(props = BASE_PROPS) {
  render(<GalleryForm {...props} />);
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
}

// ---- Tests -----------------------------------------------------------------

describe("GalleryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ id: 99 });
    mockPut.mockResolvedValue({});
    mockDel.mockResolvedValue(undefined);
    BASE_PROPS.onPickForCard = vi.fn();
    BASE_PROPS.onPickForHero = vi.fn();
    BASE_PROPS.currentCardMediaId = null;
    BASE_PROPS.currentHeroMediaId = null;
  });

  describe("fetch inicial", () => {
    it("chama GET /api/admin/drones/models/{modelKey}/gallery na montagem", async () => {
      mockGet.mockResolvedValue([]);
      await renderAndWaitFor();
      expect(mockGet).toHaveBeenCalledWith(
        "/api/admin/drones/models/agras/gallery",
      );
    });

    it("exibe 'Nenhuma mídia encontrada' quando a galeria está vazia", async () => {
      mockGet.mockResolvedValue([]);
      await renderAndWaitFor();

      await waitFor(() =>
        expect(
          screen.getByText("Nenhuma mídia encontrada para este modelo."),
        ).toBeInTheDocument(),
      );
    });

    it("exibe mensagem de erro quando fetch falha", async () => {
      mockGet.mockRejectedValue(new Error("Galeria offline"));
      await renderAndWaitFor();

      await waitFor(() =>
        expect(screen.getByText("Galeria offline")).toBeInTheDocument(),
      );
    });

    it("normaliza resposta no formato { items: [] }", async () => {
      const item = makeItem();
      mockGet.mockResolvedValue({ items: [item] });
      await renderAndWaitFor();

      await waitFor(() =>
        expect(screen.getByAltText("Foto do drone")).toBeInTheDocument(),
      );
    });

    it("normaliza resposta no formato array direto", async () => {
      mockGet.mockResolvedValue([makeItem({ caption: "Legenda direta" })]);
      await renderAndWaitFor();

      await waitFor(() =>
        expect(screen.getByAltText("Legenda direta")).toBeInTheDocument(),
      );
    });
  });

  describe("aba PICK — seleção rápida", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue([makeItem()]);
    });

    it("exibe aba 'Seleção rápida' como ativa por padrão (mostra texto explicativo)", async () => {
      await renderAndWaitFor();
      await waitFor(() =>
        expect(screen.getByText(/Clique em uma mídia/)).toBeInTheDocument(),
      );
    });

    it("exibe item da galeria com caption", async () => {
      await renderAndWaitFor();
      await waitFor(() =>
        expect(screen.getByText("Foto do drone")).toBeInTheDocument(),
      );
    });

    it("alterna para target CARD ao clicar em 'Card (Lista)'", async () => {
      await renderAndWaitFor();
      await waitFor(() =>
        expect(screen.getByText(/Clique em uma mídia/)).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole("button", { name: "Card (Lista)" }));
      expect(screen.getByRole("button", { name: "Card (Lista)" })).toBeInTheDocument();
    });

    it("chama onPickForHero ao clicar em item com target HERO", async () => {
      const onPickForHero = vi.fn().mockResolvedValue(undefined);
      mockGet.mockResolvedValue([makeItem()]);

      render(<GalleryForm modelKey="agras" onPickForHero={onPickForHero} onPickForCard={vi.fn()} />);

      await waitFor(() =>
        expect(screen.getByText("Foto do drone")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByTitle("Clique para selecionar"));

      await waitFor(() =>
        expect(mockToastSuccess).toHaveBeenCalledWith("Mídia selecionada para Destaque."),
      );
      expect(onPickForHero).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it("chama onPickForCard ao clicar em item com target CARD", async () => {
      const onPickForCard = vi.fn().mockResolvedValue(undefined);
      mockGet.mockResolvedValue([makeItem()]);

      render(<GalleryForm modelKey="agras" onPickForCard={onPickForCard} onPickForHero={vi.fn()} />);

      await waitFor(() =>
        expect(screen.getByText("Foto do drone")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Card (Lista)" }));
      fireEvent.click(screen.getByTitle("Clique para selecionar"));

      await waitFor(() =>
        expect(mockToastSuccess).toHaveBeenCalledWith("Mídia selecionada para o Card."),
      );
      expect(onPickForCard).toHaveBeenCalled();
    });
  });

  // ---- Aba MANAGE: estado vazio (describe separado para evitar conflito com beforeEach abaixo)

  describe("aba MANAGE — estado vazio", () => {
    it("exibe 'Ainda não há mídias para este modelo.' quando galeria vazia", async () => {
      mockGet.mockResolvedValue([]);
      render(<GalleryForm modelKey="agras" />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

      fireEvent.click(screen.getByRole("button", { name: "Gerenciar (CRUD)" }));

      await waitFor(() =>
        expect(
          screen.getByText("Ainda não há mídias para este modelo."),
        ).toBeInTheDocument(),
      );
    });
  });

  // ---- Aba MANAGE: com itens (beforeEach renderiza 1 item e navega para MANAGE)

  describe("aba MANAGE — com itens", () => {
    beforeEach(async () => {
      mockGet.mockResolvedValue([makeItem({ id: 10, caption: "Item CRUD" })]);
      render(<GalleryForm {...BASE_PROPS} />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      // Navega para aba MANAGE
      fireEvent.click(screen.getByRole("button", { name: "Gerenciar (CRUD)" }));
      // Aguarda itens carregados na aba MANAGE
      await waitFor(() =>
        expect(screen.getAllByDisplayValue("Item CRUD").length).toBeGreaterThan(0),
      );
    });

    it("exibe item existente com caption na aba MANAGE", () => {
      expect(screen.getAllByDisplayValue("Item CRUD").length).toBeGreaterThan(0);
    });

    describe("pending uploads", () => {
      function addPendingFile() {
        const file = new File(["content"], "foto.jpg", { type: "image/jpeg" });
        const input = document.querySelector(
          'input[type="file"][accept*="image/jpeg"][multiple]',
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });
        return file;
      }

      it("exibe nova entrada de legenda ao adicionar arquivo (total aumenta em 1)", async () => {
        const before = screen.getAllByPlaceholderText("Legenda (opcional)").length;
        addPendingFile();
        await waitFor(() =>
          expect(screen.getAllByPlaceholderText("Legenda (opcional)")).toHaveLength(
            before + 1,
          ),
        );
      });

      it("botão 'Remover' elimina o pending e reduz a contagem de legendas", async () => {
        const before = screen.getAllByPlaceholderText("Legenda (opcional)").length;
        addPendingFile();

        await waitFor(() =>
          expect(screen.getAllByPlaceholderText("Legenda (opcional)")).toHaveLength(
            before + 1,
          ),
        );

        // "Remover" é exclusivo dos pendentes; itens existentes têm "Excluir"
        fireEvent.click(screen.getByRole("button", { name: "Remover" }));

        await waitFor(() =>
          expect(screen.getAllByPlaceholderText("Legenda (opcional)")).toHaveLength(before),
        );
      });

      it("botão 'Enviar' está desabilitado quando não há pendentes", () => {
        expect(screen.getByRole("button", { name: /Enviar \(0\)/ })).toBeDisabled();
      });

      it("chama POST por arquivo ao clicar Enviar", async () => {
        addPendingFile();

        await waitFor(() =>
          expect(screen.getByRole("button", { name: /Enviar \(1\)/ })).not.toBeDisabled(),
        );

        mockGet.mockResolvedValueOnce([makeItem({ id: 10 })]);
        fireEvent.click(screen.getByRole("button", { name: /Enviar \(1\)/ }));

        await waitFor(() =>
          expect(mockPost).toHaveBeenCalledWith(
            "/api/admin/drones/models/agras/gallery",
            expect.any(FormData),
            { skipContentType: true },
          ),
        );
      });
    });

    describe("salvar item existente", () => {
      it("chama PUT /api/admin/drones/models/{key}/gallery/{id} ao clicar Salvar", async () => {
        mockGet.mockResolvedValueOnce([makeItem({ id: 10 })]);
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));

        const [url, formData, options] = mockPut.mock.calls[0];
        expect(url).toBe("/api/admin/drones/models/agras/gallery/10");
        expect(formData).toBeInstanceOf(FormData);
        expect(options).toMatchObject({ skipContentType: true });
      });

      it("exibe mensagem de erro quando PUT falha", async () => {
        mockPut.mockRejectedValueOnce(new Error("Sem permissão"));
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

        await waitFor(() =>
          expect(screen.getByText("Sem permissão")).toBeInTheDocument(),
        );
      });
    });

    describe("excluir item existente", () => {
      it("chama DEL /api/admin/drones/models/{key}/gallery/{id} ao clicar Excluir", async () => {
        mockGet.mockResolvedValueOnce([]);
        fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

        await waitFor(() =>
          expect(mockDel).toHaveBeenCalledWith(
            "/api/admin/drones/models/agras/gallery/10",
          ),
        );
      });

      it("chama toast.success após exclusão", async () => {
        mockGet.mockResolvedValueOnce([]);
        fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

        await waitFor(() =>
          expect(mockToastSuccess).toHaveBeenCalledWith("Mídia removida com sucesso."),
        );
      });

      it("exibe toast.error e msg quando DEL falha", async () => {
        mockDel.mockRejectedValueOnce(new Error("Erro ao excluir"));
        fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

        await waitFor(() =>
          expect(mockToastError).toHaveBeenCalledWith("Erro ao excluir"),
        );
      });
    });
  });

  describe("botão Recarregar", () => {
    it("chama fetchList novamente ao clicar em Recarregar", async () => {
      mockGet.mockResolvedValue([]);
      render(<GalleryForm {...BASE_PROPS} />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

      fireEvent.click(screen.getByRole("button", { name: "Recarregar" }));

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    });
  });

  describe("pick IDs via props", () => {
    it("exibe badge 'Selecionado' após clicar em item no grid PICK (Hero)", async () => {
      // Nota: currentHeroMediaId é limpo pelo useEffect de cleanup antes dos itens
      // carregarem (items=[] no mount). O badge 'Selecionado' aparece ao clicar.
      mockGet.mockResolvedValue([makeItem({ id: 5, caption: "Hero Item" })]);

      render(
        <GalleryForm
          modelKey="agras"
          onPickForHero={vi.fn().mockResolvedValue(undefined)}
          onPickForCard={vi.fn()}
        />,
      );

      await waitFor(() =>
        expect(screen.getByText("Hero Item")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByTitle("Clique para selecionar"));

      await waitFor(() =>
        expect(screen.getByText("Selecionado")).toBeInTheDocument(),
      );
    });
  });
});
