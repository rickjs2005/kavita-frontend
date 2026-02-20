// src/__tests__/lib/handleApiError.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do formatApiError (é ele que faz a “inteligência”)
vi.mock("../../lib/formatApiError", () => ({
  formatApiError: vi.fn(),
}));

import { handleApiError } from "../../lib/handleApiError";
import { formatApiError } from "../../lib/formatApiError";

type FormatMock = ReturnType<typeof vi.fn>;

describe("src/lib/handleApiError.ts -> handleApiError()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve chamar formatApiError(err, fallback default) e retornar o ui", () => {
    // Arrange
    const err = new Error("boom");
    const ui = { message: "Ocorreu um erro.", code: "X", status: 500, requestId: "r1" };

    (formatApiError as unknown as FormatMock).mockReturnValueOnce(ui);

    // Act
    const result = handleApiError(err);

    // Assert
    expect(formatApiError).toHaveBeenCalledTimes(1);
    expect(formatApiError).toHaveBeenCalledWith(err, "Ocorreu um erro.");
    expect(result).toBe(ui);
  });

  it("deve usar opts.fallback quando fornecido", () => {
    // Arrange
    const err = { any: true };
    const ui = { message: "Falhou", code: undefined, status: undefined, requestId: undefined };

    (formatApiError as unknown as FormatMock).mockReturnValueOnce(ui);

    // Act
    const result = handleApiError(err, { fallback: "Falhou" });

    // Assert
    expect(formatApiError).toHaveBeenCalledWith(err, "Falhou");
    expect(result).toBe(ui);
  });

  it("deve usar opts.fallbackMessage quando fallback não existir (compat)", () => {
    // Arrange
    const err = "x";
    const ui = { message: "Compat", code: undefined, status: undefined, requestId: undefined };

    (formatApiError as unknown as FormatMock).mockReturnValueOnce(ui);

    // Act
    const result = handleApiError(err, { fallbackMessage: "Compat" });

    // Assert
    expect(formatApiError).toHaveBeenCalledWith(err, "Compat");
    expect(result).toBe(ui);
  });

  it("fallback deve priorizar opts.fallback sobre opts.fallbackMessage", () => {
    // Arrange
    const err = "x";
    const ui = { message: "A", code: undefined, status: undefined, requestId: undefined };

    (formatApiError as unknown as FormatMock).mockReturnValueOnce(ui);

    // Act
    const result = handleApiError(err, { fallback: "A", fallbackMessage: "B" });

    // Assert
    expect(formatApiError).toHaveBeenCalledWith(err, "A");
    expect(result).toBe(ui);
  });

  it("quando opts.debug=true, deve logar no console.error e ainda retornar ui", () => {
    // Arrange
    const err = new Error("boom");
    const ui = { message: "Ocorreu um erro.", code: "X", status: 500, requestId: "r1" };

    (formatApiError as unknown as FormatMock).mockReturnValueOnce(ui);

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = handleApiError(err, { debug: true });

    // Assert
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("[handleApiError]", { ui, err });
    expect(result).toBe(ui);
  });

  it("quando opts.debug=false/undefined, NÃO deve logar no console.error", () => {
    // Arrange
    const err = new Error("boom");
    const ui = { message: "Ocorreu um erro.", code: "X", status: 500, requestId: "r1" };

    (formatApiError as unknown as FormatMock).mockReturnValueOnce(ui);

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = handleApiError(err, { debug: false });

    // Assert
    expect(spy).not.toHaveBeenCalled();
    expect(result).toBe(ui);
  });

  it("opts.silent não deve afetar o resultado (apenas compat), continua chamando formatApiError", () => {
    // Arrange
    const err = new Error("boom");
    const ui = { message: "ok", code: undefined, status: undefined, requestId: undefined };

    (formatApiError as unknown as FormatMock).mockReturnValueOnce(ui);

    // Act
    const result = handleApiError(err, { silent: true });

    // Assert
    expect(formatApiError).toHaveBeenCalledWith(err, "Ocorreu um erro.");
    expect(result).toBe(ui);
  });
});