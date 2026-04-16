// src/components/painel-corretora/LaudoPanel.tsx
//
// Painel de laudo operacional completo — classificação de café.
//
// Organizado em 3 fieldsets:
//   1. Origem e contexto (córrego, altitude, variedade, volume)
//   2. Qualidade / laudo sensorial (bebida, SCA, umidade, peneira,
//      catação, aspecto, notas sensoriais)
//   3. Avaliação comercial (mercado indicado, aptidão, prioridade,
//      preço referência, observações comerciais)
//
// Vocabulário: Manhuaçu / Zona da Mata.
// Dark mode: stone-950 inputs, amber-400 accents.

"use client";

import { useState } from "react";
import type {
  CorretoraLead,
  BebidaClassificacao,
  MercadoIndicado,
  AptidaoOferta,
  PrioridadeComercial,
} from "@/types/lead";

// ─── Catálogo de classificações ────────────────────────────────────

type ClassificacaoMeta = {
  label: string;
  shortLabel: string;
  tone: "gold" | "forest" | "terracotta" | "stone";
  description: string;
};

const CLASSIFICACOES: Record<BebidaClassificacao, ClassificacaoMeta> = {
  especial: {
    label: "Bebida Especial",
    shortLabel: "Especial",
    tone: "gold",
    description: "Acima de 80 pts · exportação e torrefação premium",
  },
  dura: {
    label: "Bebida Dura",
    shortLabel: "Dura",
    tone: "forest",
    description: "Padrão comercial bom · mercado interno e externo",
  },
  riado: {
    label: "Riado",
    shortLabel: "Riado",
    tone: "terracotta",
    description: "Notas de adstringência leve · mercado interno",
  },
  rio: {
    label: "Rio",
    shortLabel: "Rio",
    tone: "terracotta",
    description: "Adstringência intensa · indústria",
  },
  escolha: {
    label: "Escolha / Cata",
    shortLabel: "Escolha",
    tone: "stone",
    description: "Lote para triagem e separação",
  },
};

const TONE_CLASSES: Record<ClassificacaoMeta["tone"], string> = {
  gold: "border-amber-400/60 bg-amber-400/15 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)]",
  forest: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  terracotta: "border-orange-600/40 bg-orange-600/10 text-orange-200",
  stone: "border-stone-600/40 bg-stone-800 text-stone-300",
};

const MERCADO_LABELS: Record<MercadoIndicado, string> = {
  exportacao: "Exportação",
  mercado_interno: "Mercado interno",
  cafeteria: "Cafeteria / Especial",
  commodity: "Commodity",
  indefinido: "Indefinido",
};

const APTIDAO_LABELS: Record<AptidaoOferta, string> = {
  sim: "Sim — pronto para oferta",
  nao: "Não — precisa de ajuste",
  parcial: "Parcial — depende de negociação",
};

const PRIORIDADE_LABELS: Record<PrioridadeComercial, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

// Style inline para <option> em dark mode
const OPT_STYLE: React.CSSProperties = {
  backgroundColor: "#0c0a09",
  color: "#f5f5f4",
};

// ─── Badge público ─────────────────────────────────────────────────

export function BebidaBadge({
  classificacao,
  compact = false,
}: {
  classificacao: BebidaClassificacao;
  compact?: boolean;
}) {
  const meta = CLASSIFICACOES[classificacao];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${TONE_CLASSES[meta.tone]}`}
      title={meta.description}
    >
      {meta.tone === "gold" && (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
      )}
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}

// ─── Potencial comercial derivado ──────────────────────────────────
// Score simples: altitude + bebida → indicador visual.
// Não é IA — é heurística regional de Manhuaçu.

type PotencialLevel = "alto" | "medio" | "baixo";

function calcPotencial(
  bebida?: BebidaClassificacao | null,
  altitude?: number | null,
  pontuacao?: number | null,
): PotencialLevel | null {
  if (!bebida) return null;
  let score = 0;
  if (bebida === "especial") score += 3;
  else if (bebida === "dura") score += 2;
  else if (bebida === "riado") score += 1;
  if (altitude && altitude >= 1200) score += 2;
  else if (altitude && altitude >= 900) score += 1;
  if (pontuacao && pontuacao >= 85) score += 2;
  else if (pontuacao && pontuacao >= 80) score += 1;
  if (score >= 5) return "alto";
  if (score >= 3) return "medio";
  return "baixo";
}

const POTENCIAL_VISUAL: Record<
  PotencialLevel,
  { label: string; cls: string }
> = {
  alto: {
    label: "Potencial alto",
    cls: "border-amber-400/60 bg-amber-400/15 text-amber-200",
  },
  medio: {
    label: "Potencial médio",
    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  baixo: {
    label: "Potencial baixo",
    cls: "border-stone-600/40 bg-stone-800 text-stone-400",
  },
};

export function PotencialBadge({ lead }: { lead: CorretoraLead }) {
  const level = calcPotencial(
    lead.bebida_classificacao,
    lead.altitude_origem,
    lead.pontuacao_sca,
  );
  if (!level) return null;
  const v = POTENCIAL_VISUAL[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${v.cls}`}
      title="Potencial calculado por altitude + bebida + pontuação SCA"
    >
      {v.label}
    </span>
  );
}

