"use client";

// src/components/admin/hero/QuickLinksEditor.tsx
//
// Lista dinâmica dos cards de "quick links" que aparecem no rodapé
// do hero público (ex.: MERCADO / CLIMA / TECNOLOGIA / GESTÃO /
// SUSTENTABILIDADE no slide Kavita News). Limite LIMITS.maxQuickLinks
// (5). Cada item: ícone + kicker + título + descrição + href opcional.

import IconPicker from "./IconPicker";
import { LIMITS } from "./constants";
import type { HeroQuickLink } from "@/types/heroSlide";
import type { HeroIconKey } from "@/lib/heroIcons";

type Props = {
  value: HeroQuickLink[];
  onChange: (next: HeroQuickLink[]) => void;
};

const EMPTY_LINK: HeroQuickLink = {
  icon: "chart-line",
  kicker: "",
  title: "",
  description: "",
  href: "",
};

export default function QuickLinksEditor({ value, onChange }: Props) {
  const items = Array.isArray(value) ? value : [];
  const canAdd = items.length < LIMITS.maxQuickLinks;

  function update(index: number, patch: Partial<HeroQuickLink>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    if (!canAdd) return;
    onChange([...items, { ...EMPTY_LINK }]);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Quick links</p>
          <p className="text-xs text-white/55">
            Cards no rodapé do hero. Até {LIMITS.maxQuickLinks}.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] tabular-nums text-white/60">
          {items.length}/{LIMITS.maxQuickLinks}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-6 text-center text-xs text-white/45">
          Nenhum quick link. Clique em <strong>+ Adicionar</strong> abaixo.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((link, i) => {
            const kickerOver = link.kicker.length > LIMITS.quicklink_kicker;
            const titleOver = link.title.length > LIMITS.quicklink_title;
            const descOver =
              (link.description?.length ?? 0) > LIMITS.quicklink_description;
            return (
              <li
                key={i}
                className="rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <IconPicker
                    value={link.icon}
                    onChange={(key) =>
                      update(i, { icon: (key as HeroIconKey) ?? "chart-line" })
                    }
                    size="sm"
                    ariaLabel={`Ícone do quick link ${i + 1}`}
                  />

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        value={link.kicker}
                        maxLength={LIMITS.quicklink_kicker + 5}
                        onChange={(e) => update(i, { kicker: e.target.value })}
                        placeholder="Categoria (ex.: MERCADO)"
                        aria-label={`Categoria do quick link ${i + 1}`}
                        className={`w-full rounded-lg bg-black/30 border px-2.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300 outline-none focus:ring-2 ${
                          kickerOver
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
                        }`}
                      />
                      <input
                        value={link.href ?? ""}
                        maxLength={LIMITS.quicklink_href + 5}
                        onChange={(e) => update(i, { href: e.target.value })}
                        placeholder="Link (opcional)"
                        aria-label={`Href do quick link ${i + 1}`}
                        className="w-full rounded-lg bg-black/30 border border-white/10 px-2.5 py-2 text-[11px] text-white/80 outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <input
                        value={link.title}
                        maxLength={LIMITS.quicklink_title + 5}
                        onChange={(e) => update(i, { title: e.target.value })}
                        placeholder="Título (ex.: Cotações do café hoje)"
                        aria-label={`Título do quick link ${i + 1}`}
                        className={`w-full rounded-lg bg-black/30 border px-2.5 py-2 text-sm font-semibold text-white outline-none focus:ring-2 ${
                          titleOver
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
                        }`}
                      />
                      {titleOver ? (
                        <p className="mt-1 text-[11px] text-red-400">
                          Máximo {LIMITS.quicklink_title} caracteres.
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <textarea
                        value={link.description ?? ""}
                        maxLength={LIMITS.quicklink_description + 5}
                        onChange={(e) =>
                          update(i, { description: e.target.value })
                        }
                        rows={2}
                        placeholder="Descrição curta (ex.: Veja os principais preços atualizados)"
                        aria-label={`Descrição do quick link ${i + 1}`}
                        className={`w-full resize-none rounded-lg bg-black/30 border px-2.5 py-2 text-xs text-white/80 outline-none focus:ring-2 ${
                          descOver
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
                        }`}
                      />
                      {descOver ? (
                        <p className="mt-1 text-[11px] text-red-400">
                          Máximo {LIMITS.quicklink_description} caracteres.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Mover para cima"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      aria-label="Mover para baixo"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label="Remover quick link"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        disabled={!canAdd}
        className="mt-3 w-full rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-white/30"
      >
        {canAdd
          ? "+ Adicionar quick link"
          : `Limite de ${LIMITS.maxQuickLinks} atingido`}
      </button>
    </div>
  );
}
