// src/__tests__/services/api/services/addresses.test.ts
//
// Risco: funções CRUD de endereço usam endpoints dinâmicos (/addresses/{id});
// URL errada causa operação no endereço errado do usuário.
//
// O que está sendo coberto:
//   - getAddresses: GET /api/users/addresses
//   - createAddress: POST /api/users/addresses com payload correto
//   - updateAddress: PUT /api/users/addresses/{id} com payload correto
//   - deleteAddress: DELETE /api/users/addresses/{id}
//   - Propagação de erros (sem absorção silenciosa)

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/services/api/services/addresses";

// ---- Mock apiClient --------------------------------------------------------

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}));

// ---- Fixtures --------------------------------------------------------------

const BASE_PAYLOAD = {
  cep: "01310-100",
  endereco: "Av. Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP",
};

const SAMPLE_ADDRESS = { id: 1, ...BASE_PAYLOAD, apelido: "Casa", complemento: null, ponto_referencia: null, telefone: null, is_default: 0 as const };

// ---- Tests -----------------------------------------------------------------

describe("getAddresses", () => {
  beforeEach(() => {
    mockGet.mockResolvedValue([SAMPLE_ADDRESS]);
  });

  it("chama GET /api/users/addresses", async () => {
    await getAddresses();
    expect(mockGet).toHaveBeenCalledWith("/api/users/addresses");
  });

  it("retorna lista de endereços", async () => {
    const result = await getAddresses();
    expect(result).toEqual([SAMPLE_ADDRESS]);
  });

  it("propaga erro quando apiClient lança", async () => {
    mockGet.mockRejectedValueOnce(new Error("401 Unauthorized"));
    await expect(getAddresses()).rejects.toThrow("401 Unauthorized");
  });
});

describe("createAddress", () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(SAMPLE_ADDRESS);
  });

  it("chama POST /api/users/addresses", async () => {
    await createAddress(BASE_PAYLOAD);
    expect(mockPost).toHaveBeenCalledWith("/api/users/addresses", BASE_PAYLOAD);
  });

  it("retorna o endereço criado", async () => {
    const result = await createAddress(BASE_PAYLOAD);
    expect(result).toEqual(SAMPLE_ADDRESS);
  });

  it("envia payload completo (incluindo campos opcionais)", async () => {
    const fullPayload = { ...BASE_PAYLOAD, apelido: "Trabalho", complemento: "Sala 5", is_default: true };
    await createAddress(fullPayload);
    expect(mockPost).toHaveBeenCalledWith("/api/users/addresses", fullPayload);
  });

  it("propaga erro quando apiClient lança", async () => {
    mockPost.mockRejectedValueOnce(new Error("422 Unprocessable"));
    await expect(createAddress(BASE_PAYLOAD)).rejects.toThrow("422 Unprocessable");
  });
});

describe("updateAddress", () => {
  beforeEach(() => {
    mockPut.mockResolvedValue({ ...SAMPLE_ADDRESS, bairro: "Jardins" });
  });

  it("chama PUT /api/users/addresses/{id}", async () => {
    await updateAddress(1, BASE_PAYLOAD);
    expect(mockPut).toHaveBeenCalledWith("/api/users/addresses/1", BASE_PAYLOAD);
  });

  it("usa o id correto na URL", async () => {
    await updateAddress(42, BASE_PAYLOAD);
    expect(mockPut.mock.calls[0][0]).toBe("/api/users/addresses/42");
  });

  it("retorna o endereço atualizado", async () => {
    const result = await updateAddress(1, BASE_PAYLOAD);
    expect(result).toMatchObject({ id: 1, bairro: "Jardins" });
  });

  it("propaga erro quando apiClient lança", async () => {
    mockPut.mockRejectedValueOnce(new Error("404 Not Found"));
    await expect(updateAddress(999, BASE_PAYLOAD)).rejects.toThrow("404 Not Found");
  });
});

describe("deleteAddress", () => {
  beforeEach(() => {
    mockDel.mockResolvedValue(undefined);
  });

  it("chama DELETE /api/users/addresses/{id}", async () => {
    await deleteAddress(5);
    expect(mockDel).toHaveBeenCalledWith("/api/users/addresses/5");
  });

  it("usa o id correto na URL", async () => {
    await deleteAddress(99);
    expect(mockDel.mock.calls[0][0]).toBe("/api/users/addresses/99");
  });

  it("resolve sem valor quando operação tem sucesso", async () => {
    const result = await deleteAddress(1);
    expect(result).toBeUndefined();
  });

  it("propaga erro quando apiClient lança", async () => {
    mockDel.mockRejectedValueOnce(new Error("403 Forbidden"));
    await expect(deleteAddress(1)).rejects.toThrow("403 Forbidden");
  });
});
