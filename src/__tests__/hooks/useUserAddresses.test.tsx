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

// axios
const axiosGetMock = vi.fn();
const axiosPostMock = vi.fn();
const axiosPutMock = vi.fn();
const axiosDeleteMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    get: (...args: any[]) => axiosGetMock(...args),
    post: (...args: any[]) => axiosPostMock(...args),
    put: (...args: any[]) => axiosPutMock(...args),
    delete: (...args: any[]) => axiosDeleteMock(...args),
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

async function importHookWithEnv(apiBase: string) {
  // API_BASE é calculado no load do módulo: setar env antes do import
  vi.resetModules();
  process.env.NEXT_PUBLIC_API_URL = apiBase;

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
    const apiBase = "http://api.test";
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

    axiosGetMock.mockResolvedValueOnce({ data: apiResponse });

    const useUserAddresses = await importHookWithEnv(apiBase);

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
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    expect(axiosGetMock).toHaveBeenCalledWith(`${apiBase}/api/users/addresses`, {
      withCredentials: true,
    });

    expect(result.current.addresses).toEqual(apiResponse);
    expect(result.current.loading).toBe(false);
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("AAA: GET falha: mostra toast.error com mensagem do backend (mensagem/message) e loading volta para false", async () => {
    // Arrange
    const apiBase = "http://api.test";
    axiosGetMock.mockRejectedValueOnce({
      response: { data: { mensagem: "Sessão expirada" } },
    });

    const useUserAddresses = await importHookWithEnv(apiBase);

    // Act
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    // Assert
    expect(axiosGetMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith("Sessão expirada");
    expect(result.current.loading).toBe(false);
    // addresses fica como estava (inicial vazio)
    expect(result.current.addresses).toEqual([]);
  });

  it("AAA: createAddress sucesso: POST com withCredentials, adiciona no state e toast.success", async () => {
    // Arrange
    const apiBase = "http://api.test";
    axiosGetMock.mockResolvedValueOnce({ data: [] });

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

    axiosPostMock.mockResolvedValueOnce({ data: created });

    const useUserAddresses = await importHookWithEnv(apiBase);

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
    expect(axiosPostMock).toHaveBeenCalledTimes(1);
    expect(axiosPostMock).toHaveBeenCalledWith(
      `${apiBase}/api/users/addresses`,
      payload,
      { withCredentials: true }
    );

    expect(result.current.addresses).toEqual([created]);
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Endereço salvo com sucesso! ✅"
    );
  });

  it("AAA: createAddress falha: toast.error, relança erro (throw)", async () => {
    // Arrange
    const apiBase = "http://api.test";
    axiosGetMock.mockResolvedValueOnce({ data: [] });

    const err = { response: { data: { message: "Falha ao salvar" } } };
    axiosPostMock.mockRejectedValueOnce(err);

    const useUserAddresses = await importHookWithEnv(apiBase);
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

  it("AAA: updateAddress sucesso: PUT com withCredentials, substitui item por id e toast.success", async () => {
    // Arrange
    const apiBase = "http://api.test";

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

    axiosGetMock.mockResolvedValueOnce({ data: initial });

    const updated = { ...initial[1], bairro: "Novo Bairro" };
    axiosPutMock.mockResolvedValueOnce({ data: updated });

    const useUserAddresses = await importHookWithEnv(apiBase);
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
    expect(axiosPutMock).toHaveBeenCalledTimes(1);
    expect(axiosPutMock).toHaveBeenCalledWith(
      `${apiBase}/api/users/addresses/2`,
      expect.any(Object),
      { withCredentials: true }
    );

    expect(result.current.addresses).toEqual([initial[0], updated]);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Endereço atualizado com sucesso! ✅"
    );
  });

  it("AAA: updateAddress falha: toast.error e relança erro", async () => {
    // Arrange
    const apiBase = "http://api.test";
    axiosGetMock.mockResolvedValueOnce({ data: [] });

    const err = { response: { data: { mensagem: "Falha ao atualizar" } } };
    axiosPutMock.mockRejectedValueOnce(err);

    const useUserAddresses = await importHookWithEnv(apiBase);
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

  it("AAA: deleteAddress sucesso: DELETE com withCredentials, remove do state e toast.success", async () => {
    // Arrange
    const apiBase = "http://api.test";

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

    axiosGetMock.mockResolvedValueOnce({ data: initial });
    axiosDeleteMock.mockResolvedValueOnce({});

    const useUserAddresses = await importHookWithEnv(apiBase);
    const { result } = renderHook(() => useUserAddresses());

    await act(async () => {
      await flushPromises();
    });

    // Act
    await act(async () => {
      await result.current.deleteAddress(1);
    });

    // Assert
    expect(axiosDeleteMock).toHaveBeenCalledTimes(1);
    expect(axiosDeleteMock).toHaveBeenCalledWith(
      `${apiBase}/api/users/addresses/1`,
      { withCredentials: true }
    );

    expect(result.current.addresses).toEqual([initial[1]]);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Endereço excluído com sucesso."
    );
  });

  it("AAA: deleteAddress falha: toast.error e relança erro", async () => {
    // Arrange
    const apiBase = "http://api.test";
    axiosGetMock.mockResolvedValueOnce({ data: [] });

    const err = { response: { data: { message: "Falha ao excluir" } } };
    axiosDeleteMock.mockRejectedValueOnce(err);

    const useUserAddresses = await importHookWithEnv(apiBase);
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
    const apiBase = "http://api.test";
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

    axiosGetMock.mockResolvedValueOnce({ data: first }).mockResolvedValueOnce({
      data: second,
    });

    const useUserAddresses = await importHookWithEnv(apiBase);
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
    expect(axiosGetMock).toHaveBeenCalledTimes(2);
    expect(result.current.addresses).toEqual(second);
    expect(result.current.loading).toBe(false);
  });
});
