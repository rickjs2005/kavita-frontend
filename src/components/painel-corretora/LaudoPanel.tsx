// src/components/painel-corretora/LaudoPanel.tsx
//
// Painel inline de laudo operacional (classificação de café).
// Aparece no card do lead quando a amostra está "recebida" ou "laudada"
// (o corretor já tem o café na mesa). Permite:
//   1. Classificar bebida (especial/dura/riado/rio/escolha)
//   2. Registrar pontuação SCA
//   3. Informar preço de referência da saca
//   4. Enviar laudo formatado via WhatsApp
//
// Vocabulário: Manhuaçu / Zona da Mata.
//   "Bebida" = café bom (exportação/torrefação).
//   "Rio" = café com defeito (indústria/consumo interno).
//   "Escolha/Cata" = lote para triagem.

"use client";

import { useState } from "react";
import type {
  CorretoraLead,
  BebidaClassificacao,
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
    description: "Notas intensas de adstringência · indústria",
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
  forest:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  terracotta:
    "border-orange-600/40 bg-orange-600/10 text-orange-200",
  stone: "border-stone-600/40 bg-stone-800 text-stone-300",
};

// ─── Badge de classificação (usado inline no card principal) ───────

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

// ─── Botão "Enviar Laudo via WhatsApp" ─────────────────────────────

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
    "📊 *Laudo Técnico:*",
  ];

  if (meta) {
    lines.push(`• Padrão de Bebida: *${meta.label}*`);
  }
  if (lead.pontuacao_sca != null) {
    lines.push(`• Pontuação: *${lead.pontuacao_sca} pts*`);
  }
  if (lead.tipo_cafe) {
    const MAP: Record<string, string> = {
      arabica_comum: "Arábica",
      arabica_especial: "Arábica Especial",
      natural: "Natural",
      cereja_descascado: "Cereja Descascado",
      ainda_nao_sei: "—",
    };
    lines.push(`• Tipo: ${MAP[lead.tipo_cafe] ?? lead.tipo_cafe}`);
  }
  if (lead.volume_range) {
    const MAP: Record<string, string> = {
      ate_50: "Até 50 sacas",
      "50_200": "50 a 200 sacas",
      "200_500": "200 a 500 sacas",
      "500_mais": "Mais de 500 sacas",
    };
    lines.push(`• Volume: ${MAP[lead.volume_range] ?? lead.volume_range}`);
  }
  if (lead.preco_referencia_saca != null) {
    const fmt = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(lead.preco_referencia_saca);
    lines.push(`• Referência de mercado: ${fmt}/saca`);
  }

  lines.push(
    "",
    "Como estão seus planos para esse lote? Vamos fechar?",
  );

  const msg = lines.join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// ─── Painel de laudo (inline no card expandido do lead) ────────────

type Props = {
  lead: CorretoraLead;
  saving: boolean;
  corretoraNome: string;
  corretoraNomeEmpresa: string;
  onUpdate: (patch: {
    bebida_classificacao?: BebidaClassificacao | null;
    pontuacao_sca?: number | null;
    preco_referencia_saca?: number | null;
  }) => void;
};

export function LaudoPanel({
  lead,
  saving,
  corretoraNome,
  corretoraNomeEmpresa,
  onUpdate,
}: Props) {
  const [classificacao, setClassificacao] = useState<
    BebidaClassificacao | ""
  >(lead.bebida_classificacao ?? "");
  const [pontuacao, setPontuacao] = useState(
    lead.pontuacao_sca != null ? String(lead.pontuacao_sca) : "",
  );
  const [preco, setPreco] = useState(
    lead.preco_referencia_saca != null
      ? String(lead.preco_referencia_saca)
      : "",
  );

  const hasChanges =
    classificacao !== (lead.bebida_classificacao ?? "") ||
    pontuacao !== (lead.pontuacao_sca != null ? String(lead.pontuacao_sca) : "") ||
    preco !== (lead.preco_referencia_saca != null ? String(lead.preco_referencia_saca) : "");

  const canSendLaudo = Boolean(lead.bebida_classificacao);

  const save = () => {
    onUpdate({
      bebida_classificacao: classificacao || null,
      pontuacao_sca: pontuacao ? Number(pontuacao) : null,
      preco_referencia_saca: preco ? Number(preco) : null,
    });
  };

  const laudoUrl = canSendLaudo
    ? buildLaudoWhatsAppUrl(lead, corretoraNome, corretoraNomeEmpresa)
    : null;

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 shadow-sm focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/25 [color-scheme:dark]";
  const labelClass =
    "mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400";

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
          ☕ Laudo de classificação
        </p>
        {canSendLaudo && laudoUrl && (
          <a
            href={laudoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:from-emerald-400 hover:to-emerald-500"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.84 12.84 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
            </svg>
            Enviar laudo via WhatsApp
          </a>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {/* Classificação da bebida */}
        <div>
          <label className={labelClass}>Padrão de bebida</label>
          <select
            value={classificacao}
            disabled={saving}
            onChange={(e) =>
              setClassificacao(e.target.value as BebidaClassificacao | "")
            }
            className={inputClass}
          >
            <option value="">Selecione...</option>
            {(
              Object.entries(CLASSIFICACOES) as [
                BebidaClassificacao,
                ClassificacaoMeta,
              ][]
            ).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pontuação SCA */}
        <div>
          <label className={labelClass}>Pontuação (SCA)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={pontuacao}
            disabled={saving}
            onChange={(e) => setPontuacao(e.target.value)}
            className={inputClass}
            placeholder="Ex: 82"
          />
        </div>

        {/* Preço referência */}
        <div>
          <label className={labelClass}>Preço ref. R$/saca</label>
          <input
            type="number"
            min={0}
            step={1}
            value={preco}
            disabled={saving}
            onChange={(e) => setPreco(e.target.value)}
            className={inputClass}
            placeholder="Ex: 1850"
          />
        </div>
      </div>

      {hasChanges && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-semibold text-stone-950 shadow-sm shadow-amber-400/20 transition-colors hover:bg-amber-300 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar laudo"}
          </button>
        </div>
      )}
    </div>
  );
}
