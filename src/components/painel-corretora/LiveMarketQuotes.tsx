// src/components/painel-corretora/LiveMarketQuotes.tsx
//
// Conteúdo dinâmico do MarketStrip: puxa `/api/public/market-quotes/current`
// e renderiza itens CEPEA + ICE com pulse amber quando "vivo" e muted
// quando stale. Compatível com <MarketStrip> (pai fornece o contêiner).

"use client";

import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import type { MarketQuote } from "@/types/marketQuotes";
import { MarketStripItem, MarketStripDivider } from "./PanelOrnaments";

function fmtBRL(cents: number | null | undefined) {
  if (cents == null) return null;
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function fmtUSCents(cents: number | null | undefined) {
  if (cents == null) return null;
  // ICE exibe cents/lb com 2 casas — Yahoo já dá o número inteiro.
  return `${cents.toFixed(0)}¢/lb`;
}

function fmtVariation(pct: number | null | undefined) {
  if (pct == null || Number.isNaN(pct)) return null;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
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

  const content = (
    <MarketStripItem pulse={!isStale} accent>
      <span className="text-stone-400">{label}</span>
      <span className="text-stone-100 font-bold tabular-nums">{primary}</span>
      {variation && (
        <span className={`tabular-nums ${variationClass}`}>{variation}</span>
      )}
      {isStale && (
        <span
          className="text-stone-500 normal-case"
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

export function LiveMarketQuotesStub(props: LiveQuoteStubProps) {
  // Versão silenciosa pra usar no topo de páginas sem quebrar layout
  // quando backend ainda não tem snapshot.
  return <LiveMarketQuotes {...props} />;
}

type LiveQuoteStubProps = Record<string, never>;
