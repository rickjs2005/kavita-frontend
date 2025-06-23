"use client"; // Necessário para uso de hooks (como useCart) no lado do cliente

import React from "react";
import { useCart } from "../../context/CartContext"; // Hook para interagir com o carrinho
import { Product } from "../../types/product"; // Tipo de dados de produto

// Define as props esperadas para o card de produto
interface ProductCardProps {
  product: Product;
}

// Componente que exibe um único produto em forma de card
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart(); // Função para adicionar produto ao carrinho

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow duration-300 h-full flex flex-col justify-between">
      
      {/* Imagem do produto */}
      <div className="w-full h-40 flex items-center justify-center overflow-hidden mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="h-full object-contain"
        />
      </div>

      {/* Informações: nome, descrição e preço */}
      <div className="flex-1 flex flex-col justify-between text-center">
        <h3 className="text-base font-semibold text-gray-800">{product.name}</h3>

        {/* Exibe descrição se existir */}
        {product.description && (
          <p className="text-sm text-gray-500 mt-1">{product.description}</p>
        )}

        {/* Preço formatado */}
        <p className="text-green-600 font-bold text-lg mt-2">
          R$ {Number(product.price).toFixed(2)}
        </p>
      </div>

      {/* Botão para adicionar ao carrinho */}
      <div className="mt-4 flex justify-center">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 w-full"
          onClick={() => addToCart(product)}
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
// Este componente exibe um card de produto com imagem, nome, descrição e preço.
// Inclui um botão para adicionar o produto ao carrinho, utilizando o contexto de carrinho