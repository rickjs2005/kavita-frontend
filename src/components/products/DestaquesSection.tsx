"use client";

// src/components/products/DestaquesSection.tsx
//
// PromocoesHero — vitrine de ofertas da home, na identidade Kavita.
//
// Direção visual: TEAL KAVITA + ORANGE COMERCIAL.
// A versão anterior caiu numa paleta amber/lime "safra" que ficou
// bonita mas parecia outro projeto. Esta rewrite traz a seção de volta
// para a identidade real da marca usando os tokens do projeto:
//
//   - bg-primary       (#359293) — teal Kavita, base de marca
//   - bg-accent        (#EC5B20) — laranja Kavita, energia comercial
//   - bg-accent-bright (#FF7A00) — laranja vibrante para hover/glow
//   - --color-header   (#083E46) — teal-navy fundo premium
//   - --color-teal-dark/light — gradients e auras
//
// Estrutura visual:
//   - Container dark teal-navy gradient (header → primary → teal-dark)
//   - Tira top "VITRINE KAVITA · OFERTAS DA SEMANA" em primary
//   - Imagem grande à esquerda, contida em card branco com halo teal
//   - Conteúdo à direita com preço big em laranja (accent), CTA orange
//   - Sticker de desconto laranja-tijolo rotacionado
//   - Navegação inferior com prev/next + dots primary
//
// Carrossel — fix do autoplay:
//   A versão anterior tinha `current` no deps do useEffect, então o
//   interval era recriado a cada tick e podia bagunçar com o React 18
//   StrictMode (efeito dispara duas vezes em dev). Agora seguimos o
//   padrão canônico do HeroCarousel.tsx do projeto:
//
//     useEffect(() => {
//       if (total <= 1 || paused) return;
//       timerRef.current = setInterval(() => {
//         setCurrent((prev) => (prev + 1) % total);
//         setProgressKey((k) => k + 1);
//       }, AUTOPLAY_MS);
//       return () => clearInterval(timerRef.current);
//     }, [total, paused]);
//
//   Deps só dependem de `total` e `paused`. O `setCurrent` usa
//   updater function, então não precisa do `current` no deps. O timer
//   roda sozinho até o componente desmontar ou o usuário pausar.
//
//   Pausa: onMouseEnter/Leave + onTouchStart/End — funciona no mobile
//   (toque pausa, soltar retoma).
//
// Lógica preservada — mesmo fetch /api/public/promocoes, mesmo state
// interno, mesmos textos exigidos pelos testes.

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
      <div
        className="relative overflow-hidden rounded-3xl shadow-2xl shadow-[#041a24]/40"
        style={{
          background:
            "linear-gradient(135deg, #041a24 0%, #083E46 35%, #0f5e63 70%, #053a3f 100%)",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* ─── Atmospheric layer — auras teal + accent ─────────── */}
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

        {/* ─── Top strip — vitrine Kavita ─────────────────────── */}
        <div className="relative border-b border-white/10 bg-white/[0.04] backdrop-blur-md">
          <div className="flex items-center gap-3 px-6 py-3.5 md:px-10">
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
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">
              Vitrine Kavita
              <span className="mx-2 text-white/30">·</span>
              <span className="text-primary">Ofertas da semana</span>
            </p>

            {total > 1 && (
              <span className="ml-auto font-mono text-[10px] font-bold tabular-nums tracking-[0.18em] text-white/60">
                {String(current + 1).padStart(2, "0")}
                <span className="mx-1 text-white/30">/</span>
                {String(total).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Progress bars (uma por slide) */}
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

        {/* ─── Conteúdo principal ─────────────────────────────────── */}
        <div
          key={produto.id}
          className="relative grid animate-[fadeIn_0.6s_ease-out] gap-8 p-6 md:grid-cols-12 md:gap-10 md:p-10 lg:gap-14 lg:p-12"
        >
          {/* ─── ÁREA DA IMAGEM (col 6) ─── */}
          <div className="relative md:col-span-6">
            <div className="relative mx-auto max-w-md">
              {/* Halo teal atrás do produto */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 rounded-[2.5rem] blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(53,194,196,0.30) 0%, rgba(53,146,147,0.15) 40%, transparent 70%)",
                }}
              />

              {/* Frame branco com borda teal */}
              <div className="relative overflow-hidden rounded-[2rem] border-4 border-white/95 bg-white shadow-2xl shadow-[#041a24]/60 ring-1 ring-primary/20">
                {/* Faixa hairline primary topo */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-10 top-0 z-10 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                />

                <div className="relative aspect-square w-full">
                  <Image
                    src={imageUrl}
                    alt={produto.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 80vw, (max-width:1024px) 50vw, 40vw"
                    priority
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#083E46]/15 via-transparent to-transparent"
                  />
                </div>
              </div>

              {/* STICKER de desconto — laranja Kavita */}
              {desconto > 0 && (
                <div
                  className="absolute -right-3 -top-3 z-20 -rotate-[8deg] md:-right-6 md:-top-6"
                  aria-hidden
                >
                  <div className="relative">
                    {/* Glow accent */}
                    <div
                      className="absolute -inset-3 rounded-full blur-lg"
                      style={{ background: "rgba(255,122,0,0.50)" }}
                    />
                    {/* Sticker corpo */}
                    <div
                      className="relative flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full text-white shadow-xl ring-4 ring-white md:h-[108px] md:w-[108px]"
                      style={{
                        background:
                          "linear-gradient(135deg, #FF7A00 0%, #EC5B20 60%, #d44c19 100%)",
                        boxShadow:
                          "0 12px 30px -8px rgba(236,91,32,0.65), 0 0 0 1px rgba(255,255,255,0.4) inset",
                      }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-95">
                        Oferta
                      </span>
                      <span className="font-mono text-2xl font-extrabold tabular-nums leading-none tracking-tight md:text-[1.85rem]">
                        -{desconto.toFixed(0)}%
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] opacity-95">
                        Off
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selo Kavita bottom-left */}
              <div
                className="absolute -bottom-3 left-3 z-20 md:-bottom-4 md:left-6"
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

          {/* ─── CONTEÚDO (col 6) ─── */}
          <div className="relative flex flex-col justify-center md:col-span-6">
            {/* Pill kicker primary */}
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary ring-1 ring-primary/40 backdrop-blur-sm">
              <span aria-hidden className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Oferta em destaque
            </p>

            {/* Título principal */}
            <div className="relative mt-4 w-fit">
              {/* Sublinhado pintado teal */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-1 h-3 rounded-full bg-primary/30 md:h-4"
              />
              <h2 className="relative text-3xl font-extrabold leading-[1.05] tracking-tight text-white md:text-4xl lg:text-[2.75rem]">
                Produtos em Promoção
              </h2>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-[15px]">
              Selecionados pela equipe Kavita para o produtor rural —
              preços especiais por tempo limitado nas principais soluções
              da loja.
            </p>

            {/* Card da oferta */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-5 shadow-xl shadow-black/40 backdrop-blur-sm md:p-6">
              {/* Faixa multicolor topo Kavita (teal → accent) */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1"
                style={{
                  background:
                    "linear-gradient(90deg, #35c2c4 0%, #359293 50%, #FF7A00 100%)",
                }}
              />

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Em destaque agora
              </p>

              <p className="mt-2 text-xl font-bold leading-tight tracking-tight text-white md:text-2xl">
                {produto.name}
              </p>

              {produto.description && (
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/70">
                  {produto.description}
                </p>
              )}

              {/* Bloco de preço */}
              <div className="mt-5 flex items-end gap-4">
                <div className="min-w-0">
                  {original > final && (
                    <p className="font-mono text-[12px] tabular-nums text-white/50">
                      <span className="mr-1 font-sans not-italic text-white/40">
                        de
                      </span>
                      <span className="line-through">
                        {formatCurrency(original)}
                      </span>
                    </p>
                  )}
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: "var(--color-accent-bright)" }}
                    >
                      por
                    </span>
                    <span
                      className="bg-clip-text text-4xl font-extrabold tabular-nums leading-none tracking-tight text-transparent md:text-5xl"
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
                    className="shrink-0 rounded-full border-2 px-3 py-1.5 font-mono text-[11px] font-extrabold tabular-nums uppercase tracking-[0.1em]"
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
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="text-primary"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  Válido até{" "}
                  {new Date(endsAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  <span className="text-white/30">·</span>
                  <span className="font-normal text-white/60">
                    enquanto durarem os estoques
                  </span>
                </p>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={`/produtos/${produto.id}`}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-xl transition-all hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent-bright)]/40"
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
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary underline-offset-4 transition-colors hover:text-[var(--color-teal-light)] hover:underline"
              >
                Ver todas as ofertas →
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Navegação inferior ─────────────────────────────────── */}
        {total > 1 && (
          <div className="relative border-t border-white/10 bg-white/[0.04] backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-10">
              {/* Prev/Next */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  aria-label="Promoção anterior"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:border-primary/60 hover:bg-primary/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:border-primary/60 hover:bg-primary/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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

              {/* Microcopy */}
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:block">
                Vitrine automática
              </p>

              {/* Dots */}
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
