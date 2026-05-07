"use client";

// Seção "Tecnologia embarcada" — cards catálogo com mídia à esquerda
// e título/descrição à direita. Layout estilo DJI Store (referência).
//
// Fonte: features_items_json do modelo selecionado (admin/drones →
// aba Modelos → editor de Features). Cada item aceita image_url
// opcional. Sem image_url, renderiza em modo "ícone" (degradação
// elegante).
//
// Fallback estático com 5 items genéricos quando não há features
// reais cadastradas — landing nunca fica vazia.

import Image from "next/image";
import {
  Cpu,
  Droplet,
  Gauge,
  Radar,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import type { Accent } from "@/components/drones/detail/accent";
import { absUrl } from "@/utils/absUrl";

export type TechItem = {
  title?: string;
  text?: string;
  image_url?: string;
};

const FALLBACK_ITEMS: Array<TechItem & { Icon: LucideIcon }> = [
  {
    title: "Motores potentes",
    text: "Alta performance e estabilidade em qualquer condição de voo.",
    Icon: Cpu,
  },
  {
    title: "Tanque de alta capacidade",
    text: "Maior autonomia entre recargas, mais hectares por jornada.",
    Icon: Droplet,
  },
  {
    title: "Pulverização precisa",
    text: "Sistema com gotas uniformes e sem desperdício por sobreposição.",
    Icon: Gauge,
  },
  {
    title: "Sensores inteligentes",
    text: "Detecção de obstáculos e leitura do terreno em tempo real.",
    Icon: Radar,
  },
  {
    title: "Controle total",
    text: "Planejamento de voo simples e intuitivo na palma da mão.",
    Icon: Settings2,
  },
];

function pickIconByTitle(title: string): LucideIcon {
  const k = String(title || "").toLowerCase();
  if (/motor|propuls/.test(k)) return Cpu;
  if (/tanque|carga|capacidade/.test(k)) return Droplet;
  if (/pulveriz|bicos|aplica/.test(k)) return Gauge;
  if (/sensor|radar|detect/.test(k)) return Radar;
  if (/control|plano|app/.test(k)) return Settings2;
  return Cpu;
}

type Props = {
  items: TechItem[];
  accent: Accent;
  modelLabel?: string;
};

type ResolvedTech = TechItem & { Icon: LucideIcon };

export default function TechSection({ items, accent, modelLabel }: Props) {
  // Resolve uma única vez antes do render — atende
  // react-hooks/static-components.
  const resolvedItems: ResolvedTech[] =
    items.length > 0
      ? items.slice(0, 5).map((it) => ({
          ...it,
          Icon: pickIconByTitle(it.title || ""),
        }))
      : FALLBACK_ITEMS;

  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute right-0 top-0 h-72 w-[40rem] rounded-full blur-3xl opacity-40",
          accent.halo,
        ].join(" ")}
      />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Tecnologia embarcada
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl">
            Tecnologia que entrega resultados
          </h2>
          {modelLabel ? (
            <p className="mt-2 text-[13px] text-slate-400">
              Configurações de {modelLabel}
            </p>
          ) : null}
        </div>

        {/* Grid horizontal: até 5 cards lado-a-lado em desktop. Em mobile,
            cada card vira full-width com mídia à esquerda. */}
        <div className="mt-10 grid gap-3 lg:grid-cols-5">
          {resolvedItems.map((it, idx) => (
            <TechCard
              key={`${it.title}-${idx}`}
              item={it}
              accent={accent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TechCard({
  item,
  accent,
}: {
  item: ResolvedTech;
  accent: Accent;
}) {
  const { Icon } = item;
  const hasImage = Boolean(item.image_url);
  const imgSrc = hasImage ? absUrl(item.image_url || "") : "";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.55)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/20">
      {/* Mídia (lateral em mobile, topo em desktop) */}
      <div className="relative h-32 w-full overflow-hidden bg-[rgba(0,0,0,0.4)] sm:h-36">
        {hasImage ? (
          <Image
            src={imgSrc}
            alt={item.title || "Tecnologia"}
            fill
            sizes="(max-width: 1024px) 100vw, 20vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          // Modo "ícone" quando admin não subiu imagem — gradient accent
          // sutil + ícone Lucide grande centralizado.
          <div
            className={[
              "flex h-full w-full items-center justify-center bg-gradient-to-br",
              accent.glow,
            ].join(" ")}
          >
            <Icon className={["h-10 w-10", accent.text].join(" ")} aria-hidden />
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
        />
      </div>

      <div className="p-4">
        <h3 className="text-[13.5px] font-extrabold tracking-tight text-white">
          {item.title || "Tecnologia"}
        </h3>
        {item.text ? (
          <p className="mt-1 text-[12px] leading-relaxed text-slate-300/90 line-clamp-3">
            {item.text}
          </p>
        ) : null}
      </div>
    </article>
  );
}
