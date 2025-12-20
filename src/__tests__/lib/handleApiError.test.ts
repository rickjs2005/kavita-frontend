import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleApiError } from "../../lib/handleApiError";

describe("lib/handleApiError.ts -> handleApiError()", () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // restaura window para não “vazar” entre testes
    (globalThis as any).window = originalWindow;
  });

  it("deve retornar a mensagem do err.message quando existir", () => {
    // Arrange
    const err = { message: "Falhou aqui" };

    // Act
    const msg = handleApiError(err);

    // Assert
    expect(msg).toBe("Falhou aqui");
  });

  it("deve retornar err.response.data.message quando não houver err.message", () => {
    // Arrange
    const err = {
      response: {
        status: 400,
        data: { message: "Mensagem do backend" },
      },
    };

    // Act
    const msg = handleApiError(err);

    // Assert
    expect(msg).toBe("Mensagem do backend");
  });

  it("deve retornar err.response.data.mensagem quando não houver message", () => {
    // Arrange
    const err = {
      response: {
        status: 400,
        data: { mensagem: "Credenciais inválidas" },
      },
    };

    // Act
    const msg = handleApiError(err);

    // Assert
    expect(msg).toBe("Credenciais inválidas");
  });

  it("deve retornar err.response.data.error quando não houver message/mensagem", () => {
    // Arrange
    const err = {
      response: {
        status: 500,
        data: { error: "Erro interno" },
      },
    };

    // Act
    const msg = handleApiError(err);

    // Assert
    expect(msg).toBe("Erro interno");
  });

  it("deve retornar fallback quando não houver mensagem útil", () => {
    // Arrange
    const err = { response: { status: 500, data: {} } };

    // Act
    const msg = handleApiError(err, { fallback: "Fallback custom" });

    // Assert
    expect(msg).toBe("Fallback custom");
  });

  it("deve retornar fallback padrão quando não houver mensagem e não passar fallback", () => {
    // Arrange
    const err = {};

    // Act
    const msg = handleApiError(err);

    // Assert
    expect(msg).toBe("Ocorreu um erro. Tente novamente.");
  });

  it("deve aceitar err como string e retornar a própria string", () => {
    // Arrange
    const err = "Erro em texto";

    // Act
    const msg = handleApiError(err);

    // Assert
    expect(msg).toBe("Erro em texto");
  });

  it("deve usar String(trim) e cair no fallback se message for vazia/espacos", () => {
    // Arrange
    const err = { message: "   " };

    // Act
    const msg = handleApiError(err, { fallback: "Sem mensagem" });

    // Assert
    expect(msg).toBe("Sem mensagem");
  });

  it("quando silent=true, não deve logar nada (nem warn no browser, nem error no server)", () => {
    // Arrange
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = { message: "Falhou" };

    // Browser (jsdom)
    (globalThis as any).window = originalWindow;

    // Act
    const msg = handleApiError(err, { silent: true, debug: true });

    // Assert
    expect(msg).toBe("Falhou");
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("no browser: não deve usar console.error (evitar overlay), e só deve warn se debug=true", () => {
    // Arrange
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (globalThis as any).window = originalWindow;

    const err = {
      status: 401,
      code: "AUTH_ERROR",
      message: "Sessão expirada",
      url: "/api/users/me",
      details: { any: true },
    };

    // Act (debug=false)
    const msg1 = handleApiError(err, { debug: false });

    // Assert
    expect(msg1).toBe("Sessão expirada");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    // Act (debug=true)
    const msg2 = handleApiError(err, { debug: true });

    // Assert
    expect(msg2).toBe("Sessão expirada");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    const [label, payload] = warnSpy.mock.calls[0];
    expect(label).toBe("API warning:");
    expect(payload).toMatchObject({
      status: 401,
      code: "AUTH_ERROR",
      message: "Sessão expirada",
      url: "/api/users/me",
      details: { any: true },
    });
  });

  it("no server (sem window): deve logar console.error quando silent=false", () => {
    // Arrange
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (globalThis as any).window = undefined; // simula server

    const err = {
      response: {
        status: 500,
        data: { message: "Erro do servidor", code: "SERVER_ERROR" },
      },
      config: { url: "/api/test" },
    };

    // Act
    const msg = handleApiError(err, { silent: false });

    // Assert
    expect(msg).toBe("Erro do servidor");
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const [label, payload] = errorSpy.mock.calls[0];
    expect(label).toBe("API error:");
    expect(payload).toMatchObject({
      status: 500,
      code: "SERVER_ERROR",
      message: "Erro do servidor",
      url: "/api/test",
    });

    // details deve existir (err.response.data)
    expect(payload.details).toEqual({ message: "Erro do servidor", code: "SERVER_ERROR" });
  });

  it("deve normalizar url via err.url ou err.config.url", () => {
    // Arrange
    (globalThis as any).window = undefined; // server para forçar console.error
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const errA = { message: "x", url: "/a" };
    const errB = { message: "y", config: { url: "/b" } };

    // Act
    handleApiError(errA, { silent: false });
    handleApiError(errB, { silent: false });

    // Assert
    expect(errorSpy).toHaveBeenCalledTimes(2);

    const payloadA = errorSpy.mock.calls[0][1];
    const payloadB = errorSpy.mock.calls[1][1];

    expect(payloadA.url).toBe("/a");
    expect(payloadB.url).toBe("/b");
  });
});
