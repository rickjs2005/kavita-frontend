'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CloseButton from '../../components/buttons/CloseButton';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  // Estados para gerenciar o formulário e o feedback ao usuário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Hooks para navegação e autenticação
  const router = useRouter();
  const { login } = useAuth();

  // Função para lidar com o envio do formulário de login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validação básica da senha
    if (password.length < 8) {
      setErrorMessage('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    // Limpa mensagens de erro e inicia o estado de carregamento
    setErrorMessage('');
    setLoading(true);

    try {
      // Faz a requisição para a API de login
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Processa a resposta da API
      const data = await response.json();
      console.log('[Login] Resposta da API:', data);

      if (response.ok) {
        // Extrai o nome do usuário da resposta da API
        const nomeUsuario = data.user?.nome?.trim() || email; // Fallback para email se o nome não existir
        login(data.user.id, nomeUsuario); // Atualiza o contexto de autenticação com o nome do usuário
        router.push('/'); // Redireciona para a página inicial
      } else {
        // Exibe mensagem de erro da API ou uma mensagem padrão
        setErrorMessage(data.message || 'Credenciais inválidas.');
      }
    } catch (error) {
      // Trata erros de rede ou outros erros inesperados
      console.error('[Login] Erro ao fazer login:', error);
      setErrorMessage('Ocorreu um erro. Tente novamente mais tarde.');
    } finally {
      // Finaliza o estado de carregamento
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Fundo com imagem desfocada */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm"
        style={{ backgroundImage: "url('/images/cafe.png')" }}
      ></div>
      {/* Overlay escuro para melhorar a legibilidade */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Formulário de login */}
      <div className="relative w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        {/* Botão de fechar */}
        <CloseButton className="absolute top-4 right-4" />

        {/* Título do formulário */}
        <h2 className="text-2xl font-bold text-[#359293] text-center mb-6">Login</h2>

        {/* Formulário */}
        <form onSubmit={handleLogin}>
          {/* Campo de email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#359293]"
              required
            />
          </div>

          {/* Campo de senha */}
          <div className="mb-4 relative">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#359293]"
              required
            />
            {/* Botão para mostrar/esconder senha */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 top-7 flex items-center text-gray-600 hover:text-gray-900"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Mensagem de erro */}
          {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}

          {/* Botão de submit */}
          <button
            type="submit"
            className="bg-[#359293] text-white w-full py-3 rounded font-bold hover:bg-[#0C6667] transition"
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>

        {/* Links para "Esqueceu a senha?" e "Cadastre-se" */}
        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-[#359293]">
            Esqueceu a senha?
          </Link>
          <span className="mx-2">|</span>
          <Link href="/register" className="text-sm text-gray-600 hover:text-[#359293]">
            Cadastre-se aqui
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;