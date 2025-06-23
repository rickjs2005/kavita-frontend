// Indica que este componente será renderizado no cliente (Next.js)
"use client";

// Importações necessárias
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Hook de navegação
import { useCart } from "../../context/CartContext"; // Contexto do carrinho
import { useAuth } from "../../context/AuthContext"; // Contexto de autenticação
import CartItemCard from "./CartItemCard"; // Componente que exibe cada item do carrinho
import CustomButton from "../buttons/CustomButton"; // Botão reutilizável
import CloseButton from "../buttons/CloseButton"; // Botão de fechar (X)

// Define o tipo das props que o componente recebe
const CartCar: React.FC<{ isCartOpen: boolean; closeCart: () => void }> = ({ isCartOpen, closeCart }) => {
  // Obtém os itens do carrinho e o total a pagar via contexto
  const { cartItems, cartTotal } = useCart();

  // Verifica se o usuário está autenticado
  const { isAuthenticated } = useAuth();

  // Estado para controlar o cupom digitado pelo usuário
  const [coupon, setCoupon] = useState("");

  // Hook para navegar entre páginas
  const router = useRouter();

  // Simula aplicação de desconto
  const applyDiscount = (coupon: string) => {
    console.log(`Applying discount with coupon: ${coupon}`);
    // Aqui poderia ter lógica real para validar o cupom
  };

  // Quando o usuário clica em "Finalizar Compra"
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Seu carrinho está vazio! Adicione produtos antes de finalizar a compra.");
      return;
    }

    // Se o usuário não estiver logado, redireciona para login
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      // Senão, redireciona para a página de checkout
      router.push("/checkout");
    }
  };

  // Retorno visual do carrinho
  return (
    <div
      className={`fixed top-0 right-0 w-96 bg-white shadow-lg p-4 h-full z-50 flex flex-col transition-transform duration-300 ${
        isCartOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Cabeçalho do carrinho */}
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Carrinho de compras</h2>
        {/* Botão de fechar o carrinho */}
        <CloseButton onClose={closeCart} className="absolute top-3 right-5" />
      </header>

      {/* Lista de itens do carrinho */}
      <div className="flex-1 overflow-y-auto max-h-80">
        {cartItems.length > 0 ? (
          <ul>{cartItems.map((item) => <CartItemCard key={item.id} item={item} />)}</ul>
        ) : (
          <p className="text-xl text-gray-500 text-center py-10">🛒 Seu carrinho está vazio!</p>
        )}
      </div>

      {/* Rodapé: só aparece se tiver produtos no carrinho */}
      {cartItems.length > 0 && (
        <footer className="border-t pt-2">
          {/* Mostra o total */}
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span className="text-lg font-bold text-green-600">R$ {cartTotal.toFixed(2)}</span>
          </div>

          {/* Campo de cupom de desconto + botão */}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Cupom de desconto"
              className="border p-2 rounded-md flex-1 h-10"
            />
            <CustomButton
              label="Aplicar"
              onClick={() => applyDiscount(coupon)}
              variant="primary"
              isLoading={false}
              size="medium"
            />
          </div>

          {/* Botão de finalizar compra */}
          <CustomButton
            label="Finalizar Compra"
            onClick={handleCheckout}
            variant="primary"
            className="mt-4 w-full"
            isLoading={false}
            size="medium"
          />
        </footer>
      )}
    </div>
  );
};

// Exporta o componente para uso em outras partes do projeto
export default CartCar;
// O componente 'CartCar' é um carrinho de compras que exibe os itens adicionados, permite aplicar cupons de desconto e finalizar a compra.
// Ele usa contextos para gerenciar o estado do carrinho e autenticação do usuário.
// O carrinho é exibido como um painel lateral que pode ser aberto e fechado, e é responsivo para diferentes tamanhos de tela.
// Ele também inclui um botão de fechar (X) para facilitar a navegação do usuário.