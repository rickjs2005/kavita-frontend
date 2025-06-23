"use client"; // Indica que este componente deve ser renderizado no navegador (lado do cliente)

import { useState } from "react"; // Importa o hook useState para controlar estado
import { Product } from "../../types/product"; // Importa o tipo Product para tipagem TypeScript
import { useFetchProducts } from "../../hooks/useFetchProducts"; // Hook que busca produtos de uma categoria
import ProductCard from "../../components/products/ProductCard"; // Componente para exibir cada produto

// Componente principal da página da categoria "Fazenda"
const FazendaPage: React.FC = () => {
  // Hook customizado que busca produtos da categoria "fazenda"
  const { products, loading } = useFetchProducts("fazenda");

  // Estado para armazenar qual subcategoria foi selecionada no dropdown
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filtra os produtos se uma subcategoria estiver selecionada
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.third_category === selectedCategory)
    : products; // Se nenhuma for escolhida, mostra todos

  return (
    <div className="container mx-auto p-6">
      {/* Título da página */}
      <h1 className="text-3xl font-bold mb-6">Fazenda</h1>

      {/* Filtro de subcategorias */}
      <div className="mb-4">
        <select
          className="border p-2 rounded-md"
          value={selectedCategory} // Valor atual do select
          onChange={(e) => setSelectedCategory(e.target.value)} // Atualiza o estado ao mudar a opção
        >
          <option value="">Todas as Subcategorias</option>

          {/* Gera uma lista de opções únicas com base nas subcategorias existentes */}
          {[...new Set(products.map((p) => p.third_category).filter(Boolean))].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Mostra carregando enquanto os produtos são buscados */}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        // Exibe os produtos filtrados em forma de grid
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FazendaPage;
