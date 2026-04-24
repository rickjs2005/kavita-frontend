"use client";

// Rodapé "veja também" — mostra os outros 2 modelos da linha DJI Agras
// no fim da página de detalhe, com mini-card clicável que leva pra
// página correspondente.
//
// Mantém o usuário engajado e ajuda quem chegou no modelo errado a
// migrar para o certo sem precisar voltar e procurar.

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
    <section className="relative py-14 sm:py-18">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Veja também
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Os outros modelos da linha
            </h2>
          </div>
          <button
            onClick={() => router.push("/drones")}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/10"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {others.map((m) => {
            const copy = getModelCopy(m.key);
            const accent = getAccent(m.key);

            return (
              <button
                key={m.key}
                onClick={() => router.push(`/drones/${m.key}`)}
                className={[
                  "group relative overflow-hidden rounded-3xl border bg-dark-850/70 text-left transition hover:-translate-y-0.5 hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]",
                  accent.ring,
                ].join(" ")}
              >
                {/* Mídia */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                  {m.mediaUrl && m.mediaType === "video" ? (
                    <video
                      className="h-full w-full object-cover"
                      src={m.mediaUrl}
                      muted
                      playsInline
                      loop
                      preload="metadata"
                    />
                  ) : m.mediaUrl && m.mediaType === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      src={m.mediaUrl}
                      alt={m.label}
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-800 to-dark-900" />
                  )}

                  {/* Overlay gradient escurece pro texto ler melhor */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Halo accent */}
                  <div
                    className={[
                      "pointer-events-none absolute -top-20 -right-10 h-48 w-48 rounded-full blur-3xl opacity-50",
                      accent.halo,
                    ].join(" ")}
                  />

                  {/* Badge no topo */}
                  <div className="absolute left-4 top-4">
                    <span
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.14em] backdrop-blur",
                        accent.badgeBorder,
                        accent.badgeBg,
                        accent.badgeText,
                      ].join(" ")}
                    >
                      <span className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")} />
                      {copy.badge}
                    </span>
                  </div>

                  {/* Título sobre a mídia */}
                  <div className="absolute left-5 right-5 bottom-5">
                    <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                      {m.label}
                    </h3>
                    <p className={["mt-1 text-sm font-semibold", accent.textSoft].join(" ")}>
                      {copy.tagline}
                    </p>
                  </div>
                </div>

                {/* Rodapé com CTA */}
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <p className="text-xs leading-relaxed text-slate-300 line-clamp-2">
                    {copy.description}
                  </p>
                  <span
                    className={[
                      "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition group-hover:translate-x-0.5",
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
      </div>
    </section>
  );
}
