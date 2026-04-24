"use client";

// Seção de benefícios comerciais, exibida na página /drones/[id].
// Itens vem do admin em benefits_items_json: { title, text }.
// Cada item vira um card numerado com título + texto.
//
// Difere da FeaturesSection por usar numeração ordinal (01, 02, 03…)
// em vez de ícone — reforça "motivos pra comprar" em vez de features.

import type { DronePageSettings } from "@/types/drones";
import type { Accent } from "./detail/accent";

type BenefitItem = { title?: string; text?: string };

function normalizeOne(x: any): BenefitItem | null {
  if (!x) return null;

  if (typeof x?.text === "string") {
    const text = x.text.trim();
    const title = typeof x?.title === "string" ? x.title.trim() : "";
    if (!text && !title) return null;
    return { title: title || undefined, text: text || undefined };
  }

  if (typeof x?.title === "string" || typeof x?.text === "string") {
    const title = typeof x.title === "string" ? x.title.trim() : "";
    const text = typeof x.text === "string" ? x.text.trim() : "";
    if (!title && !text) return null;
    return { title: title || undefined, text: text || undefined };
  }

  if (typeof x === "string") {
    const t = x.trim();
    if (!t) return null;
    return { text: t };
  }

  return null;
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

  const numberColor = accent?.text ?? "text-emerald-300";

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <p className={["font-mono text-[11px] font-semibold uppercase tracking-[0.24em]", accent?.text ?? "text-slate-400"].join(" ")}>
          Benefícios para o operador
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div
                className={[
                  "font-mono text-3xl font-extrabold tabular-nums leading-none",
                  numberColor,
                ].join(" ")}
              >
                {String(idx + 1).padStart(2, "0")}
              </div>
              <p className="mt-4 text-sm font-extrabold text-white">
                {it.title || "Benefício"}
              </p>
              {it.text ? (
                <p className="mt-2 text-[13px] text-slate-300 leading-relaxed">
                  {it.text}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          Configure os benefícios no Admin para exibir aqui.
        </div>
      )}
    </section>
  );
}
