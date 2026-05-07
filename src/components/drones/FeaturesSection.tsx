"use client";

// Seção "Tecnologia embarcada" da página /drones/[id].
// Cards premium com ícone grande, gradiente accent no hover, e
// suporte opcional a imagem topo (se um item trouxer image_url).
//
// Mantém a API: page.features_items_json + accent. Aceita campos
// opcionais image_url/image em cada item — quando presente, o card
// renderiza com imagem topo + overlay; caso contrário, ícone grande.

import { Sparkles } from "lucide-react";
import type { DronePageSettings } from "@/types/drones";
import type { Accent } from "./detail/accent";
import { absUrl } from "@/utils/absUrl";

type FeatureItem = {
  title?: string;
  text?: string;
  image_url?: string;
  image?: string;
};

function normalizeOne(x: any): FeatureItem | null {
  if (!x) return null;

  if (typeof x === "string") {
    const t = x.trim();
    if (!t) return null;
    return { text: t };
  }

  const title = typeof x?.title === "string" ? x.title.trim() : "";
  const text = typeof x?.text === "string" ? x.text.trim() : "";
  const image = typeof x?.image_url === "string" ? x.image_url.trim()
    : typeof x?.image === "string" ? x.image.trim()
    : "";

  if (!title && !text && !image) return null;
  return {
    title: title || undefined,
    text: text || undefined,
    image_url: image || undefined,
  };
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
  const title = page.features_title || "Tecnologia embarcada";
  const items = asItems(page.features_items_json);

  const eyebrow = accent?.text ?? "text-emerald-300";
  const iconBg = accent?.badgeBg ?? "bg-emerald-500/15";
  const iconBorder = accent?.badgeBorder ?? "border-emerald-400/30";
  const iconColor = accent?.text ?? "text-emerald-300";
  const halo = accent?.halo ?? "bg-emerald-500/12";
  const ring = accent?.ring ?? "border-white/10";

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 sm:py-20">
      <div className="mb-10 max-w-2xl">
        <p
          className={[
            "font-mono text-[11px] font-semibold uppercase tracking-[0.24em]",
            eyebrow,
          ].join(" ")}
        >
          Tecnologia embarcada
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Sensores, motores e sistemas que transformam pulverização em
          precisão de catálogo. Cada bloco abaixo é uma vantagem técnica
          comprovada da linha DJI Agras.
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, idx) => (
            <FeatureCard
              key={idx}
              item={it}
              iconBg={iconBg}
              iconBorder={iconBorder}
              iconColor={iconColor}
              halo={halo}
              ring={ring}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
          Configure as funcionalidades no Admin para exibir aqui.
        </div>
      )}
    </section>
  );
}

function FeatureCard({
  item,
  iconBg,
  iconBorder,
  iconColor,
  halo,
  ring,
}: {
  item: FeatureItem;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  halo: string;
  ring: string;
}) {
  const hasImage = Boolean(item.image_url);
  const imgSrc = hasImage ? absUrl(item.image_url || "") : "";

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-3xl border bg-[rgba(8,12,22,0.55)] backdrop-blur-md transition",
        ring,
        "hover:-translate-y-0.5 hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]",
      ].join(" ")}
    >
      {/* Halo accent no hover */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-70",
          halo,
        ].join(" ")}
      />

      {hasImage ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={item.title || "Feature"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
          />
          <div className="absolute left-4 top-4">
            <div
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur",
                iconBorder,
                iconBg,
              ].join(" ")}
            >
              <Sparkles className={["h-5 w-5", iconColor].join(" ")} aria-hidden />
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative p-5 sm:p-6">
        {!hasImage && (
          <div
            className={[
              "inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition group-hover:scale-105",
              iconBorder,
              iconBg,
            ].join(" ")}
          >
            <Sparkles className={["h-5 w-5", iconColor].join(" ")} aria-hidden />
          </div>
        )}

        <h3 className="mt-4 text-base font-extrabold tracking-tight text-white">
          {item.title || "Funcionalidade"}
        </h3>
        {item.text ? (
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">
            {item.text}
          </p>
        ) : null}
      </div>
    </article>
  );
}
