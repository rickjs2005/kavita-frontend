// Indica que este componente será renderizado no lado do cliente (necessário para usar hooks como useState)
"use client";

// Importa o hook useState do React para controlar o estado do botão
import { useState } from "react";

// Define as propriedades que o componente pode receber
interface DeleteButtonProps {
  onConfirm: () => void;  // Função que será chamada quando o usuário confirmar a exclusão
  label?: string;         // Texto opcional do botão (padrão é "Excluir")
}

// Componente funcional que representa o botão de exclusão
export default function DeleteButton({ onConfirm, label = "Excluir" }: DeleteButtonProps) {
  // Estado para controlar se a exclusão está em andamento (para exibir "Removendo...")
  const [loading, setLoading] = useState(false);

  // Função executada ao clicar no botão
  const handleClick = async () => {
    // Abre uma janela de confirmação para o usuário
    if (!confirm("Tem certeza que deseja excluir?")) return;

    // Mostra que está carregando
    setLoading(true);

    // Chama a função de confirmação passada via props
    await onConfirm();

    // Após a conclusão, tira o estado de carregamento
    setLoading(false);
  };

  // Retorna o botão visual
  return (
    <button
      onClick={handleClick}    // Define o que acontece ao clicar no botão
      disabled={loading}       // Desativa o botão enquanto está carregando
      className={`bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1 rounded transition ${
        loading ? "opacity-50 cursor-not-allowed" : "" // Aplica estilo de "desativado" se estiver carregando
      }`}
    >
      {/* Altera o texto do botão com base no estado */}
      {loading ? "Removendo..." : label}
    </button>
  );
}
