import { useState } from "react";
import CustomButton from "../../buttons/CustomButton"; // Botão azul para editar
import { Product } from "@/types/product"; // Tipo do produto (com nome, imagem, preço, etc)
import DeleteButton from "@/components/buttons/DeleteButton"; // Botão vermelho para deletar

// ⬇️ Aqui dizemos o que o componente precisa receber:
interface ProdutoCardProps {
  produto: Product; // O produto que vai aparecer no cartão
  onRemover: (id: number) => void; // Função para remover um produto
  onEditar: (produto: Product) => void; // Função para editar um produto
}

// ⬇️ Este é o cartão de produto que será mostrado na tela do admin
export default function ProdutoCard({
  produto,
  onRemover,
  onEditar,
}: ProdutoCardProps) {
  const [loading, setLoading] = useState(false); // Diz se está excluindo o produto

  // 🗑️ Função que remove o produto quando o botão for clicado
  const removerProduto = async () => {
    // Antes de remover, mostramos uma perguntinha pro usuário confirmar
    if (!confirm("Deseja realmente excluir este produto?")) return;

    setLoading(true); // Mostramos que está carregando...

    // Pegamos o token do admin que está salvo no navegador
    const token = localStorage.getItem("adminToken");

    // Enviamos uma requisição para o servidor pedindo para apagar o produto
    const res = await fetch(`http://localhost:5000/admin/produtos/${produto.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`, // Enviamos o crachá do admin junto
      },
    });

    // Se deu tudo certo, chamamos a função que remove da tela
    if (res.ok) {
      onRemover(produto.id);
    } else {
      alert("Erro ao remover produto.");
    }

    setLoading(false); // Terminamos o carregamento
  };

  return (
    <div className="bg-white p-4 shadow rounded">
      {/* Imagem do produto */}
      <img
        src={produto.image}
        alt={produto.name}
        className="w-full h-40 object-cover mb-2 rounded"
      />

      {/* Nome do produto em destaque */}
      <h2 className="font-bold">{produto.name}</h2>

      {/* Descrição em texto pequeno e cinza */}
      <p className="text-sm text-gray-600">{produto.description}</p>

      {/* Preço formatado em reais */}
      <p className="text-sm">
        Preço:{" "}
        {produto.price
          ? Number(produto.price).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : "N/A"}
      </p>

      {/* Quantidade do produto */}
      <p className="text-sm">Qtd: {produto.quantity}</p>

      {/* Botões de ação: Editar e Remover */}
      <div className="mt-4 flex gap-2">
        {/* Botão azul de editar */}
        <CustomButton
          label="Editar"
          onClick={() => onEditar(produto)} // Chama a função para editar o produto
          variant="primary"
          isLoading={false}
          size="small"
        />

        {/* Botão vermelho de deletar */}
        <DeleteButton onConfirm={() => onRemover(produto.id)} />
      </div>
    </div>
  );
}
// Aqui usamos o CustomButton para o botão de editar e DeleteButton para o de remover
// O CustomButton é um botão azul que mostra um texto e chama uma função quando clicado