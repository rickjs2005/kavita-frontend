"use client";

// src/app/painel/corretora/perfil/ProfileClient.tsx
//
// Edição dos campos editáveis do perfil pela própria corretora.
// name/city/state/logo continuam sendo responsabilidade do admin.

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
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
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
const errorClass = "mt-1 text-xs text-rose-600";

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corretora, setCorretora] = useState<CorretoraAdmin | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
        const data =
          await apiClient.get<CorretoraAdmin>("/api/corretora/profile");
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
      toast.success("Perfil atualizado.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao salvar.").message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        Carregando perfil...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Meu perfil</h2>
        <p className="text-sm text-zinc-500">
          Edite os canais de contato e a descrição pública da sua corretora.
        </p>
      </section>

      {corretora && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          <p>
            <strong className="text-zinc-900">{corretora.name}</strong> — 📍{" "}
            {corretora.city}, {corretora.state}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Para alterar nome, cidade ou logo, fale com o administrador.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5"
      >
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-zinc-900">
            Informações principais
          </legend>

          <div>
            <label className={labelClass}>Responsável pelo contato *</label>
            <input
              {...register("contact_name", {
                required: "Nome do responsável é obrigatório.",
                minLength: { value: 3, message: "Mínimo 3 caracteres." },
              })}
              className={inputClass}
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
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-zinc-900">
            Canais de contato
          </legend>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </fieldset>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
