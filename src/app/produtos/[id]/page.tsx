import { notFound } from "next/navigation"; // Função do Next.js para exibir a página 404
import { Product } from "@/types/product"; // Tipo TypeScript que representa a estrutura de um produto
import ProdutoContent from "./ProdutoContent"; // Componente visual que mostra os dados do produto

// Instrução para forçar a página a ser gerada dinamicamente a cada acesso
export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string }; // O ID do produto vem da URL (ex: /produtos/3)
};

// Função que busca o produto pelo ID, acessando a API pública
async function getProduto(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, {
      cache: "no-store", // Garante que não haverá cache (útil para dados sempre atualizados)
    });
    if (!res.ok) return null; // Se der erro na resposta, retorna null
    return await res.json(); // Retorna o produto em formato JSON
  } catch {
    return null; // Se der erro na requisição, também retorna null
  }
}

// Componente principal da página de produto
export default async function ProdutoPage({ params }: PageProps) {
  const produto = await getProduto(params.id); // Busca o produto com base no ID da URL
  if (!produto) return notFound(); // Se não encontrar, mostra página 404
  return <ProdutoContent produto={produto} />; // Renderiza o componente passando os dados do produto
}
// O Next.js irá renderizar este componente na rota /produtos/[id]
// onde [id] é o ID do produto, como /produtos/3