// src/components/mercado-do-cafe/CorretoraRegionalTrust.tsx
//
// Bloco de prova social / credibilidade regional — mostra ao produtor
// com quem ele está falando e porque pode confiar.
//
// Contém 4 cards compactos:
//   1. Responsável (nome + anos de atuação, se houver)
//   2. Cidades atendidas (lista enxuta, limitada a 4 com "+N")
//   3. Tempo médio de resposta (quando já houver base estatística)
//   4. Produtores atendidos (contador quando houver)
//
// Todos os cards são "opcionais por dado" — se a corretora ainda não
// tem SLA medido ou contador de produtores, o card vira um selo
// editorial ("Presença regional ativa") em vez de número vazio.
//
// Estética: glass dark stone com hairline amber. Mobile: grid 1 col,
// tablet 2 col, desktop 4 col.

import type { PublicCorretora } from "@/types/corretora";
import { getCidadeBySlug } from "@/lib/regioes";

type Props = {
  corretora: PublicCorretora & {
    // Stats públicos — opcionais, vêm do backend quando existirem
    sla_medio_horas?: number | null;
    produtores_atendidos?: number | null;
  };
};

// Mínimo de amostra para divulgar SLA no público. Abaixo disso o
// número oscila demais — 2 leads muito rápidos distorceriam para a
// corretora, 2 leads travados a prejudicariam injustamente.
const SLA_MIN_SAMPLE = 5;

function formatSlaHoras(h: number): string {
  if (h < 1) return "< 1h";
  if (h < 24) return `${Math.round(h)}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

/**
 * Resolve a hora média de resposta a partir dos dois caminhos
 * possíveis: o agregado novo (`sla_avg_seconds` + `sla_sample_count`
 * — Sprint 5) com piso de amostra, ou a prop legada `sla_medio_horas`.
 * Retorna null se nenhum dado confiável estiver disponível.
 */
function resolveSlaHoras(c: Props["corretora"]): number | null {
  if (
    typeof c.sla_avg_seconds === "number" &&
    c.sla_avg_seconds > 0 &&
    typeof c.sla_sample_count === "number" &&
    c.sla_sample_count >= SLA_MIN_SAMPLE
  ) {
    return c.sla_avg_seconds / 3600;
  }
  if (typeof c.sla_medio_horas === "number" && c.sla_medio_horas > 0) {
    return c.sla_medio_horas;
  }
  return null;
}

type Card = {
  kicker: string;
  value: string;
  hint?: string;
};

function buildCards(c: Props["corretora"]): Card[] {
  const cards: Card[] = [];

  // 1. Responsável — sempre mostra quando existe
  if (c.contact_name) {
    const sufixo =
      c.anos_atuacao && c.anos_atuacao > 0
        ? `${c.anos_atuacao} ${c.anos_atuacao === 1 ? "ano" : "anos"} de corretagem`
        : "Atendimento direto";
    cards.push({
      kicker: "Responsável",
      value: c.contact_name,
      hint: sufixo,
    });
  }

  // 2. Cidades atendidas — resolve slugs para nomes, lista com "+N"
  const cidadeNomes = (c.cidades_atendidas ?? [])
    .map((slug) => getCidadeBySlug(slug)?.nome)
    .filter((n): n is string => Boolean(n));
  if (cidadeNomes.length > 0) {
    const head = cidadeNomes.slice(0, 3).join(" · ");
    const extra = cidadeNomes.length > 3 ? ` +${cidadeNomes.length - 3}` : "";
    cards.push({
      kicker: "Atua em",
      value: `${head}${extra}`,
      hint: "Zona da Mata · Matas de Minas",
    });
  } else if (c.city) {
    cards.push({
      kicker: "Atua em",
      value: c.city,
      hint: c.state === "MG" ? "Zona da Mata · Matas de Minas" : undefined,
    });
  }

  // 3. Tempo médio de resposta — usa SLA quando existe, senão promessa
  const slaHoras = resolveSlaHoras(c);
  if (slaHoras != null) {
    const sample = c.sla_sample_count ?? null;
    cards.push({
      kicker: "Resposta média",
      value: formatSlaHoras(slaHoras),
      hint: sample
        ? `base de ${sample} ${sample === 1 ? "lead respondido" : "leads respondidos"}`
        : "últimos 30 dias",
    });
  } else {
    cards.push({
      kicker: "Retorno",
      value: "No mesmo dia",
      hint: "horário comercial",
    });
  }

  // 4. Produtores atendidos — contador quando existe
  if (typeof c.produtores_atendidos === "number" && c.produtores_atendidos >= 5) {
    cards.push({
      kicker: "Produtores atendidos",
      value: String(c.produtores_atendidos),
      hint: "cadastrados na rede Kavita",
    });
  } else {
    cards.push({
      kicker: "Rede Kavita",
      value: "Verificada",
      hint: "corretora do Mercado do Café",
    });
  }

  return cards;
}

export function CorretoraRegionalTrust({ corretora }: Props) {
  const cards = buildCards(corretora);
  if (cards.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl bg-white/[0.04] px-4 py-4 ring-1 ring-white/[0.08] backdrop-blur-sm sm:px-5 sm:py-5"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
            {card.kicker}
          </p>
          <p className="mt-1.5 text-base font-semibold leading-snug text-stone-50 sm:text-[17px]">
            {card.value}
          </p>
          {card.hint && (
            <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
              {card.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
