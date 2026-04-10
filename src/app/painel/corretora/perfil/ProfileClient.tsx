"use client";

// src/app/painel/corretora/perfil/ProfileClient.tsx

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { PanelCard } from "@/components/painel-corretora/PanelCard";
import type { CorretoraAdmin } from "@/types/corretora";

type ProfileFormData = {
  contact_name: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
};

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

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corretora, setCorretora] = useState<CorretoraAdmin | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setError,
  } = useForm<ProfileFormData>({
    defaultValues: {
      contact_name: "",
      description: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      instagram: "",
      facebook: "",
    },
  });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await apiClient.get<CorretoraAdmin>(
          "/api/corretora/profile",
        );
        if (ignore) return;
        setCorretora(data);
        reset({
          contact_name: data.contact_name ?? "",
          description: data.description ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          email: data.email ?? "",
          website: data.website ?? "",
          instagram: data.instagram ?? "",
          facebook: data.facebook ?? "",
        });
      } catch (err) {
        toast.error(formatApiError(err, "Erro ao carregar perfil.").message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    const hasContact = CONTACT_FIELDS.some((f) => data[f]?.trim());
    if (!hasContact) {
      setError("phone", {
        message:
          "Informe pelo menos um meio de contato (telefone, WhatsApp, e-mail, site, Instagram ou Facebook).",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(data)) {
        payload[k] = v?.trim() ? v.trim() : null;
      }
      const updated = await apiClient.put<CorretoraAdmin>(
        "/api/corretora/profile",
        payload,
      );
      setCorretora(updated);
      reset(data); // limpa isDirty
      toast.success("Perfil atualizado.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao salvar.").message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PanelCard density="spacious" className="text-center">
        <p className="text-xs font-medium text-stone-500">
          Carregando perfil...
        </p>
      </PanelCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Identidade
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
          Meu perfil
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Edite os canais de contato e a descrição pública da sua corretora.
        </p>
      </div>

      {/* Context banner */}
      {corretora && (
        <PanelCard density="compact" className="bg-amber-50/40">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800"
            >
              i
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-900">
                {corretora.name}{" "}
                <span className="font-normal text-stone-500">
                  · {corretora.city}, {corretora.state}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600">
                Para alterar o nome da empresa, cidade ou a logo, entre em
                contato com o administrador do Kavita.
              </p>
            </div>
          </div>
        </PanelCard>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção: Informações principais */}
        <PanelCard density="spacious">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Informações principais
            </p>
            <h2 className="mt-1 text-base font-semibold text-stone-900">
              Como você aparece para o produtor
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>Responsável pelo contato *</label>
              <input
                {...register("contact_name", {
                  required: "Nome do responsável é obrigatório.",
                  minLength: { value: 3, message: "Mínimo 3 caracteres." },
                })}
                className={inputClass}
                placeholder="Nome completo"
              />
              {errors.contact_name && (
                <p className={errorClass}>{errors.contact_name.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Descrição pública</label>
              <textarea
                {...register("description", {
                  maxLength: {
                    value: 2000,
                    message: "Máximo 2000 caracteres.",
                  },
                })}
                rows={4}
                className={inputClass}
                placeholder="Conte em poucas linhas o que a corretora oferece, em que tipo de café atua, cidades onde compra..."
              />
              {errors.description && (
                <p className={errorClass}>{errors.description.message}</p>
              )}
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
              Como o produtor pode te encontrar
            </h2>
            <p className="mt-1 text-[11px] text-stone-500">
              Informe pelo menos um canal. Deixe em branco os que você não usa.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                {...register("phone")}
                className={inputClass}
                placeholder="(33) 9 9999-9999"
              />
              {errors.phone && (
                <p className={errorClass}>{errors.phone.message}</p>
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
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                {...register("email")}
                className={inputClass}
                placeholder="contato@corretora.com.br"
              />
              {errors.email && (
                <p className={errorClass}>{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Site</label>
              <input
                {...register("website")}
                className={inputClass}
                placeholder="https://..."
              />
              {errors.website && (
                <p className={errorClass}>{errors.website.message}</p>
              )}
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

        {/* Action row */}
        <div className="flex items-center justify-end gap-3">
          {isDirty && (
            <span className="text-[11px] font-medium text-stone-500">
              Alterações não salvas
            </span>
          )}
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="group relative overflow-hidden rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-colors hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
            <span className="relative">
              {saving ? "Salvando..." : "Salvar alterações"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
