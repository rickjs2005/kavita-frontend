'use client'; // Indica que este componente deve ser renderizado no navegador (client-side)

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Hook para redirecionamento de rotas
import { User } from '../../types/User'; // Tipo que define a estrutura do usuário
import CloseButton from '../../components/buttons/CloseButton'; // Botão personalizado para fechar a tela

// Componente de Cadastro
const Register: React.FC = () => {
  const router = useRouter(); // Hook para redirecionamento após cadastro

  // Estado com os dados do formulário, seguindo o tipo User
  const [formData, setFormData] = useState<User>({
    nome: '',
    email: '',
    senha: '',
    endereco: '',
    data_nascimento: '',
    telefone: '',
    pais: '',
    estado: '',
    cidade: '',
    cep: '',
    ponto_referencia: '',
  });

  const [confirmSenha, setConfirmSenha] = useState(''); // Campo de confirmação de senha
  const [errorMessage, setErrorMessage] = useState(''); // Para exibir mensagens de erro
  const [successMessage, setSuccessMessage] = useState(''); // Para mostrar sucesso no cadastro

  // Função que atualiza os campos conforme o usuário digita
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: id === 'data_nascimento'
        ? new Date(value).toISOString().split('T')[0] // Formata data para YYYY-MM-DD
        : value,
    }));
  };

  // Quando o formulário é enviado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o reload da página
    setErrorMessage('');
    setSuccessMessage('');

    // Verifica se as senhas batem
    if (formData.senha !== confirmSenha) {
      setErrorMessage('As senhas não conferem.');
      return;
    }

    try {
      // Envia os dados para a API
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.mensagem || 'Erro no cadastro.');
      } else {
        setSuccessMessage('Sua conta foi criada com sucesso! Redirecionando para o login...');
        
        // Após 3 segundos, redireciona para o login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      setErrorMessage('Erro de rede. Tente novamente.');
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 py-10 px-4 relative">
      
      {/* Fundo com imagem desfocada e sobreposição escura */}
      <div className="absolute inset-0 bg-cover bg-center filter blur-sm" style={{ backgroundImage: "url('/images/cafe.png')" }} />
      <div className="absolute inset-0 bg-black opacity-50" />

      {/* Card branco do formulário */}
      <div className="relative bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <CloseButton className="absolute top-4 right-4" />
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Cadastro</h2>

        {/* Mensagens de erro ou sucesso */}
        {errorMessage && <p className="mb-4 text-center text-red-500">{errorMessage}</p>}
        {successMessage && <p className="mb-4 text-center text-green-500 font-bold">{successMessage}</p>}

        {/* Formulário dividido em colunas com Tailwind */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cada campo abaixo segue o mesmo padrão: label, input e handleChange */}

          {/* Nome */}
          <div className="col-span-1">
            <label htmlFor="nome">Nome</label>
            <input id="nome" type="text" value={formData.nome} onChange={handleChange} required className="input" placeholder="Digite seu nome" />
          </div>

          {/* Email */}
          <div className="col-span-1">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={formData.email} onChange={handleChange} required className="input" placeholder="Digite seu email" />
          </div>

          {/* Senha */}
          <div className="col-span-1">
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" value={formData.senha} onChange={handleChange} required className="input" placeholder="Digite sua senha" />
          </div>

          {/* Endereço */}
          <div className="col-span-1">
            <label htmlFor="endereco">Endereço</label>
            <input id="endereco" type="text" value={formData.endereco} onChange={handleChange} required className="input" placeholder="Digite seu endereço" />
          </div>

          {/* Data de nascimento */}
          <div className="col-span-1">
            <label htmlFor="data_nascimento">Data de Nascimento</label>
            <input id="data_nascimento" type="date" value={formData.data_nascimento || ''} onChange={handleChange} required className="input" />
          </div>

          {/* Telefone */}
          <div className="col-span-1">
            <label htmlFor="telefone">Telefone</label>
            <input id="telefone" type="tel" value={formData.telefone} onChange={handleChange} required className="input" placeholder="(00) 00000-0000" />
          </div>

          {/* País */}
          <div className="col-span-1">
            <label htmlFor="pais">País</label>
            <input id="pais" type="text" value={formData.pais} onChange={handleChange} required className="input" placeholder="Digite seu país" />
          </div>

          {/* Estado */}
          <div className="col-span-1">
            <label htmlFor="estado">Estado</label>
            <input id="estado" type="text" value={formData.estado} onChange={handleChange} required className="input" placeholder="Digite seu estado" />
          </div>

          {/* Cidade */}
          <div className="col-span-1">
            <label htmlFor="cidade">Cidade</label>
            <input id="cidade" type="text" value={formData.cidade} onChange={handleChange} required className="input" placeholder="Digite sua cidade" />
          </div>

          {/* CEP */}
          <div className="col-span-1">
            <label htmlFor="cep">CEP</label>
            <input id="cep" type="text" value={formData.cep} onChange={handleChange} required className="input" placeholder="00000-000" />
          </div>

          {/* Ponto de Referência */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="ponto_referencia">Ponto de Referência</label>
            <input id="ponto_referencia" type="text" value={formData.ponto_referencia} onChange={handleChange} required className="input" placeholder="Digite um ponto de referência" />
          </div>

          {/* Confirmação da Senha */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="confirmSenha">Confirmar Senha</label>
            <input id="confirmSenha" type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} required className="input" placeholder="Confirme sua senha" />
          </div>

          {/* Botão de cadastro */}
          <div className="col-span-1 md:col-span-2">
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
// O componente Register permite que novos usuários se cadastrem, coletando informações pessoais e de contato.
// Ele valida os dados, exibe mensagens de erro ou sucesso e redireciona para a página de login após o cadastro bem-sucedido.
// O uso de "use client" permite que este componente seja renderizado no lado do cliente