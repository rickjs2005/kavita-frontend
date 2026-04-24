"use client";

// Seção de especificações técnicas, exibida na página /drones/[id].
// Grupos vem do admin em specs_items_json: { title, items[] }.
// Cada grupo vira um card com título + lista de bullets.
//
// Aceita `accent` opcional para tingir bullets e hover com a cor do
// modelo (cyan/emerald/amber). Sem accent, cai em slate neutro.

import { Layers } from "lucide-react";
import type { DronePageSettings } from "@/types/drones";
import type { Accent } from "./detail/accent";

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

type Props = {
  page: DronePageSettings;
  accent?: Accent;
};

export default function SpecsSection({ page, accent }: Props) {
  const title = page.specs_title || "Especificações técnicas";
  const groups = asGroups(page.specs_items_json);

  const bulletColor = accent?.text ?? "text-emerald-300";
  const iconBg = accent?.badgeBg ?? "bg-emerald-500/10";
  const iconBorder = accent?.badgeBorder ?? "border-emerald-400/25";
  const iconColor = accent?.text ?? "text-emerald-300";

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <p className={["font-mono text-[11px] font-semibold uppercase tracking-[0.24em]", accent?.text ?? "text-slate-400"].join(" ")}>
          Ficha técnica
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Dados técnicos oficiais do fabricante. Condições de operação podem
          variar conforme altitude, clima e configuração escolhida.
        </p>
      </div>

      {groups.length ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, idx) => (
            <div
              key={idx}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                    iconBorder,
                    iconBg,
                  ].join(" ")}
                >
                  <Layers className={["h-4 w-4", iconColor].join(" ")} aria-hidden />
                </div>
                <p className="text-sm font-extrabold text-white">
                  {g.title || "Grupo"}
                </p>
              </div>

              <ul className="mt-4 grid gap-2">
                {(g.items || []).map((it, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[13px] text-slate-200 leading-relaxed"
                  >
                    <span className={["mt-1.5 h-1 w-1 shrink-0 rounded-full", bulletColor.replace("text-", "bg-")].join(" ")} />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          Configure os itens de especificações no Admin para exibir aqui.
        </div>
      )}
    </section>
  );
}
