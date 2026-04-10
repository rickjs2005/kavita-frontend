// src/app/mercado-do-cafe/corretoras/[slug]/page.tsx
//
// Página individual da corretora — RSC
//
// Direção: editorial magazine meets Linear docs. Luz, tipografia
// display, ritmo de largura (wide/narrow/wide/narrow), numeração
// de seções 01-04, switchboard de canais, formulário offset.
//
// O que NÃO está aqui (intencionalmente): dark hero, warm glow,
// coffee bean pattern, background texture, panel-card shadows.
// A página premium vive de respiro + tipografia + hairlines,
// não de dark-mode-com-glow (que virou clichê SaaS).
//
// Lógica, fetch, rota, estado — tudo intocado.

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchPublicCorretoraBySlug } from "@/server/data/corretoras";
import { absUrl } from "@/utils/absUrl";
import { CorretoraContactChannels } from "@/components/mercado-do-cafe/CorretoraContactChannels";
import { LeadContactForm } from "@/components/mercado-do-cafe/LeadContactForm";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const corretora = await fetchPublicCorretoraBySlug(slug);
  if (!corretora) return { title: "Corretora não encontrada | Kavita" };
  return {
    title: `${corretora.name} — Corretora de Café | Kavita`,
    description:
      corretora.description ||
      `${corretora.name} — corretora de café em ${corretora.city}, ${corretora.state}.`,
  };
}

export default async function CorretoraDetailPage({ params }: Props) {
  const { slug } = await params;
  const corretora = await fetchPublicCorretoraBySlug(slug);

  if (!corretora) notFound();

  const isFeatured =
    corretora.is_featured === true || corretora.is_featured === 1;

  return (
    <main className="relative min-h-[calc(100vh-120px)] bg-stone-50 text-stone-900">
      {/* Warm ambient — suave, só no topo, dá atmosfera sem dominar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-amber-50/70 via-stone-50/30 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-4xl px-5 pb-24 pt-6 md:px-8 md:pb-32 md:pt-10">
        {/* ─── Back link — uppercase tracked editorial ───────────── */}
        <Link
          href="/mercado-do-cafe/corretoras"
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-stone-900"
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
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Mercado do Café
        </Link>

        {/* ─── HERO — Editorial 8/4 grid ─────────────────────────── */}
        <header className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:gap-10">
          {/* Main: kicker + title + location */}
          <div className="md:col-span-8">
            {/* Kicker com brand mark inline — assinatura visual */}
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 shrink-0 text-stone-900">
                <PanelBrandMark className="h-full w-full" />
              </div>
              <span aria-hidden className="h-4 w-px bg-stone-300" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                Corretora verificada
              </p>
            </div>

            {/* Display title — o momento tipográfico da página */}
            <h1 className="mt-8 text-4xl font-semibold leading-[0.95] tracking-[-0.02em] text-stone-900 md:text-5xl lg:text-[4.5rem]">
              {corretora.name}
            </h1>

            {/* Location line — tipografia secundária clara */}
            <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-stone-600">
              <span className="inline-flex items-baseline gap-2 text-lg font-medium tracking-tight md:text-xl">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="translate-y-[2px] text-stone-400"
                  aria-hidden
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {corretora.city}, {corretora.state}
              </span>
              {corretora.region && (
                <>
                  <span aria-hidden className="text-stone-300">
                    ·
                  </span>
                  <span className="text-sm font-medium uppercase tracking-[0.14em] text-stone-500">
                    {corretora.region}
                  </span>
                </>
              )}
            </div>

            {isFeatured && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-100/60 px-3 py-1 ring-1 ring-amber-200/60">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-amber-700"
                  aria-hidden
                >
                  <path d="M12 2l2.39 7.36H22l-6.2 4.5 2.38 7.36L12 16.72l-6.18 4.5 2.38-7.36L2 9.36h7.61L12 2z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
                  Corretora em destaque na rede
                </span>
              </div>
            )}
          </div>

          {/* Aside: logo + fact sheet */}
          <aside className="md:col-span-4">
            <div className="flex items-start gap-5 md:flex-col md:items-stretch">
              {/* Logo frame — hairline only, no shadow */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-stone-900/[0.08] md:h-32 md:w-32 md:self-end">
                {corretora.logo_path ? (
                  <Image
                    src={absUrl(corretora.logo_path)}
                    alt={`Logo ${corretora.name}`}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-stone-300">
                    <PanelBrandMark className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Fact sheet — dl com definitions tipo magazine caption */}
              <dl className="flex-1 divide-y divide-stone-900/[0.06] border-y border-stone-900/[0.06] md:mt-6 md:text-right">
                <div className="py-3">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Responsável
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-900">
                    {corretora.contact_name}
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Atuação
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-900">
                    Compra e venda de café
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </header>

        {/* ─── 01 / SOBRE — Reading column narrower ────────────── */}
        {corretora.description && (
          <section className="mt-20 md:mt-28">
            <SectionLabel number="01" title="Sobre a corretora" />
            <div className="mt-8 max-w-2xl">
              <p className="whitespace-pre-line text-lg leading-[1.55] text-stone-700 md:text-xl md:leading-[1.5]">
                {corretora.description}
              </p>
            </div>
          </section>
        )}

        {/* ─── 02 / CANAIS DIRETOS — Full-width switchboard ────── */}
        <section className="mt-20 md:mt-28">
          <SectionLabel
            number="02"
            title="Canais diretos"
            subtitle="Converse pelos canais oficiais da corretora."
          />
          <div className="mt-8">
            <CorretoraContactChannels corretora={corretora} variant="full" />
          </div>
        </section>

        {/* ─── 03 / FORMULÁRIO — Narrow, offset to right ─────── */}
        <section className="mt-20 md:mt-28">
          <SectionLabel
            number="03"
            title="Envie uma mensagem"
            subtitle="Alternativa ao contato direto. O lead cai no painel privado da corretora."
          />
          <div className="mt-8 md:ml-auto md:max-w-2xl">
            <LeadContactForm
              corretoraSlug={corretora.slug}
              corretoraName={corretora.name}
            />
          </div>
        </section>

        {/* ─── 04 / MERCADO — Link minimalista para cotações ──── */}
        <section className="mt-20 md:mt-28">
          <SectionLabel number="04" title="Mercado" />
          <Link
            href="/news/cotacoes"
            className="group mt-8 flex items-center justify-between gap-5 rounded-2xl bg-white px-6 py-5 ring-1 ring-stone-900/[0.06] transition-colors hover:bg-stone-50 md:px-8 md:py-6"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                Cotação do café arábica
              </p>
              <p className="mt-1 text-base font-semibold tracking-tight text-stone-900 md:text-lg">
                Acompanhe o preço em R$/saca 60kg antes de negociar
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                Dados atualizados do mercado internacional
              </p>
            </div>
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-stone-50 transition-transform group-hover:translate-x-0.5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}

// ─── Section label primitive ──────────────────────────────────
// Marcador de seção editorial: número mono-font em amber-800 +
// divisor hairline + título grande + subtítulo opcional. Reaparece
// em toda a página criando ritmo de capítulo estilo Linear docs /
// Monocle magazine.

function SectionLabel({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-t border-stone-900/[0.08] pt-6">
      <div className="flex items-baseline gap-5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-amber-800 tabular-nums">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-stone-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
