"use client"; // Indica que o componente é renderizado no cliente

import React from "react";
import { Service } from "../../types/service"; // Tipo que descreve um serviço
import CustomButton from "../buttons/CustomButton"; // Botão estilizado reutilizável

// Componente de cartão individual de serviço
export const ServiceCard = ({ nome, descricao, imagem, colaborador }: Service) => {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-4 flex flex-col gap-4">
      {/* Imagem do serviço */}
      <img src={imagem} alt={nome} className="rounded-xl h-48 object-cover" />

      {/* Nome e descrição */}
      <h3 className="text-xl font-bold">{nome}</h3>
      <p className="text-gray-700">{descricao}</p>

      {/* Colaborador responsável e botão de contato */}
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          Responsável: {colaborador.nome} ({colaborador.cargo})
        </p>
        <div className="mt-2">
          <CustomButton
            label={`Falar com ${colaborador.nome}`}
            href={colaborador.whatsapp} // Link direto para WhatsApp
            variant="primary"
            size="medium"
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
};
