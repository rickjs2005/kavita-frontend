"use client"; // Essa diretiva garante que este componente seja executado no lado do cliente (browser), não no servidor

// Importa o botão para fechar o formulário (ícone X, geralmente no canto superior)
import CloseButton from '../../components/buttons/CloseButton';

// Importa os três formulários da página de checkout
import { AddressForm } from '../../components/checkout/AddressForm'; // Formulário de endereço
import { PaymentMethod } from '../../components/checkout/PaymentMethodForm'; // Formulário de método de pagamento
import { PersonalInfoForm } from '../../components/checkout/PersonalInfoForm.tsx'; // Formulário de dados pessoais

// Importa contextos para acessar dados do usuário e do carrinho
import { useAuth } from '../../context/AuthContext'; // Para saber se o usuário está logado
import { useCart } from '../../context/CartContext'; // Para acessar os produtos no carrinho
import { useCheckoutForm } from '../../hooks/useCheckoutForm'; // Hook que lida com os dados dos formulários

import axios from 'axios'; // Biblioteca para fazer requisições HTTP (ex: enviar o pedido para o backend)

const CheckoutPage = () => {
  // Pegamos o ID e nome do usuário pelo contexto de autenticação
  const { userId, userName } = useAuth();

  // Pegamos os produtos do carrinho e o total a pagar
  const { cartItems, cartTotal } = useCart();

  // Gerencia os dados do formulário (nome, endereço, pagamento, etc.)
  const { formData, handleChange } = useCheckoutForm(userName);

  // Função executada quando o usuário clica em "Concluir Compra"
  const handleSubmit = async () => {
    // Verifica se o usuário está logado
    if (!userId) {
      alert("Erro: usuário não identificado. Faça login novamente.");
      return;
    }

    try {
      // Cria o objeto com todos os dados necessários para o pedido
      const payload = {
        usuario_id: userId,
        ...formData, // inclui nome, endereço e forma de pagamento
        produtos: cartItems.map((item) => ({
          id: item.id,
          quantidade: item.quantity, // envia a quantidade de cada item
        })),
      };

      // Envia o pedido para o backend (rota /api/checkout)
      await axios.post('http://localhost:5000/api/checkout', payload);

      // Alerta de sucesso se a compra foi finalizada corretamente
      alert('Pedido enviado com sucesso!');
    } catch (err) {
      // Alerta caso ocorra algum erro na requisição
      alert('Erro ao finalizar a compra.');
    }
  };

  // Abaixo é o JSX (HTML misturado com JS) que monta a interface visual da página
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 bg-white shadow-xl rounded-2xl border border-gray-200">
      {/* Botão de fechar a página */}
      <CloseButton />

      {/* Título da página */}
      <h1 className="text-3xl font-extrabold text-center text-[#EC5B20] mb-12 uppercase tracking-wide">
        Finalize sua Compra
      </h1>

      {/* Seção com os dois primeiros formulários: dados pessoais e endereço */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Formulário de Dados Pessoais */}
        <div className="bg-[#E6F4F1] border border-gray-200 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 tracking-wide">Dados Pessoais</h2>
          <div className="text-base text-gray-700">
            <PersonalInfoForm formData={formData} handleChange={handleChange} />
          </div>
        </div>

        {/* Formulário de Endereço */}
        <div className="bg-[#E6F4F1] border border-gray-200 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 tracking-wide">Endereço de Entrega</h2>
          <div className="text-base text-gray-700">
            <AddressForm endereco={formData.endereco} handleChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Seção do formulário de pagamento */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md mb-12">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 tracking-wide">Forma de Pagamento</h2>
        <div className="text-base text-gray-700">
          <PaymentMethod formaPagamento={formData.formaPagamento} handleChange={handleChange} />
        </div>
      </div>

      {/* Total do carrinho e botão para concluir o pedido */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-4">
        {/* Exibe o valor total */}
        <p className="text-2xl font-bold text-gray-800">
          Total:{' '}
          <span className="text-[#EC5B20] tracking-wider">
            R$ {cartTotal.toFixed(2)}
          </span>
        </p>

        {/* Botão de finalizar compra */}
        <button
          onClick={handleSubmit}
          className="bg-[#EC5B20] hover:bg-[#d84e1a] text-white font-bold px-8 py-3 rounded-xl shadow-md transition duration-300"
        >
          Concluir Compra
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
