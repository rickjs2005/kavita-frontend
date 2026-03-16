import { describe, it, expect } from "vitest";
import { computeProductPrice } from "@/utils/pricing";

describe("computeProductPrice", () => {
  // ─── sem promoção ────────────────────────────────────────────────────────
  it("sem promoção: devolve basePrice como original e final, sem desconto", () => {
    const r = computeProductPrice(100, null);
    expect(r.originalPrice).toBe(100);
    expect(r.finalPrice).toBe(100);
    expect(r.discountPercent).toBeNull();
    expect(r.discountValue).toBe(0);
    expect(r.hasDiscount).toBe(false);
  });

  it("sem promoção (undefined): mesmo comportamento que null", () => {
    const r = computeProductPrice(50, undefined);
    expect(r.originalPrice).toBe(50);
    expect(r.finalPrice).toBe(50);
    expect(r.hasDiscount).toBe(false);
  });

  it("basePrice como string: converte corretamente", () => {
    const r = computeProductPrice("79.90", null);
    expect(r.originalPrice).toBe(79.9);
    expect(r.finalPrice).toBe(79.9);
  });

  // ─── final_price explícito ────────────────────────────────────────────────
  it("promoção com final_price: usa final_price e calcula % real", () => {
    const r = computeProductPrice(100, {
      original_price: 100,
      final_price: 80,
    });
    expect(r.originalPrice).toBe(100);
    expect(r.finalPrice).toBe(80);
    expect(r.discountPercent).toBeCloseTo(20);
    expect(r.discountValue).toBeCloseTo(20);
    expect(r.hasDiscount).toBe(true);
  });

  // ─── promo_price (alias legado) ───────────────────────────────────────────
  it("promoção com promo_price (sem final_price): usa promo_price", () => {
    const r = computeProductPrice(100, {
      original_price: 100,
      promo_price: 75,
    });
    expect(r.finalPrice).toBe(75);
    expect(r.discountPercent).toBeCloseTo(25);
    expect(r.hasDiscount).toBe(true);
  });

  // ─── discount_percent sem preço final explícito ───────────────────────────
  it("só discount_percent (sem final_price): calcula preço final a partir do %", () => {
    const r = computeProductPrice(200, { discount_percent: 10 });
    expect(r.finalPrice).toBeCloseTo(180);
    expect(r.discountPercent).toBeCloseTo(10);
    expect(r.discountValue).toBeCloseTo(20);
    expect(r.hasDiscount).toBe(true);
  });

  it("discount_percent como string (ex: '15'): converte e aplica", () => {
    const r = computeProductPrice(100, { discount_percent: "15" });
    expect(r.finalPrice).toBeCloseTo(85);
    expect(r.discountPercent).toBeCloseTo(15);
  });

  // ─── price legado (fallback) ──────────────────────────────────────────────
  it("price legado como original_price quando original_price ausente", () => {
    const r = computeProductPrice(50, { price: 120, final_price: 90 });
    expect(r.originalPrice).toBe(120);
    expect(r.finalPrice).toBe(90);
  });

  it("price legado como final_price quando final_price e promo_price ausentes", () => {
    const r = computeProductPrice(150, { price: 100 });
    expect(r.originalPrice).toBe(100);
    expect(r.finalPrice).toBe(100);
    // price == original == final → sem desconto
    expect(r.hasDiscount).toBe(false);
  });

  // ─── final_price tem prioridade sobre promo_price ─────────────────────────
  it("final_price tem prioridade sobre promo_price", () => {
    const r = computeProductPrice(100, {
      original_price: 100,
      final_price: 70,
      promo_price: 60, // deve ser ignorado
    });
    expect(r.finalPrice).toBe(70);
  });

  // ─── sem desconto real (finalPrice >= originalPrice) ─────────────────────
  it("quando finalPrice >= originalPrice, hasDiscount é false", () => {
    const r = computeProductPrice(100, {
      original_price: 80,
      final_price: 100, // final maior que original → sem desconto
    });
    expect(r.hasDiscount).toBe(false);
    expect(r.discountValue).toBe(0);
  });

  // ─── discount_percent ignorado quando há final_price ─────────────────────
  it("discount_percent é ignorado quando rawFinal está presente", () => {
    // final_price = 90 → desconto real 10%
    // discount_percent = 50 → seria 50%, mas deve ser ignorado
    const r = computeProductPrice(100, {
      original_price: 100,
      final_price: 90,
      discount_percent: 50,
    });
    expect(r.finalPrice).toBe(90);
    expect(r.discountPercent).toBeCloseTo(10);
  });

  // ─── valores string no payload de promoção ───────────────────────────────
  it("campos de promoção como string: converte e calcula corretamente", () => {
    const r = computeProductPrice("100", {
      original_price: "100",
      final_price: "80",
    });
    expect(r.originalPrice).toBe(100);
    expect(r.finalPrice).toBe(80);
    expect(r.discountPercent).toBeCloseTo(20);
  });

  // ─── basePrice 0 (produto sem preço cadastrado) ───────────────────────────
  it("basePrice 0 e promoção sem original_price: originalPrice fica 0", () => {
    const r = computeProductPrice(0, { final_price: 0 });
    expect(r.originalPrice).toBe(0);
    expect(r.finalPrice).toBe(0);
    expect(r.hasDiscount).toBe(false);
  });

  // ─── discountValue calculado corretamente ────────────────────────────────
  it("discountValue é a diferença absoluta em R$", () => {
    const r = computeProductPrice(250, {
      original_price: 250,
      final_price: 200,
    });
    expect(r.discountValue).toBeCloseTo(50);
  });
});
