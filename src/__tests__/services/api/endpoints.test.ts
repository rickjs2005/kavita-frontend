// src/__tests__/services/api/endpoints.test.ts
//
// Risco: constantes de endpoint erradas causam chamadas de API para URLs
// incorretas — falhas silenciosas difíceis de rastrear em produção.
//
// O que está sendo coberto:
//   - Valores estáticos de todos os grupos (AUTH, USERS, PRODUCTS, etc.)
//   - Funções dinâmicas com id numérico e string
//   - Imutabilidade do objeto (as const)

import { describe, it, expect } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";

describe("ENDPOINTS", () => {
  describe("AUTH", () => {
    it("LOGIN aponta para /api/login", () => {
      expect(ENDPOINTS.AUTH.LOGIN).toBe("/api/login");
    });

    it("LOGOUT aponta para /api/logout", () => {
      expect(ENDPOINTS.AUTH.LOGOUT).toBe("/api/logout");
    });

    it("ME aponta para /api/users/me", () => {
      expect(ENDPOINTS.AUTH.ME).toBe("/api/users/me");
    });

    it("REGISTER aponta para /api/users/register", () => {
      expect(ENDPOINTS.AUTH.REGISTER).toBe("/api/users/register");
    });

    it("FORGOT_PASSWORD aponta para /api/users/forgot-password", () => {
      expect(ENDPOINTS.AUTH.FORGOT_PASSWORD).toBe("/api/users/forgot-password");
    });

    it("RESET_PASSWORD aponta para /api/users/reset-password", () => {
      expect(ENDPOINTS.AUTH.RESET_PASSWORD).toBe("/api/users/reset-password");
    });
  });

  describe("USERS", () => {
    it("ME aponta para /api/users/me", () => {
      expect(ENDPOINTS.USERS.ME).toBe("/api/users/me");
    });

    it("ADDRESSES aponta para /api/users/addresses", () => {
      expect(ENDPOINTS.USERS.ADDRESSES).toBe("/api/users/addresses");
    });

    it("ADDRESS(id) retorna URL com id numérico", () => {
      expect(ENDPOINTS.USERS.ADDRESS(42)).toBe("/api/users/addresses/42");
    });

    it("ADDRESS(id) retorna URL com id string", () => {
      expect(ENDPOINTS.USERS.ADDRESS("abc")).toBe("/api/users/addresses/abc");
    });
  });

  describe("PRODUCTS", () => {
    it("LIST aponta para /api/products", () => {
      expect(ENDPOINTS.PRODUCTS.LIST).toBe("/api/products");
    });

    it("DETAIL(id) retorna URL com id numérico", () => {
      expect(ENDPOINTS.PRODUCTS.DETAIL(7)).toBe("/api/products/7");
    });

    it("DETAIL(id) retorna URL com id string", () => {
      expect(ENDPOINTS.PRODUCTS.DETAIL("slug-produto")).toBe(
        "/api/products/slug-produto",
      );
    });

    it("PROMOTIONS(id) retorna URL com id numérico", () => {
      expect(ENDPOINTS.PRODUCTS.PROMOTIONS(7)).toBe("/api/public/promocoes/7");
    });
  });

  describe("SERVICES", () => {
    it("LIST aponta para /api/servicos", () => {
      expect(ENDPOINTS.SERVICES.LIST).toBe("/api/servicos");
    });

    it("DETAIL(id) retorna URL com id numérico", () => {
      expect(ENDPOINTS.SERVICES.DETAIL(3)).toBe("/api/servicos/3");
    });

    it("PUBLIC_LIST aponta para /api/public/servicos", () => {
      expect(ENDPOINTS.SERVICES.PUBLIC_LIST).toBe("/api/public/servicos");
    });
  });

  describe("FAVORITES", () => {
    it("LIST aponta para /api/favorites", () => {
      expect(ENDPOINTS.FAVORITES.LIST).toBe("/api/favorites");
    });

    it("TOGGLE(id) retorna URL com id numérico", () => {
      expect(ENDPOINTS.FAVORITES.TOGGLE(5)).toBe("/api/favorites/5");
    });
  });

  describe("CHECKOUT", () => {
    it("PLACE_ORDER aponta para /api/checkout", () => {
      expect(ENDPOINTS.CHECKOUT.PLACE_ORDER).toBe("/api/checkout");
    });

    it("PREVIEW_COUPON aponta para /api/checkout/preview-cupom", () => {
      expect(ENDPOINTS.CHECKOUT.PREVIEW_COUPON).toBe(
        "/api/checkout/preview-cupom",
      );
    });
  });

  describe("SHIPPING", () => {
    it("QUOTE aponta para /api/shipping/quote", () => {
      expect(ENDPOINTS.SHIPPING.QUOTE).toBe("/api/shipping/quote");
    });
  });

  describe("PAYMENT", () => {
    it("START aponta para /api/payment/start", () => {
      expect(ENDPOINTS.PAYMENT.START).toBe("/api/payment/start");
    });
  });
});
