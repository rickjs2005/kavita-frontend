// src/types/marketQuotes.ts
//
// Shape do payload devolvido por GET /api/public/market-quotes/current.

export type MarketQuote = {
  source: string;
  symbol: string;
  price_brl_cents: number | null;
  price_usd_cents: number | null;
  variation_pct: number | null;
  quoted_at: string; // ISO
  fetched_at: string; // ISO
  source_url: string | null;
  is_stale: boolean;
};

export type MarketQuotesCurrent = {
  cepea_arabica: MarketQuote | null;
  ice_coffee_c: MarketQuote | null;
};
