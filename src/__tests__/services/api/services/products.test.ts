// src/__tests__/services/api/services/products.test.ts
//
// Risco: lógica de query string em getProducts pode omitir parâmetros ou usar
// valores padrão errados, resultando em listagens incorretas. getProductPromotion
// precisa absorver qualquer erro (404, rede) sem propagar exceção.
//
// O que está sendo coberto:
//   - getProducts: URLSearchParams com defaults (page=1, limit=12, sort=id, order=desc)
//   - getProducts: parâmetros opcionais trimados e omitidos quando vazios
//   - getProducts: q/category/subcategory só enviados quando não-vazios após trim
//   - getProductById: chama endpoint correto com id
//   - getProductPromotion: retorna dados quando promoção existe
//   - getProductPromotion: retorna null quando apiClient lança qualquer erro
//   - getFavorites: normaliza array direto
//   - getFavorites: normaliza { data: [] }

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProducts,
  getProductById,
  getProductPromotion,
  getFavorites,
} from "@/services/api/services/products";

// ---- Mock apiClient --------------------------------------------------------

const mockGet = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args) },
  default: { get: (...args: unknown[]) => mockGet(...args) },
}));

// ---- Helpers ---------------------------------------------------------------

function capturedUrl(): string {
  return mockGet.mock.calls[0][0] as string;
}

function capturedParams(): URLSearchParams {
  return new URLSearchParams(capturedUrl().split("?")[1] ?? "");
}

// ---- Tests -----------------------------------------------------------------

describe("getProducts", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue([]);
  });

  describe("defaults", () => {
    it("usa page=1, limit=12, sort=id, order=desc quando sem parâmetros", async () => {
      await getProducts();
      const qs = capturedParams();
      expect(qs.get("page")).toBe("1");
      expect(qs.get("limit")).toBe("12");
      expect(qs.get("sort")).toBe("id");
      expect(qs.get("order")).toBe("desc");
    });

    it("chama /api/products como base", async () => {
      await getProducts();
      expect(capturedUrl()).toMatch(/^\/api\/products\?/);
    });

    it("NÃO envia q quando não fornecido", async () => {
      await getProducts();
      expect(capturedParams().has("q")).toBe(false);
    });

    it("NÃO envia category quando não fornecido", async () => {
      await getProducts();
      expect(capturedParams().has("category")).toBe(false);
    });

    it("NÃO envia subcategory quando não fornecido", async () => {
      await getProducts();
      expect(capturedParams().has("subcategory")).toBe(false);
    });
  });

  describe("parâmetros de paginação e ordenação customizados", () => {
    it("usa page e limit fornecidos", async () => {
      await getProducts({ page: 3, limit: 24 });
      const qs = capturedParams();
      expect(qs.get("page")).toBe("3");
      expect(qs.get("limit")).toBe("24");
    });

    it("usa sort e order fornecidos", async () => {
      await getProducts({ sort: "nome", order: "asc" });
      const qs = capturedParams();
      expect(qs.get("sort")).toBe("nome");
      expect(qs.get("order")).toBe("asc");
    });
  });

  describe("filtros de texto", () => {
    it("envia q após trim", async () => {
      await getProducts({ q: "  drone  " });
      expect(capturedParams().get("q")).toBe("drone");
    });

    it("NÃO envia q quando string vazia", async () => {
      await getProducts({ q: "" });
      expect(capturedParams().has("q")).toBe(false);
    });

    it("NÃO envia q quando só espaços", async () => {
      await getProducts({ q: "   " });
      expect(capturedParams().has("q")).toBe(false);
    });

    it("envia category após trim", async () => {
      await getProducts({ category: " agricola " });
      expect(capturedParams().get("category")).toBe("agricola");
    });

    it("envia subcategory após trim", async () => {
      await getProducts({ subcategory: " pulverizadores " });
      expect(capturedParams().get("subcategory")).toBe("pulverizadores");
    });

    it("NÃO envia category quando vazia", async () => {
      await getProducts({ category: "" });
      expect(capturedParams().has("category")).toBe(false);
    });

    it("combina todos os filtros na mesma chamada", async () => {
      await getProducts({ q: "agras", category: "drones", page: 2, limit: 6 });
      const qs = capturedParams();
      expect(qs.get("q")).toBe("agras");
      expect(qs.get("category")).toBe("drones");
      expect(qs.get("page")).toBe("2");
      expect(qs.get("limit")).toBe("6");
    });
  });

  describe("retorno", () => {
    it("retorna o valor resolvido pelo apiClient", async () => {
      const fakeData = [{ id: 1, nome: "Produto X" }];
      mockGet.mockResolvedValueOnce(fakeData);
      const result = await getProducts();
      expect(result).toEqual(fakeData);
    });
  });
});

describe("getProductById", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ id: 1, nome: "Produto" });
  });

  it("chama /api/products/{id} com id numérico", async () => {
    await getProductById(7);
    expect(capturedUrl()).toBe("/api/products/7");
  });

  it("chama /api/products/{id} com id string", async () => {
    await getProductById("slug-abc");
    expect(capturedUrl()).toBe("/api/products/slug-abc");
  });

  it("retorna o produto resolvido", async () => {
    const produto = { id: 99, nome: "Phantom" };
    mockGet.mockResolvedValueOnce(produto);
    const result = await getProductById(99);
    expect(result).toEqual(produto);
  });
});

describe("getProductPromotion", () => {
  it("retorna dados de promoção quando existe", async () => {
    const promo = { id: 1, product_id: 5, final_price: 99.9 };
    mockGet.mockResolvedValueOnce(promo);
    const result = await getProductPromotion(5);
    expect(result).toEqual(promo);
    expect(capturedUrl()).toBe("/api/public/promocoes/5");
  });

  it("retorna null quando apiClient lança 404", async () => {
    mockGet.mockRejectedValueOnce(new Error("Not Found"));
    const result = await getProductPromotion(5);
    expect(result).toBeNull();
  });

  it("retorna null quando apiClient lança erro de rede", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network Error"));
    const result = await getProductPromotion(99);
    expect(result).toBeNull();
  });

  it("retorna null para qualquer tipo de erro (não re-lança)", async () => {
    mockGet.mockRejectedValueOnce({ status: 500, message: "Server Error" });
    await expect(getProductPromotion(1)).resolves.toBeNull();
  });
});

describe("getFavorites", () => {
  it("retorna array direto quando resposta já é array", async () => {
    const favs = [{ id: 1 }, { id: 2 }];
    mockGet.mockResolvedValueOnce(favs);
    const result = await getFavorites();
    expect(result).toEqual(favs);
    expect(mockGet).toHaveBeenCalledWith("/api/favorites");
  });

  it("extrai data[] quando resposta é { data: [] }", async () => {
    const favs = [{ id: 3 }];
    mockGet.mockResolvedValueOnce({ data: favs });
    const result = await getFavorites();
    expect(result).toEqual(favs);
  });

  it("retorna [] quando resposta é { data: undefined }", async () => {
    mockGet.mockResolvedValueOnce({});
    const result = await getFavorites();
    expect(result).toEqual([]);
  });
});
