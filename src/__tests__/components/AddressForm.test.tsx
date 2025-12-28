import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import AddressForm from "@/components/checkout/AddressForm";
import type { CheckoutFormChangeHandler, Endereco } from "@/hooks/useCheckoutForm";

import { flushMicrotasks, mockGlobalFetch, installMockStorage } from "@/__tests__/testUtils";

// Mock do módulo de estados (para não depender do dataset real)
vi.mock("@/utils/brasil", () => ({
  ESTADOS_BR: [
    { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "SP", nome: "São Paulo" },
  ],
}));

function makeEndereco(overrides: Partial<Endereco> = {}): Endereco {
  const base: Endereco = {
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    numero: "",
    logradouro: "",
    referencia: "",
  };
  return { ...base, ...overrides };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Harness controlado: simula o comportamento real do formulário,
 * atualizando o `endereco` quando `onChange("endereco.campo", valor)` é chamado.
 */
function AddressFormHarness(props: { initial?: Partial<Endereco> }) {
  const [endereco, setEndereco] = React.useState<Endereco>(() => makeEndereco(props.initial));

  const onChange: CheckoutFormChangeHandler = React.useCallback((arg1: any, arg2?: any) => {
    // O AddressForm sempre chama: onChange("endereco.campo", "valor")
    if (typeof arg1 === "string") {
      const [, field] = arg1.split(".");
      const value = typeof arg2 === "string" ? arg2 : String(arg2 ?? "");

      setEndereco((prev) => ({ ...prev, [field]: value } as Endereco));
      return;
    }

    // Caso algum outro componente do checkout use evento/partial, ignoramos aqui
    // (este Harness só precisa suportar o AddressForm)
  }, []);

  return <AddressForm endereco={endereco} onChange={onChange} />;
}

describe("AddressForm", () => {
  beforeEach(() => {
    installMockStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza campos essenciais com semântica e opções de estado", () => {
    render(<AddressFormHarness />);

    expect(screen.getByLabelText("CEP")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("00000-000")).toBeInTheDocument();

    expect(screen.getByLabelText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Selecione o estado")).toBeInTheDocument();
    expect(screen.getByText("MG - Minas Gerais")).toBeInTheDocument();
    expect(screen.getByText("SP - São Paulo")).toBeInTheDocument();

    expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite sua cidade")).toBeInTheDocument();

    expect(screen.getByLabelText("Bairro")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex.: Centro")).toBeInTheDocument();

    expect(screen.getByLabelText("Número")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex.: 123")).toBeInTheDocument();

    expect(screen.getByLabelText("Rua / Avenida")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex.: Rua São José")).toBeInTheDocument();

    expect(screen.getByLabelText("Complemento / Referência")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Apartamento, bloco, perto de...")).toBeInTheDocument();
  });

  it("máscara CEP: mantém apenas dígitos, limita em 8 e aplica 00000-000 (positivo)", () => {
    render(<AddressFormHarness />);

    const cepInput = screen.getByLabelText("CEP") as HTMLInputElement;

    fireEvent.change(cepInput, { target: { value: "12a.345-6789" } });

    // Como o harness é controlado, o input reflete o valor mascarado
    expect(cepInput.value).toBe("12345-678");
  });

  it("não chama ViaCEP enquanto CEP não tiver 8 dígitos (negativo)", async () => {
    const fetchMock = mockGlobalFetch();

    render(<AddressFormHarness initial={{ cep: "1234" }} />);

    await flushMicrotasks();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/Buscando CEP/i)).not.toBeInTheDocument();
  });

  it("CEP com 8 dígitos: chama ViaCEP, exibe loading e autopreenche (positivo)", async () => {
    const fetchMock = mockGlobalFetch();
    const viaCepDeferred = deferred<Response>();

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("https://viacep.com.br/ws/12345678/json/")) {
        return viaCepDeferred.promise;
      }
      throw new Error(`fetch inesperado: ${url}`);
    });

    render(<AddressFormHarness initial={{ cep: "12345-678" }} />);

    // Loading aparece porque a promise está pendente
    expect(await screen.findByText("Buscando CEP...")).toBeInTheDocument();

    viaCepDeferred.resolve({
      ok: true,
      json: async () => ({
        logradouro: "Rua A",
        bairro: "Centro",
        localidade: "Belo Horizonte",
        uf: "MG",
      }),
    } as unknown as Response);

    // Aguarda refletir os campos preenchidos (controlled)
    await waitFor(() => {
      expect((screen.getByLabelText("Rua / Avenida") as HTMLInputElement).value).toBe("Rua A");
      expect((screen.getByLabelText("Bairro") as HTMLInputElement).value).toBe("Centro");
      expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe("Belo Horizonte");
      expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("MG");
    });

    await waitFor(() => {
      expect(screen.queryByText("Buscando CEP...")).not.toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/12345678/json/");
  });

  it("ViaCEP: response não ok → não autopreenche e encerra loading (negativo)", async () => {
    const fetchMock = mockGlobalFetch();
    const viaCepDeferred = deferred<Response>();

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("https://viacep.com.br/ws/12345678/json/")) {
        return viaCepDeferred.promise;
      }
      throw new Error(`fetch inesperado: ${url}`);
    });

    render(<AddressFormHarness initial={{ cep: "12345678" }} />);

    // Agora é estável: a promise está pendente => loading aparece
    expect(await screen.findByText("Buscando CEP...")).toBeInTheDocument();

    viaCepDeferred.resolve({ ok: false } as unknown as Response);

    await waitFor(() => {
      expect(screen.queryByText("Buscando CEP...")).not.toBeInTheDocument();
    });

    // Não autopreenche: inputs permanecem vazios
    expect((screen.getByLabelText("Rua / Avenida") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Bairro") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("");
  });

  it("ViaCEP: data.erro=true → não autopreenche e encerra loading (negativo)", async () => {
    const fetchMock = mockGlobalFetch();
    const viaCepDeferred = deferred<Response>();

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("https://viacep.com.br/ws/12345678/json/")) {
        return viaCepDeferred.promise;
      }
      throw new Error(`fetch inesperado: ${url}`);
    });

    render(<AddressFormHarness initial={{ cep: "12345678" }} />);

    expect(await screen.findByText("Buscando CEP...")).toBeInTheDocument();

    viaCepDeferred.resolve({
      ok: true,
      json: async () => ({ erro: true }),
    } as unknown as Response);

    await waitFor(() => {
      expect(screen.queryByText("Buscando CEP...")).not.toBeInTheDocument();
    });

    expect((screen.getByLabelText("Rua / Avenida") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Bairro") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Estado") as HTMLSelectElement).value).toBe("");
  });

  it("alterar Estado: limpa cidade; busca IBGE e popula datalist ordenada (positivo)", async () => {
    const fetchMock = mockGlobalFetch();

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/localidades/estados/MG/municipios")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ nome: "Uberlândia" }, { nome: "Belo Horizonte" }],
        } as unknown as Response);
      }
      // nenhum outro fetch esperado neste teste
      return Promise.reject(new Error(`fetch inesperado: ${url}`));
    });

    render(<AddressFormHarness initial={{ estado: "", cidade: "Qualquer" }} />);

    const select = screen.getByLabelText("Estado") as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "MG" } });

    // cidade deve ser limpa (controlled)
    await waitFor(() => {
      expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe("");
    });

    // aguarda datalist receber options (ordenadas)
    await waitFor(() => {
      const datalist = document.getElementById("checkout-cidades");
      const options = datalist?.querySelectorAll("option");
      expect(options?.length).toBe(2);

      const values = Array.from(options ?? []).map((o) => o.getAttribute("value"));
      expect(values).toEqual(["Belo Horizonte", "Uberlândia"]);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados/MG/municipios"
    );
  });

  it("estado vazio: não chama IBGE e mantém datalist vazia (negativo/controle)", async () => {
    const fetchMock = mockGlobalFetch();

    render(<AddressFormHarness initial={{ estado: "" }} />);

    await flushMicrotasks();

    expect(fetchMock).not.toHaveBeenCalled();

    const datalist = document.getElementById("checkout-cidades");
    const options = datalist?.querySelectorAll("option");
    expect(options?.length ?? 0).toBe(0);
  });

  it("IBGE: response não ok → não quebra e deixa cidade digitável; datalist vazia (negativo)", async () => {
    const fetchMock = mockGlobalFetch();
    fetchMock.mockResolvedValueOnce({ ok: false } as unknown as Response);

    render(<AddressFormHarness initial={{ estado: "SP" }} />);

    // efeito roda e tenta buscar (ok: false)
    await flushMicrotasks();

    const cityInput = screen.getByLabelText("Cidade") as HTMLInputElement;
    fireEvent.change(cityInput, { target: { value: "Campinas" } });

    expect(cityInput.value).toBe("Campinas");

    const datalist = document.getElementById("checkout-cidades");
    const options = datalist?.querySelectorAll("option");
    expect(options?.length ?? 0).toBe(0);
  });

  it("inputs de bairro/número/logradouro/referência atualizam valores (positivo)", () => {
    render(<AddressFormHarness />);

    const bairro = screen.getByLabelText("Bairro") as HTMLInputElement;
    fireEvent.change(bairro, { target: { value: "Centro" } });
    expect(bairro.value).toBe("Centro");

    const numero = screen.getByLabelText("Número") as HTMLInputElement;
    fireEvent.change(numero, { target: { value: "123" } });
    expect(numero.value).toBe("123");

    const logradouro = screen.getByLabelText("Rua / Avenida") as HTMLInputElement;
    fireEvent.change(logradouro, { target: { value: "Rua São José" } });
    expect(logradouro.value).toBe("Rua São José");

    const ref = screen.getByLabelText("Complemento / Referência") as HTMLInputElement;
    fireEvent.change(ref, { target: { value: "Apto 101" } });
    expect(ref.value).toBe("Apto 101");
  });
});
