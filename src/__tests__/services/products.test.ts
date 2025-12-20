// src/__tests__/services/products.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProducts, getProductById } from "@/services/products";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe("services/products", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({ ok: true } as any);
  });

  it("getProducts: usa defaults e monta query correta", async () => {
    await getProducts();

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/products?page=1&limit=12&sort=id&order=desc",
      { cache: "no-store" }
    );
  });

  it("getProducts: inclui q quando fornecido", async () => {
    await getProducts({ q: "milho" });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/products?page=1&limit=12&sort=id&order=desc&q=milho",
      { cache: "no-store" }
    );
  });

  it("getProducts: normaliza category (trim + lowercase)", async () => {
    await getProducts({ category: "  MeDiCaMeNtOs  " });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/products?page=1&limit=12&sort=id&order=desc&category=medicamentos",
      { cache: "no-store" }
    );
  });

  it("getProducts: normaliza subcategory (trim + lowercase)", async () => {
    await getProducts({ subcategory: "  BoViNoS " });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/products?page=1&limit=12&sort=id&order=desc&subcategory=bovinos",
      { cache: "no-store" }
    );
  });

  it("getProducts: inclui category + subcategory + q juntos", async () => {
    await getProducts({
      q: "vermífugo",
      category: " Medicamentos ",
      subcategory: " Bovinos ",
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/products?page=1&limit=12&sort=id&order=desc&q=verm%C3%ADfugo&category=medicamentos&subcategory=bovinos",
      { cache: "no-store" }
    );
  });

  it("getProducts: respeita page/limit/sort/order customizados", async () => {
    await getProducts({ page: 3, limit: 24, sort: "price", order: "asc" });

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/products?page=3&limit=24&sort=price&order=asc",
      { cache: "no-store" }
    );
  });

  it("getProducts: não inclui category/subcategory quando vazios/whitespace", async () => {
    await getProducts({ category: "   ", subcategory: "" });

    // category vira "" após trim -> não deve setar
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/products?page=1&limit=12&sort=id&order=desc",
      { cache: "no-store" }
    );
  });

  it("getProductById: chama endpoint correto com cache no-store", async () => {
    await getProductById(10);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/api/products/10", {
      cache: "no-store",
    });
  });

  it("getProductById: lança erro se id inválido (undefined/null/empty string)", async () => {
    // undefined
    await expect(getProductById(undefined as any)).rejects.toThrow(
      "Product id is required"
    );

    // null
    await expect(getProductById(null as any)).rejects.toThrow(
      "Product id is required"
    );

    // "" (string vazia)
    await expect(getProductById("" as any)).rejects.toThrow(
      "Product id is required"
    );
  });

  it("getProductById: aceita id=0 (não deve lançar)", async () => {
    await getProductById(0);

    expect(apiFetchMock).toHaveBeenCalledWith("/api/products/0", {
      cache: "no-store",
    });
  });
});
