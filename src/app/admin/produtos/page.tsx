"use client"; // Isso diz que essa parte do site vai funcionar no navegador da pessoa

import { useEffect, useRef, useState } from "react"; // usamos para guardar informações, reagir quando a tela abrir, e rolar até partes da tela
import ProdutoForm from "@/components/admin/produtos/produtoform"; // Formulário para adicionar ou editar produtos
import ProdutoCard from "@/components/admin/produtos/produtocard"; // Cartão que mostra cada produto
import { Product } from "@/types/product"; // Tipo de dado para um produto

export default function ProdutosPage() {
  // Lista com todos os produtos da loja
  const [produtos, setProdutos] = useState<Product[]>([]);

  // Mostra se ainda estamos carregando os produtos
  const [loading, setLoading] = useState(true);

  // Se a gente quiser editar um produto, guardamos ele aqui
  const [produtoEditado, setProdutoEditado] = useState<Product | null>(null);

  // Usado para rolar a tela até o formulário quando for editar
  const formRef = useRef<HTMLDivElement>(null);

  // Essa função pega os produtos do servidor
  const carregarProdutos = () => {
    const token = localStorage.getItem("adminToken"); // Pegamos o crachá do admin

    fetch("http://localhost:5000/api/admin/produtos", {
      headers: { Authorization: `Bearer ${token}` }, // Mandamos o crachá junto
    })
      .then((res) => res.json()) // Convertendo resposta para algo que o JS entende
      .then((data) => {
        // Transformamos os preços e quantidades em números certinhos
        const convertidos = data.map((p: any) => ({
          ...p,
          price: parseFloat(p.price),
          quantity: parseInt(p.quantity),
        }));

        // Guardamos os produtos
        setProdutos(convertidos);
        setLoading(false); // Paramos de mostrar "carregando"
      });
  };

  // Assim que a tela aparece, buscamos os produtos
  useEffect(() => {
    carregarProdutos();
  }, []);

  // Remove um produto da lista (só da tela, não do servidor ainda)
  const removerProduto = (id: number) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  };

  // Quando clicar no botão de editar, salvamos o produto e rolamos até o formulário
  const handleEditarProduto = (produto: Product) => {
    setProdutoEditado(produto); // Diz qual produto vai ser editado
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); // Rola a tela até o formulário
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Produtos</h1>

      {/* Aqui está o formulário de adicionar/editar produtos */}
      <div ref={formRef}>
        <ProdutoForm
          onProdutoAdicionado={carregarProdutos} // Quando adiciona, carrega os produtos de novo
          produtoEditado={produtoEditado} // Se tiver produto sendo editado, mostra ele no formulário
          onLimparEdicao={() => setProdutoEditado(null)} // Botão para cancelar a edição
        />
      </div>

      {/* Enquanto carrega, mostramos um texto. Depois, mostramos os cartões dos produtos */}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Mostra todos os produtos em formato de cartão */}
          {produtos.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onRemover={removerProduto} // Botão de remover
              onEditar={handleEditarProduto} // Botão de editar
            />
          ))}
        </div>
      )}
    </div>
  );
}
