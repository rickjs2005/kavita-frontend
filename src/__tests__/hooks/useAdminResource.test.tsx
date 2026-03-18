// src/__tests__/hooks/useAdminResource.test.tsx
//
// Risco: hook CRUD genérico usado em TODOS os painéis admin (cupons, produtos,
// pedidos, equipe, frete...). Bugs aqui quebram operações críticas de negócio
// e comprometem segurança (401/403 deve sempre fazer logout + redirect).
//
// O que está sendo coberto:
//   - Fetch inicial: loading, items populados, shapes variados (array / {rows} / {data})
//   - select customizado
//   - fetchOnMount=false não faz GET
//   - Erro de fetch: error message, toast.error, toast NÃO chamado em 401
//   - 401/403: logout() chamado + router.replace("/admin/login")
//   - create: saving, toast.success, refetch, messages.created=false, erro + toast
//   - update: PUT com id, toast.success, erro + toast + saving reset
//   - remove: DELETE com id, toast.success, 403 silent (sem re-throw), erro normal re-lança

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { SWRConfig } from "swr";
import { useAdminResource } from "@/hooks/useAdminResource";
import { ApiError } from "@/lib/errors";

// ---- Mocks -----------------------------------------------------------------

const mockRouterReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/admin",
}));

const mockLogout = vi.fn();
vi.mock("@/context/AdminAuthContext", () => ({
  useAdminAuth: () => ({ logout: mockLogout }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: {
    success: (...a: unknown[]) => mockToastSuccess(...a),
    error: (...a: unknown[]) => mockToastError(...a),
  },
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDel = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    put: (...a: unknown[]) => mockPut(...a),
    del: (...a: unknown[]) => mockDel(...a),
  },
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

// ---- Types e helpers -------------------------------------------------------

type Item = { id: number; nome: string };

const ENDPOINT = "/api/admin/items";

// ---- Tests -----------------------------------------------------------------

describe("useAdminResource", () => {
  describe("fetch inicial", () => {
    it("loading=true inicialmente, false após fetch", async () => {
      mockGet.mockResolvedValueOnce([]);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("popula items quando a API retorna um array direto", async () => {
      const items: Item[] = [
        { id: 1, nome: "Item A" },
        { id: 2, nome: "Item B" },
      ];
      mockGet.mockResolvedValueOnce(items);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual(items);
    });

    it("aceita shape { rows: T[] }", async () => {
      const rows: Item[] = [{ id: 1, nome: "Row" }];
      mockGet.mockResolvedValueOnce({ rows });

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual(rows);
    });

    it("aceita shape { data: T[] }", async () => {
      const data: Item[] = [{ id: 2, nome: "Data" }];
      mockGet.mockResolvedValueOnce({ data });

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual(data);
    });

    it("aceita shape { items: T[] }", async () => {
      const items: Item[] = [{ id: 3, nome: "Items" }];
      mockGet.mockResolvedValueOnce({ items });

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual(items);
    });

    it("aplica select customizado quando fornecido", async () => {
      mockGet.mockResolvedValueOnce({ total: 2, registros: [{ id: 1, nome: "X" }] });

      const { result } = renderHook(
        () =>
          useAdminResource<Item>({
            endpoint: ENDPOINT,
            select: (raw: unknown) => (raw as any).registros ?? [],
          }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual([{ id: 1, nome: "X" }]);
    });

    it("não faz GET quando fetchOnMount=false", () => {
      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT, fetchOnMount: false }),
        { wrapper: Wrapper },
      );

      expect(result.current.loading).toBe(false);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe("erro de fetch", () => {
    it("expõe error com a mensagem do ApiError e chama toast.error", async () => {
      const apiError = new ApiError({ status: 500, message: "Internal Server Error" });
      mockGet.mockRejectedValueOnce(apiError);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe("Internal Server Error");
      expect(mockToastError).toHaveBeenCalledWith("Internal Server Error");
    });

    it("retorna items vazio quando o fetch falha", async () => {
      mockGet.mockRejectedValueOnce(new Error("falha"));

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual([]);
    });

    it("em 401: chama logout() e router.replace('/admin/login'), NÃO chama toast.error", async () => {
      const apiError = new ApiError({ status: 401, message: "Unauthorized" });
      mockGet.mockRejectedValueOnce(apiError);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith("/admin/login");
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it("em 403: idem — logout + redirect, sem toast.error", async () => {
      const apiError = new ApiError({ status: 403, message: "Forbidden" });
      mockGet.mockRejectedValueOnce(apiError);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith("/admin/login");
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("chama POST, retorna o item criado e mostra toast de sucesso", async () => {
      const existing: Item[] = [{ id: 1, nome: "A" }];
      const created: Item = { id: 2, nome: "Novo" };
      mockGet.mockResolvedValue(existing);
      mockPost.mockResolvedValueOnce(created);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned!: Item;
      await act(async () => {
        returned = await result.current.create({ nome: "Novo" });
      });

      expect(returned).toEqual(created);
      expect(mockPost).toHaveBeenCalledWith(ENDPOINT, { nome: "Novo" });
      expect(mockToastSuccess).toHaveBeenCalledWith("Criado com sucesso.");
      expect(result.current.saving).toBe(false);
    });

    it("silencia toast quando messages.created=false", async () => {
      mockGet.mockResolvedValue([]);
      mockPost.mockResolvedValueOnce({ id: 1, nome: "X" });

      const { result } = renderHook(
        () =>
          useAdminResource<Item>({
            endpoint: ENDPOINT,
            messages: { created: false },
          }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.create({ nome: "X" });
      });

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it("usa mensagem customizada quando messages.created é string", async () => {
      mockGet.mockResolvedValue([]);
      mockPost.mockResolvedValueOnce({ id: 1, nome: "X" });

      const { result } = renderHook(
        () =>
          useAdminResource<Item>({
            endpoint: ENDPOINT,
            messages: { created: "Cupom cadastrado!" },
          }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.create({});
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("Cupom cadastrado!");
    });

    it("saving=false após erro, toast.error chamado, re-lança", async () => {
      mockGet.mockResolvedValue([]);
      const err = new ApiError({ status: 422, message: "Dados inválidos" });
      mockPost.mockRejectedValueOnce(err);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.create({})).rejects.toThrow("Dados inválidos");
      });

      expect(mockToastError).toHaveBeenCalledWith("Dados inválidos");
      expect(result.current.saving).toBe(false);
    });

    it("em 401: logout + redirect ao criar", async () => {
      mockGet.mockResolvedValue([]);
      mockPost.mockRejectedValueOnce(new ApiError({ status: 401, message: "Unauthorized" }));

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.create({})).rejects.toThrow();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith("/admin/login");
    });
  });

  describe("update", () => {
    it("chama PUT com endpoint/:id e mostra toast de sucesso", async () => {
      const updated: Item = { id: 5, nome: "Atualizado" };
      mockGet.mockResolvedValue([{ id: 5, nome: "Original" }]);
      mockPut.mockResolvedValueOnce(updated);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned!: Item;
      await act(async () => {
        returned = await result.current.update(5, { nome: "Atualizado" });
      });

      expect(returned).toEqual(updated);
      expect(mockPut).toHaveBeenCalledWith(`${ENDPOINT}/5`, { nome: "Atualizado" });
      expect(mockToastSuccess).toHaveBeenCalledWith("Atualizado com sucesso.");
      expect(result.current.saving).toBe(false);
    });

    it("saving=false e toast.error quando update falha, re-lança", async () => {
      mockGet.mockResolvedValue([]);
      mockPut.mockRejectedValueOnce(new Error("Timeout"));

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.update(1, {})).rejects.toThrow("Timeout");
      });

      expect(mockToastError).toHaveBeenCalled();
      expect(result.current.saving).toBe(false);
    });
  });

  describe("remove", () => {
    it("chama DELETE com endpoint/:id e mostra toast de sucesso", async () => {
      mockGet.mockResolvedValue([{ id: 3, nome: "Para excluir" }]);
      mockDel.mockResolvedValueOnce(undefined);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.remove(3);
      });

      expect(mockDel).toHaveBeenCalledWith(`${ENDPOINT}/3`);
      expect(mockToastSuccess).toHaveBeenCalledWith("Removido com sucesso.");
    });

    it("toast.error e re-lança em erro não-auth (500)", async () => {
      mockGet.mockResolvedValue([]);
      mockDel.mockRejectedValueOnce(new ApiError({ status: 500, message: "Erro interno" }));

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.remove(1)).rejects.toThrow("Erro interno");
      });

      expect(mockToastError).toHaveBeenCalledWith("Erro interno");
    });

    it("em 403: chama logout + redirect e NÃO re-lança (retorno silencioso)", async () => {
      mockGet.mockResolvedValue([]);
      mockDel.mockRejectedValueOnce(new ApiError({ status: 403, message: "Forbidden" }));

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      // remove retorna Promise<void> silenciosamente em 403 (não re-lança)
      await act(async () => {
        await result.current.remove(1);
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith("/admin/login");
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it("silencia toast quando messages.deleted=false", async () => {
      mockGet.mockResolvedValue([]);
      mockDel.mockResolvedValueOnce(undefined);

      const { result } = renderHook(
        () =>
          useAdminResource<Item>({
            endpoint: ENDPOINT,
            messages: { deleted: false },
          }),
        { wrapper: Wrapper },
      );
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.remove(1);
      });

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe("refetch manual", () => {
    it("refetch() re-executa o GET e atualiza items", async () => {
      const initial: Item[] = [{ id: 1, nome: "Inicial" }];
      const updated: Item[] = [{ id: 1, nome: "Inicial" }, { id: 2, nome: "Novo" }];
      mockGet.mockResolvedValueOnce(initial).mockResolvedValueOnce(updated);

      const { result } = renderHook(
        () => useAdminResource<Item>({ endpoint: ENDPOINT }),
        { wrapper: Wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.items).toEqual(initial);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.items).toEqual(updated);
    });
  });
});
