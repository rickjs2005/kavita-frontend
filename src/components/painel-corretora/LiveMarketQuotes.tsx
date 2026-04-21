// src/components/painel-corretora/LiveMarketQuotes.tsx
//
// Conteúdo dinâmico do MarketStrip: puxa `/api/public/market-quotes/current`
// e renderiza itens CEPEA + ICE com pulse amber quando "vivo" e muted
// quando stale. Compatível com <MarketStrip> (pai fornece o contêiner).

"use client";

import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { MarketStripItem, MarketStripDivider } from "./PanelOrnaments";

// Formato pt-BR: vírgula decimal + ponto como agrupador de milhar.
const BRL_FMT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});
const PCT_FMT = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

function fmtBRL(cents: number | null | undefined) {
  if (cents == null) return null;
  return BRL_FMT.format(cents / 100);
}

function fmtUSCents(cents: number | null | undefined) {
  if (cents == null) return null;
  // ICE publica cents/lb com precisão de 0,05 cent — Yahoo v8 já
  // devolve inteiro. Mostramos sem decimal para manter strip enxuto.
  return `${cents.toFixed(0)}¢/lb`;
}

function fmtVariation(pct: number | null | undefined) {
  if (pct == null || Number.isNaN(pct)) return null;
  // Intl devolve "+1,23" / "-5,39" (signDisplay=exceptZero, vírgula
  // decimal pt-BR).
  return `${PCT_FMT.format(pct)}%`;
}

function QuoteItem({
  label,
  primary,
  variation,
  isStale,
  href,
}: {
  label: string;
  primary: string | null;
  variation: string | null;
  isStale: boolean;
  href: string | null;
}) {
  if (!primary) return null;
  const variationClass =
    variation?.startsWith("+")
      ? "text-emerald-300"
      : variation?.startsWith("-")
        ? "text-red-300"
        : "text-stone-400";

  // Valor primário ganha peso e glow âmbar discreto para ser o foco
  // do olhar — a corretora precisa bater o olho e entender rápido.
  // Tracking normal quebra o letter-spacing do parent (uppercase +
  // tracking-[0.2em] na casca do strip) para o número não se desfazer.
  const content = (
    <MarketStripItem pulse={!isStale} accent>
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-50 font-bold tabular-nums text-[11px] tracking-normal drop-shadow-[0_0_8px_rgba(251,191,36,0.12)]">
        {primary}
      </span>
      {variation && (
        <span className={`tabular-nums font-semibold ${variationClass}`}>
          {variation}
        </span>
      )}
      {isStale && (
        <span
          className="text-stone-500 normal-case italic"
          title="Snapshot com mais de 48h — fonte pode não ter publicado em dia útil"
        >
          (defasado)
        </span>
      )}
    </MarketStripItem>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        title="Abrir fonte em nova aba"
      >
        {content}
      </a>
    );
  }
  return content;
}

export function LiveMarketQuotes() {
  const { data, loading } = useMarketQuotes();

  if (loading) {
    return (
      <MarketStripItem>
        <span className="text-stone-500">Carregando cotações…</span>
      </MarketStripItem>
    );
  }

  if (!data || (!data.cepea_arabica && !data.ice_coffee_c)) {
    return null;
  }

  const cepea = data.cepea_arabica;
  const ice = data.ice_coffee_c;

  return (
    <>
      {cepea && (
        <QuoteItem
          label="CEPEA arábica"
          primary={fmtBRL(cepea.price_brl_cents)}
          variation={fmtVariation(cepea.variation_pct)}
          isStale={cepea.is_stale}
          href={cepea.source_url}
        />
      )}
      {cepea && ice && <MarketStripDivider />}
      {ice && (
        <QuoteItem
          label="ICE C (NY)"
          primary={fmtUSCents(ice.price_usd_cents)}
          variation={fmtVariation(ice.variation_pct)}
          isStale={ice.is_stale}
          href={ice.source_url}
        />
      )}
    </>
  );
}
