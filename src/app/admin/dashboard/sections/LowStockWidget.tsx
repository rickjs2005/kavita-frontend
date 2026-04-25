"use client";

// LowStockWidget — A3 da auditoria de automação.
// Exibe top 5 produtos com estoque baixo (quantity > 0 e <= reorder_point).
// Visual ambar (não vermelho — vermelho fica reservado pra esgotado).

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import apiClient from "@/lib/apiClient";

type LowStockItem = {
  id: number;
  name: string;
  image: string | null;
  price: number | string;
  quantity: number;
  reorder_point: number | null;
  effective_threshold: number;
};

type LowStockResp = {
  items: LowStockItem[];
  default_threshold: number;
  total: number;
};

const TOP_N = 5;

export default function LowStockWidget() {
  const [data, setData] = useState<LowStockResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pede até TOP_N+1 pra saber se há "mais" (mostra "+N outros").
        const resp = await apiClient.get<LowStockResp>(
          `/api/admin/produtos/estoque-baixo?limit=${TOP_N + 1}`,
        );
        if (!cancelled) setData(resp);
      } catch (err) {
        const e = err as { message?: string };
        if (!cancelled) setError(e?.message || "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 shadow-lg shadow-slate-950/60">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-amber-300">
            <Package className="h-3.5 w-3.5" aria-hidden />
            Operação
          </p>
          <h2 className="text-sm font-semibold text-slate-50">
            Estoque baixo
          </h2>
        </div>
        <Link
          href="/admin/produtos?lowStock=1"
          className="text-[11px] font-medium text-amber-300 hover:text-amber-200"
        >
          Ver todos &rarr;
        </Link>
      </header>

      {loading && (
        <p className="text-xs text-slate-400">Carregando…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-rose-300">{error}</p>
      )}

      {!loading && !error && data && (
        <>
          {data.total === 0 ? (
            <p className="text-xs text-slate-400">
              Nenhum produto com estoque baixo agora — tudo nos conformes.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {data.items.slice(0, TOP_N).map((p) => {
                const isCustomThreshold = p.reorder_point != null;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/produtos?id=${p.id}&lowStock=1`}
                      className="group flex items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-1.5 hover:border-amber-500/30 hover:bg-amber-500/[0.06]"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-100 group-hover:text-amber-100">
                        {p.name}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-amber-300">
                        {p.quantity} <span className="text-slate-500">de {p.effective_threshold}</span>
                        {isCustomThreshold && (
                          <span className="ml-1 text-[9px] text-slate-500">●</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {data.total > TOP_N && (
                <li className="pt-1 text-[11px] text-slate-400">
                  + {data.total - TOP_N} {data.total - TOP_N === 1 ? "outro" : "outros"} —
                  {" "}
                  <Link
                    href="/admin/produtos?lowStock=1"
                    className="text-amber-300 hover:text-amber-200"
                  >
                    ver lista completa
                  </Link>
                </li>
              )}
            </ul>
          )}

          <p className="mt-3 border-t border-amber-500/15 pt-2 text-[10px] text-slate-500">
            Ponto de reposição padrão: {data.default_threshold} un. Ajustável
            por produto.
          </p>
        </>
      )}
    </div>
  );
}
