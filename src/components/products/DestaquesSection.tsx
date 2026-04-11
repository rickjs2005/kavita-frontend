"use client";

// src/components/products/DestaquesSection.tsx
//
// PromocoesHero — vitrine de ofertas da home, na identidade Kavita.
//
// Identidade visual: TEAL KAVITA + ORANGE COMERCIAL.
//   - bg-primary       (#359293) — teal Kavita, base de marca
//   - bg-accent        (#EC5B20) — laranja Kavita, energia comercial
//   - bg-accent-bright (#FF7A00) — laranja vibrante para hover/glow
//   - --color-header   (#083E46) — teal-navy fundo premium
//
// Carrossel: padrão canônico do HeroCarousel.tsx (useRef + progressKey,
// deps [total, paused], setCurrent updater function), 10s, pause on
// hover/touch.
//
// ─── Responsividade — refactor com grid-template-areas ──────────
//
// O problema das versões anteriores era escalar valores sem reorganizar
// a composição. No mobile o usuário via uma versão "comprimida" do
// desktop, com card-dentro-de-card, imagem dominando a vertical e
// hierarquia confusa entre o título da seção e o nome do produto.
//
// Esta versão usa grid-template-areas com media query para reordenar
// e relayoutar de verdade — não só ajustar tamanhos. UM ÚNICO h2
// renderizado, posicionado por grid em ambas as telas:
//
// Mobile (single col, ordem comercial):
//   ┌──────────┐
//   │   pill   │  ← oferta em destaque
//   │  title   │  ← "Produtos em Promoção" (kicker pequeno mobile)
//   │ product  │  ← nome BIG + preço HUGE + desconto
//   │   cta    │  ← botão full-width
//   │  image   │  ← banner horizontal compacto no fim
//   └──────────┘
//
// Desktop (5fr 7fr, image span vertical):
//   ┌──────┬────────┐
//   │      │  pill  │
//   │      │ title  │
//   │image │product │
//   │      │  cta   │
//   │      │   .    │
//   └──────┴────────┘
//
// Decisões mobile (mobile-first real, não shrink):
//   - Sem inner glass card no produto (o container já é o card)
//   - Sem subtítulo institucional
//   - Sem descrição do produto (line-clamp comia 2 linhas inúteis)
//   - Sem "Em destaque agora" interno (a pill já fala isso)
//   - Sem selo "Verificado Kavita" (poluía o frame)
//   - Title h2 vira KICKER pequeno (cor primary uppercase) para não
//     competir com o nome do produto, que é o herói visual
//   - Imagem vai pro FIM, em formato banner h-44 (não devora vertical)
//   - Sticker de desconto reduzido para 64px com -2/-2
//   - CTA full-width
//
// Desktop preserva tudo: glass card no produto, descrição, subtítulo,
// selo verificado, título display grande, halo teal, image quadrada.
//
// Lógica preservada — mesmo fetch /api/public/promocoes, mesmo state,
// mesmos textos exigidos pelos testes.

import { useCallback, useEffect, useRef, useState } from "react";
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

const AUTOPLAY_MS = 10000; // 10s

