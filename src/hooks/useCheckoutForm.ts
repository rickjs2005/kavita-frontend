import { useState } from "react";

// Define os campos do formulário de checkout
export interface CheckoutFormData {
  nome: string;
  email: string;
  telefone: string;
  endereco: {
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    logradouro: string;
    numero: string;
    referencia?: string;
  };
  formaPagamento: string;
}

// Hook personalizado que centraliza os dados e função de atualização
export const useCheckoutForm = () => {
  const [formData, setFormData] = useState<CheckoutFormData>({
    nome: "",
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
    formaPagamento: "pix", // valor padrão
  });

  // Função genérica para atualizar qualquer parte do formulário
  const updateForm = (newData: Partial<CheckoutFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return { formData, updateForm };
};
// Este hook `useCheckoutForm` gerencia o estado do formulário de checkout, permitindo que componentes acessem e atualizem os dados do formulário de forma centralizada.
// Ele define os campos necessários e fornece uma função para atualizar qualquer parte do formulário, facilitando a manipulação dos dados de checkout em componentes de forma organizada e reutilizável.