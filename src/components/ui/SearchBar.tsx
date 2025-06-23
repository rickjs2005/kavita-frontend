"use client"; // Necessário para que useState, useEffect e useRouter funcionem

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Para navegar para a página do produto
import { FaSearch, FaCartPlus } from "react-icons/fa"; // Ícones
import { useCart } from "@/context/CartContext"; // Hook de carrinho
import { Product } from "@/types/product"; // Tipo do produto

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SearchBar = () => {
  const router = useRouter(); // Para redirecionar o usuário
  const { addToCart } = useCart(); // Função de adicionar ao carrinho

  const [query, setQuery] = useState(""); // Termo digitado no input
  const [sugestoes, setSugestoes] = useState<Product[]>([]); // Lista de produtos retornados
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false); // Controla exibição da caixa de sugestões
  const [loading, setLoading] = useState(false); // Mostra "Carregando..."
  const [selectedIndex, setSelectedIndex] = useState(-1); // Index da sugestão selecionada com seta ↓ ↑

  // Executa busca com debounce (espera 300ms após digitação)
  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim().length > 1) buscarSugestoes(query);
      else setSugestoes([]);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  // Função que busca produtos na API
  const buscarSugestoes = async (busca: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/public/produtos?busca=${encodeURIComponent(busca)}`);
      const data = await res.json();
      setSugestoes(Array.isArray(data) ? data : []);
      setSelectedIndex(-1); // Resetar seleção
    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
      setSugestoes([]);
    } finally {
      setLoading(false);
      setMostrarSugestoes(true);
    }
  };

  // Ao clicar em uma sugestão
  const handleSelect = (id: number) => {
    router.push(`/produtos/${id}`); // Vai para a página do produto
    setMostrarSugestoes(false);
    setQuery("");
  };

  // Adiciona o produto ao carrinho
  const handleAddToCart = (produto: Product) => {
    addToCart(produto);
  };

  // Permite navegação com teclado (↑ ↓ Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => Math.min(prev + 1, sugestoes.length - 1));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleSelect(sugestoes[selectedIndex].id);
    }
  };

  // Formata o preço de forma segura
  const renderPreco = (preco: number | string) => {
    const valor = Number(preco);
    return !isNaN(valor) ? `R$ ${valor.toFixed(2)}` : "Preço indisponível";
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Campo de busca e botão */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedIndex >= 0 && sugestoes[selectedIndex])
            handleSelect(sugestoes[selectedIndex].id);
        }}
        className="flex shadow rounded overflow-hidden"
      >
        <input
          type="text"
          placeholder="Buscar produto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setMostrarSugestoes(true)}
          onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)} // atraso evita sumir ao clicar no item
          className="w-full px-4 py-2 text-sm text-gray-700 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 transition"
        >
          <FaSearch />
        </button>
      </form>

      {/* Sugestões de busca */}
      {mostrarSugestoes && (
        <ul className="absolute w-full mt-1 z-20 max-h-64 overflow-y-auto border border-gray-200 bg-white rounded-md shadow">
          {/* Enquanto carrega */}
          {loading ? (
            <li className="px-4 py-2 text-sm text-gray-500 italic">Carregando...</li>
          ) : sugestoes.length > 0 ? (
            // Exibe sugestões
            sugestoes.map((produto, idx) => (
              <li
                key={produto.id}
                onMouseDown={() => handleSelect(produto.id)} // Evita que onBlur oculte antes
                className={`flex justify-between items-center gap-3 px-4 py-3 cursor-pointer ${
                  idx === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                {/* Produto com imagem e nome */}
                <div className="flex items-center gap-3">
                  {produto.image && (
                    <img
                      src={produto.image}
                      alt={produto.name || "Produto"}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {produto.name || "Nome não disponível"}
                    </p>
                    <p className={`text-xs ${isNaN(Number(produto.price)) ? 'text-red-500' : 'text-green-600'} font-semibold`}>
                      {renderPreco(produto.price)}
                    </p>
                  </div>
                </div>

                {/* Botão de adicionar ao carrinho */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Evita abrir o produto ao clicar
                    handleAddToCart(produto);
                  }}
                  className="text-gray-500 hover:text-green-600"
                >
                  <FaCartPlus />
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-gray-500 italic">Produto não encontrado</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
// O componente SearchBar permite buscar produtos por nome, exibe sugestões e permite adicionar ao carrinho.
// Ele utiliza debounce para evitar muitas requisições, navegação com teclado e formatação de preços.
// As sugestões são exibidas em uma lista abaixo do campo de busca, com opção de adicionar ao carrinho.
// O componente é responsivo e se adapta a diferentes tamanhos de tela, mantendo uma boa experiência de usuário.
// Ele também lida com estados de carregamento e erros de forma amigável, garantindo que o usuário tenha feedback visual adequado durante a busca.
// O uso de ícones melhora a usabilidade, tornando as ações mais intuitivas.