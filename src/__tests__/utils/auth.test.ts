import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCookie, getAdminToken } from "@/utils/auth";

describe("utils/auth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // limpa cookies
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
    localStorage.clear();
  });

  describe("getCookie", () => {
    it("retorna null quando cookie não existe", () => {
      // Act
      const result = getCookie("adminToken");

      // Assert
      expect(result).toBeNull();
    });

    it("retorna valor do cookie quando existe", () => {
      // Arrange
      document.cookie = "adminToken=abc123";

      // Act
      const result = getCookie("adminToken");

      // Assert
      expect(result).toBe("abc123");
    });

    it("retorna null em ambiente SSR (document undefined)", () => {
      // Arrange
      const originalDocument = global.document;
      // @ts-ignore
      delete global.document;

      // Act
      const result = getCookie("adminToken");

      // Assert
      expect(result).toBeNull();

      // Cleanup
      global.document = originalDocument;
    });
  });

  describe("getAdminToken", () => {
    it("prioriza token do localStorage", () => {
      // Arrange
      localStorage.setItem("adminToken", "local-token");
      document.cookie = "adminToken=cookie-token";

      // Act
      const result = getAdminToken();

      // Assert
      expect(result).toBe("local-token");
    });

    it("usa cookie se localStorage estiver vazio", () => {
      // Arrange
      document.cookie = "adminToken=cookie-token";

      // Act
      const result = getAdminToken();

      // Assert
      expect(result).toBe("cookie-token");
    });

    it("retorna null se nenhum token existir", () => {
      // Act
      const result = getAdminToken();

      // Assert
      expect(result).toBeNull();
    });

    it("não quebra se localStorage lançar erro", () => {
      // Arrange
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage blocked");
      });
      document.cookie = "adminToken=cookie-token";

      // Act
      const result = getAdminToken();

      // Assert
      expect(result).toBe("cookie-token");
    });
  });
});
