'use client'; // Isso diz que essa parte do código roda no navegador (no seu computador), não no servidor.

import { useState } from 'react'; // Isso ajuda a guardar e mudar valores na tela.
import { useRouter } from 'next/navigation'; // Isso serve para mudar de página no site.

export default function AdminLogin() {
  // Aqui estamos criando duas "caixinhas" para guardar o email e a senha que a pessoa digitar.
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Isso nos ajuda a mudar de página depois que o login funcionar.
  const router = useRouter();

  // Função que vai tentar fazer o login quando clicar no botão
  const handleLogin = async () => {
    try {
      // Aqui a gente está mandando o email e a senha para o servidor verificar
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST', // Estamos enviando dados (não apenas pegando)
        headers: { 'Content-Type': 'application/json' }, // Dizendo que estamos enviando texto no formato JSON
        body: JSON.stringify({ email, senha }), // Transformando o email e senha em um texto que o servidor entende
      });

      // Se o servidor disser que o login está errado
      if (!res.ok) {
        alert("Credenciais inválidas"); // Mostra um aviso para o usuário
        return;
      }

      // Se o login der certo, pegamos o token (uma "chave mágica") que o servidor manda
      const { token } = await res.json();

      // Guardamos essa chave no navegador da pessoa, como se fosse um crachá de acesso
      localStorage.setItem("adminToken", token);

      // Levamos a pessoa para a página do painel do admin
      router.push("/admin");
    } catch (err) {
      // Se der erro (por exemplo, o servidor caiu), mostramos um aviso
      console.error("Erro ao fazer login:", err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  return (
    // Parte visual da página — tudo isso monta o layout bonitinho
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#359293]">
          Acesso Administrativo
        </h2>

        {/* Campo de digitar o email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Quando digita algo, salva na caixinha de email
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#359293]"
          />
        </div>

        {/* Campo de digitar a senha */}
        <div className="mb-6">
          <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)} // Quando digita algo, salva na caixinha de senha
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#359293]"
          />
        </div>

        {/* Botão de entrar */}
        <button
          onClick={handleLogin} // Quando clicar, chama a função handleLogin
          className="w-full bg-[#359293] text-white font-medium py-2 rounded hover:bg-[#277577] transition-colors"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
