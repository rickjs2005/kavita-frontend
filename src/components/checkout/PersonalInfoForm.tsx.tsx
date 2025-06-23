// Componente de formulário com dados pessoais do cliente
import React from 'react';

// Recebe os dados e a função para lidar com mudanças nos campos
export const PersonalInfoForm = ({ formData, handleChange }: any) => (
  <div>
    {/* Campo Nome */}
    <label className="block text-sm font-medium text-gray-700">Nome</label>
    <input
      name="nome"
      value={formData.nome} // Valor vindo do estado externo
      onChange={handleChange} // Atualiza o estado ao digitar
      className="w-full px-4 py-3 mt-1 text-base text-gray-800 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition duration-150"
    />

    {/* Campo CPF */}
    <label className="block text-sm font-medium mt-4 text-gray-700">CPF</label>
    <input
      name="cpf"
      value={formData.cpf}
      onChange={handleChange}
      className="w-full px-4 py-3 mt-1 text-base text-gray-800 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition duration-150"
    />

    {/* Campo Email */}
    <label className="block text-sm font-medium mt-4 text-gray-700">Email</label>
    <input
      name="email"
      value={formData.email}
      onChange={handleChange}
      className="w-full px-4 py-3 mt-1 text-base text-gray-800 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition duration-150"
    />
  </div>
);
// Exporta o componente para ser usado em outros lugares
