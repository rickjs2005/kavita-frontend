"use client";

// src/components/admin/hero/FeaturesEditor.tsx
//
// Lista dinâmica das mini-features exibidas abaixo do CTA no hero
// público. Limite de LIMITS.maxFeatures (4). Cada item: ícone + título
// + subtítulo. O parent (SlideForm) controla o array via prop `value`
// e recebe atualizações via `onChange`.
//
// Validação client-side conforme LIMITS.feature_title/feature_subtitle.
// O backend (Zod) revalida no submit — esta camada é só pra UX.

import IconPicker from "./IconPicker";
import { LIMITS } from "./constants";
import type { HeroFeature } from "@/types/heroSlide";
import type { HeroIconKey } from "@/lib/heroIcons";

type Props = {
  value: HeroFeature[];
  onChange: (next: HeroFeature[]) => void;
};

const EMPTY_FEATURE: HeroFeature = {
  icon: "leaf",
  title: "",
  subtitle: "",
};

export default function FeaturesEditor({ value, onChange }: Props) {
  const items = Array.isArray(value) ? value : [];
  const canAdd = items.length < LIMITS.maxFeatures;

  function update(index: number, patch: Partial<HeroFeature>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    if (!canAdd) return;
    onChange([...items, { ...EMPTY_FEATURE }]);
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
          <p className="text-sm font-semibold text-white">Mini-features</p>
          <p className="text-xs text-white/55">
            Cards pequenos abaixo do CTA. Até {LIMITS.maxFeatures}.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] tabular-nums text-white/60">
          {items.length}/{LIMITS.maxFeatures}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-6 text-center text-xs text-white/45">
          Nenhuma feature adicionada. Clique em <strong>+ Adicionar</strong> abaixo.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((feat, i) => {
            const titleOver = feat.title.length > LIMITS.feature_title;
            const subtitleOver =
              (feat.subtitle?.length ?? 0) > LIMITS.feature_subtitle;
            return (
              <li
                key={i}
                className="rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <IconPicker
                    value={feat.icon}
                    onChange={(key) =>
                      update(i, { icon: (key as HeroIconKey) ?? "leaf" })
                    }
                    size="sm"
                    ariaLabel={`Ícone do feature ${i + 1}`}
                  />

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div>
                      <input
                        value={feat.title}
                        maxLength={LIMITS.feature_title + 5}
                        onChange={(e) => update(i, { title: e.target.value })}
                        placeholder="Título (ex.: Negociação segura)"
                        aria-label={`Título do feature ${i + 1}`}
                        className={`w-full rounded-lg bg-black/30 border px-2.5 py-2 text-sm text-white outline-none focus:ring-2 ${
                          titleOver
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
                        }`}
                      />
                      {titleOver ? (
                        <p className="mt-1 text-[11px] text-red-400">
                          Máximo {LIMITS.feature_title} caracteres.
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <input
                        value={feat.subtitle ?? ""}
                        maxLength={LIMITS.feature_subtitle + 5}
                        onChange={(e) => update(i, { subtitle: e.target.value })}
                        placeholder="Subtítulo (ex.: Ambiente protegido)"
                        aria-label={`Subtítulo do feature ${i + 1}`}
                        className={`w-full rounded-lg bg-black/30 border px-2.5 py-2 text-xs text-white/85 outline-none focus:ring-2 ${
                          subtitleOver
                            ? "border-red-500/50 focus:ring-red-500/20"
                            : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
                        }`}
                      />
                      {subtitleOver ? (
                        <p className="mt-1 text-[11px] text-red-400">
                          Máximo {LIMITS.feature_subtitle} caracteres.
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
                      aria-label="Remover feature"
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
          ? "+ Adicionar mini-feature"
          : `Limite de ${LIMITS.maxFeatures} atingido`}
      </button>
    </div>
  );
}
