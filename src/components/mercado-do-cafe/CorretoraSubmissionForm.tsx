"use client";

// src/components/mercado-do-cafe/CorretoraSubmissionForm.tsx
//
// Form público de cadastro de corretora. Redesenhado para usar a mesma
// linguagem visual do painel da corretora (Sala Reservada) — paleta
// stone/amber/emerald, PanelCard por seção, kickers uppercase tracked,
// botão espresso — mas permanecendo em contexto claro (site público).
//
// Mudança de fluxo: agora coleta e-mail obrigatório + senha + confirmação.
// O e-mail vira chave de login. O backend bcrypta a senha no submit e,
// quando o admin aprova, cria o corretora_users com aquele hash e envia
// e-mail "aprovada". Sem mais convite manual por e-mail para cadastros
// vindos deste form.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { PanelCard } from "@/components/painel-corretora/PanelCard";
import type { CorretoraSubmissionFormData } from "@/types/corretora";

const CONTACT_FIELDS = [
  "phone",
  "whatsapp",
  "email",
  "website",
  "instagram",
  "facebook",
] as const;

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.02] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/40";
const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600";
const errorClass = "mt-1.5 text-[11px] font-medium text-red-700";

export function CorretoraSubmissionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<CorretoraSubmissionFormData>({
    defaultValues: {
      name: "",
      contact_name: "",
      description: "",
      city: "",
      state: "MG",
      region: "Zona da Mata",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      instagram: "",
      facebook: "",
      senha: "",
      senha_confirmacao: "",
    },
  });

  const senhaValue = watch("senha");

  const onSubmit = async (data: CorretoraSubmissionFormData) => {
    // Double-check local das senhas — o backend também valida.
    if (data.senha !== data.senha_confirmacao) {
      setError("senha_confirmacao", {
        message: "As senhas não coincidem.",
      });
      return;
    }

    // Pelo menos um contato. O email agora é required pelo backend
    // via schema, mas mantemos a checagem client para UX.
    const hasContact = CONTACT_FIELDS.some((f) => data[f]?.trim());
    if (!hasContact) {
      setError("email", {
        message: "Informe ao menos um meio de contato.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim()) {
          formData.append(key, value.trim());
        }
      });
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await apiClient.post("/api/public/corretoras/submit", formData);
      toast.success("Cadastro enviado com sucesso!");
      router.push("/mercado-do-cafe/corretoras/cadastro/sucesso");
    } catch (err) {
      toast.error(
        formatApiError(err, "Erro ao enviar cadastro. Tente novamente.")
          .message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
      {/* Seção: Dados da empresa */}
      <PanelCard density="spacious">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Dados da empresa
          </p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">
            Como sua corretora aparece no Mercado do Café
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>Nome da empresa *</label>
            <input
              {...register("name", {
                required: "Nome da empresa é obrigatório.",
                minLength: { value: 3, message: "Mínimo 3 caracteres." },
              })}
              className={inputClass}
              placeholder="Ex: Café Corretora Manhuaçu"
            />
            {errors.name && (
              <p className={errorClass}>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Nome do responsável *</label>
            <input
              {...register("contact_name", {
                required: "Nome do responsável é obrigatório.",
                minLength: { value: 3, message: "Mínimo 3 caracteres." },
              })}
              className={inputClass}
              placeholder="Ex: João Silva"
            />
            {errors.contact_name && (
              <p className={errorClass}>{errors.contact_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Cidade *</label>
              <input
                {...register("city", {
                  required: "Cidade é obrigatória.",
                  minLength: { value: 2, message: "Mínimo 2 caracteres." },
                })}
                className={inputClass}
                placeholder="Manhuaçu"
              />
              {errors.city && (
                <p className={errorClass}>{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Estado *</label>
              <input
                {...register("state", {
                  required: "Estado é obrigatório.",
                  minLength: { value: 2, message: "Sigla de 2 letras." },
                  maxLength: { value: 2, message: "Sigla de 2 letras." },
                })}
                className={`${inputClass} uppercase`}
                placeholder="MG"
                maxLength={2}
              />
              {errors.state && (
                <p className={errorClass}>{errors.state.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Região</label>
            <input
              {...register("region")}
              className={inputClass}
              placeholder="Ex: Zona da Mata"
            />
          </div>

          <div>
            <label className={labelClass}>Sobre a empresa</label>
            <textarea
              {...register("description", {
                maxLength: {
                  value: 2000,
                  message: "Máximo 2000 caracteres.",
                },
              })}
              rows={4}
              className={inputClass}
              placeholder="Conte brevemente sobre sua atuação, tipos de café que negocia, diferenciais..."
            />
            {errors.description && (
              <p className={errorClass}>{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Logo da empresa</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer text-sm text-stone-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.1em] file:text-stone-700 hover:file:bg-stone-200"
            />
            <p className="mt-1.5 text-[11px] text-stone-500">
              Opcional. JPEG, PNG ou WebP. Máximo 2MB.
            </p>
          </div>
        </div>
      </PanelCard>

      {/* Seção: Canais de contato */}
      <PanelCard density="spacious">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Canais de contato
          </p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">
            Como produtores podem encontrar você
          </h2>
          <p className="mt-1 text-[11px] text-stone-500">
            O e-mail também será usado como seu login no painel. Informe pelo
            menos um meio de contato adicional (WhatsApp, telefone etc.).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>E-mail *</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register("email", {
                required: "E-mail é obrigatório.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "E-mail inválido.",
                },
              })}
              className={inputClass}
              placeholder="contato@corretora.com.br"
            />
            {errors.email && (
              <p className={errorClass}>{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>WhatsApp</label>
            <input
              {...register("whatsapp")}
              className={inputClass}
              placeholder="(33) 9 9999-9999"
            />
          </div>

          <div>
            <label className={labelClass}>Telefone</label>
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="(33) 3333-3333"
            />
          </div>

          <div>
            <label className={labelClass}>Site</label>
            <input
              {...register("website")}
              className={inputClass}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className={labelClass}>Instagram</label>
            <input
              {...register("instagram")}
              className={inputClass}
              placeholder="@suacorretora"
            />
          </div>

          <div>
            <label className={labelClass}>Facebook</label>
            <input
              {...register("facebook")}
              className={inputClass}
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>
      </PanelCard>

      {/* Seção: Credenciais de acesso */}
      <PanelCard density="spacious">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Credenciais de acesso
          </p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">
            Crie sua senha agora
          </h2>
          <p className="mt-1 text-[11px] text-stone-500">
            Assim que seu cadastro for aprovado, você entra no painel com o
            e-mail acima e a senha que definir aqui — sem precisar de link
            externo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Senha *</label>
            <input
              type="password"
              autoComplete="new-password"
              {...register("senha", {
                required: "Senha é obrigatória.",
                minLength: {
                  value: 8,
                  message: "Mínimo 8 caracteres.",
                },
                maxLength: {
                  value: 200,
                  message: "Máximo 200 caracteres.",
                },
              })}
              className={inputClass}
              placeholder="Pelo menos 8 caracteres"
            />
            {errors.senha && (
              <p className={errorClass}>{errors.senha.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Confirmar senha *</label>
            <input
              type="password"
              autoComplete="new-password"
              {...register("senha_confirmacao", {
                required: "Confirmação é obrigatória.",
                validate: (value) =>
                  value === senhaValue || "As senhas não coincidem.",
              })}
              className={inputClass}
              placeholder="Repita a senha"
            />
            {errors.senha_confirmacao && (
              <p className={errorClass}>
                {errors.senha_confirmacao.message}
              </p>
            )}
          </div>
        </div>
      </PanelCard>

      {/* Action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-stone-500">
          Ao enviar, você concorda em passar pela análise da equipe antes da
          publicação.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="group relative overflow-hidden rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-colors hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
          <span className="relative">
            {submitting ? "Enviando..." : "Enviar cadastro"}
          </span>
        </button>
      </div>
    </form>
  );
}
