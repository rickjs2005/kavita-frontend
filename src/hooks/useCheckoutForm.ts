"use client";

import { ChangeEvent, useState } from "react";

/** -----------------------------
 * Tipos do formulário de checkout
 * ----------------------------- */
export type Endereco = {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  referencia?: string;
};

export type CheckoutFormData = {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  endereco: Endereco;
  formaPagamento: "Pix" | "Boleto" | "Prazo" | string;
};

type FormElementEvent = ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

export type CheckoutFormChangeHandler = (
  arg1: FormElementEvent | string | Partial<CheckoutFormData>,
  arg2?: string
) => void;

/** Estado inicial seguro */
const INITIAL_STATE: CheckoutFormData = {
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
};

/** -----------------------------
 * Hook
 * ----------------------------- */
export function useCheckoutForm() {
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_STATE);

  /** Atualiza campo aninhado de endereço */
  const updateEndereco = <K extends keyof Endereco>(
    key: K,
    value: Endereco[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [key]: value },
    }));
  };

  /** 
   * Atualiza campos de qualquer nível (raiz ou aninhado).
   * Aceita:
   *   - updateForm(e)   -> evento de input/select/textarea
   *   - updateForm("campo", valor)
   *   - updateForm({ nome: "João", email: "x@y.com" })  (atualização em lote simples)
   * Suporta campos "endereco.*"
   */
  const updateForm: CheckoutFormChangeHandler = (arg1, arg2) => {
    // Caso 1: veio um evento de formulário (onChange)
    if (typeof arg1 === "object" && arg1 !== null && "target" in arg1) {
      const e = arg1 as FormElementEvent;
      const name = String(e.target.name || "");
      const value = e.target.value;

      if (!name) return;

      if (name.startsWith("endereco.")) {
        const key = name.replace("endereco.", "") as keyof Endereco;
        updateEndereco(key, value);
        return;
      }

      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    // Caso 2: veio como objeto (bulk update simples em nível raiz)
    if (typeof arg1 === "object" && arg1 !== null) {
      const patch = arg1 as Partial<CheckoutFormData>;
      setFormData(prev => ({ ...prev, ...patch }));
      return;
    }

    // Caso 3: veio como (field, value)
    const field = arg1;
    const value = arg2;

    if (typeof field !== "string") return;

    if (field.startsWith("endereco.")) {
      const key = field.replace("endereco.", "") as keyof Endereco;
      updateEndereco(key, value ?? "");
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value ?? "" }));
  };

  /** Helpers opcionais (açúcar sintático) */
  const setField = <K extends keyof CheckoutFormData>(
    field: K,
    value: CheckoutFormData[K]
  ) => setFormData(prev => ({ ...prev, [field]: value }));

  const bulkUpdate = (patch: Partial<CheckoutFormData>) =>
    setFormData(prev => ({ ...prev, ...patch }));

  const resetForm = () => setFormData(INITIAL_STATE);

  return {
    formData,
    updateForm,
    setField,    // opcional
    bulkUpdate,  // opcional
    resetForm,   // opcional
  };
}
