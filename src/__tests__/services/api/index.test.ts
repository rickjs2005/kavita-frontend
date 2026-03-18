// src/__tests__/services/api/index.test.ts
//
// Risco: refatorações no barrel podem quebrar imports em toda a aplicação sem
// gerar erros de compilação visíveis imediatamente (tree-shaking silencioso).
//
// O que está sendo coberto:
//   - ENDPOINTS re-exportado corretamente
//   - Todos os namespace services re-exportados com as funções esperadas

import { describe, it, expect } from "vitest";
import {
  ENDPOINTS,
  authService,
  usersService,
  addressesService,
  productsService,
} from "@/services/api";

describe("src/services/api/index — exports", () => {
  it("exporta ENDPOINTS com grupos esperados", () => {
    expect(ENDPOINTS).toBeDefined();
    expect(ENDPOINTS.AUTH.LOGIN).toBe("/api/login");
    expect(ENDPOINTS.PRODUCTS.LIST).toBe("/api/products");
    expect(typeof ENDPOINTS.USERS.ADDRESS).toBe("function");
  });

  describe("authService", () => {
    it("exporta login, logout, getMe, updateMe, register, forgotPassword, resetPassword", () => {
      expect(typeof authService.login).toBe("function");
      expect(typeof authService.logout).toBe("function");
      expect(typeof authService.getMe).toBe("function");
      expect(typeof authService.updateMe).toBe("function");
      expect(typeof authService.register).toBe("function");
      expect(typeof authService.forgotPassword).toBe("function");
      expect(typeof authService.resetPassword).toBe("function");
    });
  });

  describe("usersService", () => {
    it("exporta getMe e updateMe", () => {
      expect(typeof usersService.getMe).toBe("function");
      expect(typeof usersService.updateMe).toBe("function");
    });
  });

  describe("addressesService", () => {
    it("exporta getAddresses, createAddress, updateAddress, deleteAddress", () => {
      expect(typeof addressesService.getAddresses).toBe("function");
      expect(typeof addressesService.createAddress).toBe("function");
      expect(typeof addressesService.updateAddress).toBe("function");
      expect(typeof addressesService.deleteAddress).toBe("function");
    });
  });

  describe("productsService", () => {
    it("exporta getProducts, getProductById, getProductPromotion, getFavorites", () => {
      expect(typeof productsService.getProducts).toBe("function");
      expect(typeof productsService.getProductById).toBe("function");
      expect(typeof productsService.getProductPromotion).toBe("function");
      expect(typeof productsService.getFavorites).toBe("function");
    });
  });
});
