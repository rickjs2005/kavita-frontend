// src/components/mercado-do-cafe/CorretoraSubmissionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import type { CorretoraSubmissionFormData } from "@/types/corretora";

const CONTACT_FIELDS = ["phone", "whatsapp", "email", "website", "instagram", "facebook"] as const;

export function CorretoraSubmissionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
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
    },
  });

  const onSubmit = async (data: CorretoraSubmissionFormData) => {
    // Client-side: at least one contact
    const hasContact = CONTACT_FIELDS.some((f) => data[f]?.trim());
    if (!hasContact) {
      setError("phone", {
        message: "Informe pelo menos um meio de contato (telefone, WhatsApp, e-mail, site, Instagram ou Facebook).",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value?.trim()) formData.append(key, value.trim());
      });
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await apiClient.post("/api/public/corretoras/submit", formData);
      toast.success("Cadastro enviado com sucesso!");
      router.push("/mercado-do-cafe/corretoras/cadastro/sucesso");
    } catch (err: any) {
      const msg = err?.message || "Erro ao enviar cadastro. Tente novamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
  const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
  const errorClass = "mt-1 text-xs text-rose-600";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados da empresa */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-zinc-900">
          Dados da empresa
        </legend>

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
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cidade *</label>
            <input
              {...register("city", {
                required: "Cidade é obrigatória.",
                minLength: { value: 2, message: "Mínimo 2 caracteres." },
              })}
              className={inputClass}
              placeholder="Ex: Manhuaçu"
            />
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Estado *</label>
            <input
              {...register("state", {
                required: "Estado é obrigatório.",
                minLength: { value: 2, message: "Informe a sigla do estado." },
                maxLength: { value: 2, message: "Use a sigla do estado (2 letras)." },
              })}
              className={inputClass}
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
              maxLength: { value: 2000, message: "Máximo 2000 caracteres." },
            })}
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder="Descreva sua atuação, tipos de café que negocia, diferenciais..."
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
            className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Opcional. JPEG, PNG ou WebP. Máximo 2MB.
          </p>
        </div>
      </fieldset>

      {/* Canais de contato */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-zinc-900">
          Canais de contato
        </legend>
        <p className="text-sm text-zinc-500">
          Preencha pelo menos um canal para que os produtores possam entrar em contato.
        </p>

        {errors.phone && !errors.phone.types?.required && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {errors.phone.message}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>📱 WhatsApp</label>
            <input
              {...register("whatsapp")}
              className={inputClass}
              placeholder="(33) 99999-0000"
            />
          </div>
          <div>
            <label className={labelClass}>📞 Telefone</label>
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="(33) 3331-0000"
            />
          </div>
          <div>
            <label className={labelClass}>📧 E-mail</label>
            <input
              {...register("email")}
              className={inputClass}
              placeholder="contato@empresa.com"
              type="email"
            />
          </div>
          <div>
            <label className={labelClass}>🌐 Site</label>
            <input
              {...register("website")}
              className={inputClass}
              placeholder="https://www.empresa.com"
            />
          </div>
          <div>
            <label className={labelClass}>📷 Instagram</label>
            <input
              {...register("instagram")}
              className={inputClass}
              placeholder="@empresa"
            />
          </div>
          <div>
            <label className={labelClass}>📘 Facebook</label>
            <input
              {...register("facebook")}
              className={inputClass}
              placeholder="https://facebook.com/empresa"
            />
          </div>
        </div>
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Enviando..." : "Enviar cadastro"}
      </button>

      <p className="text-xs text-zinc-400 text-center">
        Seu cadastro será analisado pela nossa equipe antes de ser publicado.
      </p>
    </form>
  );
}
