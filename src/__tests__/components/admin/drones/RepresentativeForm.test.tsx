// src/__tests__/components/admin/drones/RepresentativeForm.test.tsx
//
// Risco: formulário de representantes é a única UI admin para criar/editar
// lojas/distribuidoras exibidas publicamente. Payload errado (CNPJ sem dígitos,
// URL incorreta, modo edição usando POST em vez de PUT) causa corrupção de dados.
//
// O que está sendo coberto:
//   - Loading state e lista após fetch
//   - Estado vazio (nenhum rep)
//   - Erro de rede no carregamento
//   - Validações: name, whatsapp (10-11 dígitos), cnpj (14 dígitos), street, number, UF
//   - Criação: POST com payload correto (máscaras removidas, null para opcionais)
//   - Edição: startEdit popula o formulário; salva via PUT com id correto
//   - Exclusão: DEL com id correto, recarrega lista
//   - Reset limpa campos e cancela modo edição
//   - Paginação renderizada quando totalPages > 1
//
// NOTA DE DESIGN: setMsg("sucesso") é imediatamente batched com setMsg(null) do
// load() subsequente (React 18 auto-batching). As mensagens de sucesso não chegam
// ao DOM. Os testes verificam o comportamento observável: API call + reload.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RepresentativeForm from "@/components/admin/drones/RepresentativeForm";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}));

// Formatters transparentes — onlyDigits extrai dígitos, máscaras passam como estão
vi.mock("@/utils/formatters", () => ({
  onlyDigits: (v: string) => String(v || "").replace(/\D/g, ""),
  formatCnpjMask: (v: string) => v,
  formatCepMask: (v: string) => v,
  formatPhoneMask: (v: string) => v,
}));

vi.mock("@/utils/brasil", () => ({
  ESTADOS_BR: [
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "RJ", nome: "Rio de Janeiro" },
  ],
}));

// ---- Fixtures e helpers ----------------------------------------------------

const EMPTY_RESPONSE = { items: [], total: 0, totalPages: 1, page: 1 };

