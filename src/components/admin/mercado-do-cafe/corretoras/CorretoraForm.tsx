// src/components/admin/mercado-do-cafe/corretoras/CorretoraForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import { formatApiError } from "@/lib/formatApiError";
import type { CorretoraAdmin } from "@/types/corretora";

// Shape do erro 400 do backend quando a validação Zod falha
// (middleware/validate.js emite { code: VALIDATION_ERROR,
// details: { fields: [{ field, message }] }}).
type FieldError = { field: string; message: string };
function extractFieldErrors(err: unknown): FieldError[] {
  if (!isApiError(err)) return [];
  const details = err.details as { fields?: FieldError[] } | null;
  if (!details || !Array.isArray(details.fields)) return [];
  return details.fields.filter(
    (f): f is FieldError =>
      !!f && typeof f.field === "string" && typeof f.message === "string",
  );
}

type FormValues = {
  name: string;
  contact_name: string;
  description: string;
  city: string;
  state: string;
  region: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  status: "active" | "inactive";
  is_featured: boolean;
  sort_order: number;
};

type Props = {
  existing?: CorretoraAdmin | null;
};

export default function CorretoraForm({ existing }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  // Erros não associados a um campo específico (ex: conflito de slug,
  // arquivo grande demais). Aparecem como banner acima do form.
  const [globalError, setGlobalError] = useState<string | null>(null);
  const isEdit = !!existing;

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: existing?.name ?? "",
      contact_name: existing?.contact_name ?? "",
      description: existing?.description ?? "",
      city: existing?.city ?? "",
      state: existing?.state ?? "MG",
      region: existing?.region ?? "Zona da Mata",
      phone: existing?.phone ?? "",
      whatsapp: existing?.whatsapp ?? "",
      email: existing?.email ?? "",
      website: existing?.website ?? "",
      instagram: existing?.instagram ?? "",
      facebook: existing?.facebook ?? "",
      status: existing?.status ?? "active",
      is_featured: !!(existing?.is_featured),
      sort_order: existing?.sort_order ?? 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setGlobalError(null);
    clearErrors();
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, String(value));
        }
      });
      if (logoFile) formData.append("logo", logoFile);

      if (isEdit) {
        await apiClient.put(`/api/admin/mercado-do-cafe/corretoras/${existing!.id}`, formData);
        toast.success("Corretora atualizada.");
      } else {
        await apiClient.post("/api/admin/mercado-do-cafe/corretoras", formData);
        toast.success("Corretora cadastrada.");
      }
      router.push("/admin/mercado-do-cafe");
    } catch (err) {
      const ui = formatApiError(err, "Erro ao salvar.");
      const fieldErrors = extractFieldErrors(err);

      // Pinta cada campo errado com a mensagem vinda do backend. Usa
      // type: "server" pra diferenciar dos erros de validação client-side.
      const paintedKeys = new Set<string>();
      for (const fe of fieldErrors) {
        // O backend pode devolver "path.subpath" — pegamos só o primeiro
        // segmento que casa com os campos conhecidos do form.
        const key = fe.field.split(".")[0] as keyof FormValues;
        if (key in data) {
          setError(key, { type: "server", message: fe.message });
          paintedKeys.add(key);
        }
      }

      // Banner acima do form com lista dos problemas — principalmente
      // útil quando o backend retornou erros em campos que não estão
      // visíveis na tela ou quando o erro é global (HTTP 409, 413 etc).
      if (fieldErrors.length > 0) {
        const orphan = fieldErrors.filter(
          (fe) => !paintedKeys.has(fe.field.split(".")[0] as keyof FormValues),
        );
        setGlobalError(
          orphan.length > 0
            ? `${ui.message} — corrija: ${orphan.map((o) => o.message).join("; ")}`
            : `${ui.message} Confira os campos em vermelho abaixo.`,
        );
      } else {
        setGlobalError(
          ui.requestId ? `${ui.message} (ref: ${ui.requestId})` : ui.message,
        );
      }

      toast.error(ui.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
  const labelClass = "block text-xs font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Banner de erro global — visível e acionável. Aparece quando o
          backend devolve um erro que não está associado a um campo
          individual (conflito, arquivo grande, falha transitória) ou
          como resumo quando há múltiplos campos inválidos. */}
      {globalError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-rose-500/40 bg-rose-500/[0.08] p-3.5 text-sm text-rose-100"
        >
          <div className="flex items-start gap-2.5">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-rose-300"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="min-w-0">
              <p className="font-semibold text-rose-100">
                Não foi possível salvar
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-rose-200/90">
                {globalError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dados da empresa */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-100">Dados da empresa</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nome da empresa *</label>
            <input {...register("name", { required: "Obrigatório" })} className={inputClass} />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Responsável *</label>
            <input {...register("contact_name", { required: "Obrigatório" })} className={inputClass} />
            {errors.contact_name && <p className="mt-1 text-xs text-rose-400">{errors.contact_name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Cidade *</label>
            <input {...register("city", { required: "Obrigatório" })} className={inputClass} />
            {errors.city && <p className="mt-1 text-xs text-rose-400">{errors.city.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Estado *</label>
            <input {...register("state", { required: "Obrigatório" })} className={inputClass} maxLength={2} />
            {errors.state && <p className="mt-1 text-xs text-rose-400">{errors.state.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Região</label>
            <input {...register("region")} className={inputClass} />
            {errors.region && <p className="mt-1 text-xs text-rose-400">{errors.region.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Logo</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-200 hover:file:bg-slate-700"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea {...register("description")} className={`${inputClass} min-h-[80px] resize-y`} />
          {errors.description && <p className="mt-1 text-xs text-rose-400">{errors.description.message}</p>}
        </div>
      </div>

      {/* Canais */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-100">Canais de contato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input {...register("whatsapp")} className={inputClass} placeholder="(33) 99999-0000" />
            {errors.whatsapp && <p className="mt-1 text-xs text-rose-400">{errors.whatsapp.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input {...register("phone")} className={inputClass} placeholder="(33) 3331-0000" />
            {errors.phone && <p className="mt-1 text-xs text-rose-400">{errors.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input {...register("email")} className={inputClass} type="email" />
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Site</label>
            <input {...register("website")} className={inputClass} placeholder="https://..." />
            {errors.website && <p className="mt-1 text-xs text-rose-400">{errors.website.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input {...register("instagram")} className={inputClass} placeholder="@empresa" />
            {errors.instagram && <p className="mt-1 text-xs text-rose-400">{errors.instagram.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Facebook</label>
            <input {...register("facebook")} className={inputClass} />
            {errors.facebook && <p className="mt-1 text-xs text-rose-400">{errors.facebook.message}</p>}
          </div>
        </div>
      </div>

      {/* Admin controls */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-100">Configurações</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select {...register("status")} className={inputClass}>
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              {...register("is_featured")}
              id="is_featured"
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="is_featured" className="text-sm text-slate-300">
              Destacar
            </label>
          </div>
          <div>
            <label className={labelClass}>Ordem</label>
            <input
              type="number"
              {...register("sort_order", { valueAsNumber: true })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Salvando..." : isEdit ? "Atualizar" : "Cadastrar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/mercado-do-cafe")}
          className="rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
