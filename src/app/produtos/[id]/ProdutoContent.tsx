'use client';

import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import CustomButton from "@/components/buttons/CustomButton";
import { useState } from "react";

interface Props {
  produto: Product;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/placeholder.png";

function absUrl(p?: string | null) {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;
}

export default function ProdutoContent({ produto }: Props) {
  const { addToCart } = useCart();

  // Monta lista de imagens (sem duplicar)
  const extras = Array.isArray(produto.images) ? (produto.images as unknown as string[]) : ([] as string[]);
  const all = [produto.image].concat(extras).filter(Boolean) as string[];
  const unique = Array.from(new Set(all));
  const images = unique.map(absUrl).filter(Boolean) as string[];

  // Estado da imagem principal
  const [activeImage, setActiveImage] = useState(images[0] || PLACEHOLDER);

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      {/* Lado esquerdo: Imagens */}
      <div className="w-full flex flex-col items-center gap-4">
        {/* Imagem principal */}
        <Image
          src={activeImage}
          alt={produto.name}
          width={500}
          height={500}
          className="rounded shadow object-contain max-h-[420px] bg-gray-50 transition-all duration-300"
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />

        {/* Miniaturas */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto justify-center">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => setActiveImage(src)}
                className={`rounded border-2 overflow-hidden transition ${
                  activeImage === src
                    ? "border-[#2F7E7F]"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image
                  src={src}
                  alt={`thumb-${i + 1}`}
                  width={80}
                  height={80}
                  className="rounded object-cover w-20 h-20"
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lado direito: Informações */}
      <div className="flex flex-col justify-between h-full">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">{produto.name}</h1>
          <p className="text-gray-600">
            {produto.description || "Sem descrição disponível."}
          </p>
          <p className="text-green-600 font-bold text-2xl">
            R$ {Number(produto.price).toFixed(2)}
          </p>
        </div>

        {/* Botão */}
        <div className="mt-6">
          <CustomButton
            label="Adicionar ao Carrinho"
            variant="primary"
            size="large"
            isLoading={false}
            onClick={() => {
              addToCart(produto);
            }}
          />
        </div>
      </div>
    </section>
  );
}