function makeRep(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Distribuidora SP",
    whatsapp: "11999999999",
    cnpj: "12345678000195",
    instagram_url: null,
    address_street: "Av. Paulista",
    address_number: "1000",
    address_complement: null,
    address_neighborhood: "Bela Vista",
    address_city: "São Paulo",
    address_uf: "SP",
    address_cep: "01310100",
    notes: null,
    sort_order: 0,
    is_active: 1 as const,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function repList(items = [makeRep()], extra = {}) {
  return { items, total: items.length, totalPages: 1, page: 1, ...extra };
}

// Inputs do formulário — por posição na DOM (sem label associado via for/id)
// Ordem de textboxes: [0]=search, [1]=name, [2]=whatsapp*, [3]=cnpj*, [4]=instagram,
//                    [5]=street, [6]=number, [7]=complement, [8]=neighborhood,
//                    [9]=city, [10]=uf*, [11]=cep*, [12]=notes
// * esses têm placeholder disponível
function getFormInputs() {
  const all = screen.getAllByRole("textbox");
  return {
    name: all[1],
    whatsapp: screen.getByPlaceholderText("(00) 00000-0000"),
    cnpj: screen.getByPlaceholderText("00.000.000/0000-00"),
    street: all[5],
    number: all[6],
    uf: screen.getByPlaceholderText("SP"),
  };
}

async function fillValidForm(overrides: Partial<Record<string, string>> = {}) {
  const f = getFormInputs();
  fireEvent.change(f.name, { target: { value: overrides.name ?? "Nova Distribuidora" } });
  fireEvent.change(f.whatsapp, { target: { value: overrides.whatsapp ?? "11999990000" } });
  fireEvent.change(f.cnpj, { target: { value: overrides.cnpj ?? "12345678000195" } });
  fireEvent.change(f.street, { target: { value: overrides.street ?? "Rua das Flores" } });
  fireEvent.change(f.number, { target: { value: overrides.number ?? "42" } });
}

// ---- Tests -----------------------------------------------------------------

describe("RepresentativeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ id: 99 });
    mockPut.mockResolvedValue({});
    mockDel.mockResolvedValue(undefined);
  });

  describe("loading e fetch inicial", () => {
    it("exibe 'Carregando...' enquanto busca dados", () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      render(<RepresentativeForm />);
      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });

    it("renderiza lista de representantes após fetch", async () => {
      mockGet.mockResolvedValue(repList());
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Distribuidora SP")).toBeInTheDocument(),
      );
      expect(screen.getByText("ATIVO")).toBeInTheDocument();
    });

    it("exibe 'Nenhum representante encontrado.' quando lista vazia", async () => {
      mockGet.mockResolvedValue(EMPTY_RESPONSE);
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(
          screen.getByText("Nenhum representante encontrado."),
        ).toBeInTheDocument(),
      );
    });

    it("exibe mensagem de erro quando fetch falha", async () => {
      mockGet.mockRejectedValue(new Error("Sem conexão"));
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Sem conexão")).toBeInTheDocument(),
      );
    });

    it("chama endpoint correto com page=1 e orderBy=sort_order", async () => {
      mockGet.mockResolvedValue(EMPTY_RESPONSE);
      render(<RepresentativeForm />);

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toMatch(/\/api\/admin\/drones\/representantes/);
      expect(url).toMatch(/page=1/);
      expect(url).toMatch(/orderBy=sort_order/);
    });
  });

  describe("validações do formulário", () => {
    beforeEach(async () => {
      mockGet.mockResolvedValue(EMPTY_RESPONSE);
      render(<RepresentativeForm />);
      await waitFor(() =>
        expect(screen.getByText("Nenhum representante encontrado.")).toBeInTheDocument(),
      );
    });

    it("bloqueia submit quando name está vazio", async () => {
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      await waitFor(() =>
        expect(screen.getByText("name é obrigatório.")).toBeInTheDocument(),
      );
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("bloqueia submit quando whatsapp está vazio", async () => {
      const f = getFormInputs();
      fireEvent.change(f.name, { target: { value: "Empresa X" } });
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      await waitFor(() =>
        expect(screen.getByText("whatsapp é obrigatório.")).toBeInTheDocument(),
      );
    });

    it("bloqueia submit quando whatsapp tem menos de 10 dígitos", async () => {
      const f = getFormInputs();
      fireEvent.change(f.name, { target: { value: "Empresa X" } });
      fireEvent.change(f.whatsapp, { target: { value: "119999" } }); // 6 dígitos
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      await waitFor(() =>
        expect(
          screen.getByText("whatsapp inválido (DDD + número)."),
        ).toBeInTheDocument(),
      );
    });

    it("bloqueia submit quando cnpj não tem 14 dígitos", async () => {
      const f = getFormInputs();
      fireEvent.change(f.name, { target: { value: "Empresa X" } });
      fireEvent.change(f.whatsapp, { target: { value: "11999990000" } });
      fireEvent.change(f.cnpj, { target: { value: "123456" } }); // 6 dígitos
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      await waitFor(() =>
        expect(
          screen.getByText("cnpj inválido (14 dígitos)."),
        ).toBeInTheDocument(),
      );
    });

    it("bloqueia submit quando address_street está vazio", async () => {
      const f = getFormInputs();
      fireEvent.change(f.name, { target: { value: "Empresa X" } });
      fireEvent.change(f.whatsapp, { target: { value: "11999990000" } });
      fireEvent.change(f.cnpj, { target: { value: "12345678000195" } });
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      await waitFor(() =>
        expect(
          screen.getByText("address_street é obrigatório."),
        ).toBeInTheDocument(),
      );
    });

    it("bloqueia submit quando UF é inválida", async () => {
      await fillValidForm();
      const f = getFormInputs();
      fireEvent.change(f.uf, { target: { value: "XX" } }); // não está em ESTADOS_BR
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      await waitFor(() =>
        expect(
          screen.getByText("UF inválida. Use uma sigla válida (ex: SP, MG)."),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("criação de representante", () => {
    beforeEach(async () => {
      mockGet.mockResolvedValue(EMPTY_RESPONSE);
      render(<RepresentativeForm />);
      await waitFor(() =>
        expect(screen.getByText("Nenhum representante encontrado.")).toBeInTheDocument(),
      );
    });

    it("chama POST com payload correto (dígitos sem máscara, opcionais como null)", async () => {
      await fillValidForm();
      mockGet.mockResolvedValueOnce(repList());

      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

      const [url, payload] = mockPost.mock.calls[0];
      expect(url).toBe("/api/admin/drones/representantes");
      expect(payload.name).toBe("Nova Distribuidora");
      expect(payload.whatsapp).toBe("11999990000");
      expect(payload.cnpj).toBe("12345678000195");
      expect(payload.address_street).toBe("Rua das Flores");
      expect(payload.address_number).toBe("42");
      expect(payload.instagram_url).toBeNull();
      expect(payload.is_active).toBe(1);
    });

    it("limpa o formulário após criação bem-sucedida (name vazio)", async () => {
      // Nota: mensagem "Representante criado." é batched com setMsg(null) do reload
      // → não visível. Verificamos que o campo name foi limpo.
      await fillValidForm();
      mockGet.mockResolvedValueOnce(repList());

      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

      await waitFor(() => expect(mockPost).toHaveBeenCalled());
      // Reload deve ocorrer após POST bem-sucedido
      await waitFor(() => expect(mockGet.mock.calls.length).toBeGreaterThan(1));

      const nameInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });

    it("exibe mensagem de erro quando POST falha", async () => {
      await fillValidForm();
      mockPost.mockRejectedValueOnce(new Error("Erro ao salvar"));

      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

      await waitFor(() =>
        expect(screen.getByText("Erro ao salvar")).toBeInTheDocument(),
      );
    });
  });

  describe("modo edição", () => {
    it("popula o formulário ao clicar em Editar e exibe 'Editar representante'", async () => {
      mockGet.mockResolvedValue(repList());
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Distribuidora SP")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Editar" }));

      expect(screen.getByText("Editar representante")).toBeInTheDocument();
      // name input (index 1 nos textboxes) deve ter o valor do rep
      const nameInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
      expect(nameInput.value).toBe("Distribuidora SP");
    });

    it("salva via PUT com o id correto", async () => {
      mockGet.mockResolvedValue(repList([makeRep({ id: 42 })]));
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Distribuidora SP")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      mockGet.mockResolvedValueOnce(repList());

      fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

      await waitFor(() => expect(mockPut).toHaveBeenCalledTimes(1));

      const [url] = mockPut.mock.calls[0];
      expect(url).toBe("/api/admin/drones/representantes/42");
    });

    it("recarrega lista após PUT bem-sucedido", async () => {
      // Nota: "Representante atualizado." é batched com setMsg(null) do load() — não visível.
      mockGet.mockResolvedValue(repList());
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Distribuidora SP")).toBeInTheDocument(),
      );

      const callsBefore = mockGet.mock.calls.length;
      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      mockGet.mockResolvedValueOnce(repList());
      fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

      await waitFor(() =>
        expect(mockGet.mock.calls.length).toBeGreaterThan(callsBefore),
      );
    });
  });

  describe("exclusão de representante", () => {
    it("chama DEL com o id correto e recarrega lista", async () => {
      mockGet.mockResolvedValue(repList([makeRep({ id: 99 })]));
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Distribuidora SP")).toBeInTheDocument(),
      );

      const callsBefore = mockGet.mock.calls.length;
      mockGet.mockResolvedValueOnce(EMPTY_RESPONSE);
      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      await waitFor(() =>
        expect(mockDel).toHaveBeenCalledWith(
          "/api/admin/drones/representantes/99",
        ),
      );
      await waitFor(() =>
        expect(mockGet.mock.calls.length).toBeGreaterThan(callsBefore),
      );
    });

    it("exibe mensagem de erro quando DEL falha", async () => {
      mockGet.mockResolvedValue(repList());
      mockDel.mockRejectedValueOnce(new Error("Proibido"));
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Distribuidora SP")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      await waitFor(() =>
        expect(screen.getByText("Proibido")).toBeInTheDocument(),
      );
    });
  });

  describe("botão Limpar", () => {
    it("cancela modo edição e limpa todos os campos", async () => {
      mockGet.mockResolvedValue(repList());
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText("Distribuidora SP")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole("button", { name: "Editar" }));
      expect(screen.getByText("Editar representante")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

      expect(screen.getByText("Adicionar representante")).toBeInTheDocument();
      const nameInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });
  });

  describe("paginação", () => {
    it("exibe controles quando totalPages > 1", async () => {
      mockGet.mockResolvedValue({
        items: [makeRep()],
        total: 50,
        totalPages: 3,
        page: 1,
      });
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument(),
      );

      expect(screen.getByRole("button", { name: "Próxima" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    });

    it("NÃO exibe paginação quando totalPages = 1", async () => {
      mockGet.mockResolvedValue(repList());
      render(<RepresentativeForm />);

      await waitFor(() =>
        expect(screen.queryByText(/Página/)).not.toBeInTheDocument(),
      );
    });
  });
});
