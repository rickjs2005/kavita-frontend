// Formulário com campos do endereço do cliente
import React from 'react';

// Recebe o objeto 'endereco' e uma função para atualizar o estado ao digitar
export const AddressForm = ({ endereco, handleChange }: any) => (
  <div>
    {/* Gera os campos dinamicamente com base nos nomes do array */}
    {['cep', 'estado', 'cidade', 'bairro', 'logradouro', 'numero', 'referencia'].map((field) => (
      <div key={field}>
        {/* Nome do campo (capitalizado) */}
        <label className="block text-sm font-medium mt-4 capitalize text-gray-700">
          {field}
        </label>

        {/* Input do campo */}
        <input
          name={field}
          value={endereco[field]}
          onChange={handleChange}
          className="w-full px-4 py-3 mt-1 text-base text-gray-800 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition duration-150"
        />
      </div>
    ))}
  </div>
);
// O componente AddressForm renderiza um formulário com campos para o endereço do cliente
// Ele recebe um objeto 'endereco' e uma função 'handleChange' para atualizar o estado
// Os campos são gerados dinamicamente a partir de um array de nomes, permitindo fácil manutenção