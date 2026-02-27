import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

/**
 * ============================
 * Mocks obrigatórios
 * ============================
 */

// Toast
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("react-hot-toast", () => ({
  default: {
    success: (...args: any[]) => toastSuccessMock(...args),
    error: (...args: any[]) => toastErrorMock(...args),
  },
}));

// next/navigation (padrão fixo — mesmo que este hook não use)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

// apiClient
const apiClientGetMock = vi.fn();
const apiClientPostMock = vi.fn();
const apiClientPutMock = vi.fn();
const apiClientDelMock = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: (...args: any[]) => apiClientGetMock(...args),
    post: (...args: any[]) => apiClientPostMock(...args),
    put: (...args: any[]) => apiClientPutMock(...args),
    del: (...args: any[]) => apiClientDelMock(...args),
  },
}));

/**
 * Helpers
 */
async function flushPromises() {
  // resolve microtasks pendentes
  await Promise.resolve();
  await Promise.resolve();
}

async function importHook() {
  vi.resetModules();

  const mod = await import("@/hooks/useUserAddresses");
  return mod.useUserAddresses;
}

describe("useUserAddresses (hook)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("AAA: estado inicial: loading true, addresses vazio; após GET sucesso, popula e loading false", async () => {
    // Arrange
    const apiResponse = [
      {
        id: 1,
        apelido: "Casa",
        cep: "00000-000",
        endereco: "Rua A",
        numero: "10",
        bairro: "Centro",
        cidade: "X",
        estado: "MG",
        complemento: null,
        ponto_referencia: null,
        telefone: null,
        is_default: 1,
      },
    ];

    apiClientGetMock.mockResolvedValueOnce(apiResponse);

    const useUserAddresses = await importHook();

    // Act
    const { result } = renderHook(() => useUserAddresses());

    // Assert (antes de resolver o effect)
    expect(result.current.addresses).toEqual([]);
    expect(result.current.loading).toBe(true);

    // Act (resolve effect)
    await act(async () => {
      await flushPromises();
    });

    // Assert (depois do GET)
    expect(apiClientGetMock).toHaveBeenCalledTimes(1);
    expect(apiClientGetMock).toHaveBeenCalledWith("/api/users/addresses");

    expect(result.current.addresses).toEqual(apiResponse);
    expect(result.current.loading).toBe(false);
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("AAA: GET falha: mostra toast.error com mensagem do backend e loading volta para false", async () => {
    // Arrange
    apiClientGetMock.mockRejectedValueOnce({ message: "Sessão expirada" });

    const useUserAddresses = await importHook();

    // Act
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    // Assert
    expect(apiClientGetMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith("Sessão expirada");
    expect(result.current.loading).toBe(false);
    // addresses fica como estava (inicial vazio)
    expect(result.current.addresses).toEqual([]);
  });

  it("AAA: createAddress sucesso: POST, adiciona no state e toast.success", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce([]);

    const created = {
      id: 99,
      apelido: "Trabalho",
      cep: "11111-111",
      endereco: "Rua B",
      numero: "20",
      bairro: "Bairro B",
      cidade: "Y",
      estado: "ES",
      complemento: null,
      ponto_referencia: null,
      telefone: null,
      is_default: 0,
    };

    apiClientPostMock.mockResolvedValueOnce(created);

    const useUserAddresses = await importHook();

    const { result } = renderHook(() => useUserAddresses());

    // resolve load inicial
    await act(async () => {
      await flushPromises();
    });

    const payload = {
      cep: created.cep,
      endereco: created.endereco,
      numero: created.numero,
      bairro: created.bairro,
      cidade: created.cidade,
      estado: created.estado,
      apelido: created.apelido ?? undefined,
      is_default: false,
    };

    // Act
    await act(async () => {
      await result.current.createAddress(payload as any);
    });

    // Assert
    expect(apiClientPostMock).toHaveBeenCalledTimes(1);
    expect(apiClientPostMock).toHaveBeenCalledWith("/api/users/addresses", payload);

    expect(result.current.addresses).toEqual([created]);
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Endereço salvo com sucesso! ✅"
    );
  });

  it("AAA: createAddress falha: toast.error, relança erro (throw)", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce([]);

    const err = { message: "Falha ao salvar" };
    apiClientPostMock.mockRejectedValueOnce(err);

    const useUserAddresses = await importHook();
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    const payload = {
      cep: "00000-000",
      endereco: "Rua X",
      numero: "1",
      bairro: "Centro",
      cidade: "X",
      estado: "MG",
    };

    // Act + Assert
    await expect(
      act(async () => {
        await result.current.createAddress(payload as any);
      })
    ).rejects.toBeTruthy();

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith("Falha ao salvar");
  });

  it("AAA: updateAddress sucesso: PUT, substitui item por id e toast.success", async () => {
    // Arrange
    const initial = [
      {
        id: 1,
        apelido: "Casa",
        cep: "00000-000",
        endereco: "Rua A",
        numero: "10",
        bairro: "Centro",
        cidade: "X",
        estado: "MG",
        complemento: null,
        ponto_referencia: null,
        telefone: null,
        is_default: 1,
      },
      {
        id: 2,
        apelido: "Trabalho",
        cep: "11111-111",
        endereco: "Rua B",
        numero: "20",
        bairro: "Bairro B",
        cidade: "Y",
        estado: "ES",
        complemento: null,
        ponto_referencia: null,
        telefone: null,
        is_default: 0,
      },
    ];

    apiClientGetMock.mockResolvedValueOnce(initial);

    const updated = { ...initial[1], bairro: "Novo Bairro" };
    apiClientPutMock.mockResolvedValueOnce(updated);

    const useUserAddresses = await importHook();
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    // Act
    await act(async () => {
      await result.current.updateAddress(2, {
        cep: updated.cep,
        endereco: updated.endereco,
        numero: updated.numero,
        bairro: updated.bairro,
        cidade: updated.cidade,
        estado: updated.estado,
      } as any);
    });

    // Assert
    expect(apiClientPutMock).toHaveBeenCalledTimes(1);
    expect(apiClientPutMock).toHaveBeenCalledWith(
      "/api/users/addresses/2",
      expect.any(Object)
    );

    expect(result.current.addresses).toEqual([initial[0], updated]);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Endereço atualizado com sucesso! ✅"
    );
  });

  it("AAA: updateAddress falha: toast.error e relança erro", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce([]);

    const err = { message: "Falha ao atualizar" };
    apiClientPutMock.mockRejectedValueOnce(err);

    const useUserAddresses = await importHook();
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    // Act + Assert
    await expect(
      act(async () => {
        await result.current.updateAddress(
          1,
          {
            cep: "00000-000",
            endereco: "Rua A",
            numero: "10",
            bairro: "Centro",
            cidade: "X",
            estado: "MG",
          } as any
        );
      })
    ).rejects.toBeTruthy();

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith("Falha ao atualizar");
  });

  it("AAA: deleteAddress sucesso: DELETE, remove do state e toast.success", async () => {
    // Arrange
    const initial = [
      {
        id: 1,
        apelido: "Casa",
        cep: "00000-000",
        endereco: "Rua A",
        numero: "10",
        bairro: "Centro",
        cidade: "X",
        estado: "MG",
        complemento: null,
        ponto_referencia: null,
        telefone: null,
        is_default: 1,
      },
      {
        id: 2,
        apelido: "Trabalho",
        cep: "11111-111",
        endereco: "Rua B",
        numero: "20",
        bairro: "Bairro B",
        cidade: "Y",
        estado: "ES",
        complemento: null,
        ponto_referencia: null,
        telefone: null,
        is_default: 0,
      },
    ];

    apiClientGetMock.mockResolvedValueOnce(initial);
    apiClientDelMock.mockResolvedValueOnce(undefined);

    const useUserAddresses = await importHook();
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    // Act
    await act(async () => {
      await result.current.deleteAddress(1);
    });

    // Assert
    expect(apiClientDelMock).toHaveBeenCalledTimes(1);
    expect(apiClientDelMock).toHaveBeenCalledWith("/api/users/addresses/1");

    expect(result.current.addresses).toEqual([initial[1]]);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Endereço excluído com sucesso."
    );
  });

  it("AAA: deleteAddress falha: toast.error e relança erro", async () => {
    // Arrange
    apiClientGetMock.mockResolvedValueOnce([]);

    const err = { message: "Falha ao excluir" };
    apiClientDelMock.mockRejectedValueOnce(err);

    const useUserAddresses = await importHook();
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    // Act + Assert
    await expect(
      act(async () => {
        await result.current.deleteAddress(1);
      })
    ).rejects.toBeTruthy();

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith("Falha ao excluir");
  });

  it("AAA: reload chama GET novamente e atualiza addresses", async () => {
    // Arrange
    const first = [
      {
        id: 1,
        apelido: "Casa",
        cep: "00000-000",
        endereco: "Rua A",
        numero: "10",
        bairro: "Centro",
        cidade: "X",
        estado: "MG",
        complemento: null,
        ponto_referencia: null,
        telefone: null,
        is_default: 1,
      },
    ];
    const second = [
      {
        id: 2,
        apelido: "Trabalho",
        cep: "11111-111",
        endereco: "Rua B",
        numero: "20",
        bairro: "Bairro B",
        cidade: "Y",
        estado: "ES",
        complemento: null,
        ponto_referencia: null,
        telefone: null,
        is_default: 0,
      },
    ];

    apiClientGetMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const useUserAddresses = await importHook();
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    expect(result.current.addresses).toEqual(first);

    // Act (reload)
    await act(async () => {
      await result.current.reload();
      await flushPromises();
    });

    // Assert
    expect(apiClientGetMock).toHaveBeenCalledTimes(2);
    expect(result.current.addresses).toEqual(second);
    expect(result.current.loading).toBe(false);
  });
});
