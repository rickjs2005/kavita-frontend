// src/hooks/useMarketQuotes.ts
//
// Hook que carrega as cotações correntes (CEPEA + ICE). Usado pelo
// ticker dos painéis (corretora e produtor). Cache em memória por
// 5 minutos para evitar request em cada re-render — backend já
// serve do DB, mas não precisa bater toda vez.

"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { MarketQuotesCurrent } from "@/types/marketQuotes";

const REFRESH_MS = 5 * 60 * 1000;

// Cache singleton compartilhado entre instâncias do hook.
let _cache: {
  data: MarketQuotesCurrent | null;
  at: number;
} | null = null;
let _inflight: Promise<MarketQuotesCurrent | null> | null = null;

async function loadFresh(): Promise<MarketQuotesCurrent | null> {
  if (_inflight) return _inflight;
  _inflight = (async () => {
    try {
      const data = await apiClient.get<MarketQuotesCurrent>(
        "/api/public/market-quotes/current",
      );
      _cache = { data, at: Date.now() };
      return data;
    } catch {
      return null;
    } finally {
      _inflight = null;
    }
  })();
  return _inflight;
}

export function useMarketQuotes() {
  const [data, setData] = useState<MarketQuotesCurrent | null>(
    _cache?.data ?? null,
  );
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    const now = Date.now();
    if (_cache && now - _cache.at < REFRESH_MS) {
      setData(_cache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadFresh().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
