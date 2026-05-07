"use client";

// Galeria premium da página /drones/[id].
// - Layout masonry via CSS columns (zero deps)
// - Hover cinematográfico com glow accent
// - Lightbox simples com navegação ←/→ e ESC para fechar
// - Suporta vídeo dentro do lightbox
//
// Mantém a API anterior: items + heroItemId/cardItemId.

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { DroneGalleryItem } from "@/types/drones";
import { absUrl } from "@/utils/absUrl";

type ViewerItem = {
  id: number | string;
  src: string;
  type: "VIDEO" | "IMAGE";
  caption?: string;
};

function toViewerItems(items: DroneGalleryItem[]): ViewerItem[] {
  return items.map((it) => ({
    id: it.id,
    src: absUrl(it.media_path),
    type: it.media_type === "VIDEO" ? "VIDEO" : "IMAGE",
    caption: it.caption || "",
  }));
}

export default function GallerySection({
  items,
  heroItemId,
  cardItemId,
}: {
  items: DroneGalleryItem[];
  heroItemId?: number | null;
  cardItemId?: number | null;
}) {
  const viewer = toViewerItems(items);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const close = useCallback(() => setOpenIdx(null), []);
  const next = useCallback(
    () =>
      setOpenIdx((cur) =>
        cur == null ? cur : (cur + 1) % viewer.length,
      ),
    [viewer.length],
  );
  const prev = useCallback(
    () =>
      setOpenIdx((cur) =>
        cur == null ? cur : (cur - 1 + viewer.length) % viewer.length,
      ),
    [viewer.length],
  );

  // Bind teclado quando lightbox aberto
  useEffect(() => {
    if (openIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    // Trava scroll do body enquanto aberto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIdx, close, next, prev]);

  if (!items.length) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-14">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          Galeria
        </h2>
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
          Nenhum item na galeria ainda.
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 sm:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Em campo
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Galeria
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Imagens e vídeos reais — operação Kavita e equipamentos em
            campo. Clique para abrir em tela cheia.
          </p>
        </div>
        <div className="hidden sm:block text-xs text-slate-400">
          {viewer.length} {viewer.length === 1 ? "item" : "itens"}
        </div>
      </div>

      {/* Masonry CSS columns — empacota imagens com aspect ratio variado */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
        {viewer.map((it, idx) => {
          const isHero =
            heroItemId != null && Number(it.id) === Number(heroItemId);
          const isCard =
            cardItemId != null && Number(it.id) === Number(cardItemId);

          return (
            <button
              key={it.id}
              onClick={() => setOpenIdx(idx)}
              className="group relative mb-4 block w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] focus:outline-none focus:ring-2 focus:ring-white/30 break-inside-avoid"
              aria-label={it.caption || "Abrir mídia em tela cheia"}
            >
              {it.type === "VIDEO" ? (
                <div className="relative aspect-video bg-black/40">
                  <video
                    className="h-full w-full object-cover"
                    src={it.src}
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/50">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl transition group-hover:scale-105">
                      <Play className="h-5 w-5 fill-current" aria-hidden />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full bg-black/40">
                  <Image
                    src={it.src}
                    alt={it.caption || "Galeria"}
                    width={800}
                    height={600}
                    className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}

              {/* Overlay gradient — caption aparece no hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100"
              />

              {/* Badges hero/card */}
              {(isHero || isCard) && (
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {isHero && (
                    <span className="rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">
                      Destaque
                    </span>
                  )}
                  {isCard && (
                    <span className="rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">
                      Card
                    </span>
                  )}
                </div>
              )}

              {it.caption && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-4 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[13px] font-semibold leading-snug text-white drop-shadow line-clamp-3">
                    {it.caption}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {openIdx != null && (
        <Lightbox
          item={viewer[openIdx]}
          onClose={close}
          onPrev={prev}
          onNext={next}
          index={openIdx}
          total={viewer.length}
        />
      )}
    </section>
  );
}

function Lightbox({
  item,
  onClose,
  onPrev,
  onNext,
  index,
  total,
}: {
  item: ViewerItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="kvt-fade-in fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur-2xl"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-white/60 tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-white transition hover:bg-white/[0.12]"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Mídia centralizada */}
      <div className="relative flex flex-1 items-center justify-center px-4 sm:px-12">
        {/* Setas */}
        {total > 1 && (
          <>
            <button
              onClick={onPrev}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:bg-black/60 sm:left-6"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <button
              onClick={onNext}
              aria-label="Próxima"
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:bg-black/60 sm:right-6"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </>
        )}

        <div className="relative max-h-full max-w-full">
          {item.type === "VIDEO" ? (
            <video
              key={item.src}
              className="max-h-[80vh] max-w-full rounded-2xl bg-black"
              src={item.src}
              controls
              autoPlay
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.src}
              src={item.src}
              alt={item.caption || "Galeria"}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain"
            />
          )}
        </div>
      </div>

      {/* Caption */}
      {item.caption && (
        <div className="mx-auto max-w-3xl px-6 pb-8 pt-4 text-center">
          <p className="text-sm leading-relaxed text-slate-200">
            {item.caption}
          </p>
        </div>
      )}
    </div>
  );
}
