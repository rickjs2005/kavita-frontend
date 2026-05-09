"use client";

// src/components/products/DestaquesSection.tsx
//
// PromocoesHero — vitrine de ofertas da home, na identidade Kavita.
//
// Refactor visual (2026-05-09): layout reorganizado para hero text à
// esquerda + card de produto à direita, com imagem de fundo dourada
// (produtor olhando o cafezal) e CTA "Ver todas as ofertas".
//
// LÓGICA PRESERVADA — tudo o que os 14 testes em
// __tests__/components/DestaquesSection.test.tsx exigem segue idêntico:
//   - fetch GET /api/public/promocoes
//   - state machine (current/paused/progressKey/timerRef)
//   - autoplay 10s, pause em hover/touch
//   - dots clicáveis "Ir para promoção N"
//   - h2 "Produtos em Promoção" sempre presente
//   - pill "Oferta em destaque" (default) ou produto.title
//   - selo "-XX% OFF" + linha "de R$ X" / "por R$ Y"
//   - linha "Válido até DD/MM" quando ends_at definido
//   - link "Ver oferta" → /produtos/{id}
//   - placeholder.png como fallback de imagem ausente
//   - container null em lista vazia ou erro de API
//
// Apenas a apresentação mudou: nada de fetch, nem state, nem texto
// foi alterado.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import { formatCurrency, formatDateShort } from "@/utils/formatters";

type PromoProduct = Product & {
  image?: string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  ends_at?: string | null;
  // Título da campanha configurado no admin (ex.: "Oferta do Campo").
  // Backend já devolve via d.title em /api/public/promocoes, mas o tipo
  // Product não declara esse campo, então o spread perdia a chave.
  title?: string | null;
};

const AUTOPLAY_MS = 10000; // 10s
const BG_IMAGE = "/images/home/destaques-bg.jpg";

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
            title:
              typeof item.title === "string" && item.title.trim()
                ? item.title.trim()
                : null,
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

  // ── Autoplay ───────────────────────────────────────────────────
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
      className="relative overflow-hidden rounded-2xl shadow-xl shadow-black/20 md:rounded-3xl md:shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      key={`hero-${progressKey}`}
    >
      {/* ── Background ───────────────────────────────────────── */}
      <div className="absolute inset-0">
        <Image
          src={BG_IMAGE}
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover"
        />
        {/* Overlay escurecimento + gradient pra realçar texto à esquerda */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#041a24]/95 via-[#041a24]/75 to-[#041a24]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* ── Conteúdo principal — 2 colunas ───────────────────── */}
      <div className="relative grid grid-cols-1 gap-6 p-5 sm:p-7 md:grid-cols-[1.1fr_1fr] md:gap-10 md:p-10 lg:p-12">
        {/* HERO TEXT (esquerda) */}
        <div className="flex flex-col justify-center text-white">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-emerald-400/40 backdrop-blur-sm sm:text-[11px]">
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Ofertas em destaque
          </p>

          {/* IMPORTANTE: texto em um único nó pra DestaquesSection.test
              poder usar `screen.findByText("Produtos em Promoção")` —
              RTL não atravessa filhos por padrão. A cor especial em
              "Promoção" foi removida para preservar o contrato textual. */}
          <h2 className="mt-4 max-w-[14ch] text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl md:mt-5 md:text-5xl lg:text-[3.25rem]">
            Produtos em Promoção
          </h2>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:mt-4 sm:text-base">
            Selecionados pela equipe Kavita para impulsionar sua produtividade
            com os melhores preços.
          </p>

          <Link
            href="/produtos"
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-6px_rgba(16,185,129,0.6)] transition-all hover:bg-emerald-400 hover:shadow-[0_14px_28px_-6px_rgba(16,185,129,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:mt-6 sm:px-6 sm:py-3 sm:text-sm"
          >
            Ver todas as ofertas
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* PRODUTO ATUAL (direita) — card branco */}
        <article
          key={produto.id}
          className="relative animate-[fadeIn_0.5s_ease-out] rounded-2xl bg-white p-3.5 shadow-2xl shadow-black/30 sm:p-4 md:p-5"
        >
          {/* Imagem do produto + selos sobrepostos */}
          <div className="relative">
            {desconto > 0 && (
              <span
                className="absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white shadow-md sm:text-[11px]"
                style={{
                  background:
                    "linear-gradient(135deg, #FF7A00 0%, #EC5B20 60%, #d44c19 100%)",
                }}
              >
                -{desconto.toFixed(0)}% OFF
              </span>
            )}

            <button
              type="button"
              aria-label="Adicionar aos favoritos"
              className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-500 ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:text-rose-500 sm:h-9 sm:w-9"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
            </button>

            <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-50">
              <Image
                src={imageUrl}
                alt={produto.name}
                width={500}
                height={500}
                priority
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>

          {/* Pill da campanha — preserva 'Oferta em destaque' / produto.title */}
          <p className="mt-3 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-200">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="truncate">
              {produto.title || "Oferta em destaque"}
            </span>
          </p>

          {/* Nome do produto */}
          <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-tight tracking-tight text-slate-900 sm:text-base">
            {produto.name}
          </h3>

          {/* Descrição */}
          {produto.description && (
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-600 sm:text-[13px]">
              {produto.description}
            </p>
          )}

          {/* Preço de/por */}
          <div className="mt-3">
            {original > final && (
              <p className="font-mono text-[12px] tabular-nums text-slate-400">
                <span className="mr-1 font-sans not-italic text-slate-400">
                  de
                </span>
                <span className="line-through">{formatCurrency(original)}</span>
              </p>
            )}
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-600 sm:text-[11px]">
                por
              </span>
              <span className="text-2xl font-extrabold tabular-nums leading-none tracking-tight text-slate-900 sm:text-[1.65rem]">
                {formatCurrency(final)}
              </span>
            </div>
          </div>

          {/* Validade */}
          {endsAt && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
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
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>Válido até {formatDateShort(endsAt)}</span>
            </p>
          )}

          {/* CTA Ver oferta */}
          <Link
            href={`/produtos/${produto.id}`}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:text-sm"
          >
            Ver oferta
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </article>
      </div>

      {/* ── Navegação inferior — setas + dots ───────────────── */}
      {total > 1 && (
        <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 md:px-10">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="Promoção anterior"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:h-10 sm:w-10"
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
                      ? "h-2 w-9 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] transition-all duration-300"
                      : "h-2 w-2 rounded-full bg-white/30 transition-all duration-300 hover:bg-white/60"
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Próxima promoção"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:h-10 sm:w-10"
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
        </div>
      )}
    </section>
  );
}
