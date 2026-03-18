// src/__tests__/hooks/useFetchDronesPage.test.tsx
//
// Risco: hook que agrega dados de múltiplas rotas simultâneas para a landing
// de drones, com fallback legado e normalização de payload. Falhas aqui fazem
// a página de drones renderizar vazia ou travar.
//
// O que está sendo coberto:
//   - loading inicial
//   - sem modelKey: busca /drones + /models + /representantes em paralelo
//   - com modelKey válido: busca /models/{key} ao invés de /drones
//   - normalização de modelKey (lowercase + trim + validação de regex)
//   - modelKey inválido (hífen, muito curto/longo) → tratado como sem modelKey
//   - fallback legado: /drones/galeria quando gallery vazio no root
//   - fallback legado: /drones/comentarios quando comments vazio no root
//   - normalizeModels: key via model_key, label via name, filtro de inválidos
//   - resolvePageFromRoot: campo landing vs page
//   - extractItemsArray: array direto, {items: []}, {data: []}
//   - defaults seguros quando resposta está vazia
//   - erro exposto via error.message

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { useFetchDronesPage } from "@/hooks/useFetchDronesPage";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));

// ---- Wrapper ---------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        dedupingInterval: 0,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}

// ---- Helpers ---------------------------------------------------------------

/** Mock padrão para o caso sem modelKey (root + models + representantes). */
function setupRootMocks({
  models = [],
  reps = [],
  root = {},
}: {
  models?: unknown[];
  reps?: unknown;
  root?: unknown;
} = {}) {
  mockGet.mockImplementation((url: string) => {
    if (url === "/api/public/drones/models") return Promise.resolve(models);
    if (url.includes("/api/public/drones/representantes")) return Promise.resolve(reps);
    if (url === "/api/public/drones") return Promise.resolve(root);
    // fallbacks legados: nunca resolver para não interferir
    return Promise.resolve([]);
  });
}

/** Mock padrão para o caso com modelKey. */
function setupModelKeyMocks({
  models = [],
  reps = [],
  agg = {},
  modelKey = "agras",
}: {
  models?: unknown[];
  reps?: unknown;
  agg?: unknown;
  modelKey?: string;
} = {}) {
  mockGet.mockImplementation((url: string) => {
    if (url === "/api/public/drones/models") return Promise.resolve(models);
    if (url.includes("/api/public/drones/representantes")) return Promise.resolve(reps);
    if (url === `/api/public/drones/models/${modelKey}`) return Promise.resolve(agg);
    return Promise.resolve([]);
  });
}

// ---- Tests -----------------------------------------------------------------

