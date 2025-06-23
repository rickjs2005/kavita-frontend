"use client"; // Esse componente será renderizado no lado do cliente (navegador)

import { useState } from "react"; // Hook do React para gerenciar estado
import { Product } from "../../types/product"; // Tipo TypeScript para um produto
import { useFetchProducts } from "../../hooks/useFetchProducts"; // Hook customizado para buscar produtos de uma categoria
import ProductCard from "../../components/products/ProductCard"; // Componente que renderiza visualmente cada produto

// Componente principal da página de produtos da categoria "Outros"
const OutrosPage: React.FC = () => {
  // Busca os produtos da categoria "outros" usando o hook
  const { products, loading } = useFetchProducts("outros");

  // Estado que guarda a subcategoria selecionada no filtro (dropdown)
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filtra os produtos com base na subcategoria (third_category)
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.third_category === selectedCategory)
    : products; // Se nenhuma subcategoria for selecionada, exibe todos os produtos

  return (
    <div className="container mx-auto p-6">
      {/* Título da página */}
      <h1 className="text-3xl font-bold mb-6">Outros</h1>

      {/* Dropdown para filtrar por subcategoria */}
      <div className="mb-4">
        <select
          className="border p-2 rounded-md"
          value={selectedCategory} // valor atual selecionado
          onChange={(e) => setSelectedCategory(e.target.value)} // atualiza o estado ao trocar a opção
        >
          <option value="">Todas as Subcategorias</option>
          {
            // Cria uma lista única de subcategorias existentes nos produtos
            [...new Set(products.map((p) => p.third_category).filter(Boolean))].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))
          }
        </select>
      </div>

      {/* Enquanto os dados estão sendo carregados, mostra mensagem de loading */}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        // Mostra os produtos em um grid responsivo
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => (
            <ProductCard 
              key={product.id} // Chave única para o React
              product={product} // Passa o objeto do produto como prop
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OutrosPage;
// Exporta o componente para ser usado em outras partes da aplicação
// O Next.js irá renderizar este componente na rota /outros 