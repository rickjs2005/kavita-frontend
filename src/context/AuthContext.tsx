"use client"; // Necessário para usar hooks no lado do cliente (Next.js)

import React, { createContext, useContext, useState, useEffect } from "react";
import { useCart } from "./CartContext"; // Hook do carrinho (deve ser usado dentro do componente)

// Define o formato dos dados disponíveis no contexto de autenticação
interface AuthContextProps {
  isAuthenticated: boolean; // Está logado?
  userName: string | null;  // Nome do usuário
  userId: number | null;    // ID do usuário
  login: (userId: number, userName: string) => void; // Função de login
  logout: () => void;       // Função de logout
}

// Criação do contexto (com tipo opcional)
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Componente que envolve a aplicação e fornece os dados de autenticação
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const { clearCart } = useCart(); // Hook para limpar o carrinho ao deslogar

  // Ao carregar o site, verifica se há dados salvos no localStorage
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const storedUserName = localStorage.getItem("userName");
    const storedUserId = localStorage.getItem("userId");

    // Se houver dados, o usuário é considerado autenticado
    if (token && storedUserName && storedUserId) {
      setIsAuthenticated(true);
      setUserName(storedUserName);
      setUserId(Number(storedUserId));
    }
  }, []);

  // Função que realiza o login (simulado aqui com "fakeToken")
  const login = (id: number, name: string) => {
    try {
      const token = "fakeToken123"; // Em produção, seria o token real do backend

      // Salva os dados no localStorage
      localStorage.setItem("userToken", token);
      localStorage.setItem("userName", name);
      localStorage.setItem("userId", id.toString());

      // Atualiza os estados internos
      setIsAuthenticated(true);
      setUserName(name);
      setUserId(id);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw new Error("Não foi possível fazer login. Tente novamente.");
    }
  };

  // Função que faz o logout
  const logout = () => {
    try {
      // Remove o carrinho específico do usuário
      if (userId) {
        localStorage.removeItem(`cartItems_${userId}`);
      }

      // Remove os dados de login
      localStorage.removeItem("userToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");

      // Reseta os estados internos
      setIsAuthenticated(false);
      setUserName(null);
      setUserId(null);

      // Limpa o carrinho da memória (contexto)
      clearCart();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw new Error("Não foi possível fazer logout. Tente novamente.");
    }
  };

  // Fornece os dados e funções para os componentes filhos
  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userName, userId, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para acessar o AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};
// Este hook permite que outros componentes acessem os dados de autenticação
// e as funções de login/logout de forma fácil e segura.