// src/components/admin/mercado-do-cafe/corretoras/CorretoraForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import type { CorretoraAdmin } from "@/types/corretora";

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
  const isEdit = !!existing;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
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
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
  const labelClass = "block text-xs font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          </div>
          <div>
            <label className={labelClass}>Cidade *</label>
            <input {...register("city", { required: "Obrigatório" })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Estado *</label>
            <input {...register("state", { required: "Obrigatório" })} className={inputClass} maxLength={2} />
          </div>
          <div>
            <label className={labelClass}>Região</label>
            <input {...register("region")} className={inputClass} />
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
        </div>
      </div>

      {/* Canais */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-100">Canais de contato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input {...register("whatsapp")} className={inputClass} placeholder="(33) 99999-0000" />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input {...register("phone")} className={inputClass} placeholder="(33) 3331-0000" />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input {...register("email")} className={inputClass} type="email" />
          </div>
          <div>
            <label className={labelClass}>Site</label>
            <input {...register("website")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input {...register("instagram")} className={inputClass} placeholder="@empresa" />
          </div>
          <div>
            <label className={labelClass}>Facebook</label>
            <input {...register("facebook")} className={inputClass} />
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
