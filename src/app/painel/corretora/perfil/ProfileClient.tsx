"use client";

// src/app/painel/corretora/perfil/ProfileClient.tsx

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { PanelCard } from "@/components/painel-corretora/PanelCard";
import type { CorretoraAdmin, PerfilCompra } from "@/types/corretora";
import {
  CIDADES_ZONA_DA_MATA,
  TIPOS_CAFE,
  type TipoCafe,
} from "@/lib/regioes";

// Tipos de café editáveis (exclui "ainda_nao_sei" que é só para lead público).
const TIPOS_CAFE_EDITAVEIS = TIPOS_CAFE.filter(
  (t) => t.value !== "ainda_nao_sei",
);

const PERFIS_COMPRA: { value: PerfilCompra; label: string; desc: string }[] = [
  { value: "compra", label: "Só compra", desc: "Busca café para comprar" },
  { value: "venda", label: "Só venda", desc: "Vende café do produtor" },
  { value: "ambos", label: "Compra e venda", desc: "Atua nos dois lados" },
];

type ProfileFormData = {
  contact_name: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  // Regionalização (Sprint 2.3)
  cidades_atendidas: string[];
  tipos_cafe: TipoCafe[];
  perfil_compra: PerfilCompra | "";
  horario_atendimento: string;
  anos_atuacao: string; // string no form, convertido para number no submit
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
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.02] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40";
const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600";
const errorClass = "mt-1.5 text-[11px] font-medium text-red-700";

/**
 * Normaliza o campo JSON do backend. Depending on MySQL driver, pode
 * vir como array já parseado OU string JSON. Retorna array vazio em
 * qualquer outro caso para simplificar uso no form.
 */
function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((v) => typeof v === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [corretora, setCorretora] = useState<CorretoraAdmin | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
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
      cidades_atendidas: [],
      tipos_cafe: [],
      perfil_compra: "",
      horario_atendimento: "",
      anos_atuacao: "",
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

        // Parse de JSON fields — backend retorna array OU string JSON
        // (depende do driver MySQL). Normalizamos para array.
        const cidadesAtendidas = parseJsonArray(data.cidades_atendidas);
        const tiposCafe = parseJsonArray(data.tipos_cafe) as TipoCafe[];

        reset({
          contact_name: data.contact_name ?? "",
          description: data.description ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          email: data.email ?? "",
          website: data.website ?? "",
          instagram: data.instagram ?? "",
          facebook: data.facebook ?? "",
          cidades_atendidas: cidadesAtendidas,
          tipos_cafe: tiposCafe,
          perfil_compra: data.perfil_compra ?? "",
          horario_atendimento: data.horario_atendimento ?? "",
          anos_atuacao:
            data.anos_atuacao != null ? String(data.anos_atuacao) : "",
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
      // Strings: trim + null-se-vazio. Arrays: passam direto.
      // Anos_atuacao: converte para número ou null.
      const payload: Record<string, unknown> = {
        contact_name: data.contact_name?.trim() || null,
        description: data.description?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        email: data.email?.trim() || null,
        website: data.website?.trim() || null,
        instagram: data.instagram?.trim() || null,
        facebook: data.facebook?.trim() || null,
        cidades_atendidas:
          data.cidades_atendidas.length > 0 ? data.cidades_atendidas : null,
        tipos_cafe: data.tipos_cafe.length > 0 ? data.tipos_cafe : null,
        perfil_compra: data.perfil_compra || null,
        horario_atendimento: data.horario_atendimento?.trim() || null,
        anos_atuacao: data.anos_atuacao
          ? Number(data.anos_atuacao)
          : null,
      };

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
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
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

        {/* Seção: Atendimento regional (Sprint 2.3) */}
        <PanelCard density="spacious">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Atendimento regional
            </p>
            <h2 className="mt-1 text-base font-semibold text-stone-900">
              Onde e como você atua
            </h2>
            <p className="mt-1 text-[11px] text-stone-500">
              Produtores filtram por cidade e tipo de café. Quanto mais
              completo, melhor sua exposição na Zona da Mata.
            </p>
          </div>

          <div className="space-y-6">
            {/* Cidades atendidas (multi-select checkboxes) */}
            <div>
              <label className={labelClass}>Cidades atendidas</label>
              <p className="-mt-1 mb-2.5 text-[11px] text-stone-500">
                Marque todas as cidades da Zona da Mata onde você compra ou
                vende café.
              </p>
              <Controller
                control={control}
                name="cidades_atendidas"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CIDADES_ZONA_DA_MATA.map((cidade) => {
                      const checked = field.value.includes(cidade.slug);
                      return (
                        <label
                          key={cidade.slug}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm transition-colors hover:border-amber-400/40 hover:bg-amber-50/30 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([
                                  ...field.value,
                                  cidade.slug,
                                ]);
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (v: string) => v !== cidade.slug,
                                  ),
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="flex-1 text-stone-800">
                            {cidade.nome}
                          </span>
                          {cidade.destaque && (
                            <span
                              aria-label="Cidade-bandeira"
                              className="h-1.5 w-1.5 rounded-full bg-amber-500"
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* Tipos de café (chips multi-select) */}
            <div>
              <label className={labelClass}>Tipos de café que você trabalha</label>
              <Controller
                control={control}
                name="tipos_cafe"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_CAFE_EDITAVEIS.map((tipo) => {
                      const checked = field.value.includes(
                        tipo.value as TipoCafe,
                      );
                      return (
                        <label key={tipo.value} className="cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([
                                  ...field.value,
                                  tipo.value,
                                ]);
                              } else {
                                field.onChange(
                                  field.value.filter(
                                    (v: TipoCafe) => v !== tipo.value,
                                  ),
                                );
                              }
                            }}
                            className="peer sr-only"
                          />
                          <span className="inline-block rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 transition-all hover:border-amber-400/40 peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-900">
                            {tipo.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* Perfil de compra (radio) */}
            <div>
              <label className={labelClass}>Perfil comercial</label>
              <Controller
                control={control}
                name="perfil_compra"
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {PERFIS_COMPRA.map((perfil) => {
                      const checked = field.value === perfil.value;
                      return (
                        <label
                          key={perfil.value}
                          className="cursor-pointer"
                        >
                          <input
                            type="radio"
                            value={perfil.value}
                            checked={checked}
                            onChange={() => field.onChange(perfil.value)}
                            className="peer sr-only"
                          />
                          <span className="block rounded-xl border border-stone-200 bg-white p-3 text-left transition-all hover:border-amber-400/40 peer-checked:border-amber-500 peer-checked:bg-amber-50">
                            <span className="block text-sm font-semibold text-stone-900 peer-checked:text-amber-900">
                              {perfil.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-stone-500">
                              {perfil.desc}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* Horário + anos de atuação — 2 colunas */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Horário de atendimento</label>
                <input
                  {...register("horario_atendimento", {
                    maxLength: {
                      value: 120,
                      message: "Máximo 120 caracteres.",
                    },
                  })}
                  className={inputClass}
                  placeholder="Seg a Sex · 7h às 17h"
                />
                {errors.horario_atendimento && (
                  <p className={errorClass}>
                    {errors.horario_atendimento.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Anos de atuação</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  {...register("anos_atuacao", {
                    min: { value: 0, message: "Valor inválido." },
                    max: { value: 120, message: "Valor inválido." },
                  })}
                  className={inputClass}
                  placeholder="Ex: 12"
                />
                {errors.anos_atuacao && (
                  <p className={errorClass}>
                    {errors.anos_atuacao.message}
                  </p>
                )}
              </div>
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
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-colors hover:from-amber-400 hover:to-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
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
