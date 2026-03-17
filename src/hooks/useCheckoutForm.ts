"use client";

import { useCallback, useState } from "react";
import type { TipoLocalidade, Endereco } from "@/types/address";

export type { TipoLocalidade, Endereco };

export type CheckoutFormData = {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  endereco: Endereco;
  formaPagamento: "Pix" | "Boleto" | "Prazo" | string;
};

/**
 * Mesma assinatura do updateForm (evento | "campo" | objeto) + arg2 opcional
 */
export type CheckoutFormChangeHandler = (
  arg1:
    | React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    | string
    | Record<string, any>,
  arg2?: any,
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
    complemento: "",
    referencia: "",
    tipo_localidade: "URBANA",
    comunidade: "",
    observacoes_acesso: "",
  },
  formaPagamento: "Pix",
};

export function useCheckoutForm() {
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_STATE);

  const updateEndereco = useCallback((key: keyof Endereco, value: any) => {
    setFormData((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [key]: value },
    }));
  }, []);

  /**
   * Aceita:
   *   - updateForm(e)
   *   - updateForm("campo", valor)
   *   - updateForm({ patch })
   * Suporta campos "endereco.*"
   */
  const updateForm: CheckoutFormChangeHandler = useCallback(
    (arg1, arg2) => {
      // Caso 1: evento
      if (arg1 && typeof arg1 === "object" && "target" in arg1) {
        const e = arg1 as React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >;

        const name = String(e.target.name || "").trim();
        if (!name) return;

        const isCheckbox = (e.target as HTMLInputElement).type === "checkbox";
        const value = isCheckbox
          ? (e.target as HTMLInputElement).checked
          : e.target.value;

        if (name.startsWith("endereco.")) {
          const key = name.replace("endereco.", "") as keyof Endereco;
          updateEndereco(key, value);
          return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        return;
      }

      // Caso 2: patch objeto
      if (arg1 && typeof arg1 === "object") {
        const patch = arg1 as Record<string, any>;
        setFormData((prev) => ({ ...prev, ...patch }));
        return;
      }

      // Caso 3: (field, value)
      const field = String(arg1 || "").trim();
      const value = arg2;

      if (!field) return;

      if (field.startsWith("endereco.")) {
        const key = field.replace("endereco.", "") as keyof Endereco;
        updateEndereco(key, value);
        return;
      }

      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [updateEndereco],
  );

  const setField = useCallback((field: keyof CheckoutFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const bulkUpdate = useCallback((patch: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetForm = useCallback(() => setFormData(INITIAL_STATE), []);

  return {
    formData,
    updateForm,
    setField,
    bulkUpdate,
    resetForm,
  };
}
