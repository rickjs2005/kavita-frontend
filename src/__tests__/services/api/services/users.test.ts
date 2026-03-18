// src/__tests__/services/api/services/users.test.ts
//
// Risco: usersService espelha parte do authService — se divergirem em endpoint
// ou método HTTP, dois caminhos de código atualizarão rotas diferentes.
//
// O que está sendo coberto:
//   - getMe: GET /api/users/me
//   - updateMe: PUT /api/users/me com payload parcial
//   - Propagação de erros (sem absorção silenciosa)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMe, updateMe } from "@/services/api/services/users";

// ---- Mock apiClient --------------------------------------------------------

const mockGet = vi.fn();
const mockPut = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

// ---- Fixture ---------------------------------------------------------------

const SAMPLE_USER = {
  id: 1,
  nome: "Usuário",
  email: "user@test.com",
  telefone: null,
  cpf: null,
};

// ---- Tests -----------------------------------------------------------------

describe("getMe", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue(SAMPLE_USER);
  });

  it("chama GET /api/users/me", async () => {
    await getMe();
    expect(mockGet).toHaveBeenCalledWith("/api/users/me");
  });

  it("retorna o perfil do usuário", async () => {
    const result = await getMe();
    expect(result).toEqual(SAMPLE_USER);
  });

  it("propaga erro quando não autenticado (401)", async () => {
    mockGet.mockRejectedValueOnce(new Error("401 Unauthorized"));
    await expect(getMe()).rejects.toThrow("401 Unauthorized");
  });

  it("propaga erro de rede", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network Error"));
    await expect(getMe()).rejects.toThrow("Network Error");
  });
});

describe("updateMe", () => {
  beforeEach(() => {
    mockPut.mockResolvedValue({ ...SAMPLE_USER, nome: "Atualizado" });
  });

  it("chama PUT /api/users/me", async () => {
    await updateMe({ nome: "Atualizado" });
    expect(mockPut).toHaveBeenCalledWith("/api/users/me", { nome: "Atualizado" });
  });

  it("retorna o perfil atualizado", async () => {
    const result = await updateMe({ nome: "Atualizado" });
    expect(result).toMatchObject({ nome: "Atualizado" });
  });

  it("aceita payload com múltiplos campos", async () => {
    const payload = { nome: "Novo Nome", telefone: "11999999999", cidade: "SP" };
    mockPut.mockResolvedValueOnce({ ...SAMPLE_USER, ...payload });
    await updateMe(payload);
    expect(mockPut).toHaveBeenCalledWith("/api/users/me", payload);
  });

  it("aceita payload vazio — atualização sem mudanças", async () => {
    mockPut.mockResolvedValueOnce(SAMPLE_USER);
    await updateMe({});
    expect(mockPut).toHaveBeenCalledWith("/api/users/me", {});
  });

  it("propaga erro quando apiClient lança (ex.: validação 422)", async () => {
    mockPut.mockRejectedValueOnce(new Error("422 Unprocessable"));
    await expect(updateMe({ nome: "" })).rejects.toThrow("422 Unprocessable");
  });

  it("propaga erro 401 quando sessão expirou", async () => {
    mockPut.mockRejectedValueOnce(new Error("401"));
    await expect(updateMe({ nome: "X" })).rejects.toThrow("401");
  });
});
