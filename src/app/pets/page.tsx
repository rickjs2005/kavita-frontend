"use client"; // Garante que o componente será executado no navegador (client-side)

import { useState } from "react"; // Hook para gerenciar estados em componentes
import { Product } from "../../types/product"; // Tipo TypeScript que define a estrutura de um produto
import { useFetchProducts } from "../../hooks/useFetchProducts"; // Hook personalizado que busca produtos da API
import ProductCard from "../../components/products/ProductCard"; // Componente que exibe um produto individual

// Componente da página de produtos da categoria "Pets"
const PetsPage: React.FC = () => {
  // Busca os produtos da categoria "pets"
  const { products, loading } = useFetchProducts("pets");

  // Estado para armazenar a subcategoria selecionada no filtro
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filtra os produtos com base na subcategoria selecionada (third_category)
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.third_category === selectedCategory)
    : products; // Se nenhuma subcategoria estiver selecionada, mostra todos os produtos

  return (
    <div className="container mx-auto p-6">
      {/* Título da página */}
      <h1 className="text-3xl font-bold mb-6">Pets</h1>

      {/* Filtro de subcategorias (dropdown) */}
      <div className="mb-4">
        <select
          className="border p-2 rounded-md"
          value={selectedCategory} // valor atual selecionado no estado
          onChange={(e) => setSelectedCategory(e.target.value)} // atualiza o estado ao selecionar uma opção
        >
          {/* Opção para mostrar todos os produtos */}
          <option value="">Todas as Subcategorias</option>

          {/* Gera dinamicamente as opções únicas de subcategorias existentes */}
          {[...new Set(products.map((p) => p.third_category).filter(Boolean))].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Mostra "carregando" enquanto busca os produtos */}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        // Exibe os produtos em um layout de grade responsiva
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PetsPage;
// Exporta o componente para ser usado em outras partes da aplicação
// O uso de "use client" no início garante que este componente seja renderizado no lado do cliente (navegador),
// permitindo interações dinâmicas como o filtro de subcategorias.  