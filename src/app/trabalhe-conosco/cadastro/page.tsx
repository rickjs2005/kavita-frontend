"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
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
  email: string;
  especialidade_id: string;
  descricao: string;
};

export default function CadastroColaboradorPage() {
  const [form, setForm] = useState<FormState>({
    nome: "",
    cargo: "",
    whatsapp: "",
    email: "",
    especialidade_id: "",
    descricao: "",
  });

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

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
        toast.error(
          "Erro ao carregar especialidades. Tente novamente mais tarde."
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

  function handleImagemChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImagemFile(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setImagemPreview(url);
    } else {
      setImagemPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.nome || !form.whatsapp || !form.email || !form.especialidade_id) {
      const msg =
        "Preencha pelo menos nome, WhatsApp, e-mail e especialidade para enviar o cadastro.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("nome", form.nome.trim());
      formData.append("cargo", form.cargo.trim());
      formData.append("whatsapp", form.whatsapp.trim());
      formData.append("email", form.email.trim());
      formData.append("descricao", form.descricao.trim());
      formData.append("especialidade_id", form.especialidade_id);

      if (imagemFile) {
        formData.append("imagem", imagemFile);
      }

      const res = await fetch(
        `${API_URL}/api/admin/colaboradores/public`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao enviar cadastro.");
      }

      const okMsg =
        "Cadastro enviado com sucesso! A equipe da Kavita vai analisar seus dados e, se aprovado, você receberá um e-mail de confirmação.";
      setSuccessMessage(okMsg);
      toast.success("Cadastro enviado para análise com sucesso!");

      setForm({
        nome: "",
        cargo: "",
        whatsapp: "",
        email: "",
        especialidade_id: "",
        descricao: "",
      });
      setImagemFile(null);
      setImagemPreview(null);
    } catch (err: any) {
      console.error(err);
      const msg =
        err.message || "Erro ao enviar cadastro. Tente novamente.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="bg-gradient-to-b from-[#083E46] via-[#0b4f56] to-slate-950">
        {/* AGORA TUDO USA A MESMA LARGURA DO CARD (max-w-3xl) */}
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
          {/* Header + breadcrumb centralizado dentro de max-w-2xl */}
          <header className="w-full">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-2 text-xs text-emerald-100/80 sm:text-sm">
                <Link
                  href="/trabalhe-conosco"
                  className="font-medium hover:underline"
                >
                  Trabalhe com a Kavita
                </Link>{" "}
                <span className="text-emerald-100/60">
                  / Cadastro de prestador
                </span>
              </p>
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
                Cadastro de prestador de serviços
              </h1>
              <p className="mt-3 text-sm text-emerald-50/90 sm:text-base">
                Preencha seus dados para entrar na fila de análise. Depois de
                aprovado, seu perfil passa a aparecer na página de serviços
                da Kavita e produtores poderão encontrar você com facilidade.
              </p>
            </div>
          </header>

          {/* Card do formulário (mesma largura do container) */}
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

              {/* E-mail + WhatsApp */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormattedInput
                  label="E-mail profissional*"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange as any}
                  placeholder="seuemail@exemplo.com"
                  required
                  helperText="Usaremos esse e-mail para avisar quando seu cadastro for aprovado."
                />

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
              </div>

              {/* Upload de foto de perfil */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Foto de perfil
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagemChange}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
                />
                <span className="text-xs text-gray-500">
                  Use uma foto nítida, de preferência com fundo simples.
                </span>

                {imagemPreview && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagemPreview}
                        alt="Pré-visualização da foto de perfil"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Pré-visualização da foto que será enviada.
                    </p>
                  </div>
                )}
              </div>

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
