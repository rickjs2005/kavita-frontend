import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import ServiceFormUnificado from "@/components/admin/servicos/ServiceFormUnificado";
import { mockGlobalFetch } from "@/__tests__/testUtils";

// mocks de dependências internas (sem depender do layout real)
vi.mock("@/components/buttons/CustomButton", () => {
  return {
    default: function MockCustomButton(props: any) {
      const { label, isLoading, ...rest } = props;
      return (
        <button type={rest.type ?? "button"} disabled={!!isLoading} {...rest}>
          {label}
        </button>
      );
    },
  };
});

vi.mock("@/components/layout/FormattedInput", () => {
  return {
    default: function MockFormattedInput(props: any) {
      const { label, name, value, onChange, placeholder, required } = props;
      const id = `fi-${name}`;
      return (
        <div>
          <label htmlFor={id}>{label}</label>
          <input
            id={id}
            name={name}
            value={value ?? ""}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
          />
        </div>
      );
    },
  };
});

type ServiceLike = {
  id?: number;
  nome?: string | null;
  cargo?: string | null;
  whatsapp?: string | null;
  descricao?: string | null;
  especialidade_id?: number | null;
  imagem?: string | null;
  images?: string[] | null;
};

function makeService(overrides: Partial<ServiceLike> = {}): ServiceLike {
  return {
    id: 99,
    nome: "Maria",
    cargo: "Aplicadora",
    whatsapp: "31999991111",
    descricao: "Serviço de aplicação.",
    especialidade_id: 10,
    imagem: "/uploads/capa.jpg",
    images: ["/uploads/extra.jpg", "/uploads/capa.jpg"], // inclui duplicada
    ...overrides,
  };
}

function okJson(data: any) {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as any);
}

function okEmpty() {
  return Promise.resolve({
    ok: true,
    status: 204,
    headers: new Headers({ "content-type": "text/plain" }),
    json: async () => ({}),
    text: async () => "",
  } as any);
}

