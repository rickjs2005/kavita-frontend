'use client'; // Esse componente será renderizado no lado do cliente (navegador)

import { Product } from "@/types/product"; // Tipo do produto
import { useCart } from "@/context/CartContext"; // Hook de contexto que lida com o carrinho de compras
import Image from "next/image"; // Componente otimizado de imagem do Next.js
import CustomButton from "@/components/buttons/CustomButton"; // Botão personalizado reutilizável

interface Props {
  produto: Product; // Espera receber um objeto do tipo Produto via props
}

// Componente responsável por exibir as informações do produto na tela
export default function ProdutoContent({ produto }: Props) {
  const { addToCart } = useCart(); // Função para adicionar o produto ao carrinho

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      
      {/* Imagem do produto */}
      {produto.image && (
        <div className="w-full flex justify-center">
          <Image
            src={produto.image} // URL da imagem
            alt={produto.name}  // Texto alternativo
            width={450}
            height={450}
            className="rounded shadow object-contain max-h-[400px]"
          />
        </div>
      )}

      {/* Conteúdo à direita da imagem */}
      <div className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          {/* Nome do produto */}
          <h1 className="text-3xl font-bold text-gray-800">{produto.name}</h1>

          {/* Descrição (ou texto padrão se não existir) */}
          <p className="text-gray-600">{produto.description || "Sem descrição disponível."}</p>

          {/* Preço formatado */}
          <p className="text-green-600 font-bold text-2xl">
            R$ {Number(produto.price).toFixed(2)}
          </p>
        </div>

        {/* Botão de adicionar ao carrinho */}
        <div className="mt-6">
          <CustomButton
            label="Adicionar ao Carrinho"
            variant="primary"
            size="large"
            isLoading={false}
            onClick={() => addToCart(produto)} // Adiciona o produto ao carrinho
          />
        </div>
      </div>
    </section>
  );
}
// O componente ProdutoContent exibe os detalhes de um produto específico, incluindo sua imagem, nome, descrição e preço.
// Ele também permite que o usuário adicione o produto ao carrinho de compras com um botão