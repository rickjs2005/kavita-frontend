"use client";

// src/app/painel/corretora/perfil/ProfileClient.tsx

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { API_BASE } from "@/utils/absUrl";
import { ApiError } from "@/lib/errors";
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
  // Fase 8 — regionais adicionais
  endereco_textual: string;
  compra_cafe_especial: boolean;
  volume_minimo_sacas: string; // string no form
  faz_retirada_amostra: boolean;
  trabalha_exportacao: boolean;
  trabalha_cooperativas: boolean;
};

const CONTACT_FIELDS = [
  "phone",
  "whatsapp",
  "email",
  "website",
  "instagram",
  "facebook",
] as const;

// Em mobile, py-3 dá ~44px de altura efetiva (tap target WCAG). Em sm+
// voltamos pra py-2.5 compacto — telas grandes operam com cursor, não dedo.
const inputClass =
  "w-full rounded-xl border border-white/10 bg-stone-950 px-3.5 py-3 text-sm text-stone-100 placeholder:text-stone-500 shadow-sm transition-colors hover:bg-stone-950/80 focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/25 sm:py-2.5 [color-scheme:dark]";
const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400";
const errorClass = "mt-1.5 text-[11px] font-medium text-red-300";

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
      endereco_textual: "",
      compra_cafe_especial: false,
      volume_minimo_sacas: "",
      faz_retirada_amostra: false,
      trabalha_exportacao: false,
      trabalha_cooperativas: false,
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
          // Fase 8 — regionais adicionais (booleans podem vir como
          // 0/1 do MySQL; normaliza para boolean do form)
          endereco_textual: data.endereco_textual ?? "",
          compra_cafe_especial: Boolean(data.compra_cafe_especial),
          volume_minimo_sacas:
            data.volume_minimo_sacas != null
              ? String(data.volume_minimo_sacas)
              : "",
          faz_retirada_amostra: Boolean(data.faz_retirada_amostra),
          trabalha_exportacao: Boolean(data.trabalha_exportacao),
          trabalha_cooperativas: Boolean(data.trabalha_cooperativas),
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
        // Fase 8 — regionais adicionais
        endereco_textual: data.endereco_textual?.trim() || null,
        compra_cafe_especial: Boolean(data.compra_cafe_especial),
        volume_minimo_sacas: data.volume_minimo_sacas
          ? Number(data.volume_minimo_sacas)
          : null,
        faz_retirada_amostra: Boolean(data.faz_retirada_amostra),
        trabalha_exportacao: Boolean(data.trabalha_exportacao),
        trabalha_cooperativas: Boolean(data.trabalha_cooperativas),
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          Identidade
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
          Meu perfil
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Edite os canais de contato e a descrição pública da sua corretora.
        </p>
      </div>

      {/* Context banner */}
      {corretora && (
        <PanelCard density="compact" className="!bg-amber-950/30 !ring-amber-900/50">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30"
            >
              ☕
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-100">
                {corretora.name}{" "}
                <span className="font-normal text-amber-200/80">
                  · {corretora.city}, {corretora.state}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-stone-400">
                Nome, cidade e estado são mantidos pelo admin do Kavita. Logo,
                canais e descrição você edita aqui mesmo.
              </p>
            </div>
          </div>
        </PanelCard>
      )}

      {/* Logo — Fase 4 */}
      {corretora && (
        <LogoUploader
          corretora={corretora}
          onUpdated={(updated) => setCorretora(updated)}
        />
      )}

      {/* ETAPA 2.4 — link para segurança / 2FA */}
      <PanelCard density="compact">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
              Segurança da conta
            </p>
            <p className="mt-0.5 text-[12px] text-stone-300">
              Ative autenticação em dois fatores e gerencie sessões.
            </p>
          </div>
          <a
            href="/painel/corretora/perfil/seguranca"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition-colors hover:bg-amber-500/20 sm:h-9 sm:min-h-0 sm:w-auto"
          >
            Abrir segurança →
          </a>
        </div>
      </PanelCard>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção: Informações principais */}
        <PanelCard density="spacious">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Informações principais
            </p>
            <h2 className="mt-1 text-base font-semibold text-stone-100">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Canais de contato
            </p>
            <h2 className="mt-1 text-base font-semibold text-stone-100">
              Como o produtor pode te encontrar
            </h2>
            <p className="mt-1 text-[11px] text-stone-400">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Atendimento regional
            </p>
            <h2 className="mt-1 text-base font-semibold text-stone-100">
              Onde e como você atua
            </h2>
            <p className="mt-1 text-[11px] text-stone-400">
              Produtores filtram por cidade e tipo de café. Quanto mais
              completo, melhor sua exposição na Zona da Mata.
            </p>
          </div>

          <div className="space-y-6">
            {/* Cidades atendidas (multi-select checkboxes) */}
            <div>
              <label className={labelClass}>Cidades atendidas</label>
              <p className="-mt-1 mb-2.5 text-[11px] text-stone-400">
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
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-stone-950 px-3 py-2 text-sm transition-colors hover:border-amber-400/30 hover:bg-stone-950/80 has-[:checked]:border-amber-400/60 has-[:checked]:bg-amber-400/10"
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
                            className="h-4 w-4 rounded border-stone-600 bg-stone-800 text-amber-400 focus:ring-amber-400"
                          />
                          <span className="flex-1 text-stone-200">
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
                          <span className="inline-block rounded-full border border-white/10 bg-stone-950 px-3.5 py-1.5 text-xs font-medium text-stone-300 transition-all hover:border-amber-400/30 peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-checked:text-amber-200">
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
                          <span className="block rounded-xl border border-white/10 bg-stone-950 p-3 text-left transition-all hover:border-amber-400/30 peer-checked:border-amber-400/60 peer-checked:bg-amber-400/10">
                            <span className="block text-sm font-semibold text-stone-100">
                              {perfil.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-stone-400">
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

        {/* Fase 8 — perfil comercial da mesa (Zona da Mata) */}
        <PanelCard density="spacious">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Mesa regional
            </p>
            <h2 className="mt-1 text-base font-semibold text-stone-100">
              Como você opera na região
            </h2>
            <p className="mt-0.5 text-[12px] text-stone-400">
              Esses sinais aparecem na sua ficha pública e no filtro que o
              produtor usa para escolher corretora.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>Endereço (rua, número, bairro)</label>
              <input
                {...register("endereco_textual", { maxLength: 255 })}
                className={inputClass}
                placeholder="Ex: Rua São Paulo 200, Centro — Manhuaçu/MG"
              />
              <p className="mt-1.5 text-[11px] text-stone-500">
                Aparece na ficha pública e alimenta o link do Google Maps.
              </p>
            </div>

            <div>
              <label className={labelClass}>Volume mínimo (sacas de 60 kg)</label>
              <input
                type="number"
                min="0"
                max="100000"
                {...register("volume_minimo_sacas")}
                className={inputClass}
                placeholder="Ex: 30 (deixe vazio se não há mínimo)"
              />
              <p className="mt-1.5 text-[11px] text-stone-500">
                Deixe em branco se você atende lotes de qualquer tamanho.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]">
                <input
                  type="checkbox"
                  {...register("compra_cafe_especial")}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400/60"
                />
                <span className="text-[13px] leading-snug text-stone-200">
                  <span className="font-semibold text-stone-100">
                    Compra café especial
                  </span>
                  <span className="mt-0.5 block text-[11px] text-stone-400">
                    Arábica SCA 80+, microlotes, cafés premiados.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]">
                <input
                  type="checkbox"
                  {...register("faz_retirada_amostra")}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400/60"
                />
                <span className="text-[13px] leading-snug text-stone-200">
                  <span className="font-semibold text-stone-100">
                    Faz retirada de amostra
                  </span>
                  <span className="mt-0.5 block text-[11px] text-stone-400">
                    Vai até o produtor buscar sem custo adicional.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]">
                <input
                  type="checkbox"
                  {...register("trabalha_exportacao")}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400/60"
                />
                <span className="text-[13px] leading-snug text-stone-200">
                  <span className="font-semibold text-stone-100">
                    Trabalha com exportação
                  </span>
                  <span className="mt-0.5 block text-[11px] text-stone-400">
                    Coloca lote direto no contêiner.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]">
                <input
                  type="checkbox"
                  {...register("trabalha_cooperativas")}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400/60"
                />
                <span className="text-[13px] leading-snug text-stone-200">
                  <span className="font-semibold text-stone-100">
                    Atende cooperativas
                  </span>
                  <span className="mt-0.5 block text-[11px] text-stone-400">
                    Compra de cooperados ou via cooperativa.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </PanelCard>

        {/* Action row — em mobile o botão é full-width com tap target
            confortável; "Alterações não salvas" sobe acima do botão pra
            não ficar espremido. Em sm+ volta pro layout inline direito. */}
        <div className="sticky bottom-0 -mx-1 flex flex-col items-stretch gap-2 border-t border-white/[0.06] bg-stone-950/80 px-1 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          {isDirty && (
            <span className="text-center text-[11px] font-medium text-stone-500 sm:text-left">
              Alterações não salvas
            </span>
          )}
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="group relative inline-flex min-h-[48px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-300 hover:to-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:w-auto sm:py-2.5"
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

