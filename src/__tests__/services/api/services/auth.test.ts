// src/__tests__/services/api/services/auth.test.ts
//
// Risco: endpoints de autenticação errados (ex.: POST para GET, URL incorreta)
// resultam em falhas de login/logout silenciosas ou vazamento de sessão.
//
// O que está sendo coberto:
//   - login: POST /api/login com payload
//   - logout: POST /api/logout (sem payload)
//   - getMe: GET /api/users/me
//   - updateMe: PUT /api/users/me com payload parcial
//   - register: POST /api/users/register com payload
//   - forgotPassword: POST /api/users/forgot-password com email
//   - resetPassword: POST /api/users/reset-password com token + password
//   - Propagação de erros sem absorção silenciosa

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  login,
  logout,
  getMe,
  updateMe,
  register,
  forgotPassword,
  resetPassword,
} from "@/services/api/services/auth";

// ---- Mock apiClient --------------------------------------------------------

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

// ---- Fixtures --------------------------------------------------------------

const SAMPLE_USER = { id: 1, nome: "Usuário Teste", email: "user@test.com" };

// ---- Tests -----------------------------------------------------------------

describe("login", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(SAMPLE_USER);
  });

  it("chama POST /api/login", async () => {
    await login({ email: "a@b.com", password: "123456" });
    expect(mockPost).toHaveBeenCalledWith("/api/login", {
      email: "a@b.com",
      password: "123456",
    });
  });

  it("retorna o perfil do usuário autenticado", async () => {
    const result = await login({ email: "a@b.com", password: "123456" });
    expect(result).toEqual(SAMPLE_USER);
  });

  it("propaga erro quando credenciais inválidas (401)", async () => {
    mockPost.mockRejectedValueOnce(new Error("401 Unauthorized"));
    await expect(
      login({ email: "a@b.com", password: "errada" }),
    ).rejects.toThrow("401 Unauthorized");
  });
});

describe("logout", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(undefined);
  });

  it("chama POST /api/logout sem payload", async () => {
    await logout();
    expect(mockPost).toHaveBeenCalledWith("/api/logout");
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("resolve sem valor quando sucesso", async () => {
    const result = await logout();
    expect(result).toBeUndefined();
  });

  it("propaga erro quando apiClient lança", async () => {
    mockPost.mockRejectedValueOnce(new Error("500"));
    await expect(logout()).rejects.toThrow("500");
  });
});

describe("getMe", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue(SAMPLE_USER);
  });

  it("chama GET /api/users/me", async () => {
    await getMe();
    expect(mockGet).toHaveBeenCalledWith("/api/users/me");
  });

  it("retorna perfil do usuário", async () => {
    const result = await getMe();
    expect(result).toEqual(SAMPLE_USER);
  });

  it("propaga erro quando não autenticado (401)", async () => {
    mockGet.mockRejectedValueOnce(new Error("401"));
    await expect(getMe()).rejects.toThrow("401");
  });
});

describe("updateMe", () => {
  beforeEach(() => {
    mockPut.mockResolvedValue({ ...SAMPLE_USER, nome: "Novo Nome" });
  });

  it("chama PUT /api/users/me com payload parcial", async () => {
    await updateMe({ nome: "Novo Nome" });
    expect(mockPut).toHaveBeenCalledWith("/api/users/me", { nome: "Novo Nome" });
  });

  it("retorna o perfil atualizado", async () => {
    const result = await updateMe({ nome: "Novo Nome" });
    expect(result).toMatchObject({ nome: "Novo Nome" });
  });

  it("aceita payload vazio (nenhuma atualização)", async () => {
    mockPut.mockResolvedValueOnce(SAMPLE_USER);
    await updateMe({});
    expect(mockPut).toHaveBeenCalledWith("/api/users/me", {});
  });

  it("propaga erro quando apiClient lança", async () => {
    mockPut.mockRejectedValueOnce(new Error("422"));
    await expect(updateMe({ nome: "" })).rejects.toThrow("422");
  });
});

describe("register", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(SAMPLE_USER);
  });

  it("chama POST /api/users/register com payload", async () => {
    const payload = { nome: "Novo", email: "novo@test.com", password: "abc123" };
    await register(payload);
    expect(mockPost).toHaveBeenCalledWith("/api/users/register", payload);
  });

  it("retorna o perfil do usuário registrado", async () => {
    const result = await register({
      nome: "Novo",
      email: "novo@test.com",
      password: "abc123",
    });
    expect(result).toEqual(SAMPLE_USER);
  });

  it("envia telefone opcional quando fornecido", async () => {
    const payload = {
      nome: "Novo",
      email: "novo@test.com",
      password: "abc123",
      telefone: "11999999999",
    };
    await register(payload);
    expect(mockPost).toHaveBeenCalledWith("/api/users/register", payload);
  });

  it("propaga erro quando email já existe (409)", async () => {
    mockPost.mockRejectedValueOnce(new Error("409 Conflict"));
    await expect(
      register({ nome: "X", email: "dup@test.com", password: "abc" }),
    ).rejects.toThrow("409 Conflict");
  });
});

describe("forgotPassword", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(undefined);
  });

  it("chama POST /api/users/forgot-password com email", async () => {
    await forgotPassword({ email: "user@test.com" });
    expect(mockPost).toHaveBeenCalledWith("/api/users/forgot-password", {
      email: "user@test.com",
    });
  });

  it("resolve sem valor quando sucesso", async () => {
    const result = await forgotPassword({ email: "user@test.com" });
    expect(result).toBeUndefined();
  });

  it("propaga erro quando apiClient lança", async () => {
    mockPost.mockRejectedValueOnce(new Error("404 Not Found"));
    await expect(
      forgotPassword({ email: "inexistente@test.com" }),
    ).rejects.toThrow("404 Not Found");
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(undefined);
  });

  it("chama POST /api/users/reset-password com token e password", async () => {
    await resetPassword({ token: "tok123", password: "novaSenha" });
    expect(mockPost).toHaveBeenCalledWith("/api/users/reset-password", {
      token: "tok123",
      password: "novaSenha",
    });
  });

  it("resolve sem valor quando sucesso", async () => {
    const result = await resetPassword({ token: "tok", password: "pw" });
    expect(result).toBeUndefined();
  });

  it("propaga erro quando token expirado/inválido", async () => {
    mockPost.mockRejectedValueOnce(new Error("400 Bad Request"));
    await expect(
      resetPassword({ token: "expired", password: "pw" }),
    ).rejects.toThrow("400 Bad Request");
  });
});
