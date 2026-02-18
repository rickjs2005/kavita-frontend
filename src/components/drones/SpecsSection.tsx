"use client";

import type { DronePageSettings } from "@/types/drones";

type SpecsGroup = {
  title?: string;
  items?: string[];
};

function asGroups(v: any): SpecsGroup[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((g) => ({
      title: typeof g?.title === "string" ? g.title : undefined,
      items: Array.isArray(g?.items)
        ? g.items.filter((x: any) => typeof x === "string")
        : [],
    }))
    .filter((g) => (g.title && g.title.trim()) || (g.items && g.items.length));
}

export default function SpecsSection({ page }: { page: DronePageSettings }) {
  const title = page.specs_title || "Especificações";
  const groups = asGroups(page.specs_items_json);

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">{title}</h2>
      </div>

      {groups.length ? (
        <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <p className="text-sm font-extrabold text-white">{g.title || "Grupo"}</p>

              <ul className="mt-4 grid gap-2">
                {(g.items || []).map((it, i) => (
                  <li key={i} className="text-sm text-slate-200 leading-relaxed">
                    <span className="text-emerald-300/90">•</span> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Configure os itens de especificações no Admin para exibir aqui.
        </div>
      )}
    </section>
  );
}
