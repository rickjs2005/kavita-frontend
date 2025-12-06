"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { api } from "@/lib/api";

type PromoProduct = Product & {
  image?: string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  ends_at?: string | null;
};

const SLIDE_INTERVAL = 6000; // 6s
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const PLACEHOLDER =
  "https://via.placeholder.com/600x400?text=Produto+sem+imagem";

// mesma ideia que usamos no admin
function getImageUrl(raw?: string | null): string {
  if (!raw) return PLACEHOLDER;

  let p = String(raw).trim().replace(/\\/g, "/");

  // já é URL completa
  if (/^https?:\/\//i.test(p)) return p;

  // remove barras iniciais duplicadas
  p = p.replace(/^\/+/, "");

  // se vier só "uploads/..." já funciona
  return `${API_BASE}/${p}`;
}

export default function PromocoesHero() {
  const [promocoes, setPromocoes] = useState<PromoProduct[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchPromocoes = async () => {
      try {
        const data = await api("/api/public/promocoes");
        const list = Array.isArray(data) ? data : [];

        const mapped: PromoProduct[] = list.map((item: any) => {
          const originalNum = Number(item.original_price ?? item.price ?? 0);
          const finalNum = Number(
            item.final_price ??
              item.promo_price ??
              item.price ??
              item.original_price ??
              0
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

  // autoplay
  useEffect(() => {
    if (promocoes.length <= 1) return;

    const id = setInterval(
      () =>
        setCurrent((prev) =>
          prev + 1 >= promocoes.length ? 0 : prev + 1
        ),
      SLIDE_INTERVAL
    );

    return () => clearInterval(id);
  }, [promocoes.length]);

  if (promocoes.length === 0) return null;

  const produto = promocoes[current];

  const original = Number(
    produto.original_price ?? produto.price ?? 0
  );
  const final = Number(produto.final_price ?? produto.price ?? 0);

  const desconto =
    produto.discount_percent != null
      ? Number(produto.discount_percent)
      : original > 0
      ? ((original - final) / original) * 100
      : 0;

  const endsAt = produto.ends_at;
  const imageUrl = getImageUrl(produto.image as string | null);

  return (
    <section className="mb-10 px-4 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-3xl bg-emerald-700/95 px-4 py-6 text-white shadow-lg sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        {/* fundo decorativo */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-400 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Texto da oferta */}
          <div className="max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
              Ofertas especiais
            </span>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
              Produtos em Promoção
            </h2>
            <p className="mt-2 text-sm text-emerald-50/90 sm:text-base">
              Descontos selecionados com carinho para o produtor rural.
              Aproveite preços especiais por tempo limitado nas principais
              soluções do Kavita.
            </p>

            <div className="mt-4 rounded-2xl bg-emerald-900/40 p-3 text-sm sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                Oferta em destaque
              </p>
              <p className="mt-1 text-lg font-semibold">
                {produto.name}
              </p>

              {produto.description && (
                <p className="mt-1 line-clamp-2 text-xs text-emerald-100/90 sm:text-sm">
                  {produto.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-baseline gap-2 text-sm">
                {original > final && (
                  <span className="text-xs text-emerald-200 line-through">
                    R$ {original.toFixed(2)}
                  </span>
                )}
                <span className="text-xl font-extrabold text-amber-200">
                  R$ {final.toFixed(2)}
                </span>
                {desconto > 0 && (
                  <span className="rounded-full bg-amber-300/90 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                    -{desconto.toFixed(0)}% OFF
                  </span>
                )}
              </div>

              {endsAt && (
                <p className="mt-1 text-[11px] text-amber-100">
                  Válido até{" "}
                  {new Date(endsAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  , ou enquanto durarem os estoques.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/produtos/${produto.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-emerald-900 shadow-md transition hover:bg-amber-200"
                >
                  Ver oferta
                </Link>
              </div>
            </div>
          </div>

          {/* Imagem grande do produto */}
          <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <div className="relative overflow-hidden rounded-3xl bg-white/95 shadow-xl">
              <div className="relative h-56 w-full sm:h-64 lg:h-72">
                <Image
                  src={imageUrl}
                  alt={produto.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 40vw"
                />
              </div>

              <div className="border-t border-emerald-100/60 px-4 py-3 text-xs text-emerald-900/90 sm:px-5 sm:py-4">
                <p className="line-clamp-1 font-semibold">
                  {produto.name}
                </p>
              </div>

              {desconto > 0 && (
                <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                  -{desconto.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bolinhas de navegação */}
        {promocoes.length > 1 && (
          <div className="relative z-10 mt-5 flex justify-center gap-2">
            {promocoes.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-2.5 rounded-full transition ${
                  index === current
                    ? "w-6 bg-amber-300"
                    : "w-2 bg-emerald-200/60 hover:bg-amber-200"
                }`}
                aria-label={`Ir para promoção ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
