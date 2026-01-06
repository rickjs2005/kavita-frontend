import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";

type AnyChangeEvent = {
  target: {
    name?: string;
    value?: any;
  };
};

function makeEvent(name?: string, value?: any): AnyChangeEvent {
  return { target: { name, value } };
}

describe("useCheckoutForm (src/hooks/useCheckoutForm.ts)", () => {
  it("inicia com estado inicial seguro (INITIAL_STATE)", () => {
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
        referencia: "",
      },
      formaPagamento: "Pix",
    });
  });

  it("updateForm(event): atualiza campo raiz quando name não começa com endereco.", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm(makeEvent("nome", "João") as any);
    });

    // Assert
    expect(result.current.formData.nome).toBe("João");
    // não deve afetar endereço
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
    // não deve afetar campos raiz
    expect(result.current.formData.nome).toBe("");
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

  it("updateForm(objeto): faz bulk update simples no nível raiz (sem merge profundo)", () => {
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

    // Confirma que endereço continua intacto (patch em nível raiz não altera nested automaticamente)
    expect(result.current.formData.endereco).toEqual({
      cep: "",
      estado: "",
      cidade: "",
      bairro: "",
      logradouro: "",
      numero: "",
      referencia: "",
    });
  });

  it("updateForm(field inválido não-string): não quebra e não altera estado", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());
    const before = result.current.formData;

    // Act
    act(() => {
      // Forçando caminho de guarda (typeof field !== 'string')
      result.current.updateForm(123 as any, "x");
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

  it("bulkUpdate: aplica patch no nível raiz", () => {
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
        referencia: "",
      },
      formaPagamento: "Pix",
    });
  });
});
