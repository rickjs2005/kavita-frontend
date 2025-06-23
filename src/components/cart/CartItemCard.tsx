// Indica que este componente será executado no lado do cliente
"use client";

// Importações
import React from "react";
import { CartItem } from "../../types/CartCarProps"; // Tipo que representa um item do carrinho
import { useCart } from "../../context/CartContext"; // Hook para acessar funções do carrinho
import CustomButton from "../buttons/CustomButton"; // Botão personalizado reutilizável
import DeleteButton from "../buttons/DeleteButton"; // (Não está sendo usado aqui, mas foi importado)

// Componente que recebe um item do carrinho como prop
const CartItemCard: React.FC<{ item: CartItem }> = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart(); // Funções para remover ou alterar quantidade

  // Função para formatar o preço com duas casas decimais
  const formatPrice = (price?: number) => (
    typeof price === "number" ? price.toFixed(2) : "0.00"
  );

  return (
    <li className="flex justify-between items-center border-b py-3">
      {/* Imagem do produto */}
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-md mr-3"
      />

      {/* Informações principais do produto */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold">{item.name}</h3>
        <p className="text-gray-500">R$ {formatPrice(item.price)}</p>

        {/* Controle de quantidade: botão "-", número e botão "+" */}
        <div className="flex items-center gap-1 mt-2">
          <CustomButton
            label="-"
            onClick={() => updateQuantity(item.id, item.quantity - 1)} // Diminui 1 da quantidade
            variant="secondary"
            isLoading={false}
            size="small"
          />
          <span className="w-6 text-center">{item.quantity}</span>
          <CustomButton
            label="+"
            onClick={() => updateQuantity(item.id, item.quantity + 1)} // Aumenta 1 na quantidade
            variant="secondary"
            isLoading={false}
            size="small"
          />
        </div>
      </div>

      {/* Total do item e botão de remover */}
      <div className="flex flex-col items-end">
        {/* Total = preço unitário * quantidade */}
        <p className="text-green-600 font-bold">
          R$ {formatPrice(item.price * item.quantity)}
        </p>

        {/* Botão para remover o item do carrinho */}
        <CustomButton
          label="🗑 Remover"
          onClick={() => removeFromCart(item.id)}
          variant="primary"
          isLoading={false}
          size="small"
          className="mt-6"
        />
      </div>
    </li>
  );
};

// Exporta o componente
export default CartItemCard;
// Este componente representa um item do carrinho de compras
// Ele exibe a imagem do produto, nome, preço, quantidade e total do item 