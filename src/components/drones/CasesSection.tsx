"use client";

// Seção pública de cases comerciais.
// Lista cases reais (fazenda + cidade + hectares + modelo + foto +
// depoimento) cadastrados pelo admin. Renderização propositalmente
// simples — primeiro entrega estrutura funcional, redesign visual
// premium fica para a próxima rodada.

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import type { DroneCase } from "@/types/drones";

export default function CasesSection({ modelKey }: { modelKey?: string }) {
  const [cases, setCases] = useState<DroneCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const qs = modelKey ? `?model=${encodeURIComponent(modelKey)}` : "";
        const res = await apiClient.get<{ items?: DroneCase[] }>(
          `/api/public/drones/cases${qs}`,
        );
        if (cancelled) return;
        setCases(Array.isArray(res?.items) ? res.items : []);
      } catch {
        if (!cancelled) setCases([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modelKey]);

  // Sem cases ou ainda carregando, não renderiza nada — landing não
  // mostra estado vazio embaraçoso.
  if (loading || !cases.length) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Em campo, com produtores reais
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
            Cases Kavita Drones
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Histórias de uso real — fazendas, hectares aplicados e
            depoimento direto de quem opera.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:border-emerald-400/25"
            >
              {c.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={absUrl(c.cover_image_url)}
                  alt={c.title}
                  className="block aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[16/10] w-full bg-gradient-to-br from-emerald-900/40 via-slate-900 to-black" />
              )}

              <div className="p-5">
                <h3 className="text-sm font-extrabold text-white">
                  {c.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {c.farm_name}
                  {c.city ? ` · ${c.city}` : ""}
                  {c.uf ? `/${c.uf}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
                  {c.hectares != null && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                      {c.hectares} ha
                    </span>
                  )}
                  {c.model_key && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-bold uppercase text-emerald-200">
                      {c.model_key}
                    </span>
                  )}
                </div>

                {c.summary ? (
                  <p className="mt-3 text-[13px] leading-relaxed text-slate-300">
                    {c.summary}
                  </p>
                ) : null}

                {c.testimonial ? (
                  <blockquote className="mt-4 flex gap-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-[12.5px] leading-relaxed text-slate-300">
                    <Quote
                      className="h-3.5 w-3.5 shrink-0 text-emerald-300"
                      aria-hidden
                    />
                    <span className="line-clamp-4">{c.testimonial}</span>
                  </blockquote>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
