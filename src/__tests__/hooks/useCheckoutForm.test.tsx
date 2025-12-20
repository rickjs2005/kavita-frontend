import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";

describe("useCheckoutForm", () => {
  it("deve iniciar com o estado inicial seguro", () => {
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

  it("updateForm(event): deve atualizar campo raiz usando target.name e target.value", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm({
        target: { name: "nome", value: "Rick" },
      } as any);
    });

    // Assert
    expect(result.current.formData.nome).toBe("Rick");
  });

  it('updateForm(event): deve atualizar campo aninhado quando name começa com "endereco."', () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm({
        target: { name: "endereco.cep", value: "31589-000" },
      } as any);
    });

    // Assert
    expect(result.current.formData.endereco.cep).toBe("31589-000");
  });

  it("updateForm(event): não deve alterar estado quando name está vazio", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());
    const before = result.current.formData;

    // Act
    act(() => {
      result.current.updateForm({
        target: { name: "", value: "X" },
      } as any);
    });

    // Assert
    expect(result.current.formData).toEqual(before);
  });

  it("updateForm(field, value): deve atualizar campo raiz e aplicar fallback '' quando value é undefined", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm("cpf", "123");
    });

    act(() => {
      result.current.updateForm("email", undefined as any);
    });

    // Assert
    expect(result.current.formData.cpf).toBe("123");
    expect(result.current.formData.email).toBe("");
  });

  it('updateForm("endereco.<campo>", value): deve atualizar endereço e aplicar fallback "" quando value é undefined', () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm("endereco.cidade", "Santana do Manhuaçu");
    });

    act(() => {
      result.current.updateForm("endereco.bairro", undefined as any);
    });

    // Assert
    expect(result.current.formData.endereco.cidade).toBe("Santana do Manhuaçu");
    expect(result.current.formData.endereco.bairro).toBe("");
  });

  it("updateForm(patch): deve fazer bulk update em nível raiz", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.updateForm({
        nome: "João",
        email: "joao@kavita.com",
        formaPagamento: "Boleto",
      });
    });

    // Assert
    expect(result.current.formData.nome).toBe("João");
    expect(result.current.formData.email).toBe("joao@kavita.com");
    expect(result.current.formData.formaPagamento).toBe("Boleto");
  });

  it("updateForm(arg inválido): deve ignorar quando field não é string (ex.: null)", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());
    const before = result.current.formData;

    // Act
    act(() => {
      result.current.updateForm(null as any, "X");
    });

    // Assert
    expect(result.current.formData).toEqual(before);
  });

  it("setField: deve atualizar campo raiz (açúcar sintático)", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.setField("formaPagamento", "Prazo");
    });

    // Assert
    expect(result.current.formData.formaPagamento).toBe("Prazo");
  });

  it("bulkUpdate: deve mesclar patch em nível raiz", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    // Act
    act(() => {
      result.current.bulkUpdate({ nome: "Maria", cpf: "999" });
    });

    // Assert
    expect(result.current.formData.nome).toBe("Maria");
    expect(result.current.formData.cpf).toBe("999");
  });

  it("resetForm: deve restaurar o estado inicial", () => {
    // Arrange
    const { result } = renderHook(() => useCheckoutForm());

    act(() => {
      result.current.updateForm("nome", "Alterado");
      result.current.updateForm("endereco.cep", "00000-000");
      result.current.setField("formaPagamento", "Boleto");
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
