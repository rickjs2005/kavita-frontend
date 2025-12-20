// src/__tests__/services/services.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServices, getServiceById } from "@/services/services";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe("services/services", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({} as any);
  });

  describe("getServices", () => {
    it("usa defaults e monta query correta (endpoint /api/servicos)", async () => {
      await getServices();

      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/servicos?page=1&limit=12&sort=id&order=desc",
        { cache: "no-store" }
      );
    });

    it("inclui q quando fornecido (trim)", async () => {
      await getServices({ q: "  consulta  " });

      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/servicos?page=1&limit=12&sort=id&order=desc&q=consulta",
        { cache: "no-store" }
      );
    });

    it("converte specialty -> especialidade (trim + lowercase)", async () => {
      await getServices({ specialty: "  VeTeRiNÁrIo " });

      // URLSearchParams vai encodear acentos
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/servicos?page=1&limit=12&sort=id&order=desc&especialidade=veterin%C3%A1rio",
        { cache: "no-store" }
      );
    });

    it("não inclui especialidade quando specialty vazia/whitespace", async () => {
      await getServices({ specialty: "   " });

      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/servicos?page=1&limit=12&sort=id&order=desc",
        { cache: "no-store" }
      );
    });

    it("respeita page/limit/sort/order dentro do contrato", async () => {
      await getServices({ page: 2, limit: 24, sort: "nome", order: "asc" });

      expect(apiFetchMock).toHaveBeenCalledWith(
        "/api/servicos?page=2&limit=24&sort=nome&order=asc",
        { cache: "no-store" }
      );
    });

    it("quando apiFetch falha, lança erro limpo", async () => {
      apiFetchMock.mockRejectedValueOnce(new Error("Internal Server Error"));

      await expect(getServices()).rejects.toThrow("Failed to fetch services");
    });
  });

  describe("getServiceById", () => {
    it("chama endpoint correto com cache no-store (/api/servicos/:id)", async () => {
      apiFetchMock.mockResolvedValueOnce({ id: 1, images: [] });

      await getServiceById(1);

      expect(apiFetchMock).toHaveBeenCalledWith("/api/servicos/1", {
        cache: "no-store",
      });
    });

    it("normaliza images quando vier como string", async () => {
      apiFetchMock.mockResolvedValueOnce({
        id: 1,
        name: "Consulta",
        images: "image.jpg",
      });

      const result = await getServiceById(1);

      expect(result.images).toEqual(["image.jpg"]);
    });

    it("normaliza images quando vier null", async () => {
      apiFetchMock.mockResolvedValueOnce({
        id: 1,
        name: "Consulta",
        images: null,
      });

      const result = await getServiceById(1);

      expect(result.images).toEqual([]);
    });

    it("normaliza images quando vier undefined", async () => {
      apiFetchMock.mockResolvedValueOnce({
        id: 1,
        name: "Consulta",
      });

      const result = await getServiceById(1);

      expect(result.images).toEqual([]);
    });

    it("lança erro limpo quando id inválido", async () => {
      await expect(getServiceById(undefined as any)).rejects.toThrow(
        "Service id is required"
      );
      await expect(getServiceById(null as any)).rejects.toThrow(
        "Service id is required"
      );
      await expect(getServiceById("" as any)).rejects.toThrow(
        "Service id is required"
      );
    });

    it("quando apiFetch falha, lança erro limpo (não vaza mensagem original)", async () => {
      apiFetchMock.mockRejectedValueOnce(new Error("Internal Server Error"));

      await expect(getServiceById(1)).rejects.toThrow("Failed to fetch service");
    });
  });
});