describe("useFetchDronesPage", () => {
  describe("loading", () => {
    it("loading=true antes do fetch resolver", async () => {
      setupRootMocks();

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });

      // Verificação síncrona — antes de qualquer microtask de SWR
      expect(result.current.loading).toBe(true);

      // Cleanup: aguarda estabilização para evitar warnings de act()
      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });

  describe("sem modelKey (landing page completa)", () => {
    it("popula page, models, gallery, representatives e comments", async () => {
      setupRootMocks({
        models: [{ key: "agras", label: "Agras T40" }],
        reps: { items: [{ id: 1, nome: "Distribuidor SP" }] },
        root: {
          landing: { title: "Drones Kavita" },
          gallery: [{ id: 1, url: "/img/drone.jpg" }],
          comments: { items: [{ id: 1, text: "Ótimo!" }] },
        },
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.page).toEqual({ title: "Drones Kavita" });
      expect(result.current.models).toHaveLength(1);
      expect(result.current.gallery).toHaveLength(1);
      expect(result.current.representatives).toHaveLength(1);
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it("retorna defaults seguros quando a API responde vazio", async () => {
      mockGet.mockImplementation((url: string) => {
        if (url === "/api/public/drones/models") return Promise.resolve([]);
        if (url.includes("representantes")) return Promise.resolve([]);
        if (url === "/api/public/drones") return Promise.resolve({});
        // fallbacks: responde [] para não travar
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.page).toBeNull();
      expect(result.current.models).toEqual([]);
      expect(result.current.gallery).toEqual([]);
      expect(result.current.representatives).toEqual([]);
      expect(result.current.comments).toEqual([]);
      expect(result.current.model).toBeNull();
    });

    it("chama /drones e NÃO chama /drones/models/{key}", async () => {
      setupRootMocks();

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockGet).toHaveBeenCalledWith("/api/public/drones");
      expect(mockGet).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/public\/drones\/models\/.+/),
      );
    });
  });

  describe("fallback legado", () => {
    it("chama /drones/galeria quando root.gallery está vazio", async () => {
      const galeria = [{ id: 1, url: "/img/a.jpg" }];
      mockGet.mockImplementation((url: string) => {
        if (url === "/api/public/drones/models") return Promise.resolve([]);
        if (url.includes("representantes")) return Promise.resolve([]);
        if (url === "/api/public/drones") return Promise.resolve({ gallery: [] });
        if (url === "/api/public/drones/galeria") return Promise.resolve(galeria);
        if (url.includes("comentarios")) return Promise.resolve([]);
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.gallery).toEqual(galeria);
      expect(mockGet).toHaveBeenCalledWith("/api/public/drones/galeria");
    });

    it("chama /drones/comentarios quando root.comments está vazio", async () => {
      const comentarios = [{ id: 1, text: "Legal" }];
      mockGet.mockImplementation((url: string) => {
        if (url === "/api/public/drones/models") return Promise.resolve([]);
        if (url.includes("representantes")) return Promise.resolve([]);
        if (url === "/api/public/drones")
          return Promise.resolve({ gallery: [{ id: 1 }], comments: [] });
        if (url.includes("comentarios")) return Promise.resolve({ items: comentarios });
        return Promise.resolve([]);
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.comments).toEqual(comentarios);
    });

    it("NÃO chama fallback de galeria quando root.gallery já tem itens", async () => {
      setupRootMocks({
        root: { gallery: [{ id: 1, url: "/img/ok.jpg" }] },
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockGet).not.toHaveBeenCalledWith("/api/public/drones/galeria");
    });
  });

  describe("com modelKey válido", () => {
    it("busca dados do modelo específico e NÃO chama /drones", async () => {
      const agg = {
        landing: { title: "Agras T40" },
        model_data: { specs: ["GPS", "RTK"] },
        gallery: [{ id: 1, url: "/img/agras.jpg" }],
        comments: { items: [{ id: 1, text: "Excelente!" }] },
      };
      setupModelKeyMocks({ agg, modelKey: "agras" });

      const { result } = renderHook(() => useFetchDronesPage("agras"), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.page).toEqual({ title: "Agras T40" });
      expect(result.current.model).toEqual({ specs: ["GPS", "RTK"] });
      expect(result.current.gallery).toHaveLength(1);
      expect(result.current.comments).toHaveLength(1);
      expect(mockGet).toHaveBeenCalledWith("/api/public/drones/models/agras");
      expect(mockGet).not.toHaveBeenCalledWith("/api/public/drones");
    });

    it("normaliza modelKey para lowercase + trim antes de usar na URL", async () => {
      setupModelKeyMocks({ modelKey: "agras" });

      const { result } = renderHook(
        () => useFetchDronesPage("  AGRAS  "),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockGet).toHaveBeenCalledWith("/api/public/drones/models/agras");
    });
  });

  describe("modelKey inválido → tratado como sem modelKey", () => {
    it("chave com hífen é inválida para o regex e busca root", async () => {
      // /^[a-z0-9_]{2,20}$/ — hífen não é aceito
      setupRootMocks();

      const { result } = renderHook(
        () => useFetchDronesPage("abc-def"),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockGet).toHaveBeenCalledWith("/api/public/drones");
      expect(mockGet).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/models\/abc-def/),
      );
    });

    it("chave de 1 caractere é muito curta (mínimo 2) e busca root", async () => {
      setupRootMocks();

      const { result } = renderHook(() => useFetchDronesPage("a"), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockGet).toHaveBeenCalledWith("/api/public/drones");
    });

    it("chave com 21+ caracteres excede o máximo (20) e busca root", async () => {
      setupRootMocks();

      const { result } = renderHook(
        () => useFetchDronesPage("abcdefghijklmnopqrstu"), // 21 chars
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockGet).toHaveBeenCalledWith("/api/public/drones");
    });
  });

  describe("normalização de dados", () => {
    it("normalizeModels: usa model_key como fallback para key", async () => {
      setupRootMocks({
        models: [{ model_key: "phantom", name: "Phantom 4" }],
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.models[0]).toMatchObject({
        key: "phantom",
        label: "Phantom 4",
      });
    });

    it("normalizeModels: filtra modelos sem key ou sem label", async () => {
      setupRootMocks({
        models: [
          { key: "ok", label: "Válido" },
          { key: "", label: "Sem chave" },
          { key: "semLabel", label: "" },
          { key: "perfeito", label: "Perfeito" },
        ],
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.models).toHaveLength(2);
      expect(result.current.models.map((m) => m.key)).toEqual(["ok", "perfeito"]);
    });

    it("resolvePageFromRoot: usa campo 'page' quando 'landing' está ausente", async () => {
      const pageData = { title: "Página via page" };
      setupRootMocks({ root: { page: pageData } });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.page).toEqual(pageData);
    });

    it("resolvePageFromRoot: prioriza 'landing' quando ambos existem", async () => {
      const landingData = { title: "Landing" };
      const pageData = { title: "Page" };
      setupRootMocks({ root: { landing: landingData, page: pageData } });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.page).toEqual(landingData);
    });

    it("extractItemsArray: aceita resposta no formato { items: [] }", async () => {
      setupRootMocks({
        reps: { items: [{ id: 1, nome: "Rep A" }] },
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.representatives).toHaveLength(1);
    });

    it("extractItemsArray: aceita resposta no formato { data: [] }", async () => {
      setupRootMocks({
        reps: { data: [{ id: 2, nome: "Rep B" }] },
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.representatives).toHaveLength(1);
    });

    it("normalizeModels: normaliza key para lowercase", async () => {
      setupRootMocks({
        models: [{ key: "PHANTOM", label: "Phantom 4" }],
      });

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.models[0].key).toBe("phantom");
    });
  });

  describe("tratamento de erro", () => {
    it("expõe error.message quando o fetch lança erro", async () => {
      mockGet.mockRejectedValue(new Error("Network failure"));

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Network failure");
    });

    it("retorna coleções vazias quando há erro de rede", async () => {
      mockGet.mockRejectedValue(new Error("500"));

      const { result } = renderHook(() => useFetchDronesPage(), { wrapper: Wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.models).toEqual([]);
      expect(result.current.gallery).toEqual([]);
      expect(result.current.representatives).toEqual([]);
      expect(result.current.comments).toEqual([]);
      expect(result.current.page).toBeNull();
    });
  });
});
