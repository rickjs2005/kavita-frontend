// src/__tests__/services/normalizers.test.ts
// Testes unitários para normalizeProduct e normalizeService.
// Garantem que inconsistências do backend nunca chegam aos componentes.
import { describe, it, expect } from "vitest";
import { normalizeProduct } from "@/services/products";
import { normalizeService } from "@/services/services";

// ---------------------------------------------------------------------------
// normalizeProduct
// ---------------------------------------------------------------------------

describe("normalizeProduct", () => {
  const base = {
    id: 1,
    name: "Ração Bovina",
    price: "129.90",
    image: "/uploads/products/racao.jpg",
    images: null,
    quantity: null,
    estoque: null,
    shipping_free: 1,
  };

  it("converte price string para number", () => {
    expect(normalizeProduct(base).price).toBe(129.9);
  });

  it("price numérico continua number", () => {
    expect(normalizeProduct({ ...base, price: 99.5 }).price).toBe(99.5);
  });

  it("price ausente vira 0", () => {
    expect(normalizeProduct({ ...base, price: undefined }).price).toBe(0);
  });

  it("unifica quantity (tem priority sobre estoque)", () => {
    expect(normalizeProduct({ ...base, quantity: 10, estoque: 5 }).quantity).toBe(10);
  });

  it("usa estoque quando quantity é null", () => {
    expect(normalizeProduct({ ...base, quantity: null, estoque: 7 }).quantity).toBe(7);
  });

  it("quantity vira 0 quando ambos são null", () => {
    expect(normalizeProduct({ ...base, quantity: null, estoque: null }).quantity).toBe(0);
  });

  it("shipping_free 1 vira true", () => {
    expect(normalizeProduct({ ...base, shipping_free: 1 }).shipping_free).toBe(true);
  });

  it("shipping_free 0 vira false", () => {
    expect(normalizeProduct({ ...base, shipping_free: 0 }).shipping_free).toBe(false);
  });

  it("shipping_free boolean false permanece false", () => {
    expect(normalizeProduct({ ...base, shipping_free: false }).shipping_free).toBe(false);
  });

  it("shipping_free boolean true permanece true", () => {
    expect(normalizeProduct({ ...base, shipping_free: true }).shipping_free).toBe(true);
  });

  it("images null vira []", () => {
    expect(normalizeProduct({ ...base, images: null }).images).toEqual([]);
  });

  it("images array é preservado", () => {
    const imgs = ["/a.jpg", "/b.jpg"];
    expect(normalizeProduct({ ...base, images: imgs }).images).toEqual(imgs);
  });

  it("description null/undefined vira string vazia", () => {
    expect(normalizeProduct({ ...base, description: null }).description).toBe("");
    expect(normalizeProduct({ ...base, description: undefined }).description).toBe("");
  });

  it("category_id é null quando ausente", () => {
    expect(normalizeProduct(base).category_id).toBeNull();
  });

  it("category_id numérico vira string", () => {
    expect(normalizeProduct({ ...base, category_id: 3 }).category_id).toBe("3");
  });

  it("rating_avg null permanece null", () => {
    expect(normalizeProduct({ ...base, rating_avg: null }).rating_avg).toBeNull();
  });

  it("rating_avg string vira number", () => {
    expect(normalizeProduct({ ...base, rating_avg: "4.5" }).rating_avg).toBe(4.5);
  });
});

// ---------------------------------------------------------------------------
// normalizeService
// ---------------------------------------------------------------------------

describe("normalizeService", () => {
  const base = {
    id: 10,
    nome: "Dr. Silva",
    descricao: null,
    cargo: "Veterinário",
    imagem: "/uploads/servicos/silva.jpg",
    images: null,
    whatsapp: "31999999999",
    especialidade_nome: "Saúde Animal",
    especialidade_id: "2",
    verificado: 1,
  };

  it("verificado 1 vira true", () => {
    expect(normalizeService(base).verificado).toBe(true);
  });

  it("verificado 0 vira false", () => {
    expect(normalizeService({ ...base, verificado: 0 }).verificado).toBe(false);
  });

  it("verificado boolean permanece boolean", () => {
    expect(normalizeService({ ...base, verificado: false }).verificado).toBe(false);
    expect(normalizeService({ ...base, verificado: true }).verificado).toBe(true);
  });

  it("especialidade_id string vira number", () => {
    expect(normalizeService(base).especialidade_id).toBe(2);
  });

  it("especialidade_id numérico permanece number", () => {
    expect(normalizeService({ ...base, especialidade_id: 5 }).especialidade_id).toBe(5);
  });

  it("especialidade_id null vira null", () => {
    expect(normalizeService({ ...base, especialidade_id: null }).especialidade_id).toBeNull();
  });

  it("especialidade_id string vazia vira null", () => {
    expect(normalizeService({ ...base, especialidade_id: "" }).especialidade_id).toBeNull();
  });

  it("images null vira []", () => {
    expect(normalizeService({ ...base, images: null }).images).toEqual([]);
  });

  it("images string única vira array com um elemento", () => {
    expect(normalizeService({ ...base, images: "/a.jpg" }).images).toEqual(["/a.jpg"]);
  });

  it("images array é preservado (filtra não-strings)", () => {
    expect(
      normalizeService({ ...base, images: ["/a.jpg", null, "/b.jpg"] }).images
    ).toEqual(["/a.jpg", "/b.jpg"]);
  });

  it("descricao null vira string vazia", () => {
    expect(normalizeService(base).descricao).toBe("");
  });

  it("cargo null vira null", () => {
    expect(normalizeService({ ...base, cargo: null }).cargo).toBeNull();
  });

  it("whatsapp null vira null", () => {
    expect(normalizeService({ ...base, whatsapp: null }).whatsapp).toBeNull();
  });
});
