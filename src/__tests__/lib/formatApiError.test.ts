// src/__tests__/lib/formatApiError.test.ts
import { describe, it, expect } from "vitest";
import { formatApiError, toUserMessage } from "@/lib/formatApiError";
import { ApiError } from "@/lib/errors";

function apiErr(
  args: {
    status?: number;
    message?: string;
    code?: string;
    requestId?: string;
  } = {},
): ApiError {
  return new ApiError({
    status: args.status ?? 400,
    message: args.message ?? "erro genérico",
    code: args.code,
    requestId: args.requestId,
  });
}

// ──────────────────────────────────────────────────────────────
// formatApiError
// ──────────────────────────────────────────────────────────────
describe("formatApiError", () => {
  // ── ApiError ──────────────────────────────────────────────
  describe("ApiError", () => {
    it("extrai message, code, requestId e status quando todos estão presentes (positivo)", () => {
      const err = apiErr({
        status: 422,
        message: "Email inválido",
        code: "INVALID_EMAIL",
        requestId: "req-abc",
      });
      expect(formatApiError(err)).toEqual({
        message: "Email inválido",
        code: "INVALID_EMAIL",
        requestId: "req-abc",
        status: 422,
      });
    });

    it("usa fallback padrão quando message está vazia (negativo)", () => {
      const err = apiErr({ message: "" });
      const result = formatApiError(err);
      expect(result.message).toBe("Ocorreu um erro. Tente novamente.");
      // status ainda deve ser propagado mesmo quando message usa fallback
      expect(result.status).toBe(400);
    });

    it("usa fallback customizado quando message está vazia", () => {
      const err = apiErr({ message: "" });
      const result = formatApiError(err, "Erro personalizado.");
      expect(result.message).toBe("Erro personalizado.");
    });

    it("code e requestId ficam undefined quando não informados", () => {
      const err = apiErr({ message: "Sem extras" });
      const result = formatApiError(err);
      expect(result.code).toBeUndefined();
      expect(result.requestId).toBeUndefined();
      expect(result.status).toBe(400);
    });

    it("code propagado sem requestId (apenas um campo opcional presente)", () => {
      const err = apiErr({ message: "Erro com code", code: "SOME_CODE" });
      const result = formatApiError(err);
      expect(result.code).toBe("SOME_CODE");
      expect(result.requestId).toBeUndefined();
    });

    it("requestId propagado sem code", () => {
      const err = apiErr({ message: "Com requestId", requestId: "id-xyz" });
      const result = formatApiError(err);
      expect(result.requestId).toBe("id-xyz");
      expect(result.code).toBeUndefined();
    });
  });

  // ── Error padrão (não ApiError) ───────────────────────────
  describe("Error padrão (não ApiError)", () => {
    it("extrai message de Error padrão (positivo)", () => {
      const err = new Error("falha de rede");
      expect(formatApiError(err)).toEqual({ message: "falha de rede" });
    });

    it("usa fallback quando Error.message está vazio (negativo)", () => {
      const err = new Error("");
      expect(formatApiError(err).message).toBe("Ocorreu um erro. Tente novamente.");
    });

    it("não inclui code/requestId/status para Error padrão", () => {
      const err = new Error("oops");
      const result = formatApiError(err);
      expect(result.code).toBeUndefined();
      expect(result.requestId).toBeUndefined();
      expect((result as any).status).toBeUndefined();
    });
  });

  // ── string ────────────────────────────────────────────────
  describe("string", () => {
    it("retorna a string como message (positivo)", () => {
      expect(formatApiError("Algo deu errado")).toEqual({
        message: "Algo deu errado",
      });
    });

    it("usa fallback padrão quando string está vazia (negativo)", () => {
      expect(formatApiError("").message).toBe("Ocorreu um erro. Tente novamente.");
    });

    it("usa fallback customizado para string vazia", () => {
      expect(formatApiError("", "Custom fallback").message).toBe("Custom fallback");
    });
  });

  // ── valores desconhecidos / falsy ─────────────────────────
  describe("valores desconhecidos / falsy", () => {
    it("null → fallback padrão", () => {
      expect(formatApiError(null).message).toBe("Ocorreu um erro. Tente novamente.");
    });

    it("undefined → fallback padrão", () => {
      expect(formatApiError(undefined).message).toBe("Ocorreu um erro. Tente novamente.");
    });

    it("objeto desconhecido → fallback", () => {
      expect(formatApiError({ detail: "algo" }).message).toBe(
        "Ocorreu um erro. Tente novamente.",
      );
    });

    it("número → fallback", () => {
      expect(formatApiError(500).message).toBe("Ocorreu um erro. Tente novamente.");
    });

    it("array → fallback", () => {
      expect(formatApiError(["erro1", "erro2"]).message).toBe(
        "Ocorreu um erro. Tente novamente.",
      );
    });
  });
});

// ──────────────────────────────────────────────────────────────
// toUserMessage
// ──────────────────────────────────────────────────────────────
describe("toUserMessage", () => {
  it("inclui (ref: ...) quando requestId existe", () => {
    const err = apiErr({ message: "Erro X", requestId: "req-123" });
    expect(toUserMessage(err)).toBe("Erro X (ref: req-123)");
  });

  it("retorna só message quando não há requestId", () => {
    const err = apiErr({ message: "Erro simples" });
    expect(toUserMessage(err)).toBe("Erro simples");
  });

  it("usa fallback customizado quando erro é null", () => {
    expect(toUserMessage(null, "Fallback teste")).toBe("Fallback teste");
  });

  it("não inclui 'ref:' quando requestId é undefined", () => {
    const err = apiErr({ message: "Sem ref" });
    expect(toUserMessage(err)).not.toContain("ref:");
  });

  it("fallback padrão quando err é null e sem customização", () => {
    expect(toUserMessage(null)).toBe("Ocorreu um erro. Tente novamente.");
  });
});
