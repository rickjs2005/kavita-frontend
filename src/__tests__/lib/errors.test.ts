import { describe, it, expect } from "vitest";
import { ApiError, isApiError } from "../../lib/errors";

describe("lib/api/errors.ts", () => {
  it("ApiError: deve criar erro com status, code, message, details e requestId", () => {
    // Arrange
    const err = new ApiError({
      status: 400,
      code: "BAD_REQUEST",
      message: "Erro genérico",
      details: { field: "name" },
      requestId: "req-123",
    });

    // Assert
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ApiError");

    expect(err.status).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Erro genérico");
    expect(err.details).toEqual({ field: "name" });
    expect(err.requestId).toBe("req-123");
  });

  it("ApiError: deve funcionar com campos opcionais ausentes (code/details/requestId)", () => {
    // Arrange
    const err = new ApiError({
      status: 418,
      message: "I'm a teapot",
    });

    // Assert
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe("ApiError");

    expect(err.status).toBe(418);
    expect(err.message).toBe("I'm a teapot");
    expect(err.code).toBeUndefined();
    expect(err.details).toBeUndefined();
    expect(err.requestId).toBeUndefined();
  });

  it("isApiError: deve retornar true para instância de ApiError", () => {
    // Arrange
    const err = new ApiError({ status: 401, message: "Não autorizado" });

    // Act
    const result = isApiError(err);

    // Assert
    expect(result).toBe(true);
  });

  it("isApiError: deve retornar false para Error comum", () => {
    // Arrange
    const err = new Error("x");

    // Act
    const result = isApiError(err);

    // Assert
    expect(result).toBe(false);
  });

  it("isApiError: deve retornar false para null/undefined e primitivos (não-objetos)", () => {
    // Arrange
    const cases: unknown[] = [null, undefined, 0, 1, "x", true, false, Symbol("x")];

    // Act + Assert
    for (const c of cases) {
      expect(isApiError(c)).toBe(false);
    }
  });

  it("isApiError: deve retornar true para objeto compatível com name='ApiError' (comportamento do guard)", () => {
    // Arrange
    const fake = { name: "ApiError", status: 400, message: "fake" };

    // Act
    const result = isApiError(fake);

    // Assert
    expect(result).toBe(true);
  });

  it("isApiError: deve ser estável (não lançar) com objetos variados e sempre retornar boolean", () => {
    // Arrange
    const objs: unknown[] = [
      {},
      { status: 400 },
      { message: "x" },
      { name: "Error" },
      { name: "ApiError" }, // pode ser true dependendo do guard
      { status: "400", message: "x" },
      { status: 0, message: "" },
      { code: "AUTH_ERROR", status: 401, message: "Sessão expirada" },
    ];

    // Act
    const results = objs.map((o) => {
      // Assert (parte 1): não pode lançar
      expect(() => isApiError(o)).not.toThrow();
      return isApiError(o);
    });

    // Assert (parte 2): sempre boolean
    for (const r of results) {
      expect(typeof r).toBe("boolean");
    }
  });
});
