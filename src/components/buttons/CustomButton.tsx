// Define que o componente será renderizado no cliente (necessário para hooks ou interatividade)
"use client";

// Importações necessárias
import React from "react";
import { FaSpinner } from "react-icons/fa"; // Ícone de carregamento
import Link from "next/link"; // Link do Next.js para navegação entre páginas

// Define o tipo das propriedades (props) que o botão pode receber
type CustomButtonProps = {
    label: string; // Texto exibido no botão
    onClick?: () => void; // Função a ser executada ao clicar
    href?: string; // Se for um link, redireciona para essa URL
    variant: "primary" | "secondary"; // Estilo visual do botão
    isLoading: boolean; // Indica se está em estado de carregamento
    size: "small" | "medium" | "large"; // Tamanho do botão
    message?: string; // Mensagem de erro ou informativa opcional
    className?: string; // Classe extra para estilização personalizada
};

// Componente funcional que recebe as props definidas acima
const CustomButton: React.FC<CustomButtonProps> = ({
    label,
    onClick,
    href,
    variant,
    isLoading,
    size,
    message,
    className = "", // Se nenhuma classe for passada, usa string vazia
}) => {

    // Função que retorna as classes de estilo do botão com base nas props
    const buttonStyles = () => {
        // Estilos base que todos os botões usam
        let baseStyles = "text-white rounded-md flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed";

        // Estilos por tamanho
        let sizeStyles = "";
        if (size === "small") {
            sizeStyles = "px-3 py-2 text-sm";
        } else if (size === "medium") {
            sizeStyles = "px-6 py-2";
        } else if (size === "large") {
            sizeStyles = "w-full px-6 py-3";
        }

        // Estilos por tipo (variant)
        let variantStyles = "";
        if (variant === "primary") {
            variantStyles = "bg-[#359293] hover:bg-[#2b797a]";
        } else if (variant === "secondary") {
            variantStyles = "bg-[#EC5B20] hover:bg-[#d44c19]";
        }

        // Estilo ao passar o mouse (hover)
        let hoverStyles = "hover:scale-105";

        // Junta todos os estilos em uma única string
        return `${baseStyles} ${sizeStyles} ${variantStyles} ${hoverStyles} ${className}`;
    };

    // Renderiza o botão
    return (
        <>
            {/* Se a prop href existir, o botão será um link clicável */}
            {href ? (
                <Link href={href}>
                    <button
                        onClick={onClick}
                        className={buttonStyles()}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            // Exibe um ícone de carregando se estiver carregando
                            <div className="flex items-center">
                                <FaSpinner className="animate-spin mr-2" />
                                <span>Carregando...</span>
                            </div>
                        ) : (
                            label // Caso contrário, mostra o texto do botão
                        )}
                    </button>
                </Link>
            ) : (
                // Se não tiver href, o botão será "normal"
                <button
                    onClick={onClick}
                    className={buttonStyles()}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <FaSpinner className="animate-spin mr-2" />
                            <span>Carregando...</span>
                        </div>
                    ) : (
                        label
                    )}
                </button>
            )}

            {/* Se houver uma mensagem e não estiver carregando, exibe abaixo do botão */}
            {message && !isLoading && (
                <p className="text-red-500 text-sm mt-2">{message}</p>
            )}
        </>
    );
};

// Exporta o botão para ser usado em outros componentes
export default CustomButton;
// O componente 'CustomButton' é um botão reutilizável que pode ser estilizado de diferentes maneiras,
// dependendo das propriedades passadas. Ele pode ser um link ou um botão normal, exibe um ícone de carregamento quando necessário,
// e pode mostrar uma mensagem de erro ou informativa abaixo dele. Suas classes são geradas dinamicamente com base nas props,
// permitindo fácil personalização visual e funcional.