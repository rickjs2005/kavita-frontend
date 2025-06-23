"use client"; // Isso fala pro Next.js que esse código vai rodar no navegador

import { useEffect, useRef, useState } from "react"; // Coisas que usamos para controlar o estado e ações da página
import ServiceFormUnificado from "@/components/admin/servicos/ServiceFormUnificado"; // O formulário para adicionar ou editar serviços
import ServiceCard from "@/components/admin/servicos/ServiceCard"; // Um cartãozinho que mostra o serviço
import { Service } from "@/types/service"; // O tipo de dado que um serviço deve ter

export default function ServicosPage() {
  // Guardamos todos os serviços aqui
  const [servicos, setServicos] = useState<Service[]>([]);

  // Mostra se ainda está carregando os dados
  const [loading, setLoading] = useState(true);

  // Guarda o serviço que a gente quer editar
  const [servicoEditado, setServicoEditado] = useState<Service | null>(null);

  // Serve para rolar a tela até o formulário de edição
  const formRef = useRef<HTMLDivElement>(null);

  // Função que vai buscar os serviços do servidor
  const carregarServicos = async () => {
    try {
      const token = localStorage.getItem("adminToken"); // Pega o crachá do administrador
      const res = await fetch("http://localhost:5000/api/admin/servicos", {
        headers: { Authorization: `Bearer ${token}` }, // Envia o crachá junto com o pedido
      });

      if (!res.ok) throw new Error("Falha ao buscar serviços");

      const data = await res.json(); // Converte a resposta em dados
      setServicos(Array.isArray(data) ? data : []); // Se for lista, salva. Se não, salva lista vazia.
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
      setServicos([]); // Se der erro, deixa a lista vazia
    } finally {
      setLoading(false); // Para de mostrar o "carregando"
    }
  };

  // Quando a tela aparece, a gente chama a função para buscar os serviços
  useEffect(() => {
    carregarServicos();
  }, []);

  // Função para remover um serviço
  const removerServico = async (id: number) => {
    const token = localStorage.getItem("adminToken"); // Pega o crachá do admin

    // Confirma se o usuário realmente quer apagar
    if (!confirm("Tem certeza que deseja remover este serviço?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/servicos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Se deu certo, tiramos o serviço da tela
      if (res.ok) {
        setServicos((prev) => prev.filter((s) => s.id !== id));
      } else {
        console.error("Erro ao remover serviço.");
      }
    } catch (err) {
      console.error("Erro ao remover:", err);
    }
  };

  // Quando clica no botão de editar, colocamos o serviço no formulário e rolamos até lá
  const editarServico = (servico: Service) => {
    setServicoEditado(servico);
    formRef.current?.scrollIntoView({ behavior: "smooth" }); // Faz a página rolar com suavidade até o formulário
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Serviços Cadastrados</h1>

      {/* Formulário de adicionar ou editar serviço */}
      <div ref={formRef}>
        <ServiceFormUnificado
          // Se estiver editando, manda os dados do serviço para o formulário
          servicoEditado={
            servicoEditado && {
              nome: servicoEditado.nome,
              cargo: servicoEditado.cargo || "",
              whatsapp: servicoEditado.whatsapp || "",
              imagem: servicoEditado.imagem || "",
              descricao: servicoEditado.descricao || "",
              especialidade_id: String(
                (servicoEditado as any).especialidade_id ?? ""
              ),
            }
          }
          onServicoAdicionado={carregarServicos} // Depois de adicionar ou editar, recarrega a lista
          onLimparEdicao={() => setServicoEditado(null)} // Se clicar pra cancelar edição
        />
      </div>

      {/* Se ainda estiver carregando, mostra texto. Senão, mostra os cartões dos serviços */}
      {loading ? (
        <p className="mt-6">Carregando serviços...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          {servicos.map((servico) => (
            <ServiceCard
              key={servico.id}
              servico={servico}
              onRemover={removerServico} // Botão de remover
              onEditar={editarServico} // Botão de editar
            />
          ))}
        </div>
      )}
    </div>
  );
}
