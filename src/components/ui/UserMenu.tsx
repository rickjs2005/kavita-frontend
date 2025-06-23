"use client"; // Necessário para usar hooks como useState e useEffect no client

import { useState, useEffect, useRef, MouseEvent } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext"; // Hook que traz info de login

// Componente de menu suspenso do usuário (login, meus dados, logout etc)
const UserMenu = () => {
  // Informações vindas do contexto de autenticação
  const { isAuthenticated, userName, logout } = useAuth();

  // Controla se o menu está aberto
  const [isOpen, setIsOpen] = useState(false);

  // Referência ao container do menu para fechar ao clicar fora
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false); // fecha o menu
      }
    };

    // Adiciona listener apenas se o menu estiver aberto
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Limpa o listener ao desmontar
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Alterna o menu (abre/fecha)
  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão que abre o menu */}
      <button onClick={toggleMenu} className="hover:text-[#EC5B20] cursor-pointer">
        {isAuthenticated
          ? `Bem-vindo, ${userName || "Usuário"}` // Mostra nome se estiver logado
          : "Login / Meus Pedidos"} // Se não estiver logado
      </button>

      {/* Menu suspenso */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-50">
          {/* Se estiver logado */}
          {isAuthenticated ? (
            <>
              {/* Link para dados do usuário */}
              <Link href="/meus-dados">
                <a
                  className="block px-4 py-2 hover:bg-gray-200 text-gray-800"
                  onClick={() => setIsOpen(false)} // Fecha menu ao clicar
                >
                  Meus Dados
                </a>
              </Link>

              {/* Link para pedidos */}
              <Link href="/meus-pedidos">
                <a
                  className="block px-4 py-2 hover:bg-gray-200 text-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  Meus Pedidos
                </a>
              </Link>

              {/* Botão de logout */}
              <button
                onClick={() => {
                  logout();        // Executa logout
                  setIsOpen(false); // Fecha menu
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-200 text-red-500"
              >
                Sair
              </button>
            </>
          ) : (
            // Se não estiver logado, mostra botão de login
            <Link href="/login">
              <a
                className="block px-4 py-2 hover:bg-gray-200 text-gray-800"
                onClick={() => setIsOpen(false)}
              >
                Fazer Login
              </a>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMenu;
// Este componente exibe um menu suspenso para o usuário, com opções de login, meus dados e logout.
// Utiliza o contexto de autenticação para saber se o usuário está logado e exibir o nome dele.
// O menu fecha ao clicar fora dele, utilizando uma referência e um listener de evento.