"use client";

import { useState } from "react";

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
  const updateEndereco = (key: keyof Endereco, value: any) => {
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
  const updateForm = (
    arg1:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
      | string
      | Record<string, any>,
    arg2?: any
  ) => {
    // Caso 1: veio um evento de formulário (onChange)
    if (arg1 && typeof arg1 === "object" && "target" in arg1) {
      const e = arg1 as React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >;
      const name = String(e.target.name || "");
      const value = (e.target as any).value;

      if (!name) return;

      if (name.startsWith("endereco.")) {
        const key = name.replace("endereco.", "") as keyof Endereco;
        return updateEndereco(key, value);
      }
      return setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Caso 2: veio como objeto (bulk update simples em nível raiz)
    if (arg1 && typeof arg1 === "object") {
      const patch = arg1 as Record<string, any>;
      return setFormData(prev => ({ ...prev, ...patch }));
    }

    // Caso 3: veio como (field, value)
    const field = arg1 as string;
    const value = arg2;

    if (typeof field !== "string") return;

    if (field.startsWith("endereco.")) {
      const key = field.replace("endereco.", "") as keyof Endereco;
      return updateEndereco(key, value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /** Helpers opcionais (açúcar sintático) */
  const setField = (field: keyof CheckoutFormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

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
