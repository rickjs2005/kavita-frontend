"use client";

import type { DronePageSettings } from "@/types/drones";

type FeatureItem = { title?: string; text?: string };

function normalizeOne(x: any): FeatureItem | null {
  if (!x) return null;

  // ✅ novo formato: { text }
  if (typeof x?.text === "string") {
    const text = x.text.trim();
    const title = typeof x?.title === "string" ? x.title.trim() : "";
    if (!text && !title) return null;
    return { title: title || undefined, text: text || undefined };
  }

  // ✅ legado: { title, text }
  if (typeof x?.title === "string" || typeof x?.text === "string") {
    const title = typeof x.title === "string" ? x.title.trim() : "";
    const text = typeof x.text === "string" ? x.text.trim() : "";
    if (!title && !text) return null;
    return { title: title || undefined, text: text || undefined };
  }

  // ✅ se vier string acidentalmente (ex: array de strings)
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

export default function FeaturesSection({ page }: { page: DronePageSettings }) {
  const title = page.features_title || "Funcionalidades";
  const items = asItems(page.features_items_json);

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">{title}</h2>

      {items.length ? (
        <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 h-8 w-8 rounded-2xl bg-emerald-500/15 border border-emerald-400/20" />
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {it.title || "Funcionalidade"}
                  </p>

                  {it.text ? (
                    <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                      {it.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Configure as funcionalidades no Admin para exibir aqui.
        </div>
      )}
    </section>
  );
}
