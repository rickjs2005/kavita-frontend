// src/components/mercado-do-cafe/MarketCotacaoPill.tsx
//
// Bloco de cotação do café para reuso dentro do módulo Mercado do Café.
// Pega um PublicCotacao (vindo de fetchPublicCotacoes do News — zero
// duplicação de fonte) e renderiza de três formas diferentes via prop
// `variant`:
//
//   - "stat": formato coeso com os cards de stat do hero da listagem
//     de corretoras. Mesmo tamanho, mesma estrutura.
//   - "strip": formato compacto inline, usado no market strip do topo.
//
// Reutiliza os helpers canônicos de src/utils/kavita-news/cotacoes.ts
// (safeNum, formatPrice, formatPct, hasPrice). Nenhuma formatação
// paralela é reinventada.

import Link from "next/link";
import type { PublicCotacao } from "@/lib/newsPublicApi";
import {
  safeNum,
  formatPrice,
  formatPct,
  hasPrice,
  convertToLocalUnit,
} from "@/utils/kavita-news/cotacoes";

type Variant = "stat" | "strip";

type Props = {
  cotacao: PublicCotacao | null;
  variant: Variant;
};

/**
 * Ícone de seta compacto (up/down/flat) — inline SVG estilo Lucide,
 * cores passadas por currentColor via Tailwind no parent.
 */
function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 17L17 7" />
        <path d="M9 7h8v8" />
      </svg>
    );
  }
  if (direction === "down") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 7l10 10" />
        <path d="M17 9v8H9" />
      </svg>
    );
  }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function getDirection(varNum: number | null): "up" | "down" | "flat" {
  if (varNum === null || varNum === 0) return "flat";
  return varNum > 0 ? "up" : "down";
}

function getToneClasses(direction: "up" | "down" | "flat") {
  if (direction === "up") {
    return {
      text: "text-emerald-300",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-400/30",
    };
  }
  if (direction === "down") {
    return {
      text: "text-rose-300",
      bg: "bg-rose-500/10",
      ring: "ring-rose-400/30",
    };
  }
  return {
    text: "text-stone-300",
    bg: "bg-white/[0.06]",
    ring: "ring-white/15",
  };
}

