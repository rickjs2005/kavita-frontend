"use client";

// Seção "Por que escolher este modelo" da página /drones/[id].
// Cards numerados (01, 02, 03…) com glow accent na numeração e
// hover de elevação. Itens vêm do admin em benefits_items_json.
//
// Diferença para FeaturesSection: este reforça motivos comerciais
// (não tecnologia) — daí o padrão visual numerado em vez de ícone.

import type { DronePageSettings } from "@/types/drones";
import type { Accent } from "./detail/accent";

type BenefitItem = { title?: string; text?: string };

function normalizeOne(x: any): BenefitItem | null {
  if (!x) return null;

  if (typeof x === "string") {
    const t = x.trim();
    return t ? { text: t } : null;
  }

  const title = typeof x?.title === "string" ? x.title.trim() : "";
  const text = typeof x?.text === "string" ? x.text.trim() : "";
  if (!title && !text) return null;
  return { title: title || undefined, text: text || undefined };
}

function asItems(v: any): BenefitItem[] {
  if (!Array.isArray(v)) return [];
  const out: BenefitItem[] = [];
  for (const x of v) {
    const item = normalizeOne(x);
    if (item) out.push(item);
  }
  return out;
}

type Props = {
  page: DronePageSettings;
  accent?: Accent;
};

export default function BenefitsSection({ page, accent }: Props) {
  const title = page.benefits_title || "Por que escolher este modelo";
  const items = asItems(page.benefits_items_json);

  const eyebrow = accent?.text ?? "text-emerald-300";
  const numberColor = accent?.text ?? "text-emerald-300";
  const halo = accent?.halo ?? "bg-emerald-500/12";

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 sm:py-20">
      <div className="mb-10 max-w-2xl">
        <p
          className={[
            "font-mono text-[11px] font-semibold uppercase tracking-[0.24em]",
            eyebrow,
          ].join(" ")}
        >
          Mais produtividade, menos esforço
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, idx) => (
            <article
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(8,12,22,0.55)] p-6 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
            >
              {/* Halo accent — aparece no hover */}
              <div
                aria-hidden
                className={[
                  "pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-70",
                  halo,
                ].join(" ")}
              />

              <div className="relative flex items-baseline justify-between gap-3">
                <span
                  className={[
                    "font-mono text-4xl sm:text-5xl font-extrabold tabular-nums leading-none",
                    numberColor,
                  ].join(" ")}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Benefício
                </span>
              </div>

              <h3 className="relative mt-5 text-base font-extrabold tracking-tight text-white">
                {it.title || "Benefício"}
              </h3>
              {it.text ? (
                <p className="relative mt-2 text-[13.5px] leading-relaxed text-slate-300">
                  {it.text}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
          Configure os benefícios no Admin para exibir aqui.
        </div>
      )}
    </section>
  );
}