// ─── WhatsApp com laudo completo ───────────────────────────────────

function buildLaudoWhatsAppUrl(
  lead: CorretoraLead,
  corretoraNome: string,
  corretoraNomeEmpresa: string,
): string {
  const digits = lead.telefone.replace(/\D/g, "").replace(/^0+/, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;

  const meta = lead.bebida_classificacao
    ? CLASSIFICACOES[lead.bebida_classificacao]
    : null;

  const lines: string[] = [
    `Olá, ${lead.nome}! Aqui é ${corretoraNome} da ${corretoraNomeEmpresa}.`,
    `Acabamos de classificar sua amostra${lead.corrego_localidade ? ` do ${lead.corrego_localidade}` : ""}.`,
    "",
    "📊 *Resultado da prova:*",
  ];

  if (meta) lines.push(`• Bebida: *${meta.label}*`);
  if (lead.pontuacao_sca != null) lines.push(`• Pontuação SCA: *${lead.pontuacao_sca} pts*`);
  if (lead.umidade_pct != null) lines.push(`• Umidade: ${lead.umidade_pct}%`);
  if (lead.peneira) lines.push(`• Peneira: ${lead.peneira}`);
  if (lead.altitude_origem) lines.push(`• Altitude: ${lead.altitude_origem}m`);
  if (lead.variedade_cultivar) lines.push(`• Variedade: ${lead.variedade_cultivar}`);
  if (lead.obs_sensoriais) lines.push(`• Notas: ${lead.obs_sensoriais}`);
  if (lead.mercado_indicado) {
    lines.push(`• Mercado indicado: ${MERCADO_LABELS[lead.mercado_indicado]}`);
  }
  if (lead.preco_referencia_saca != null) {
    const fmt = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(lead.preco_referencia_saca);
    lines.push(`• Referência: ${fmt}/saca`);
  }

  lines.push("", "Podemos conversar sobre oferta?");
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// ─── Classes compartilhadas ────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 shadow-sm focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/25 [color-scheme:dark]";
const selectClass = `${inputClass} appearance-none pr-8`;
const labelClass =
  "mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400";
const fieldsetLegendClass =
  "mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90";
const hairlineClass =
  "h-px flex-1 bg-gradient-to-r from-amber-400/20 to-transparent";

// ─── Painel principal ──────────────────────────────────────────────

type Props = {
  lead: CorretoraLead;
  saving: boolean;
  corretoraNome: string;
  corretoraNomeEmpresa: string;
  onUpdate: (patch: Record<string, unknown>) => void;
};

export function LaudoPanel({
  lead,
  saving,
  corretoraNome,
  corretoraNomeEmpresa,
  onUpdate,
}: Props) {
  // State local para todos os campos — inicializado com valores do lead.
  const [f, setF] = useState(() => ({
    bebida_classificacao: lead.bebida_classificacao ?? "",
    pontuacao_sca: lead.pontuacao_sca != null ? String(lead.pontuacao_sca) : "",
    preco_referencia_saca:
      lead.preco_referencia_saca != null
        ? String(lead.preco_referencia_saca)
        : "",
    umidade_pct: lead.umidade_pct != null ? String(lead.umidade_pct) : "",
    peneira: lead.peneira ?? "",
    catacao_defeitos: lead.catacao_defeitos ?? "",
    aspecto_lote: lead.aspecto_lote ?? "",
    obs_sensoriais: lead.obs_sensoriais ?? "",
    obs_comerciais: lead.obs_comerciais ?? "",
    mercado_indicado: lead.mercado_indicado ?? "",
    aptidao_oferta: lead.aptidao_oferta ?? "",
    prioridade_comercial: lead.prioridade_comercial ?? "",
    altitude_origem:
      lead.altitude_origem != null ? String(lead.altitude_origem) : "",
    variedade_cultivar: lead.variedade_cultivar ?? "",
  }));

  const set = (key: keyof typeof f, value: string) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const hasChanges = Object.keys(f).some((key) => {
    const k = key as keyof typeof f;
    const current = f[k];
    const original =
      (lead as Record<string, unknown>)[k] != null
        ? String((lead as Record<string, unknown>)[k])
        : "";
    return current !== original;
  });

  const save = () => {
    const patch: Record<string, unknown> = {};
    const numOrNull = (v: string) => (v ? Number(v) : null);
    const strOrNull = (v: string) => (v.trim() || null);

    patch.bebida_classificacao = strOrNull(f.bebida_classificacao);
    patch.pontuacao_sca = numOrNull(f.pontuacao_sca);
    patch.preco_referencia_saca = numOrNull(f.preco_referencia_saca);
    patch.umidade_pct = numOrNull(f.umidade_pct);
    patch.peneira = strOrNull(f.peneira);
    patch.catacao_defeitos = strOrNull(f.catacao_defeitos);
    patch.aspecto_lote = strOrNull(f.aspecto_lote);
    patch.obs_sensoriais = strOrNull(f.obs_sensoriais);
    patch.obs_comerciais = strOrNull(f.obs_comerciais);
    patch.mercado_indicado = strOrNull(f.mercado_indicado);
    patch.aptidao_oferta = strOrNull(f.aptidao_oferta);
    patch.prioridade_comercial = strOrNull(f.prioridade_comercial);
    patch.altitude_origem = numOrNull(f.altitude_origem);
    patch.variedade_cultivar = strOrNull(f.variedade_cultivar);
    onUpdate(patch);
  };

  const canSendLaudo = Boolean(lead.bebida_classificacao);
  const laudoUrl = canSendLaudo
    ? buildLaudoWhatsAppUrl(lead, corretoraNome, corretoraNomeEmpresa)
    : null;

  const potencial = calcPotencial(
    (f.bebida_classificacao as BebidaClassificacao) || null,
    f.altitude_origem ? Number(f.altitude_origem) : null,
    f.pontuacao_sca ? Number(f.pontuacao_sca) : null,
  );

  return (
    <div className="space-y-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4">
      {/* Header + WhatsApp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
            ☕ Laudo de classificação
          </p>
          {potencial && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${POTENCIAL_VISUAL[potencial].cls}`}
            >
              {POTENCIAL_VISUAL[potencial].label}
            </span>
          )}
        </div>
        {canSendLaudo && laudoUrl && (
          <a
            href={laudoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:from-emerald-400 hover:to-emerald-500"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Enviar laudo via WhatsApp
          </a>
        )}
      </div>

      {/* ─── 1. Origem ──────────────────────────────────── */}
      <fieldset className="space-y-3 border-0 p-0">
        <legend className={fieldsetLegendClass}>
          <span>Origem do café</span>
          <span aria-hidden className={hairlineClass} />
        </legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Altitude (metros)">
            <input
              type="number"
              min={0}
              max={3000}
              value={f.altitude_origem}
              disabled={saving}
              onChange={(e) => set("altitude_origem", e.target.value)}
              className={inputClass}
              placeholder="Ex: 1100"
            />
          </Field>
          <Field label="Variedade / Cultivar">
            <input
              value={f.variedade_cultivar}
              disabled={saving}
              onChange={(e) => set("variedade_cultivar", e.target.value)}
              className={inputClass}
              placeholder="Catuaí, Mundo Novo..."
            />
          </Field>
          <Field label="Peneira">
            <input
              value={f.peneira}
              disabled={saving}
              onChange={(e) => set("peneira", e.target.value)}
              className={inputClass}
              placeholder="17/18, 15/16..."
            />
          </Field>
          <Field label="Aspecto do lote">
            <input
              value={f.aspecto_lote}
              disabled={saving}
              onChange={(e) => set("aspecto_lote", e.target.value)}
              className={inputClass}
              placeholder="Verde-azulado, claro..."
            />
          </Field>
        </div>
      </fieldset>

      {/* ─── 2. Qualidade / Laudo sensorial ─────────────── */}
      <fieldset className="space-y-3 border-0 p-0">
        <legend className={fieldsetLegendClass}>
          <span>Resultado da prova</span>
          <span aria-hidden className={hairlineClass} />
        </legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Padrão de bebida">
            <select
              value={f.bebida_classificacao}
              disabled={saving}
              onChange={(e) => set("bebida_classificacao", e.target.value)}
              className={selectClass}
            >
              <option value="" style={OPT_STYLE}>
                Selecione...
              </option>
              {(
                Object.entries(CLASSIFICACOES) as [
                  BebidaClassificacao,
                  ClassificacaoMeta,
                ][]
              ).map(([key, meta]) => (
                <option key={key} value={key} style={OPT_STYLE}>
                  {meta.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pontuação SCA">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={f.pontuacao_sca}
              disabled={saving}
              onChange={(e) => set("pontuacao_sca", e.target.value)}
              className={inputClass}
              placeholder="Ex: 82"
            />
          </Field>
          <Field label="Umidade (%)">
            <input
              type="number"
              min={0}
              max={30}
              step={0.1}
              value={f.umidade_pct}
              disabled={saving}
              onChange={(e) => set("umidade_pct", e.target.value)}
              className={inputClass}
              placeholder="Ex: 11.5"
            />
          </Field>
          <Field label="Catação / Defeitos">
            <input
              value={f.catacao_defeitos}
              disabled={saving}
              onChange={(e) => set("catacao_defeitos", e.target.value)}
              className={inputClass}
              placeholder="Ex: 12 defeitos/300g"
            />
          </Field>
        </div>
        <Field label="Notas sensoriais">
          <textarea
            rows={2}
            value={f.obs_sensoriais}
            disabled={saving}
            onChange={(e) => set("obs_sensoriais", e.target.value)}
            className={inputClass}
            placeholder="Chocolate, caramelo, frutado, corpo médio..."
          />
        </Field>
      </fieldset>

      {/* ─── 3. Avaliação comercial ─────────────────────── */}
      <fieldset className="space-y-3 border-0 p-0">
        <legend className={fieldsetLegendClass}>
          <span>Avaliação comercial</span>
          <span aria-hidden className={hairlineClass} />
        </legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Mercado indicado">
            <select
              value={f.mercado_indicado}
              disabled={saving}
              onChange={(e) => set("mercado_indicado", e.target.value)}
              className={selectClass}
            >
              <option value="" style={OPT_STYLE}>
                Selecione...
              </option>
              {(Object.entries(MERCADO_LABELS) as [MercadoIndicado, string][]).map(
                ([key, label]) => (
                  <option key={key} value={key} style={OPT_STYLE}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Apto para oferta?">
            <select
              value={f.aptidao_oferta}
              disabled={saving}
              onChange={(e) => set("aptidao_oferta", e.target.value)}
              className={selectClass}
            >
              <option value="" style={OPT_STYLE}>
                Selecione...
              </option>
              {(Object.entries(APTIDAO_LABELS) as [AptidaoOferta, string][]).map(
                ([key, label]) => (
                  <option key={key} value={key} style={OPT_STYLE}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Prioridade comercial">
            <select
              value={f.prioridade_comercial}
              disabled={saving}
              onChange={(e) => set("prioridade_comercial", e.target.value)}
              className={selectClass}
            >
              <option value="" style={OPT_STYLE}>
                Selecione...
              </option>
              {(
                Object.entries(PRIORIDADE_LABELS) as [
                  PrioridadeComercial,
                  string,
                ][]
              ).map(([key, label]) => (
                <option key={key} value={key} style={OPT_STYLE}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preço ref. R$/saca">
            <input
              type="number"
              min={0}
              step={1}
              value={f.preco_referencia_saca}
              disabled={saving}
              onChange={(e) => set("preco_referencia_saca", e.target.value)}
              className={inputClass}
              placeholder="Ex: 1850"
            />
          </Field>
        </div>
        <Field label="Observações comerciais">
          <textarea
            rows={2}
            value={f.obs_comerciais}
            disabled={saving}
            onChange={(e) => set("obs_comerciais", e.target.value)}
            className={inputClass}
            placeholder="Produtor bom de negócio, café com muita cata..."
          />
        </Field>
      </fieldset>

      {/* Footer */}
      {hasChanges && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-lg bg-amber-400 px-4 py-1.5 text-[11px] font-semibold text-stone-950 shadow-sm shadow-amber-400/20 transition-colors hover:bg-amber-300 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar laudo"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers de layout ─────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.84 12.84 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
    </svg>
  );
}
