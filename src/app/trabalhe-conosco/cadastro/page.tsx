"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FormattedInput } from "@/components/layout/FormattedInput";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Especialidade = {
  id: number;
  nome: string;
};

type FormState = {
  nome: string;
  cargo: string;
  whatsapp: string;
  especialidade_id: string;
  descricao: string;
};

export default function CadastroColaboradorPage() {
  const [form, setForm] = useState<FormState>({
    nome: "",
    cargo: "",
    whatsapp: "",
    especialidade_id: "",
    descricao: "",
  });

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Carrega especialidades pela rota pública
  useEffect(() => {
    async function loadEspecialidades() {
      try {
        const res = await fetch(
          `${API_URL}/api/admin/especialidades/public`,
        );

        if (!res.ok) {
          throw new Error("Erro ao buscar especialidades");
        }

        const data = await res.json();
        setEspecialidades(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErrorMessage(
          "Não foi possível carregar a lista de especialidades. Tente novamente mais tarde."
        );
      } finally {
        setLoadingEspecialidades(false);
      }
    }

    loadEspecialidades();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.nome || !form.whatsapp || !form.especialidade_id) {
      setErrorMessage(
        "Preencha pelo menos nome, WhatsApp e especialidade para enviar o cadastro."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `${API_URL}/api/admin/colaboradores/public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            cargo: form.cargo.trim() || null,
            whatsapp: form.whatsapp.trim(),
            descricao: form.descricao.trim() || null,
            especialidade_id: Number(form.especialidade_id),
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao enviar cadastro.");
      }

      setSuccessMessage(
        "Cadastro enviado com sucesso! A equipe da Kavita vai analisar seus dados e liberar seu perfil na plataforma."
      );

      setForm({
        nome: "",
        cargo: "",
        whatsapp: "",
        especialidade_id: "",
        descricao: "",
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "Erro ao enviar cadastro. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="bg-gradient-to-b from-[#083E46] via-[#0b4f56] to-slate-950">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
          {/* Header + breadcrumb */}
          <header className="space-y-2 text-center sm:text-left">
            <p className="text-xs text-emerald-100/80">
              <Link
                href="/trabalhe-conosco"
                className="hover:underline"
              >
                Trabalhe com a Kavita
              </Link>{" "}
              / Cadastro de prestador
            </p>
            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              Cadastro de prestador de serviços
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-emerald-50/90 sm:text-base">
              Preencha seus dados para entrar na fila de análise. Depois
              de aprovado, seu perfil passa a aparecer na página de
              serviços da Kavita e produtores poderão encontrar você com
              facilidade.
            </p>
          </header>

          {/* Card do formulário */}
          <div className="w-full rounded-2xl bg-white/95 p-4 text-slate-900 shadow-xl sm:p-6 lg:p-7">
            {successMessage && (
              <div className="mb-4 rounded-xl border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 sm:space-y-6"
            >
              {/* Nome + Cargo */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormattedInput
                  label="Nome completo*"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange as any}
                  placeholder="Ex: João da Silva"
                  required
                />

                <FormattedInput
                  label="Função / Cargo"
                  name="cargo"
                  value={form.cargo}
                  onChange={handleChange as any}
                  placeholder="Ex: Médico veterinário, Agrônomo, Mecânico..."
                />
              </div>

              {/* WhatsApp */}
              <FormattedInput
                label="WhatsApp para contato*"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange as any}
                mask="telefone"
                placeholder="(00) 00000-0000"
                required
                helperText="Esse número será usado para contato dos produtores."
              />

              {/* Especialidade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Especialidade principal*
                </label>

                {loadingEspecialidades ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    Carregando especialidades...
                  </div>
                ) : (
                  <select
                    name="especialidade_id"
                    value={form.especialidade_id}
                    onChange={handleChange}
                    className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EC5B20]"
                    required
                  >
                    <option value="">Selecione uma opção</option>
                    {especialidades.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                )}

                <span className="text-xs text-gray-500">
                  Ex: Veterinário de grandes animais, Agrônomo de café,
                  Mecânico de máquinas agrícolas...
                </span>
              </div>

              {/* Descrição / regiões */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Fale um pouco sobre seu trabalho e regiões que atende
                </label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EC5B20]"
                  rows={4}
                  placeholder="Ex: Atendo fazendas num raio de 80km de Manhuaçu/MG, com foco em bovinos de leite e manejo de pastagens."
                />
              </div>

              <p className="text-xs text-gray-500">
                *Seu cadastro passa por uma análise simples para manter a
                qualidade da rede. Você poderá ser contatado pela equipe
                da Kavita para confirmar algumas informações.
              </p>

              {/* Footer do formulário */}
              <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#EC5B20] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#d44c19] disabled:opacity-60 sm:w-auto"
                >
                  {submitting
                    ? "Enviando cadastro..."
                    : "Enviar cadastro para análise"}
                </button>

                <Link
                  href="/trabalhe-conosco"
                  className="text-center text-xs text-gray-500 hover:text-gray-700 hover:underline sm:text-right"
                >
                  Voltar para informações sobre a rede de serviços
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