// ===================================================================
// Fase 4 — LogoUploader
// ===================================================================
//
// Componente separado do form principal porque upload é multipart e
// não depende de react-hook-form/Zod pipeline. Dois estados visuais:
// preview do arquivo escolhido (ainda não enviado) e estado salvo
// (logo atual da corretora).
//
// RBAC: backend rejeita 403 se role não tiver profile.edit. Aqui só
// tentamos; fallback com toast pra sales/viewer. Poderíamos esconder
// preventivamente, mas o custo de deixar o botão e cair num toast
// amigável é menor que pedir role aqui no cliente e arriscar drift.

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function LogoUploader({
  corretora,
  onUpdated,
}: {
  corretora: CorretoraAdmin;
  onUpdated: (updated: CorretoraAdmin) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentSrc = corretora.logo_path
    ? `${API_BASE}${corretora.logo_path.startsWith("/") ? "" : "/"}${corretora.logo_path}`
    : null;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!ACCEPTED_LOGO_TYPES.includes(picked.type)) {
      toast.error("Use JPEG, PNG ou WebP.");
      return;
    }
    if (picked.size > MAX_LOGO_BYTES) {
      toast.error("Arquivo acima de 2 MB. Tente uma imagem menor.");
      return;
    }
    setFile(picked);
    const url = URL.createObjectURL(picked);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const upload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("logo", file);
    setUploading(true);
    try {
      const res = await apiClient.put<CorretoraAdmin>(
        "/api/corretora/profile/logo",
        fd,
      );
      onUpdated(res);
      toast.success("Logo atualizado.");
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error(
          "Seu papel não permite editar o perfil. Peça pra quem tem permissão.",
        );
      } else {
        toast.error(formatApiError(err, "Erro ao enviar logo.").message);
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    // Cleanup do objectURL quando o componente desmonta.
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const displaySrc = preview ?? currentSrc;

  return (
    <PanelCard density="spacious">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Marca
        </p>
        <h2 className="mt-1 text-base font-semibold text-stone-100">
          Logo da corretora
        </h2>
        <p className="mt-1 text-[12px] text-stone-400">
          Aparece no seu card público e no painel. JPEG, PNG ou WebP — até
          2 MB.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center self-center overflow-hidden rounded-2xl border border-white/10 bg-stone-950 sm:self-auto">
          {displaySrc ? (
            <Image
              src={displaySrc}
              alt={`Logo de ${corretora.name}`}
              fill
              sizes="96px"
              className="object-contain"
              unoptimized
            />
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Sem logo
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {/* Em mobile botões empilham full-width com tap target 44px.
              Em sm+ voltam lado a lado compactos (h-9) como antes. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-200 transition-colors hover:bg-white/[0.08] disabled:opacity-50 sm:h-9 sm:min-h-0"
            >
              {preview ? "Trocar arquivo" : "Escolher arquivo"}
            </button>
            {preview && (
              <>
                <button
                  type="button"
                  onClick={upload}
                  disabled={uploading}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-amber-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 ring-1 ring-amber-400/40 transition-colors hover:bg-amber-500/30 disabled:opacity-50 sm:h-9 sm:min-h-0"
                >
                  {uploading ? "Enviando…" : "Salvar logo"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={uploading}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] px-4 text-[11px] font-semibold text-stone-400 transition-colors hover:text-stone-200 disabled:opacity-50 sm:h-9 sm:min-h-0"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_LOGO_TYPES.join(",")}
            onChange={handlePick}
            className="sr-only"
          />
          {file && (
            <p className="text-[11px] text-stone-400">
              Arquivo: {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
      </div>
    </PanelCard>
  );
}
