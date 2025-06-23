// MedicamentosPage.tsx

"use client"; // Este componente será renderizado no navegador (lado do cliente)

import { useState } from "react"; // Hook para trabalhar com estado (armazenar e atualizar variáveis dinâmicas)
import { Product } from "../../types/product"; // Tipo de dados para produtos
import { useFetchProducts } from "../../hooks/useFetchProducts"; // Hook personalizado que busca produtos da API
import ProductCard from "../../components/products/ProductCard"; // Componente visual para exibir cada produto

// Componente principal da página de Medicamentos
const MedicamentosPage: React.FC = () => {
  // Busca os produtos da categoria "medicamentos"
  const { products, loading } = useFetchProducts("medicamentos");

  // Estado para armazenar a subcategoria selecionada pelo usuário
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filtra os produtos com base na subcategoria selecionada
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.third_category === selectedCategory) // Exibe só os da subcategoria
    : products; // Se nenhuma subcategoria estiver selecionada, mostra todos

  return (
    <div className="container mx-auto p-6">
      {/* Título da página */}
      <h1 className="text-3xl font-bold mb-6">Medicamentos</h1>

      {/* Filtro de subcategorias */}
      <div className="mb-4">
        <select
          className="border p-2 rounded-md"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)} // Atualiza o estado quando uma opção é escolhida
        >
          <option value="">Todas as Subcategorias</option>

          {/* Gera as opções únicas com base nas subcategorias existentes nos produtos */}
          {[...new Set(products.map((p) => p.third_category).filter(Boolean))].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Exibe carregando enquanto busca os produtos */}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        // Exibe os produtos (filtrados ou todos) em formato de grid responsivo
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product) => (
            <ProductCard 
              key={product.id} // Chave única para o React
              product={product} // Passa o objeto do produto como props
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicamentosPage;
