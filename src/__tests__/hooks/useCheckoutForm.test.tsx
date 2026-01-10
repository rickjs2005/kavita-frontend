import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";

type AnyChangeEvent = {
  target: {
    name?: string;
    value?: any;
    type?: string;
    checked?: boolean;
  };
};

function makeEvent(
  name?: string,
  value?: any,
  opts?: { type?: string; checked?: boolean }
): AnyChangeEvent {
  return {
    target: {
      name,
      value,
      type: opts?.type,
      checked: opts?.checked,
    },
  };
}

describe("useCheckoutForm (src/hooks/useCheckoutForm.ts)", () => {
  it("inicia com estado inicial seguro (INITIAL_STATE) incluindo campos rural/urbano", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    const { formData } = result.current;

    // Assert
    expect(formData).toEqual({
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      endereco: {
        cep: "",
        estado: "",
        cidade: "",
        bairro: "",
        logradouro: "",
        numero: "",
        complemento: "",
        referencia: "",
        tipo_localidade: "URBANA",
        comunidade: "",
        observacoes_acesso: "",
      },
      formaPagamento: "Pix",
    });
  });

  it("updateForm(event): atualiza campo raiz quando name NÃO começa com 'endereco.'", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm(makeEvent("nome", "João") as any);
    });

    // Assert
    expect(result.current.formData.nome).toBe("João");
    // Não deve afetar endereço
    expect(result.current.formData.endereco.cep).toBe("");
  });

  it("updateForm(event): atualiza campo aninhado quando name = endereco.<campo>", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm(makeEvent("endereco.cep", "36900070") as any);
    });

    // Assert
    expect(result.current.formData.endereco.cep).toBe("36900070");
    // Não deve afetar campos raiz
    expect(result.current.formData.nome).toBe("");
  });

  it("updateForm(event): usa 'checked' quando target.type = checkbox (campo raiz)", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm(
        makeEvent("termosAceitos", undefined, { type: "checkbox", checked: true }) as any
      );
    });

    // Assert
    // Campo não existe no tipo, mas o hook permite set dinâmico por name
    expect((result.current.formData as any).termosAceitos).toBe(true);
  });

  it("updateForm(event): usa 'checked' quando target.type = checkbox (campo endereco.*)", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm(
        makeEvent("endereco.temPorteira", undefined, { type: "checkbox", checked: false }) as any
      );
    });

    // Assert
    expect((result.current.formData.endereco as any).temPorteira).toBe(false);
  });

  it("updateForm(event): ignora quando name está vazio (não altera estado)", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());
    const before = result.current.formData;

    // Act
    act(() => {
      result.current.updateForm(makeEvent("", "qualquer") as any);
    });

    // Assert
    expect(result.current.formData).toEqual(before);
  });

  it("updateForm(field, value): atualiza campo raiz", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm("email", "x@y.com");
    });

    // Assert
    expect(result.current.formData.email).toBe("x@y.com");
  });

  it("updateForm(field, value): atualiza campo endereco.<campo>", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm("endereco.cidade", "Manhuaçu");
    });

    // Assert
    expect(result.current.formData.endereco.cidade).toBe("Manhuaçu");
  });

  it("updateForm(objeto patch): aplica merge raso no nível raiz (não faz merge profundo do endereço)", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm({
        nome: "Maria",
        cpf: "123",
        formaPagamento: "Boleto",
      } as any);
    });

    // Assert
    expect(result.current.formData.nome).toBe("Maria");
    expect(result.current.formData.cpf).toBe("123");
    expect(result.current.formData.formaPagamento).toBe("Boleto");

    // Endereço deve permanecer intacto (patch raso não altera nested automaticamente)
    expect(result.current.formData.endereco).toEqual({
      cep: "",
      estado: "",
      cidade: "",
      bairro: "",
      logradouro: "",
      numero: "",
      complemento: "",
      referencia: "",
      tipo_localidade: "URBANA",
      comunidade: "",
      observacoes_acesso: "",
    });
  });

  it("updateForm(field, value): ignora quando field está vazio", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());
    const before = result.current.formData;

    // Act
    act(() => {
      result.current.updateForm("   " as any, "x");
    });

    // Assert
    expect(result.current.formData).toEqual(before);
  });

  it("setField: atualiza campo raiz via helper", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.setField("telefone" as any, "31999999999");
    });

    // Assert
    expect(result.current.formData.telefone).toBe("31999999999");
  });

  it("bulkUpdate: aplica patch no nível raiz (merge raso)", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.bulkUpdate({
        nome: "Rick",
        email: "rick@kavita.com",
      });
    });

    // Assert
    expect(result.current.formData.nome).toBe("Rick");
    expect(result.current.formData.email).toBe("rick@kavita.com");
  });

  it("resetForm: reseta todo o formulário para INITIAL_STATE", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    act(() => {
      result.current.updateForm("nome", "Alterado");
      result.current.updateForm("endereco.cep", "36940000");
      result.current.updateForm("endereco.tipo_localidade", "RURAL");
      result.current.updateForm("endereco.comunidade", "Córrego do Meio");
      result.current.updateForm({ formaPagamento: "Prazo" } as any);
    });

    // Act
    act(() => {
      result.current.resetForm();
    });

    // Assert
    expect(result.current.formData).toEqual({
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      endereco: {
        cep: "",
        estado: "",
        cidade: "",
        bairro: "",
        logradouro: "",
        numero: "",
        complemento: "",
        referencia: "",
        tipo_localidade: "URBANA",
        comunidade: "",
        observacoes_acesso: "",
      },
      formaPagamento: "Pix",
    });
  });
});
