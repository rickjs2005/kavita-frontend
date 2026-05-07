"use client";

// Rodapé "veja também" — outros 2 modelos da linha DJI Agras.
// Cards cinematográficos com identidade própria por modelo:
// T25P (cyan/sky), T70P (emerald/teal), T100 (amber/orange).
// Mídia gigante com gradientes, halo accent e CTA destacado.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getModelCopy } from "@/lib/drones/modelCopy";
import { getAccent } from "./accent";

type RelatedModel = {
  key: string;
  label: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "";
};

type Props = {
  currentKey: string;
  models: RelatedModel[];
};

export default function RelatedModels({ currentKey, models }: Props) {
  const router = useRouter();
  const others = models.filter(
    (m) => m.key.toLowerCase() !== currentKey.toLowerCase(),
  );

  if (!others.length) return null;

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 sm:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Veja também
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Os outros modelos da linha
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Cada DJI Agras tem um perfil de operação diferente.
            Encontrou o seu? Confira os outros antes de fechar a escolha.
          </p>
        </div>
        <button
          onClick={() => router.push("/drones")}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-extrabold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
        >
          Ver toda a linha
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {others.map((m) => {
          const copy = getModelCopy(m.key);
          const accent = getAccent(m.key);

          return (
            <button
              key={m.key}
              onClick={() => router.push(`/drones/${m.key}`)}
              className={[
                "group relative overflow-hidden rounded-[2rem] border bg-[rgba(8,12,22,0.6)] text-left transition",
                "hover:-translate-y-1 hover:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]",
                accent.ring,
              ].join(" ")}
            >
              {/* Halo radial accent — pulsa no hover */}
              <div
                aria-hidden
                className={[
                  "pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full blur-3xl opacity-50 transition-opacity duration-500 group-hover:opacity-90",
                  accent.halo,
                ].join(" ")}
              />

              {/* Mídia */}
              <div className="relative aspect-[16/10] overflow-hidden">
                {m.mediaUrl && m.mediaType === "video" ? (
                  <video
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    src={m.mediaUrl}
                    muted
                    playsInline
                    loop
                    preload="metadata"
                  />
                ) : m.mediaUrl && m.mediaType === "image" ? (
                  <Image
                    src={m.mediaUrl}
                    alt={m.label}
                    fill
                    quality={80}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div
                    className={[
                      "h-full w-full bg-gradient-to-br",
                      accent.glow,
                    ].join(" ")}
                  />
                )}

                {/* Overlay gradient inferior */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"
                />

                {/* Badge premium no canto */}
                <div className="absolute left-5 top-5">
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.18em] backdrop-blur-md",
                      accent.badgeBorder,
                      accent.badgeBg,
                      accent.badgeText,
                    ].join(" ")}
                  >
                    <span className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")} />
                    {copy.badge}
                  </span>
                </div>

                {/* Título sobre mídia */}
                <div className="absolute inset-x-5 bottom-5">
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {m.label}
                  </h3>
                  <p
                    className={[
                      "mt-1 text-sm sm:text-base font-semibold",
                      accent.textSoft,
                    ].join(" ")}
                  >
                    {copy.tagline}
                  </p>
                </div>
              </div>

              {/* Rodapé com descrição + CTA */}
              <div className="relative flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
                <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-300">
                  {copy.description}
                </p>
                <span
                  className={[
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] transition group-hover:translate-x-0.5",
                    accent.badgeBorder,
                    accent.badgeBg,
                    accent.badgeText,
                  ].join(" ")}
                >
                  Ver modelo
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