export function MarketCotacaoPill({ cotacao, variant }: Props) {
  // Caso base: sem cotação disponível (falha de fetch ou sem dados).
  // Em vez de quebrar, rendereiza um estado "mercado indisponível"
  // discreto para manter o layout estável.
  if (!cotacao) {
    if (variant === "strip") {
      return (
        <span className="hidden text-[10px] font-medium text-stone-500 md:inline">
          Mercado indisponível
        </span>
      );
    }
    return (
      <div className="p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/70">
          Café arábica
        </p>
        <p className="mt-1.5 text-sm font-medium text-stone-500">
          Mercado indisponível
        </p>
      </div>
    );
  }

  const varNum = safeNum(cotacao.variation_day);
  const varLabel = formatPct(varNum);
  const direction = getDirection(varNum);
  const tone = getToneClasses(direction);
  const detailHref = cotacao.slug
    ? `/news/cotacoes/${cotacao.slug}`
    : "/news/cotacoes";

  // Valor convertido para unidade local brasileira (saca 60kg para
  // café). Reusa o mesmo helper canônico que o News usa no CotacaoCard,
  // então a matemática/rótulo ficam sempre em sincronia.
  const priceNum = safeNum(cotacao.price);
  const localUnit =
    priceNum !== null && cotacao.slug
      ? convertToLocalUnit(priceNum, cotacao.slug)
      : null;

  const isUsdReference =
    cotacao.unit === "USD/lb" || cotacao.unit?.startsWith("USD");
  const refPrefix = isUsdReference ? "$" : "";

  // ─── Variant: strip (inline no topbar de mercado) ────────────────
  // Priorizamos a saca 60kg. Cores adaptadas para dark parent: text
  // amber-300 nos nomes/valores, stone-600 nos separadores.
  if (variant === "strip") {
    return (
      <Link
        href={detailHref}
        className="group hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-amber-300 md:inline-flex"
        aria-label={`Ver cotação: ${cotacao.name ?? "café"}`}
      >
        <span className="text-amber-300/80">
          {cotacao.name ?? "Café arábica"}
        </span>
        {localUnit ? (
          <>
            <span aria-hidden className="text-stone-600">
              ·
            </span>
            <span className="font-bold tabular-nums text-stone-100">
              R$ {formatPrice(localUnit.value)}
            </span>
            <span className="text-[9px] font-medium normal-case tracking-normal text-stone-500">
              /{localUnit.label}
            </span>
          </>
        ) : hasPrice(cotacao.price) ? (
          <>
            <span aria-hidden className="text-stone-600">
              ·
            </span>
            <span className="font-bold tabular-nums text-stone-100">
              {refPrefix}
              {formatPrice(cotacao.price)}
            </span>
          </>
        ) : null}
        {varNum !== null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] ${tone.text}`}
          >
            <TrendArrow direction={direction} />
            <span className="font-bold tabular-nums">{varLabel}</span>
          </span>
        )}
      </Link>
    );
  }

  // ─── Variant: stat (cartão no grid de stats do hero) ─────────────
  // Hierarquia flipada em relação ao News: saca 60kg vira o número
  // grande (é o que importa pro comprador/produtor), e a referência
  // internacional ($/lb) fica como linha secundária de contexto.
  // Quando não há conversão local disponível, cai para o preço de
  // referência como valor principal (comportamento anterior).
  return (
    <Link
      href={detailHref}
      className="group relative block p-4 transition-colors hover:bg-white/[0.03] md:p-5"
      aria-label={`Ver detalhes da cotação: ${cotacao.name ?? "café"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
          {cotacao.name ?? "Café arábica"}
        </p>
        {varNum !== null && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full ${tone.bg} px-1.5 py-0.5 text-[9px] font-bold ring-1 ${tone.ring} ${tone.text}`}
          >
            <TrendArrow direction={direction} />
            <span className="tabular-nums">{varLabel}</span>
          </span>
        )}
      </div>

      {localUnit ? (
        <>
          {/* Linha principal: R$ por saca 60kg — número grande */}
          <p className="mt-1.5 flex items-baseline gap-1 font-semibold tracking-tight text-stone-50">
            <span className="text-base font-medium text-stone-400">R$</span>
            <span className="text-2xl tabular-nums md:text-[1.9rem]">
              {formatPrice(localUnit.value)}
            </span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            / {localUnit.label}
          </p>
          {/* Linha secundária: referência internacional — contexto */}
          {hasPrice(cotacao.price) && (
            <p className="mt-1.5 truncate text-[10px] text-stone-500">
              Ref.{" "}
              <span className="font-semibold tabular-nums text-stone-400">
                {refPrefix}
                {formatPrice(cotacao.price)}
              </span>{" "}
              {cotacao.unit ?? ""}
            </p>
          )}
        </>
      ) : hasPrice(cotacao.price) ? (
        // Fallback: sem conversão local, mostra só a referência
        <>
          <p className="mt-1.5 flex items-baseline gap-1 font-semibold tracking-tight text-stone-50">
            {isUsdReference && (
              <span className="text-base font-medium text-stone-400">$</span>
            )}
            <span className="text-2xl tabular-nums md:text-3xl">
              {formatPrice(cotacao.price)}
            </span>
          </p>
          <p className="mt-0.5 truncate text-[10px] text-stone-500">
            {cotacao.unit ?? "referência"}
          </p>
        </>
      ) : (
        <p className="mt-1.5 text-sm font-medium text-stone-500">
          Aguardando atualização
        </p>
      )}

      {/* Subtle "see more" on hover */}
      <span
        aria-hidden
        className="absolute right-4 top-4 text-[9px] font-semibold uppercase tracking-wider text-amber-300 opacity-0 transition-opacity group-hover:opacity-100"
      >
        Ver →
      </span>
    </Link>
  );
}
