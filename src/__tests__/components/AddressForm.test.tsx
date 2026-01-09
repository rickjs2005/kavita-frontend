import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AddressForm from "@/components/checkout/AddressForm";
import { mockGlobalFetch, makeFetchResponse } from "../testUtils";

// Mocks padrão do seu template
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

vi.mock("@/utils/brasil", () => ({
  ESTADOS_BR: [
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "MG", nome: "Minas Gerais" },
  ],
}));

vi.mock("@/hooks/useCheckoutForm", () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CheckoutFormChangeHandler: Function as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Endereco: Object as any,
  };
});

type EnderecoLike = {
  cep?: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  numero?: string;
  logradouro?: string;
  referencia?: string;
  tipo_localidade?: "URBANA" | "RURAL" | string;
  comunidade?: string;
  observacoes_acesso?: string;
};

function isViaCepUrl(url: string) {
  return url.startsWith("https://viacep.com.br/ws/");
}
function isIbgeUrl(url: string) {
  return url.startsWith(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados/"
  );
}

/**
 * Harness: simula o comportamento real do “pai”.
 * - Mantém endereco em state
 * - Aplica onChange("endereco.x", value) mutando o state
 * Assim, inputs controlados funcionam igual ao app.
 */
function renderWithHarness(opts?: {
  initialEndereco?: Partial<EnderecoLike>;
  onChangeSpy?: (path: string, value: any) => void;
}) {
  const onChangeSpy = opts?.onChangeSpy ?? vi.fn();

  const initial: EnderecoLike = {
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    numero: "",
    logradouro: "",
    referencia: "",
    ...opts?.initialEndereco,
  };

  function Harness() {
    const [endereco, setEndereco] = React.useState<EnderecoLike>(initial);

    const handleChange = (path: string, value: any) => {
      onChangeSpy(path, value);

      // path sempre chega como "endereco.xxx"
      const key = String(path).replace(/^endereco\./, "");
      setEndereco((prev) => ({ ...prev, [key]: value }));
    };

    return <AddressForm endereco={endereco as any} onChange={handleChange as any} />;
  }

  const view = render(<Harness />);
  return { ...view, onChangeSpy };
}

function renderForm(opts?: {
  endereco?: Partial<EnderecoLike>;
  onChange?: (path: string, value: any) => void;
}) {
  const onChange = opts?.onChange ?? vi.fn();
  const endereco: EnderecoLike = {
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    numero: "",
    logradouro: "",
    referencia: "",
    ...opts?.endereco,
  };

  const view = render(
    <AddressForm endereco={endereco as any} onChange={onChange as any} />
  );

  return { ...view, onChange };
}

