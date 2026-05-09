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
import {
  ShieldCheckIcon,
  WhatsAppIcon,
  TruckIcon,
  LeafIcon,
} from "@/components/home/BenefitIcons";
import HomeServicesPromoCard from "@/components/home/HomeServicesPromoCard";

type Props = {
  categories: PublicCategory[];
  shop: PublicShopSettings;
  heroSlides: HeroSlide[];
};

type BenefitItem = {
  Icon: (props: { className?: string; size?: number }) => React.JSX.Element;
  title: string;
  subtitle: string;
};

const BENEFITS: BenefitItem[] = [
  {
    Icon: ShieldCheckIcon,
    title: "Pagamento seguro",
    subtitle: "Transações protegidas",
  },
  {
    Icon: WhatsAppIcon,
    title: "Atendimento WhatsApp",
    subtitle: "Rápido e humanizado",
  },
  {
    Icon: TruckIcon,
    title: "Entrega regional",
    subtitle: "Mais agilidade pra você",
  },
  {
    Icon: LeafIcon,
    title: "Produtos selecionados",
    subtitle: "Qualidade que o agro confia",
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  insumos: "🌾",
  defensivos: "🧪",
  equipamentos: "🚜",
  ferramentas: "🛠️",
  medicamentos: "💊",
  pets: "🐾",
  alimentos: "🌱",
  default: "📦",
};

function categoryIcon(slug: string): string {
  const k = slug.toLowerCase();
  for (const key of Object.keys(CATEGORY_ICONS)) {
    if (k.includes(key)) return CATEGORY_ICONS[key];
  }
  return CATEGORY_ICONS.default;
}

export default function HomeClient({ categories, shop, heroSlides }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf8] text-slate-900">
      {/* ─── HERO — card largo com bordas arredondadas em todas as breakpoints ─ */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:pt-6">
        <div className="overflow-hidden rounded-[28px] shadow-[0_22px_48px_-22px_rgba(7,63,67,0.55)] ring-1 ring-slate-200/40 sm:rounded-[32px]">
          <HeroCarousel
            slides={heroSlides}
            className="!min-h-[440px] sm:!min-h-[520px] lg:!min-h-[600px]"
          />
        </div>
      </div>

      {/* ─── BENEFÍCIOS — card único, 4-cols com divisores ──────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:pt-7">
        <ul className="grid grid-cols-4 divide-x divide-slate-100 rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
          {BENEFITS.map(({ Icon, title, subtitle }) => (
            <li
              key={title}
              className="flex flex-col items-center justify-center gap-2 px-1.5 py-3.5 text-center sm:gap-2.5 sm:px-2 sm:py-5"
            >
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 sm:h-11 sm:w-11"
              >
                <Icon size={20} />
              </span>
              <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-900 sm:text-[13px]">
                {title}
              </p>
              <p className="hidden text-[10.5px] leading-tight text-slate-500 min-[400px]:line-clamp-2 min-[400px]:block sm:text-[11.5px]">
                {subtitle}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── OFERTAS DA SEMANA ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:pt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF6B16]">
              Promoções
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 sm:text-xl">
              Ofertas da semana
            </h2>
          </div>
          <Link
            href="/produtos"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-500"
          >
            Ver todas
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm sm:rounded-3xl sm:p-5">
          <DestaquesSection />
        </div>
      </section>

      {/* ─── CATÁLOGO DA LOJA ────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-7 sm:pt-10">
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Catálogo da loja
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 sm:text-2xl">
              Encontre o que precisa
            </h2>
          </div>
          <Link
            href="/produtos"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-500"
          >
            Ver todas
            <span aria-hidden>→</span>
          </Link>
        </header>

        {categories.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-700">
            Nenhuma categoria ativa encontrada.
          </div>
        )}

        {/* Atalhos rápidos — chips horizontais */}
        {categories.length > 0 && (
          <div
            className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
            aria-label="Atalhos de categorias"
          >
            <ul className="flex gap-2.5 sm:gap-3">
              {categories.map((cat) => (
                <li key={`chip-${cat.id}`} className="shrink-0">
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className="flex w-[136px] flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition-colors hover:border-emerald-400 sm:w-[148px]"
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-base text-emerald-700"
                    >
                      {categoryIcon(cat.slug)}
                    </span>
                    {/*
                      Texto com separador embutido no MESMO text node:
                      `${name} ›`. Isso evita conflito com `getByText(name)`
                      no HomeClient.test (que matcheria o h3 da seção
                      abaixo se tivéssemos um text node exato).
                    */}
                    <span className="line-clamp-2 text-center text-[11px] font-semibold capitalize leading-tight text-slate-800">
                      {`${cat.name} ›`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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

      {/* ─── SERVIÇOS — card promocional + listagem ─────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:pb-10 sm:pt-10">
        <HomeServicesPromoCard
          imageSrc="/images/home/profissional-agro.jpg"
          imageAlt="Profissional do agro examinando lavoura de café Kavita"
          avatars={[
            {
              src: "/images/home/avatars/agronoma.jpg",
              alt: "Agrônoma Kavita",
            },
            {
              src: "/images/home/avatars/mecanico.jpg",
              alt: "Mecânico de campo Kavita",
            },
            {
              src: "/images/home/avatars/veterinario.jpg",
              alt: "Veterinário Kavita",
            },
          ]}
        />
        <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-4">
          <ServicosSection />
        </div>
      </section>

      <TrustBar />
      <Footer shop={shop} />
    </div>
  );
}
