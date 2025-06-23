import { useEffect, useState } from "react";

// Define o tipo do serviço com colaborador incluído
export interface ServicoPublico {
  id: number;
  nome: string;
  cargo: string;
  whatsapp: string;
  imagem: string;
  descricao: string;
  especialidade_nome: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Hook para buscar serviços públicos
export const useFetchServicos = () => {
  const [servicos, setServicos] = useState<ServicoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServicos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/servicos`);
        const data = await res.json();
        setServicos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar serviços públicos:", err);
        setError("Erro ao buscar serviços.");
      } finally {
        setLoading(false);
      }
    };

    fetchServicos();
  }, []);

  return { servicos, loading, error };
};
