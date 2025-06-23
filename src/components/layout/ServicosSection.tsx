"use client"; // Componente renderizado no cliente

import { useEffect, useState, useRef } from "react";

// Interface local para o tipo do serviço recebido da API
interface Servico {
  id: number;
  nome: string;
  cargo: string;
  whatsapp: string;
  imagem: string;
  descricao: string;
  especialidade_nome: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL; // URL base da API

// Componente que exibe a seção de serviços em carrossel horizontal
export default function ServicosSection() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null); // Referência do container para scroll horizontal

  // Carrega os serviços da API ao montar o componente
  useEffect(() => {
    const fetchServicos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/servicos`);
        const data = await res.json();
        setServicos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicos();
  }, []);

  // Função para rolar horizontalmente os cards
  const scroll = (offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += offset;
    }
  };

  // Se estiver carregando ou não houver dados, não exibe nada
  if (loading || servicos.length === 0) return null;

  return (
    <section className="px-4 md:px-10 mb-16">
      {/* Título da seção */}
      <h2 className="text-2xl font-bold text-[#359293] mb-2">Serviços Oferecidos</h2>
      <p className="text-sm text-gray-600 mb-6">
        Esses são alguns dos serviços oferecidos para nossos clientes, com atendimento técnico especializado.
      </p>

      {/* Carrossel com botões de navegação lateral */}
      <div className="relative">

        {/* Botão de scroll para esquerda */}
        <button
          onClick={() => scroll(-300)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full z-10 hover:bg-gray-100"
        >
          ◀
        </button>

        {/* Lista horizontal de cartões de serviços */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-6"
        >
          {servicos.map((s) => (
            <div
              key={s.id}
              className="min-w-[270px] max-w-[270px] flex-shrink-0 bg-white shadow rounded-xl p-4 flex flex-col justify-between"
            >
              <img src={s.imagem} alt={s.nome} className="h-40 w-full object-cover rounded mb-3" />
              <h3 className="text-md font-semibold text-gray-800">{s.nome}</h3>
              <p className="text-sm text-gray-500 mb-1">{s.cargo}</p>
              <p className="text-sm text-gray-600 mb-2">{s.descricao}</p>
              <p className="text-sm text-gray-400 italic mb-2">Especialidade: {s.especialidade_nome}</p>
              <a
                href={`https://wa.me/${s.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-600 text-sm hover:underline mt-auto"
              >
                Falar no WhatsApp
              </a>
            </div>
          ))}
        </div>

        {/* Botão de scroll para direita */}
        <button
          onClick={() => scroll(300)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full z-10 hover:bg-gray-100"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
// O componente ServicosSection exibe uma lista horizontal de serviços
// Carrega os dados de uma API e permite rolar horizontalmente pelos serviços