describe("AddressForm (src/components/checkout/AddressForm.tsx)", () => {
  let fetchMock: ReturnType<typeof mockGlobalFetch>;

  beforeEach(() => {
    fetchMock = mockGlobalFetch();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza por padrão em URBANA quando tipo_localidade não existe e exibe campos urbanos (sem aviso rural)", () => {
    renderForm({
      endereco: { tipo_localidade: undefined, cep: "", estado: "", cidade: "" },
    });

    const btnUrbana = screen.getByRole("button", { name: /zona urbana/i });
    const btnRural = screen.getByRole("button", { name: /zona rural/i });

    expect(btnUrbana).toHaveAttribute("aria-pressed", "true");
    expect(btnRural).toHaveAttribute("aria-pressed", "false");

    expect(screen.getByLabelText(/bairro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^número$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rua \/ avenida/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/complemento \/ referência/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText(/córrego \/ comunidade/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/aviso importante/i)).not.toBeInTheDocument();
  });

  it("clicar em 'Zona rural' dispara onChange('endereco.tipo_localidade','RURAL') e, ao re-renderizar como RURAL, exibe aviso + campos rurais", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = renderForm({
      endereco: { tipo_localidade: "URBANA" },
      onChange,
    });

    await user.click(screen.getByRole("button", { name: /zona rural/i }));
    expect(onChange).toHaveBeenCalledWith("endereco.tipo_localidade", "RURAL");

    rerender(
      <AddressForm
        endereco={
          {
            tipo_localidade: "RURAL",
            cep: "",
            estado: "",
            cidade: "",
            numero: "",
          } as any
        }
        onChange={onChange as any}
      />
    );

    expect(screen.getByRole("button", { name: /zona rural/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    expect(screen.getByText(/aviso importante/i)).toBeInTheDocument();
    expect(screen.getByText(/estradas muito precárias/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/córrego \/ comunidade/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/referência \/ descrição de acesso/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/número \(se houver\)/i)).toBeInTheDocument();

    expect(screen.queryByLabelText(/bairro/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rua \/ avenida/i)).not.toBeInTheDocument();
  });

  it("máscara de CEP: ao digitar 8 dígitos, o input deve ficar 00000-000 (com Harness controlando state)", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();

    renderWithHarness({ onChangeSpy });

    const cepInput = screen.getByLabelText(/cep/i);

    await user.type(cepInput, "12345678");

    // agora o componente está controlado como no app; valor final deve estar mascarado
    expect(cepInput).toHaveValue("12345-678");

    // e deve existir (em algum momento) chamada com o valor mascarado
    const calls = onChangeSpy.mock.calls.map((c) => [c[0], c[1]]);
    expect(calls).toContainEqual(["endereco.cep", "12345-678"]);
  });

  it("URBANA: quando CEP tem 8 dígitos, busca ViaCEP e auto-preenche cidade/estado/logradouro/bairro", async () => {
    const onChange = vi.fn();

    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input);
      if (isViaCepUrl(url)) {
        return makeFetchResponse({
          ok: true,
          status: 200,
          contentType: "application/json",
          json: {
            localidade: "São Paulo",
            uf: "SP",
            logradouro: "Av. Paulista",
            bairro: "Bela Vista",
          },
        });
      }
      return makeFetchResponse({ ok: false, status: 500, text: "unexpected" });
    });

    renderForm({
      endereco: { tipo_localidade: "URBANA", cep: "12345-678" },
      onChange,
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://viacep.com.br/ws/12345678/json/"
      );
    });

    const calls = onChange.mock.calls.map((c) => [c[0], c[1]]);
    expect(calls).toContainEqual(["endereco.cidade", "São Paulo"]);
    expect(calls).toContainEqual(["endereco.estado", "SP"]);
    expect(calls).toContainEqual(["endereco.logradouro", "Av. Paulista"]);
    expect(calls).toContainEqual(["endereco.bairro", "Bela Vista"]);
  });

  it("RURAL: quando CEP tem 8 dígitos, busca ViaCEP e auto-preenche apenas cidade/estado (não preenche bairro/logradouro)", async () => {
    const onChange = vi.fn();

    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input);
      if (isViaCepUrl(url)) {
        return makeFetchResponse({
          ok: true,
          status: 200,
          contentType: "application/json",
          json: {
            localidade: "Belo Horizonte",
            uf: "MG",
            logradouro: "Rua X",
            bairro: "Centro",
          },
        });
      }
      return makeFetchResponse({ ok: false, status: 500, text: "unexpected" });
    });

    renderForm({
      endereco: { tipo_localidade: "RURAL", cep: "30130-010" },
      onChange,
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://viacep.com.br/ws/30130010/json/"
      );
    });

    const calls = onChange.mock.calls.map((c) => [c[0], c[1]]);
    expect(calls).toContainEqual(["endereco.cidade", "Belo Horizonte"]);
    expect(calls).toContainEqual(["endereco.estado", "MG"]);

    const keys = onChange.mock.calls.map((c) => String(c[0]));
    expect(keys).not.toContain("endereco.logradouro");
    expect(keys).not.toContain("endereco.bairro");
  });

  it("ViaCEP: quando data.erro=true, não auto-preenche (e não quebra)", async () => {
    const onChange = vi.fn();

    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input);
      if (isViaCepUrl(url)) {
        return makeFetchResponse({
          ok: true,
          status: 200,
          contentType: "application/json",
          json: { erro: true },
        });
      }
      return makeFetchResponse({ ok: false, status: 500 });
    });

    renderForm({
      endereco: { tipo_localidade: "URBANA", cep: "12345-678" },
      onChange,
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://viacep.com.br/ws/12345678/json/"
      );
    });

    const keys = onChange.mock.calls.map((c) => String(c[0]));
    expect(keys).not.toContain("endereco.cidade");
    expect(keys).not.toContain("endereco.estado");
    expect(keys).not.toContain("endereco.logradouro");
    expect(keys).not.toContain("endereco.bairro");
  });

  it("IBGE: com estado preenchido, busca municípios e popula datalist ordenada; ao trocar estado, limpa cidade", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input);
      if (isIbgeUrl(url)) {
        return makeFetchResponse({
          ok: true,
          status: 200,
          contentType: "application/json",
          json: [{ nome: "Zeta" }, { nome: "Alpha" }, { nome: "Médio" }],
        });
      }
      return makeFetchResponse({ ok: false, status: 404 });
    });

    renderForm({
      endereco: { tipo_localidade: "URBANA", estado: "SP", cidade: "" },
      onChange,
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios"
      );
    });

    const dl = document.querySelector("#checkout-cidades") as HTMLDataListElement;
    expect(dl).toBeTruthy();

    const values = Array.from(dl.querySelectorAll("option")).map(
      (opt) => (opt as HTMLOptionElement).value
    );
    expect(values).toEqual(["Alpha", "Médio", "Zeta"]);

    const selectEstado = screen.getByLabelText(/estado/i);
    await user.selectOptions(selectEstado, "MG");

    expect(onChange).toHaveBeenCalledWith("endereco.estado", "MG");
    expect(onChange).toHaveBeenCalledWith("endereco.cidade", "");
  });

  it("IBGE: se retornar não-array, não quebra e mantém input de cidade funcional (com Harness)", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();

    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input);
      if (isIbgeUrl(url)) {
        return makeFetchResponse({
          ok: true,
          status: 200,
          contentType: "application/json",
          json: { qualquer: "coisa" }, // inválido
        });
      }
      return makeFetchResponse({ ok: false, status: 404 });
    });

    renderWithHarness({
      onChangeSpy,
      initialEndereco: { tipo_localidade: "URBANA", estado: "SP", cidade: "" },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios"
      );
    });

    const cidade = screen.getByLabelText(/cidade/i);
    await user.type(cidade, "Minha Cidade");

    // input controlado pelo Harness => valor final completo
    expect(cidade).toHaveValue("Minha Cidade");

    // e deve ter chamado com a string completa em algum momento
    const calls = onChangeSpy.mock.calls.map((c) => [c[0], c[1]]);
    expect(calls).toContainEqual(["endereco.cidade", "Minha Cidade"]);

    const dl = document.querySelector("#checkout-cidades") as HTMLDataListElement;
    expect(dl).toBeTruthy();
    expect(dl.querySelectorAll("option").length).toBe(0);
  });
});
