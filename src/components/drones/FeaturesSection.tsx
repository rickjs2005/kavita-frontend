"use client";

// Seção de funcionalidades, exibida na página /drones/[id].
// Itens vem do admin em features_items_json: { title, text }.
// Cada item vira um card com ícone + título + texto.
//
// Aceita `accent` opcional para tingir ícone e bordas com a cor do
// modelo (cyan/emerald/amber). Sem accent, cai em emerald neutro.

import { Sparkles } from "lucide-react";
import type { DronePageSettings } from "@/types/drones";
import type { Accent } from "./detail/accent";

type FeatureItem = { title?: string; text?: string };

function normalizeOne(x: any): FeatureItem | null {
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

function asItems(v: any): FeatureItem[] {
  if (!Array.isArray(v)) return [];
  const out: FeatureItem[] = [];
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

export default function FeaturesSection({ page, accent }: Props) {
  const title = page.features_title || "Funcionalidades";
  const items = asItems(page.features_items_json);

  const iconBg = accent?.badgeBg ?? "bg-emerald-500/10";
  const iconBorder = accent?.badgeBorder ?? "border-emerald-400/25";
  const iconColor = accent?.text ?? "text-emerald-300";

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <p className={["font-mono text-[11px] font-semibold uppercase tracking-[0.24em]", accent?.text ?? "text-slate-400"].join(" ")}>
          Tecnologia embarcada
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
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                  iconBorder,
                  iconBg,
                ].join(" ")}
              >
                <Sparkles className={["h-5 w-5", iconColor].join(" ")} aria-hidden />
              </div>
              <p className="mt-4 text-sm font-extrabold text-white">
                {it.title || "Funcionalidade"}
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
          Configure as funcionalidades no Admin para exibir aqui.
        </div>
      )}
    </section>
  );
}
