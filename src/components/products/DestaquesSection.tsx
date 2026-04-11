"use client";

// src/components/products/DestaquesSection.tsx
//
// PromocoesHero — bloco de promoções da home.
//
// Redesign visual: deixa de ser "banner emerald + amber blob" e passa
// a ser uma vitrine editorial dark espresso, com a mesma DNA premium
// que o resto do projeto vem ganhando (stone-950 + ring-white/[0.08]
// + accent amber-400). A composição agora é split 5/7 (imagem grande à
// esquerda, conteúdo à direita), com top-strip de progresso do
// autoplay, kicker mono, preço editorial big tabular nums, CTA gradient
// amber e navegação refinada (prev/next + ticks ativos).
//
// Lógica preservada — mesmo fetch, mesmo state, mesmas props de teste:
//   - h2 "Produtos em Promoção"
//   - "-X% OFF" badge text
//   - "Válido até DD/MM" line
//   - Link href="/produtos/{id}"
//   - aria-label "Ir para promoção N" para cada dot

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import { formatCurrency } from "@/utils/formatters";

type PromoProduct = Product & {
  image?: string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  ends_at?: string | null;
};

const SLIDE_INTERVAL = 6000; // 6s

export default function PromocoesHero() {
  const [promocoes, setPromocoes] = useState<PromoProduct[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchPromocoes = async () => {
      try {
        const data = await apiClient.get("/api/public/promocoes");
        const list = Array.isArray(data) ? data : [];

        const mapped: PromoProduct[] = list.map((item: any) => {
          const originalNum = Number(item.original_price ?? item.price ?? 0);
          const finalNum = Number(
            item.final_price ??
              item.promo_price ??
              item.price ??
              item.original_price ??
              0,
          );

          const discountNum =
            item.discount_percent != null
              ? Number(item.discount_percent)
              : originalNum > 0
                ? ((originalNum - finalNum) / originalNum) * 100
                : 0;

          return {
            ...(item as Product),
            image: item.image ?? item.main_image ?? item.foto ?? null,
            price: finalNum,
            preco: finalNum,
            original_price: originalNum,
            final_price: finalNum,
            discount_percent: discountNum > 0 ? discountNum : null,
            promo_price:
              item.promo_price != null ? Number(item.promo_price) : null,
            ends_at: item.ends_at ?? null,
          };
        });

        setPromocoes(mapped);
        setCurrent(0);
      } catch (err) {
        console.error("Erro ao buscar promoções:", err);
      }
    };

    fetchPromocoes();
  }, []);

  // autoplay (pausa no hover/focus)
  useEffect(() => {
    if (promocoes.length <= 1 || paused) return;

    const id = setInterval(
      () =>
        setCurrent((prev) => (prev + 1 >= promocoes.length ? 0 : prev + 1)),
      SLIDE_INTERVAL,
    );

    return () => clearInterval(id);
  }, [promocoes.length, paused, current]);

  // Reinicia animação da barra de progresso ao trocar slide
  useEffect(() => {
    const el = tickRef.current;
    if (!el) return;
    el.style.animation = "none";
    void el.offsetWidth;
    if (!paused && promocoes.length > 1) {
      el.style.animation = `kavita-promo-tick ${SLIDE_INTERVAL}ms linear forwards`;
    }
  }, [current, paused, promocoes.length]);

  if (promocoes.length === 0) return null;

  const produto = promocoes[current];

  const original = Number(produto.original_price ?? produto.price ?? 0);
  const final = Number(produto.final_price ?? produto.price ?? 0);

  const desconto =
    produto.discount_percent != null
      ? Number(produto.discount_percent)
      : original > 0
        ? ((original - final) / original) * 100
        : 0;

  const endsAt = produto.ends_at;
  const imageUrl = absUrl(produto.image as string | null);

  const total = promocoes.length;
  const goPrev = () =>
    setCurrent((prev) => (prev === 0 ? total - 1 : prev - 1));
  const goNext = () =>
    setCurrent((prev) => (prev + 1 >= total ? 0 : prev + 1));

  return (
    <section aria-label="Promoções em destaque">
      {/* Keyframes locais para a barra de tick do autoplay */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@keyframes kavita-promo-tick { from { transform: scaleX(0); } to { transform: scaleX(1); } }",
        }}
      />

      <div
        className="relative overflow-hidden rounded-3xl bg-stone-950 text-stone-100 shadow-2xl shadow-stone-900/40 ring-1 ring-stone-900"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* ─── Atmospheric warm glows ────────────────────────────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-amber-500/[0.10] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-32 h-[460px] w-[460px] rounded-full bg-orange-700/[0.08] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/3 h-[360px] w-[360px] rounded-full bg-amber-700/[0.07] blur-3xl"
        />

        {/* ─── Top strip: kicker + counter + autoplay tick ────── */}
        <div className="relative border-b border-white/[0.08] bg-stone-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3 px-5 py-3 md:px-8">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
            </span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Kavita
              <span className="mx-2 text-stone-600">·</span>
              <span className="text-stone-300">Ofertas em destaque</span>
            </p>
            {total > 1 && (
              <span className="ml-auto font-mono text-[10px] font-semibold tabular-nums tracking-[0.18em] text-stone-400">
                {String(current + 1).padStart(2, "0")}
                <span className="mx-1 text-stone-600">/</span>
                {String(total).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Tick bar do autoplay */}
          {total > 1 && (
            <div
              className="relative h-px w-full overflow-hidden bg-white/[0.04]"
              aria-hidden
            >
              <div
                ref={tickRef}
                className="h-full origin-left bg-gradient-to-r from-amber-400 via-amber-300 to-orange-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
              />
            </div>
          )}
        </div>

        {/* ─── Conteúdo principal ─────────────────────────────────── */}
        <div className="relative grid gap-8 p-6 md:grid-cols-12 md:gap-10 md:p-10 lg:gap-12 lg:p-12">
          {/* ─── Imagem (col 5) ─── */}
          <div className="relative md:col-span-5">
            <div className="relative">
              {/* Halo amber atrás da imagem */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-transparent blur-2xl"
              />

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 via-white to-stone-50 ring-1 ring-white/15 shadow-2xl shadow-black/50">
                {/* Top highlight hairline */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-10 top-0 z-10 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
                />

                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={imageUrl}
                    alt={produto.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 40vw"
                  />
                  {/* Vinheta inferior sutil para legibilidade do badge */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/15 via-transparent to-transparent"
                  />
                </div>

                {/* Badge desconto floating top-right */}
                {desconto > 0 && (
                  <div className="absolute right-4 top-4 z-10">
                    <div className="relative">
                      <div
                        aria-hidden
                        className="absolute -inset-1 rounded-full bg-amber-400/40 blur-md"
                      />
                      <span className="relative inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 px-3 py-1 font-mono text-[11px] font-bold uppercase tabular-nums tracking-[0.08em] text-stone-950 shadow-lg shadow-amber-500/40 ring-1 ring-amber-200/60">
                        -{desconto.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Conteúdo (col 7) ─── */}
          <div className="relative md:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-400/20">
              <span
                aria-hidden
                className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
              />
              Oferta em destaque
            </p>

            <h2 className="mt-4 text-2xl font-bold leading-[1.1] tracking-tight text-stone-50 md:text-3xl lg:text-4xl">
              Produtos em Promoção
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-400 md:text-[15px]">
              Descontos selecionados pela equipe Kavita para o produtor
              rural — preços especiais por tempo limitado nas principais
              soluções da loja.
            </p>

            {/* Painel da oferta atual */}
            <div className="relative mt-7 overflow-hidden rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-xl shadow-black/30 backdrop-blur-sm md:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
              />

              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                Em destaque agora
              </p>

              <p className="mt-2 text-lg font-semibold leading-tight tracking-tight text-stone-50 md:text-xl">
                {produto.name}
              </p>

              {produto.description && (
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-stone-400">
                  {produto.description}
                </p>
              )}

              {/* Bloco de preço */}
              <div className="mt-5 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  {original > final && (
                    <p className="font-mono text-[11px] tabular-nums text-stone-500 line-through">
                      {formatCurrency(original)}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-baseline gap-1.5 text-stone-50">
                    <span className="bg-gradient-to-br from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-3xl font-extrabold tabular-nums tracking-tight text-transparent md:text-4xl">
                      {formatCurrency(final)}
                    </span>
                  </p>
                </div>

                {desconto > 0 && (
                  <span className="shrink-0 rounded-full bg-amber-400/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tabular-nums tracking-[0.1em] text-amber-300 ring-1 ring-amber-400/30">
                    -{desconto.toFixed(0)}% OFF
                  </span>
                )}
              </div>

              {endsAt && (
                <p className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="text-amber-300/70"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  Válido até{" "}
                  {new Date(endsAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  <span className="text-stone-600">·</span>
                  <span className="font-sans normal-case tracking-normal text-stone-500">
                    enquanto durarem os estoques
                  </span>
                </p>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={`/produtos/${produto.id}`}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 hover:shadow-amber-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                />
                <span className="relative flex items-center gap-2">
                  Ver oferta
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </span>
              </Link>

              <Link
                href="/produtos"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-amber-300"
              >
                Ver todas as ofertas →
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Navegação inferior ─────────────────────────────────── */}
        {total > 1 && (
          <div className="relative border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-10">
              {/* Prev/Next */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Promoção anterior"
                  className="group flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:text-amber-200 hover:ring-amber-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Próxima promoção"
                  className="group flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:text-amber-200 hover:ring-amber-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Ticks */}
              <div className="flex items-center gap-2">
                {promocoes.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Ir para promoção ${index + 1}`}
                    aria-current={index === current ? "true" : undefined}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === current
                        ? "w-8 bg-gradient-to-r from-amber-300 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        : "w-4 bg-white/15 hover:bg-amber-400/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
