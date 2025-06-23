"use client"; // Indica que este componente deve ser renderizado no lado do cliente (navegador)

import { useState } from "react"; // Hook do React para manipular estado
import { Product } from "../../types/product"; // Tipo que define a estrutura dos produtos
import { useFetchProducts } from "../../hooks/useFetchProducts"; // Hook customizado para buscar produtos da API
import ProductCard from "../../components/products/ProductCard"; // Componente que exibe visualmente um produto

// Componente da página para exibir produtos da categoria "Pragas e Insetos"
const PragasPage: React.FC = () => {
  // Busca os produtos da categoria "pragas e insetos"
  const { products, loading } = useFetchProducts("pragas e insetos");

  // Estado que armazena a subcategoria selecionada no filtro
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filtra os produtos com base na subcategoria escolhida
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.third_category === selectedCategory)
    : products; // Se nenhuma subcategoria for escolhida, mostra todos

  return (
    <div className="container mx-auto p-6">
      {/* Título da página */}
      <h1 className="text-3xl font-bold mb-6">Pragas e Insetos</h1>

      {/* Filtro por subcategoria (third_category) */}
      <div className="mb-4">
        <select
          className="border p-2 rounded-md"
          value={selectedCategory} // valor atual selecionado
          onChange={(e) => setSelectedCategory(e.target.value)} // atualiza o estado ao trocar opção
        >
          {/* Opção padrão para mostrar todos os produtos */}
          <option value="">Todas as Subcategorias</option>

          {/* Gera opções únicas com base nas subcategorias existentes */}
          {[...new Set(products.map((p) => p.third_category).filter(Boolean))].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Enquanto os dados estão sendo carregados, exibe mensagem de loading */}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        // Exibe os produtos filtrados em formato de grade
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => (
            <ProductCard 
              key={product.id} // chave única para o React
              product={product} // envia os dados do produto para o componente visual
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PragasPage;
// Exporta o componente para ser usado em outras partes da aplicação
// O uso de "use client" permite que este componente seja renderizado no lado do cliente