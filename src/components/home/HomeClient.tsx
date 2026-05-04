// src/components/home/HomeClient.tsx
"use client";

import Link from "next/link";

import type { PublicCategory } from "@/server/data/categories";
import type { HeroSlide } from "@/types/heroSlide";
import type { PublicShopSettings } from "@/server/data/shopSettings";

import HeroCarousel from "@/components/layout/HeroCarousel";
import DestaquesSection from "@/components/products/DestaquesSection";
import ServicosSection from "@/components/layout/ServicosSection";
import ProdutosPorCategoria from "@/components/products/ProdutosPorCategoria";
import TrustBar from "@/components/layout/TrustBar";
import Footer from "@/components/layout/Footer";

type Props = {
  categories: PublicCategory[];
  shop: PublicShopSettings;
  heroSlides: HeroSlide[];
};

const TRUST_ITEMS: { icon: string; title: string; desc: string }[] = [
  { icon: "🔒", title: "Pagamento seguro", desc: "Pix · Cartão · Boleto" },
  { icon: "💬", title: "Atendimento", desc: "WhatsApp e e-mail" },
  { icon: "🚚", title: "Entrega regional", desc: "Cobertura ampliada" },
  { icon: "✓", title: "Selecionados", desc: "Curados pela Kavita" },
];

export default function HomeClient({ categories, shop, heroSlides }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      {/* ─── HERO — modo card no mobile, full-bleed no desktop ───────── */}
      <div className="px-3 pt-3 sm:px-0 sm:pt-0">
        <div className="overflow-hidden rounded-3xl shadow-[0_18px_40px_-20px_rgba(7,63,67,0.45)] ring-1 ring-slate-200/60 sm:rounded-none sm:shadow-none sm:ring-0">
          <HeroCarousel
            slides={heroSlides}
            className="!min-h-[44vh] sm:!min-h-[80vh]"
          />
        </div>
      </div>

      {/* ─── TRUST STRIP — 4 cards (2x2 mobile, 4-col desktop) ───────── */}
      <section className="mx-auto w-full max-w-7xl px-3 pt-5 sm:px-4 sm:pt-7">
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {TRUST_ITEMS.map((it) => (
            <li
              key={it.title}
              className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:gap-3 sm:px-4 sm:py-3"
            >
              <span
                aria-hidden
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm text-emerald-700 sm:h-10 sm:w-10 sm:text-base"
              >
                {it.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-tight text-slate-900 sm:text-sm">
                  {it.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-slate-500 sm:text-xs">
                  {it.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── OFERTAS DA SEMANA ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-3 pt-6 sm:px-4 sm:pt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF6B16]">
              Promoções
            </p>
            <h2 className="mt-0.5 text-base font-bold text-slate-900 sm:text-xl">
              Ofertas da semana
            </h2>
          </div>
          <Link
            href="/produtos"
            className="shrink-0 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-500"
          >
            Ver todas →
          </Link>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <DestaquesSection />
        </div>
      </section>

      {/* ─── CATÁLOGO DA LOJA ────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-3 pt-7 sm:px-4 sm:pt-10">
        <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Catálogo da loja
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 sm:text-2xl">
              Encontre o que você precisa no agro
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Produtos organizados por categoria.
            </p>
          </div>
        </header>

        {categories.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-700">
            Nenhuma categoria ativa encontrada.
          </div>
        )}

        {categories.length > 0 && (
          <div className="space-y-5 sm:space-y-7">
            {categories.map(({ id, name, slug }) => (
              <div key={id} className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-base font-semibold capitalize text-slate-900 sm:text-lg">
                    {name}
                  </h3>
                  <a
                    href={`/categorias/${slug}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:text-xs"
                  >
                    Ver todos
                    <span aria-hidden>→</span>
                  </a>
                </div>
                <ProdutosPorCategoria categoria={slug} limit={12} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SERVIÇOS ────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-3 pb-10 pt-7 sm:px-4 sm:pt-10">
        <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Rede de serviços
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 sm:text-2xl">
              Profissionais para te ajudar no campo
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Veterinários, agrônomos, mecânicos e outros prestadores.
            </p>
          </div>
          <Link
            href="/servicos"
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-400 sm:w-auto"
          >
            Ver todos os serviços
          </Link>
        </header>
        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4">
          <ServicosSection />
        </div>
      </section>

      <TrustBar />
      <Footer shop={shop} />
    </div>
  );
}