export default function PromocoesHero() {
  const [promocoes, setPromocoes] = useState<PromoProduct[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
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
        setProgressKey((k) => k + 1);
      } catch (err) {
        console.error("Erro ao buscar promoções:", err);
      }
    };

    fetchPromocoes();
  }, []);

  // ── Autoplay (padrão canônico HeroCarousel) ───────────────────
  const total = promocoes.length;

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
      setProgressKey((k) => k + 1);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, paused]);

  const goTo = useCallback(
    (idx: number) => {
      if (total === 0) return;
      setCurrent(((idx % total) + total) % total);
      setProgressKey((k) => k + 1);
    },
    [total],
  );

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

  return (
    <section
      aria-label="Promoções em destaque"
      aria-roledescription="carousel"
    >
      {/* Grid template areas — fonte de verdade da reorganização */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .kavita-promo-grid {
              display: grid;
              grid-template-columns: 1fr;
              grid-template-areas:
                "pill"
                "title"
                "product"
                "cta"
                "image";
              gap: 0.75rem;
            }
            @media (min-width: 768px) {
              .kavita-promo-grid {
                grid-template-columns: 5fr 7fr;
                grid-template-areas:
                  "image pill"
                  "image title"
                  "image product"
                  "image cta"
                  "image .";
                column-gap: 2.5rem;
                row-gap: 0;
                align-items: start;
              }
            }
            @media (min-width: 1024px) {
              .kavita-promo-grid {
                column-gap: 3.5rem;
              }
            }
          `,
        }}
      />

      <div
        className="relative overflow-hidden rounded-2xl shadow-xl shadow-[#041a24]/40 md:rounded-3xl md:shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, #041a24 0%, #083E46 35%, #0f5e63 70%, #053a3f 100%)",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* ─── Atmospheric layer ─────────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-[460px] w-[460px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(53,194,196,0.20) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-32 h-[480px] w-[480px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(236,91,32,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 h-[360px] w-[360px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(53,146,147,0.12) 0%, transparent 70%)",
          }}
        />

        {/* ─── Top strip ─────────── */}
        <div className="relative border-b border-white/10 bg-white/[0.04] backdrop-blur-md">
          <div className="flex items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-6 sm:py-3.5 md:px-10">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: "var(--color-accent-bright)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full shadow-[0_0_8px_rgba(255,122,0,0.7)]"
                style={{ background: "var(--color-accent-bright)" }}
              />
            </span>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-[11px] sm:tracking-[0.22em]">
              <span className="text-primary">Ofertas da semana</span>
              <span className="hidden sm:inline">
                <span className="mx-2 text-white/30">·</span>
                <span className="text-white">Vitrine Kavita</span>
              </span>
            </p>

            {total > 1 && (
              <span className="ml-auto shrink-0 font-mono text-[10px] font-bold tabular-nums tracking-[0.16em] text-white/60 sm:tracking-[0.18em]">
                {String(current + 1).padStart(2, "0")}
                <span className="mx-1 text-white/30">/</span>
                {String(total).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Progress bars */}
          {total > 1 && (
            <div
              key={progressKey}
              className="flex h-[3px] w-full items-stretch gap-[2px] bg-white/5 px-1"
              aria-hidden
            >
              {promocoes.map((_, i) => (
                <div
                  key={i}
                  className="relative flex-1 overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className={
                      i === current
                        ? !paused
                          ? "absolute inset-y-0 left-0 rounded-full bg-primary animate-[progressBar_linear_forwards]"
                          : "absolute inset-0 rounded-full bg-primary"
                        : i < current
                          ? "absolute inset-0 rounded-full bg-primary/40"
                          : ""
                    }
                    style={
                      i === current && !paused
                        ? { animationDuration: `${AUTOPLAY_MS}ms` }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Conteúdo principal — grid template areas ─────────── */}
        <div
          key={produto.id}
          className="kavita-promo-grid relative animate-[fadeIn_0.6s_ease-out] p-4 sm:p-5 md:p-10 lg:p-12"
        >
          {/* ── PILL ── */}
          <div style={{ gridArea: "pill" }}>
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary ring-1 ring-primary/40 backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-[11px] sm:tracking-[0.16em]">
              <span aria-hidden className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
              </span>
              Oferta em destaque
            </p>
          </div>

          {/* ── TITLE — h2 único, dois visuais via responsive classes ── */}
          {/*
            Mobile: small kicker style (text-[10px] uppercase tracking-wide
                    color primary). Não compete com o nome do produto.
            Desktop: BIG display (text-3xl/4xl extrabold branco) com
                     sublinhado pintado teal embaixo.
          */}
          <div
            style={{ gridArea: "title" }}
            className="mt-1 md:mt-4"
          >
            <div className="relative md:w-fit">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-1 hidden h-3 rounded-full bg-primary/30 md:block md:h-4"
              />
              <h2 className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-primary md:text-3xl md:font-extrabold md:normal-case md:leading-[1.05] md:tracking-tight md:text-white lg:text-4xl xl:text-[2.75rem]">
                Produtos em Promoção
              </h2>
            </div>

            {/* Subtítulo — só desktop */}
            <p className="mt-4 hidden max-w-xl text-sm leading-relaxed text-white/70 md:block md:text-[15px]">
              Selecionados pela equipe Kavita para o produtor rural —
              preços especiais por tempo limitado nas principais soluções
              da loja.
            </p>
          </div>

          {/* ── PRODUCT (nome + preço + desconto + ends_at) ── */}
          {/*
            Mobile: sem wrapper glass — flui direto no gradient.
                    Nome e preço são os heróis visuais.
            Desktop: glass card via classes md: (border, bg, padding, shadow).
          */}
          <div
            style={{ gridArea: "product" }}
            className="relative mt-2 md:mt-6 md:overflow-hidden md:rounded-2xl md:border md:border-white/15 md:bg-white/[0.06] md:p-6 md:shadow-xl md:shadow-black/40 md:backdrop-blur-sm"
          >
            {/* Faixa multicolor topo — só desktop dentro do card */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 hidden h-1 md:block"
              style={{
                background:
                  "linear-gradient(90deg, #35c2c4 0%, #359293 50%, #FF7A00 100%)",
              }}
            />

            {/* Kicker "Em destaque agora" — só desktop */}
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-primary md:block">
              Em destaque agora
            </p>

            {/* NOME DO PRODUTO — herói visual no mobile */}
            <p className="text-[1.625rem] font-extrabold leading-[1.1] tracking-tight text-white md:mt-2 md:text-2xl md:font-bold md:leading-tight">
              {produto.name}
            </p>

            {/* Descrição — só desktop */}
            {produto.description && (
              <p className="mt-2 hidden line-clamp-2 text-[13px] leading-relaxed text-white/70 md:block">
                {produto.description}
              </p>
            )}

            {/* Bloco de preço — sempre coluna no mobile */}
            <div className="mt-3 md:mt-5 md:flex md:items-end md:gap-4">
              <div className="min-w-0 md:flex-1">
                {original > final && (
                  <p className="font-mono text-[12px] tabular-nums text-white/55">
                    <span className="mr-1 font-sans not-italic text-white/40">
                      de
                    </span>
                    <span className="line-through">
                      {formatCurrency(original)}
                    </span>
                  </p>
                )}
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "var(--color-accent-bright)" }}
                  >
                    por
                  </span>
                  <span
                    className="bg-clip-text text-[2.5rem] font-extrabold tabular-nums leading-none tracking-tight text-transparent sm:text-5xl md:text-5xl"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #FF7A00 0%, #EC5B20 70%, #d44c19 100%)",
                    }}
                  >
                    {formatCurrency(final)}
                  </span>
                </div>
              </div>

              {desconto > 0 && (
                <span
                  className="mt-3 inline-flex w-fit shrink-0 rounded-full border-2 px-3 py-1.5 font-mono text-[11px] font-extrabold tabular-nums uppercase tracking-[0.1em] md:mt-0"
                  style={{
                    borderColor: "var(--color-accent)",
                    background: "rgba(236,91,32,0.12)",
                    color: "var(--color-accent-bright)",
                  }}
                >
                  -{desconto.toFixed(0)}% OFF
                </span>
              )}
            </div>

            {/* ends_at */}
            {endsAt && (
              <p
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold ring-1"
                style={{
                  background: "rgba(53,194,196,0.10)",
                  color: "#cffafe",
                  borderColor: "rgba(53,194,196,0.30)",
                }}
              >
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
                  className="shrink-0 text-primary"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span>
                  Válido até{" "}
                  {new Date(endsAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
                <span className="hidden text-white/30 md:inline">·</span>
                <span className="hidden font-normal text-white/60 md:inline">
                  enquanto durarem os estoques
                </span>
              </p>
            )}
          </div>

          {/* ── CTA ── */}
          <div
            style={{ gridArea: "cta" }}
            className="mt-4 flex flex-col items-stretch gap-3 md:mt-6 md:flex-row md:flex-wrap md:items-center md:gap-4"
          >
            <Link
              href={`/produtos/${produto.id}`}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] text-white shadow-xl transition-all hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent-bright)]/40 md:w-auto md:px-7 md:text-sm"
              style={{
                background:
                  "linear-gradient(135deg, #FF7A00 0%, #EC5B20 60%, #d44c19 100%)",
                boxShadow:
                  "0 12px 30px -8px rgba(236,91,32,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
              />
              <span className="relative">Ver oferta</span>
              <span
                aria-hidden
                className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/25 transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            <Link
              href="/produtos"
              className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-primary underline-offset-4 transition-colors hover:text-[var(--color-teal-light)] hover:underline md:text-left md:tracking-[0.16em]"
            >
              Ver todas as ofertas →
            </Link>
          </div>

          {/* ── IMAGEM ── */}
          {/*
            Mobile: vai pro fim do flow, banner horizontal h-44 (não
                    devora vertical), sem halo, sem selo verificado.
            Desktop: span vertical na coluna esquerda, aspect quadrado
                     com halo teal e selo verificado.
          */}
          <div
            style={{ gridArea: "image" }}
            className="relative mt-4 md:mt-0 md:self-stretch"
          >
            <div className="relative md:mx-auto md:max-w-md">
              {/* Halo teal — só desktop */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 hidden rounded-[2.5rem] blur-2xl md:block"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(53,194,196,0.30) 0%, rgba(53,146,147,0.15) 40%, transparent 70%)",
                }}
              />

              {/* Frame branco */}
              <div className="relative overflow-hidden rounded-2xl border-[3px] border-white/95 bg-white shadow-xl shadow-[#041a24]/60 ring-1 ring-primary/20 md:rounded-[2rem] md:border-4 md:shadow-2xl">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-0 z-10 h-px bg-gradient-to-r from-transparent via-primary to-transparent md:inset-x-10"
                />

                {/* Mobile: banner horizontal h-40 / Desktop: quadrado */}
                <div className="relative h-40 w-full sm:h-48 md:aspect-square md:h-auto">
                  <Image
                    src={imageUrl}
                    alt={produto.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 45vw, 38vw"
                    priority
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#083E46]/15 via-transparent to-transparent"
                  />
                </div>
              </div>

              {/* STICKER de desconto — menor e mais discreto no mobile */}
              {desconto > 0 && (
                <div
                  className="absolute -right-2 -top-2 z-20 -rotate-[8deg] md:-right-6 md:-top-6"
                  aria-hidden
                >
                  <div className="relative">
                    <div
                      className="absolute -inset-2 rounded-full blur-lg md:-inset-3"
                      style={{ background: "rgba(255,122,0,0.50)" }}
                    />
                    <div
                      className="relative flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full text-white shadow-xl ring-[3px] ring-white md:h-[108px] md:w-[108px] md:ring-4"
                      style={{
                        background:
                          "linear-gradient(135deg, #FF7A00 0%, #EC5B20 60%, #d44c19 100%)",
                        boxShadow:
                          "0 12px 30px -8px rgba(236,91,32,0.65), 0 0 0 1px rgba(255,255,255,0.4) inset",
                      }}
                    >
                      <span className="text-[7px] font-bold uppercase tracking-[0.10em] opacity-95 md:text-[9px] md:tracking-[0.16em]">
                        Oferta
                      </span>
                      <span className="font-mono text-base font-extrabold tabular-nums leading-none tracking-tight md:text-[1.85rem]">
                        -{desconto.toFixed(0)}%
                      </span>
                      <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.08em] opacity-95 md:text-[9px] md:tracking-[0.14em]">
                        Off
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selo Kavita — só desktop */}
              <div
                className="absolute -bottom-4 left-6 z-20 hidden md:block"
                aria-hidden
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg ring-2 ring-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #35c2c4 0%, #359293 60%, #2b797a 100%)",
                    boxShadow: "0 8px 20px -4px rgba(53,146,147,0.55)",
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
                  </svg>
                  Verificado Kavita
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Navegação inferior ─────────── */}
        {total > 1 && (
          <div className="relative border-t border-white/10 bg-white/[0.04] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 md:px-10">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  aria-label="Promoção anterior"
                  className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:border-primary/60 hover:bg-primary/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-10 sm:w-10"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  aria-label="Próxima promoção"
                  className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:border-primary/60 hover:bg-primary/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-10 sm:w-10"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:block">
                Vitrine automática
              </p>

              <div className="flex items-center gap-2">
                {promocoes.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Ir para promoção ${index + 1}`}
                    aria-current={index === current ? "true" : undefined}
                    className={
                      index === current
                        ? "h-2 w-9 rounded-full bg-primary shadow-[0_0_10px_rgba(53,194,196,0.6)] transition-all duration-300"
                        : "h-2 w-2 rounded-full bg-white/25 transition-all duration-300 hover:bg-primary/60"
                    }
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
