"use client";

// Spec bar HUD horizontal — 5 colunas full-width logo abaixo do hero.
// Cada slot mostra ícone + label uppercase + valor grande + helper.
// Inspiração: painéis tecnológicos de operação (catálogo DJI Agras
// premium). Visual "instrument panel" mais que "card grid".
//
// Fonte de dados: extractKeySpecs do modelData do admin → cai em
// copy.benefits do MODEL_COPY se não houver 5 specs reais.

import {
  Activity,
  Droplet,
  Gauge,
  MountainSnow,
  Radar,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { Accent } from "@/components/drones/detail/accent";

export type SpecBarItem = {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
};

type Props = {
  items: SpecBarItem[];
  accent: Accent;
};

// Mapa heurístico de label → ícone. Tenta casar palavras comuns das
// specs (Capacidade, Vazão, Alcance, Relevo, Produtividade...) com um
// ícone razoável. Quando não casa, cai em Activity (ícone neutro).
function pickIconByLabel(label: string): LucideIcon {
  const k = String(label || "").toLowerCase();
  if (/capac|tanque|carga|peso/.test(k)) return Droplet;
  if (/vaz|fluxo|bicos/.test(k)) return Gauge;
  if (/alcance|largura|raio|distan/.test(k)) return Radar;
  if (/relev|terreno|altitude/.test(k)) return MountainSnow;
  if (/produtiv|hect|hora|jornada|autonom|bateria/.test(k)) return Timer;
  if (/precis|manejo|opera/.test(k)) return Activity;
  return Activity;
}

type ResolvedSpec = SpecBarItem & { Icon: LucideIcon };

export default function SpecBar({ items, accent }: Props) {
  if (!items.length) return null;

  // Limita a 5 slots e resolve ícone uma vez, antes do render — evita
  // re-resolver dentro de SpecCell e satisfaz react-hooks/static-components.
  const slots: ResolvedSpec[] = items.slice(0, 5).map((it) => ({
    ...it,
    Icon: it.icon ?? pickIconByLabel(it.label),
  }));

  return (
    <section
      id="drones-specs"
      className="relative -mt-12 sm:-mt-14 lg:-mt-20"
    >
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(8,12,22,0.85)] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          {/* Halos accent decorativos no topo do bar (lado a lado) */}
          <div
            aria-hidden
            className={[
              "pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full blur-3xl opacity-40",
              accent.halo,
            ].join(" ")}
          />
          <div
            aria-hidden
            className={[
              "pointer-events-none absolute -right-12 -bottom-16 h-40 w-40 rounded-full blur-3xl opacity-40",
              accent.halo,
            ].join(" ")}
          />

          {/* Mobile: scroll horizontal com snap (mantém densidade).
              kvt-scroll-fade-r adiciona gradient fade à direita
              (visível só em <768px) sinalizando "tem mais". */}
          <div className="kvt-scroll-fade-r md:hidden">
            <div className="relative flex snap-x snap-mandatory gap-0 overflow-x-auto scrollbar-hide">
              {slots.map((it, i) => (
                <SpecCell
                  key={`${it.label}-${i}`}
                  item={it}
                  accent={accent}
                  className="snap-start shrink-0 basis-[60%] border-r border-white/8 last:border-r-0"
                />
              ))}
            </div>
          </div>

          {/* Desktop: grid divisores verticais. */}
          <div
            className={[
              "relative hidden divide-x divide-white/8 md:grid",
              slots.length === 5
                ? "md:grid-cols-5"
                : slots.length === 4
                  ? "md:grid-cols-4"
                  : slots.length === 3
                    ? "md:grid-cols-3"
                    : "md:grid-cols-2",
            ].join(" ")}
          >
            {slots.map((it, i) => (
              <SpecCell
                key={`${it.label}-${i}`}
                item={it}
                accent={accent}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecCell({
  item,
  accent,
  className = "",
}: {
  item: ResolvedSpec;
  accent: Accent;
  className?: string;
}) {
  const { Icon } = item;
  return (
    <div
      className={[
        "flex items-start gap-3 px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7",
        "transition hover:bg-white/[0.02]",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          accent.badgeBorder,
          accent.badgeBg,
          accent.text,
        ].join(" ")}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {item.label}
        </div>
        <div
          className={[
            "mt-1 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl",
            accent.text,
          ].join(" ")}
          title={item.value}
        >
          {item.value}
        </div>
        {item.helper ? (
          <div className="mt-0.5 text-[11px] leading-snug text-slate-500">
            {item.helper}
          </div>
        ) : null}
      </div>
    </div>
  );
}
