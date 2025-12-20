import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type AxiosInstanceMock = {
  interceptors: {
    response: {
      use: ReturnType<typeof vi.fn>;
    };
  };
};

let axiosInstance: AxiosInstanceMock;

// Mock do ApiError (sem dependências novas)
vi.mock("../../lib/api/errors", () => {
  class ApiError extends Error {
    status: number;
    code?: string;
    details?: unknown;
    requestId?: string;

    constructor(args: { status: number; code?: string; message: string; details?: unknown; requestId?: string }) {
      super(args.message);
      this.name = "ApiError";
      this.status = args.status;
      this.code = args.code;
      this.details = args.details;
      this.requestId = args.requestId;
    }
  }

  return { ApiError };
});

// Mock do axios (default import) e captura do create()
const createMock = vi.fn();
vi.mock("axios", () => {
  return {
    __esModule: true,
    default: {
      create: (...args: any[]) => createMock(...args),
    },
  };
});

describe("lib/api/axiosClient.ts", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };

    axiosInstance = {
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    };

    createMock.mockReturnValue(axiosInstance);
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("deve criar axios instance com baseURL default e withCredentials=true quando env não existir", async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    // Act
    const mod = await import("../../lib/axiosClient");

    // Assert
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      baseURL: "http://localhost:5000",
      withCredentials: true,
    });

    // export `api` deve ser o retorno de axios.create()
    expect(mod.api).toBe(axiosInstance);

    // interceptor registrado
    expect(axiosInstance.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it("deve priorizar NEXT_PUBLIC_API_URL sobre NEXT_PUBLIC_API_BASE_URL", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com";
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://base.kavita.com";

    // Act
    await import("../../lib/axiosClient");

    // Assert
    expect(createMock).toHaveBeenCalledWith({
      baseURL: "https://api.kavita.com",
      withCredentials: true,
    });
  });

  it("deve usar NEXT_PUBLIC_API_BASE_URL quando NEXT_PUBLIC_API_URL não existir", async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://base.kavita.com";

    // Act
    await import("../../lib/axiosClient");

    // Assert
    expect(createMock).toHaveBeenCalledWith({
      baseURL: "https://base.kavita.com",
      withCredentials: true,
    });
  });

  it("interceptor: caminho de sucesso deve retornar o response sem alterar", async () => {
    // Arrange
    await import("../../lib/axiosClient");
    const [onFulfilled] = (axiosInstance.interceptors.response.use as any).mock.calls[0];

    const res = { data: { ok: true } };

    // Act
    const out = onFulfilled(res);

    // Assert
    expect(out).toBe(res);
  });

  it("interceptor: quando erro tem response.status e payload com message, deve lançar ApiError com message + campos", async () => {
    // Arrange
    const { ApiError } = await import("../../lib/errors");
    await import("../../lib/axiosClient");
    const [, onRejected] = (axiosInstance.interceptors.response.use as any).mock.calls[0];

    const err = {
      response: {
        status: 400,
        data: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: { field: "name" },
          requestId: "req-123",
        },
        headers: {
          "x-request-id": "hdr-999",
        },
      },
    };

    // Act + Assert
    expect(() => onRejected(err)).toThrow(ApiError);
    expect(() => onRejected(err)).toThrow("Dados inválidos");

    try {
      onRejected(err);
    } catch (e: any) {
      expect(e.name).toBe("ApiError");
      expect(e.status).toBe(400);
      expect(e.code).toBe("VALIDATION_ERROR");
      expect(e.details).toEqual({ field: "name" });
      // prioridade: payload.requestId acima do header
      expect(e.requestId).toBe("req-123");
    }
  });

  it("interceptor: se payload não tiver message, deve usar fallback `HTTP <status>`", async () => {
    // Arrange
    const { ApiError } = await import("../../lib/errors");
    await import("../../lib/axiosClient");
    const [, onRejected] = (axiosInstance.interceptors.response.use as any).mock.calls[0];

    const err = {
      response: {
        status: 500,
        data: {
          code: "SERVER_ERROR",
          details: { any: true },
        },
        headers: {
          "x-request-id": "hdr-1",
        },
      },
    };

    // Act + Assert
    expect(() => onRejected(err)).toThrow(ApiError);
    expect(() => onRejected(err)).toThrow("HTTP 500");

    try {
      onRejected(err);
    } catch (e: any) {
      expect(e.status).toBe(500);
      expect(e.code).toBe("SERVER_ERROR");
      expect(e.message).toBe("HTTP 500");
      expect(e.requestId).toBe("hdr-1");
    }
  });

  it("interceptor: se status for 0 (sem response), deve usar mensagem de falha de conexão", async () => {
    // Arrange
    const { ApiError } = await import("../../lib/errors");
    await import("../../lib/axiosClient");
    const [, onRejected] = (axiosInstance.interceptors.response.use as any).mock.calls[0];

    const err = {}; // sem response

    // Act + Assert
    expect(() => onRejected(err)).toThrow(ApiError);
    expect(() => onRejected(err)).toThrow("Falha de conexão. Verifique sua internet e tente novamente.");

    try {
      onRejected(err);
    } catch (e: any) {
      expect(e.status).toBe(0);
      expect(e.message).toBe("Falha de conexão. Verifique sua internet e tente novamente.");
    }
  });

  it("interceptor: requestId deve cair para headers x-request-id e depois request-id quando payload não tiver", async () => {
    // Arrange
    await import("../../lib/axiosClient");
    const [, onRejected] = (axiosInstance.interceptors.response.use as any).mock.calls[0];

    const errA = {
      response: {
        status: 401,
        data: { code: "AUTH" }, // sem requestId
        headers: { "x-request-id": "x-req-777" },
      },
    };

    const errB = {
      response: {
        status: 401,
        data: { code: "AUTH" }, // sem requestId
        headers: { "request-id": "req-888" },
      },
    };

    // Act + Assert (A)
    try {
      onRejected(errA);
    } catch (e: any) {
      expect(e.requestId).toBe("x-req-777");
    }

    // Act + Assert (B)
    try {
      onRejected(errB);
    } catch (e: any) {
      expect(e.requestId).toBe("req-888");
    }
  });
});
