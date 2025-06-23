"use client"; // Diz que esse código será executado no navegador (lado do cliente)

import { useEffect, useState } from "react";
import CustomButton from "@/components/buttons/CustomButton"; // Botão personalizado para salvar

// Estrutura dos dados do formulário (o que o serviço tem)
interface FormData {
  nome: string;
  cargo: string;
  whatsapp: string;
  imagem: string;
  descricao: string;
  especialidade_id: string;
}

// Estrutura de uma especialidade (ex: veterinário, agrônomo...)
interface Especialidade {
  id: number;
  nome: string;
}

// Informações que o componente precisa receber
interface Props {
  servicoEditado?: FormData | null; // Se for edição, recebemos os dados do serviço
  onServicoAdicionado: () => void; // Função chamada depois de cadastrar
  onLimparEdicao: () => void; // Função chamada para cancelar a edição
}

// Nosso componente principal
export default function ServiceFormUnificado({
  servicoEditado,
  onServicoAdicionado,
  onLimparEdicao,
}: Props) {
  // Estado que guarda os dados digitados no formulário
  const [form, setForm] = useState<FormData>({
    nome: "",
    cargo: "",
    whatsapp: "",
    imagem: "",
    descricao: "",
    especialidade_id: "",
  });

  // Lista de especialidades vindas do servidor
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  // Estados de carregamento e mensagens
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Se estivermos editando, preenchemos o formulário com os dados atuais
  useEffect(() => {
    if (servicoEditado) {
      setForm(servicoEditado);
    }
  }, [servicoEditado]);

  // Quando o formulário carrega, buscamos as especialidades do banco
  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("http://localhost:5000/api/admin/especialidades", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao buscar especialidades");
        const data = await res.json();
        setEspecialidades(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar especialidades:", err);
        setEspecialidades([]);
      }
    };

    fetchEspecialidades(); // Chama a função assim que carrega
  }, []);

  // Quando a pessoa digita em um campo, atualizamos o valor no estado
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Quando clicar no botão de salvar
  const handleSubmit = async () => {
    // Verificamos se os campos obrigatórios estão preenchidos
    if (!form.nome || !form.whatsapp || !form.especialidade_id) {
      setErro("Preencha os campos obrigatórios: nome, WhatsApp e especialidade.");
      return;
    }

    setErro("");
    setSucesso("");
    setIsLoading(true); // Começamos o carregamento

    try {
      const token = localStorage.getItem("adminToken");

      // Enviamos os dados para o servidor
      const res = await fetch("http://localhost:5000/api/admin/colaboradores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      // Se algo deu errado
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao cadastrar serviço.");
      }

      // Se deu certo, limpamos o formulário
      setForm({
        nome: "",
        cargo: "",
        whatsapp: "",
        imagem: "",
        descricao: "",
        especialidade_id: "",
      });

      setSucesso("Serviço cadastrado com sucesso!");
      onServicoAdicionado(); // Atualiza a lista na tela
      onLimparEdicao(); // Sai do modo de edição
    } catch (err: any) {
      console.error("Erro ao cadastrar:", err);
      setErro(err.message || "Erro ao cadastrar.");
    } finally {
      setIsLoading(false); // Finaliza o carregamento
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-4xl">
      <h2 className="text-xl font-bold mb-4">Cadastrar Serviço e Colaborador</h2>

      {/* Campos de texto do formulário */}
      {[
        { name: "nome", placeholder: "Nome do colaborador" },
        { name: "cargo", placeholder: "Cargo ou formação" },
        { name: "whatsapp", placeholder: "WhatsApp" },
        { name: "imagem", placeholder: "URL da imagem" },
      ].map((input) => (
        <input
          key={input.name}
          type="text"
          name={input.name}
          placeholder={input.placeholder}
          value={(form as any)[input.name]}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        />
      ))}

      {/* Campo de descrição */}
      <textarea
        name="descricao"
        placeholder="Descrição do serviço"
        value={form.descricao}
        onChange={handleChange}
        className="w-full mb-3 p-2 border rounded"
      />

      {/* Campo para escolher a especialidade */}
      <select
        name="especialidade_id"
        value={form.especialidade_id}
        onChange={handleChange}
        className="w-full mb-4 p-2 border rounded"
      >
        <option value="">Selecione a especialidade</option>
        {especialidades.map((esp) => (
          <option key={esp.id} value={esp.id}>
            {esp.nome}
          </option>
        ))}
      </select>

      {/* Botão de salvar */}
      <CustomButton
        label={servicoEditado ? "Salvar Alterações" : "Cadastrar"}
        onClick={handleSubmit}
        variant="primary"
        size="large"
        isLoading={isLoading}
        message={erro || sucesso} // Mostra mensagem de erro ou sucesso
      />
    </div>
  );
}
// Explicação do código:
// - O componente exibe um formulário para cadastrar ou editar serviços e colaboradores.