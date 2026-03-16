"use client";

import { useState } from "react";
import type { DroneGalleryItem } from "@/types/drones";
import { absUrl } from "@/utils/absUrl";

function MediaBlock({
  item,
  title,
}: {
  item: DroneGalleryItem;
  title: string;
}) {
  const src = absUrl(item.media_path);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h3 className="text-sm font-extrabold text-white">{title}</h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-slate-200">
          {item.media_type === "VIDEO" ? "VÍDEO" : "IMAGEM"}
        </span>
      </div>

      <div className="p-4 pt-3">
        {item.media_type === "VIDEO" ? (
          <video
            className="block w-full aspect-video object-cover bg-black/30 rounded-2xl min-h-[180px]"
            src={src}
            controls
            playsInline
          />
        ) : imgError ? (
          <div className="flex w-full aspect-video min-h-[180px] items-center justify-center rounded-2xl bg-white/10 text-xs text-slate-400">
            Imagem indisponível
          </div>
        ) : (
          <img
            className="block w-full aspect-video object-cover bg-black/30 rounded-2xl min-h-[180px]"
            src={src}
            alt={item.caption || title}
            width={1280}
            height={720}
            loading="eager"
            onError={() => {
              console.warn(`[GallerySection] MediaBlock image failed to load: ${src}`);
              setImgError(true);
            }}
          />
        )}

        {item.caption ? (
          <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-3">
            {item.caption}
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-400">Sem legenda</p>
        )}
      </div>
    </div>
  );
}

function GalleryItem({
  item,
  isHero,
  isCard,
}: {
  item: DroneGalleryItem;
  isHero: boolean;
  isCard: boolean;
}) {
  const src = absUrl(item.media_path);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
      <div className="relative">
        {item.media_type === "VIDEO" ? (
          <video
            className="block w-full aspect-video object-cover bg-black/30 min-h-[180px]"
            src={src}
            controls
            playsInline
          />
        ) : imgError ? (
          <div className="flex w-full aspect-video min-h-[180px] items-center justify-center bg-white/10 text-xs text-slate-400">
            Imagem indisponível
          </div>
        ) : (
          <img
            className="block w-full aspect-video object-cover bg-black/30 min-h-[180px]"
            src={src}
            alt={item.caption || "Galeria"}
            width={1280}
            height={720}
            loading="lazy"
            onError={() => {
              console.warn(`[GallerySection] Gallery image failed to load: ${src}`);
              setImgError(true);
            }}
          />
        )}

        {/* ✅ badges (opcional, mas ajuda a visualizar) */}
        {(isHero || isCard) && (
          <div className="absolute left-3 top-3 flex gap-2">
            {isHero && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/15 text-white">
                DESTAQUE
              </span>
            )}
            {isCard && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/15 text-white">
                CARD
              </span>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {item.caption ? (
        <div className="p-4">
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
            {item.caption}
          </p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-xs text-slate-400">Sem legenda</p>
        </div>
      )}
    </div>
  );
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
  const heroItem =
    heroItemId != null
      ? items.find((x) => Number(x.id) === Number(heroItemId))
      : undefined;

  const cardItem =
    cardItemId != null
      ? items.find((x) => Number(x.id) === Number(cardItemId))
      : undefined;

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          Galeria
        </h2>
        <span className="hidden sm:inline text-xs text-slate-400">
          Fotos e vídeos reais
        </span>
      </div>

      {/* ✅ DESTAQUE + CARD (cliente recebendo e exibindo) */}
      {(heroItem || cardItem) && (
        <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-2">
          {heroItem ? <MediaBlock item={heroItem} title="Destaque" /> : null}
          {cardItem ? <MediaBlock item={cardItem} title="Card" /> : null}
        </div>
      )}

      {/* Galeria normal */}
      {items.length ? (
        <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const isHero =
              heroItemId != null && Number(it.id) === Number(heroItemId);
            const isCard =
              cardItemId != null && Number(it.id) === Number(cardItemId);

            return (
              <GalleryItem
                key={it.id}
                item={it}
                isHero={isHero}
                isCard={isCard}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Nenhum item na galeria ainda.
        </div>
      )}
    </section>
  );
}
