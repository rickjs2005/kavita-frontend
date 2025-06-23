// Componente para seleção da forma de pagamento
import React from 'react';

// Recebe o valor atual da forma de pagamento e a função para atualizar
export const PaymentMethod = ({ formaPagamento, handleChange }: any) => (
  <div className="mt-8">
    {/* Título da seção */}
    <h2 className="text-lg font-semibold mb-2">Forma de Pagamento</h2>

    {/* Select com as opções de pagamento */}
    <select
      name="formaPagamento"
      value={formaPagamento}
      onChange={handleChange}
      className="input"
    >
      <option value="Pix">Pix</option>
      <option value="Boleto">Boleto</option>
      <option value="Prazo">Prazo</option>
    </select>

    {/* Aviso adicional abaixo do select */}
    <p className="text-sm text-gray-600 mt-2">
      💳 Pagamento com cartão somente presencialmente na loja.
    </p>
  </div>
);
// O componente PaymentMethod renderiza um campo de seleção para a forma de pagamento
// Ele recebe o valor atual da forma de pagamento e uma função para atualizar o estado