"use client";

// src/components/products/DestaquesSection.tsx
//
// PromocoesHero — vitrine de ofertas da safra na home.
//
// Direção visual: SAFRA / VITRINE COMERCIAL DO AGRO. A versão anterior
// herdou o DNA dark espresso de Mercado do Café e ficou com cara de
// "outra página de corretora", quando promoções precisam transmitir
// energia comercial, vitrine viva, oportunidade. Essa rewrite quebra
// completamente com o stone-950 e adota uma paleta light warm campo:
//
//   - Background: gradient cream → orange-50 → lime-50 (sol + sand + folha)
//   - Accent comercial: emerald-600 (CTA, vida, crescimento)
//   - Accent urgência: rose-600 (sticker de desconto rotacionado)
//   - Accent calor: amber-500 (kickers, sun-burst atrás da imagem)
//
// Outras decisões:
//   - Container com border orgânica (rounded-[2.5rem]) e sombras quentes
//   - Padrão sutil de "campo" (linhas curvas SVG topographic) no fundo
//   - Imagem do produto sobre um sun-burst radial amber + leaf-blob
//     verde — referência sutil a sol e folhagem, sem virar caricato
//   - Sticker de desconto vermelho rotacionado -8deg (linguagem de
//     etiqueta de promoção, mas com ring branco e shadow elegante)
//   - Preço final em vermelho-tijolo grande (urgência) com gradient
//     leve, original riscado discreto acima
//   - CTA verde-folha sólido (emerald-600 → emerald-700 hover) com
//     ícone de seta e ring de foco coerente
//   - Carrossel: autoplay 6s + crossfade entre slides + tick bar +
//     prev/next + dots ativos verdes + pausa no hover/focus
//
// Lógica preservada — mesmo fetch /api/public/promocoes, mesmo state,
// mesmos textos exigidos pelos testes (h2 "Produtos em Promoção",
// "-X% OFF", "Válido até DD/MM", aria-label "Ir para promoção N",
// link "/produtos/{id}", formatCurrency).

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

  // Autoplay (pausa no hover/focus)
  useEffect(() => {
    if (promocoes.length <= 1 || paused) return;

    const id = setInterval(
      () =>
        setCurrent((prev) => (prev + 1 >= promocoes.length ? 0 : prev + 1)),
      SLIDE_INTERVAL,
    );

    return () => clearInterval(id);
  }, [promocoes.length, paused, current]);

  // Reinicia animação da barra de tick a cada slide
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
      {/* Keyframes locais (tick autoplay + crossfade) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes kavita-promo-tick {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
            @keyframes kavita-promo-fade {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .kavita-promo-fade {
              animation: kavita-promo-fade 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }
          `,
        }}
      />

      <div
        className="relative overflow-hidden rounded-[2.5rem] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-lime-50 shadow-2xl shadow-amber-900/10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* ─── Background decorativo: campo / safra ─────────────── */}

        {/* Sol nascente top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-gradient-radial from-amber-300/40 via-orange-200/20 to-transparent blur-2xl"
          style={{
            background:
              "radial-gradient(circle at center, rgba(252,211,77,0.45), rgba(254,215,170,0.18) 40%, transparent 70%)",
          }}
        />

        {/* Folhagem bottom-left (verde-folha orgânico) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 h-[460px] w-[460px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(132,204,22,0.30), rgba(190,242,100,0.12) 45%, transparent 75%)",
          }}
        />

        {/* Faixa horizonte sutil — terra/colheita */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-amber-100/50 to-transparent"
        />

        {/* Padrão de linhas curvas tipo lavoura (topographic SVG) */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="kavita-field-rows"
              x="0"
              y="0"
              width="1200"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0,80 Q300,40 600,80 T1200,80"
                fill="none"
                stroke="#65a30d"
                strokeWidth="1.5"
              />
              <path
                d="M0,40 Q300,0 600,40 T1200,40"
                fill="none"
                stroke="#a16207"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="1200" height="600" fill="url(#kavita-field-rows)" />
        </svg>

        {/* ─── Top strip: marca vitrine + counter + tick ─────── */}
        <div className="relative border-b border-amber-200/60 bg-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-6 py-3.5 md:px-10">
            {/* Folhinha SVG inline — referência sutil ao agro */}
            <span
              className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-700/30"
              aria-hidden
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M11 20A7 7 0 0 1 4 13c0-2.5 1-4.5 3-6 3-2 7-2 11-1-1 4-1 8-3 11-1.5 2-3.5 3-4 3z" />
                <path d="M2 22c1-7 5-11 12-13" />
              </svg>
            </span>

            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800">
              Kavita
              <span className="mx-2 text-amber-700/60">·</span>
              <span className="text-amber-800">Ofertas da Safra</span>
            </p>

            {total > 1 && (
              <span className="ml-auto font-mono text-[10px] font-bold tabular-nums tracking-[0.18em] text-stone-500">
                {String(current + 1).padStart(2, "0")}
                <span className="mx-1 text-stone-400">/</span>
                {String(total).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Tick bar autoplay (sun + leaf gradient) */}
          {total > 1 && (
            <div
              className="relative h-[3px] w-full overflow-hidden bg-amber-100"
              aria-hidden
            >
              <div
                ref={tickRef}
                className="h-full origin-left bg-gradient-to-r from-emerald-500 via-lime-500 to-amber-500 shadow-[0_0_10px_rgba(132,204,22,0.5)]"
              />
            </div>
          )}
        </div>

        {/* ─── Conteúdo principal ─────────────────────────────────── */}
        <div
          key={produto.id}
          className="kavita-promo-fade relative grid gap-8 p-6 md:grid-cols-12 md:gap-10 md:p-10 lg:gap-14 lg:p-12"
        >
          {/* ─── ÁREA DA IMAGEM (col 6) ─── */}
          <div className="relative md:col-span-6">
            <div className="relative mx-auto max-w-md">
              {/* Sun-burst SVG atrás do produto */}
              <svg
                aria-hidden
                viewBox="0 0 200 200"
                className="pointer-events-none absolute inset-0 -m-12 h-[calc(100%+6rem)] w-[calc(100%+6rem)] animate-[spin_60s_linear_infinite] text-amber-300/30"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 360) / 24;
                  return (
                    <line
                      key={i}
                      x1="100"
                      y1="100"
                      x2="100"
                      y2="6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      transform={`rotate(${angle} 100 100)`}
                    />
                  );
                })}
              </svg>

              {/* Leaf blob verde atrás (assimétrico, orgânico) */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-4 rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-gradient-to-br from-lime-200/70 via-emerald-200/50 to-amber-100/40 blur-sm"
              />

              {/* Card da imagem */}
              <div className="relative overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-2xl shadow-amber-900/20">
                <div className="relative aspect-square w-full">
                  <Image
                    src={imageUrl}
                    alt={produto.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 80vw, (max-width:1024px) 50vw, 40vw"
                    priority
                  />
                  {/* Vinheta inferior */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-transparent"
                  />
                </div>
              </div>

              {/* STICKER DESCONTO — selo rotacionado de promoção */}
              {desconto > 0 && (
                <div
                  className="absolute -right-3 -top-3 z-20 -rotate-[8deg] md:-right-6 md:-top-6"
                  aria-hidden
                >
                  <div className="relative">
                    {/* Glow vermelho atrás */}
                    <div
                      className="absolute -inset-2 rounded-full bg-rose-500/40 blur-lg"
                      aria-hidden
                    />
                    {/* Sticker */}
                    <div className="relative flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 text-white shadow-xl shadow-rose-900/40 ring-4 ring-white md:h-[104px] md:w-[104px]">
                      <span className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-90">
                        Oferta
                      </span>
                      <span className="font-mono text-2xl font-extrabold tabular-nums leading-none tracking-tight md:text-3xl">
                        -{desconto.toFixed(0)}%
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] opacity-90">
                        Off
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selo "Direto do campo" bottom-left */}
              <div
                className="absolute -bottom-3 left-3 z-20 md:-bottom-4 md:left-6"
                aria-hidden
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-emerald-900/30 ring-2 ring-white">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
                  </svg>
                  Para o campo
                </span>
              </div>
            </div>
          </div>

          {/* ─── CONTEÚDO (col 6) ─── */}
          <div className="relative flex flex-col justify-center md:col-span-6">
            {/* Pill kicker comercial */}
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-lime-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800 shadow-sm ring-1 ring-emerald-600/20">
              <span
                aria-hidden
                className="relative flex h-2 w-2"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              Oferta em destaque
            </p>

            {/* Título principal */}
            <div className="relative mt-4 w-fit">
              {/* Sublinhado pintado com tom amarelo-safra */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-1 h-3 rounded-full bg-amber-300/60 md:h-4"
              />
              <h2 className="relative text-3xl font-extrabold leading-[1.05] tracking-tight text-stone-900 md:text-4xl lg:text-[2.75rem]">
                Produtos em Promoção
              </h2>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-600 md:text-[15px]">
              Selecionados pela equipe Kavita para o produtor rural —
              preços de safra por tempo limitado nas principais soluções
              da loja.
            </p>

            {/* Card da oferta — vitrine */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-amber-200/80 bg-white/85 p-5 shadow-xl shadow-amber-900/10 backdrop-blur-sm md:p-6">
              {/* Faixa superior amber */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
              />

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Em destaque agora
              </p>

              <p className="mt-2 text-xl font-bold leading-tight tracking-tight text-stone-900 md:text-2xl">
                {produto.name}
              </p>

              {produto.description && (
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-stone-600">
                  {produto.description}
                </p>
              )}

              {/* Preço grande comercial */}
              <div className="mt-5 flex items-end gap-4">
                <div className="min-w-0">
                  {original > final && (
                    <p className="font-mono text-[12px] tabular-nums text-stone-500">
                      <span className="mr-1 font-sans not-italic text-stone-400">
                        de
                      </span>
                      <span className="line-through">
                        {formatCurrency(original)}
                      </span>
                    </p>
                  )}
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700">
                      por
                    </span>
                    <span className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 bg-clip-text text-4xl font-extrabold tabular-nums leading-none tracking-tight text-transparent md:text-5xl">
                      {formatCurrency(final)}
                    </span>
                  </div>
                </div>

                {desconto > 0 && (
                  <span className="shrink-0 rounded-full border-2 border-rose-600 bg-rose-50 px-3 py-1.5 font-mono text-[11px] font-extrabold tabular-nums uppercase tracking-[0.1em] text-rose-700">
                    -{desconto.toFixed(0)}% OFF
                  </span>
                )}
              </div>

              {endsAt && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">
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
                    className="text-amber-700"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  Válido até{" "}
                  {new Date(endsAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  <span className="text-amber-600">·</span>
                  <span className="font-normal text-amber-800/80">
                    enquanto durarem os estoques
                  </span>
                </p>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={`/produtos/${produto.id}`}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-xl shadow-emerald-700/30 transition-all hover:from-emerald-400 hover:via-emerald-500 hover:to-emerald-600 hover:shadow-emerald-700/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/40"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                />
                <span className="relative">Ver oferta</span>
                <span
                  aria-hidden
                  className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5"
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
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800 underline-offset-4 transition-colors hover:text-emerald-700 hover:underline"
              >
                Ver todas as ofertas →
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Navegação inferior ─────────────────────────────────── */}
        {total > 1 && (
          <div className="relative border-t border-amber-200/60 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-10">
              {/* Prev/Next */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Promoção anterior"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-emerald-600/30 bg-white text-emerald-700 shadow-sm transition-all hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
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
                  onClick={goNext}
                  aria-label="Próxima promoção"
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-emerald-600/30 bg-white text-emerald-700 shadow-sm transition-all hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
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

              {/* Microcopy "auto" */}
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 sm:block">
                Vitrine automática
              </p>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {promocoes.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Ir para promoção ${index + 1}`}
                    aria-current={index === current ? "true" : undefined}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === current
                        ? "w-9 bg-gradient-to-r from-emerald-500 to-lime-500 shadow-md shadow-emerald-700/30"
                        : "w-2 bg-amber-300/60 hover:bg-emerald-400/60"
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