async function formDataToObject(fd: FormData) {
  const out: Record<string, any> = {};
  for (const [k, v] of fd.entries()) {
    if (k === "images") {
      out[k] = out[k] ?? [];
      out[k].push(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

describe("ServiceFormUnificado", () => {
  let fetchMock: ReturnType<typeof mockGlobalFetch>;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = mockGlobalFetch();

    // previews
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn((file: any) => `blob:mock-${file?.name ?? "file"}`),
      revokeObjectURL: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve buscar especialidades ao montar (credentials include) e popular o select", async () => {
    fetchMock.mockImplementation((url: any, init: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        expect(init?.credentials).toBe("include");
        return okJson([{ id: 10, nome: "Bovinos" }]);
      }
      return okEmpty();
    });

    render(<ServiceFormUnificado onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(
      screen.getByRole("option", { name: /Selecione a especialidade/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Bovinos" })).toBeInTheDocument();
    });
  });

  it("se falhar ao buscar especialidades (res.ok=false), não deve quebrar e mantém apenas placeholder", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    fetchMock.mockImplementation((url: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({}),
          text: async () => "",
        } as any);
      }
      return okEmpty();
    });

    render(<ServiceFormUnificado onSaved={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    expect(screen.queryByRole("option", { name: "Bovinos" })).not.toBeInTheDocument();
  });

  it("deve impedir submit efetivo quando campos obrigatórios estão vazios (não chama POST)", async () => {
    fetchMock.mockImplementation((url: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        return okJson([{ id: 10, nome: "Bovinos" }]);
      }
      return okEmpty();
    });

    render(<ServiceFormUnificado onSaved={vi.fn()} onCancel={vi.fn()} />);

    // ao submeter vazio, o browser validation bloqueia o submit; logo, não deve chamar /api/admin/servicos (POST)
    fireEvent.click(screen.getByRole("button", { name: /Adicionar Serviço/i }));

    const calls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(calls.some((u) => u.includes("/api/admin/servicos"))).toBe(false);
  });

  it("deve criar serviço (POST) com FormData, exibir sucesso, resetar form e chamar onSaved + onCancel", async () => {
    const onSaved = vi.fn();
    const onCancel = vi.fn();

    fetchMock.mockImplementation(async (url: any, init: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        return okJson([{ id: 10, nome: "Bovinos" }]);
      }
      if (String(url).includes("/api/admin/servicos")) {
        expect(init?.method).toBe("POST");
        expect(init?.credentials).toBe("include");
        expect(init?.body).toBeInstanceOf(FormData);

        const bodyObj = await formDataToObject(init.body);
        expect(bodyObj.nome).toBe("João");
        expect(bodyObj.whatsapp).toBe("31999991111");
        expect(bodyObj.especialidade_id).toBe("10");
        expect(bodyObj.images).toBeUndefined();

        return okJson({ ok: true });
      }
      return okEmpty();
    });

    render(<ServiceFormUnificado onSaved={onSaved} onCancel={onCancel} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Bovinos" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nome do colaborador/i), {
      target: { name: "nome", value: "João" },
    });
    fireEvent.change(screen.getByLabelText(/WhatsApp/i), {
      target: { name: "whatsapp", value: "31999991111" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { name: "especialidade_id", value: "10" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Adicionar Serviço/i }));

    await waitFor(() => {
      expect(screen.getByText(/Serviço cadastrado com sucesso/i)).toBeInTheDocument();
    });

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);

    expect((screen.getByLabelText(/Nome do colaborador/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/WhatsApp/i) as HTMLInputElement).value).toBe("");
  });

  it("em modo edição: deve preencher campos, listar imagens existentes únicas e permitir marcar para remoção (keepImages)", async () => {
    const onSaved = vi.fn();
    const onCancel = vi.fn();

    const servicoEditado = makeService({
      id: 123,
      nome: "Maria",
      especialidade_id: 10,
      imagem: "/uploads/capa.jpg",
      images: ["/uploads/extra.jpg", "/uploads/capa.jpg"],
    });

    fetchMock.mockImplementation(async (url: any, init: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        return okJson([
          { id: 10, nome: "Bovinos" },
          { id: 11, nome: "Suínos" },
        ]);
      }

      if (String(url).includes("/api/admin/servicos/123")) {
        expect(init?.method).toBe("PUT");
        expect(init?.credentials).toBe("include");

        const bodyObj = await formDataToObject(init.body);

        const keep = JSON.parse(String(bodyObj.keepImages));
        expect(keep).toEqual(["/uploads/capa.jpg"]);

        return okJson({ ok: true });
      }

      return okEmpty();
    });

    render(
      <ServiceFormUnificado
        servicoEditado={servicoEditado as any}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText(/Editar Serviço/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/Nome do colaborador/i) as HTMLInputElement).value).toBe("Maria");

    await waitFor(() => {
      expect(screen.getByText(/Imagens atuais/i)).toBeInTheDocument();
    });

    const existingImgs = screen.getAllByRole("img", { name: /img existente/i });
    expect(existingImgs.length).toBe(2);

    // selecionar a imagem "extra" para remover (a que NÃO contém "capa.jpg")
    const imgExtra = existingImgs.find(
      (img) => !String((img as HTMLImageElement).src).includes("capa.jpg")
    );
    expect(imgExtra).toBeTruthy();

    const btnExtra = imgExtra!.closest("button");
    expect(btnExtra).toBeTruthy();

    // clicar para marcar remoção
    fireEvent.click(btnExtra!);

    await waitFor(() => {
      expect(screen.getAllByText(/remover/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /Atualizar Serviço/i }));

    await waitFor(() => {
      expect(screen.getByText(/Serviço atualizado com sucesso/i)).toBeInTheDocument();
    });

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("upload de novas imagens: deve limitar a 8 arquivos e permitir remover um preview", async () => {
    fetchMock.mockImplementation((url: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        return okJson([{ id: 10, nome: "Bovinos" }]);
      }
      return okEmpty();
    });

    const { container } = render(<ServiceFormUnificado onSaved={vi.fn()} onCancel={vi.fn()} />);

    // label não está associado ao input; selecionar direto pelo DOM
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    const files = Array.from({ length: 9 }).map((_, i) => {
      return new File([`x-${i}`], `img-${i}.png`, { type: "image/png" });
    });

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(screen.getAllByRole("img", { name: /preview-/i }).length).toBe(8);
    });

    // remover preview 0 (botões "Remover" são os dos previews)
    const removeBtn = screen.getAllByRole("button", { name: /remover/i })[0];
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.getAllByRole("img", { name: /preview-/i }).length).toBe(7);
    });
  });

  it("se o backend retornar 401/403 sem message, deve exibir mensagem de permissão padrão", async () => {
    fetchMock.mockImplementation(async (url: any, init: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        return okJson([{ id: 10, nome: "Bovinos" }]);
      }
      if (String(url).includes("/api/admin/servicos") && init?.method === "POST") {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "content-type": "text/plain" }),
          text: async () => "",
          json: async () => ({}),
        } as any);
      }
      return okEmpty();
    });

    render(<ServiceFormUnificado onSaved={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Bovinos" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Nome do colaborador/i), {
      target: { name: "nome", value: "João" },
    });
    fireEvent.change(screen.getByLabelText(/WhatsApp/i), {
      target: { name: "whatsapp", value: "31999991111" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { name: "especialidade_id", value: "10" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Adicionar Serviço/i }));

    await waitFor(() => {
      expect(screen.getByText(/Você não tem permissão para salvar serviço/i)).toBeInTheDocument();
    });
  });

  it("botão Limpar deve resetar formulário e chamar onCancel", () => {
    const onCancel = vi.fn();

    fetchMock.mockImplementation((url: any) => {
      if (String(url).includes("/api/admin/especialidades")) {
        return okJson([{ id: 10, nome: "Bovinos" }]);
      }
      return okEmpty();
    });

    render(<ServiceFormUnificado onSaved={vi.fn()} onCancel={onCancel} />);

    fireEvent.change(screen.getByLabelText(/Nome do colaborador/i), {
      target: { name: "nome", value: "Teste" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Limpar/i }));

    expect((screen.getByLabelText(/Nome do colaborador/i) as HTMLInputElement).value).toBe("");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
