// src/app/mercado-do-cafe/corretoras/[slug]/page.tsx
//
// Página individual da corretora — RSC
//
// Direção: editorial premium com gradiente como elemento principal.
// Sem imagem, sem textura, sem dark hero. O visual vive de:
//   1. Hero card com gradient linear + 2 glows radiais (warm golden hour)
//   2. Page background stone-50 + overlay de luz warm no topo
//   3. Footer row com mesmo gradient warm → rima visual topo/fundo
//   4. Hairline rings em vez de shadows
//   5. Tipografia display como âncora
//   6. Seções numeradas 01–04 com hairline gradient fade
//
// Lógica, fetch, estado — tudo intocado. Só composição e CSS.

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
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-50 text-stone-900">
      {/* ─── Layer 1 — Page atmosphere ─────────────────────────────
          Warm glow muito sutil no topo, estende além da borda do hero.
          Dá sensação de "luz da manhã entrando" sem texturizar nada. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-gradient-to-b from-amber-50/40 via-stone-50/20 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-[100%] bg-orange-100/20 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-4xl px-5 pb-24 pt-6 md:px-8 md:pb-32 md:pt-10">
        {/* ─── Back link ──────────────────────────────────────────── */}
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

        {/* ─── HERO — Gradient card premium ─────────────────────────
            Aqui mora o gradient principal da página. Três camadas
            trabalhando juntas: base linear warm cream → orange suave,
            glow radial top-right (luz dourada), glow radial bottom-left
            (profundidade), hairline ring fino para definir a borda. */}
        <header
          className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50/60 px-6 py-14 ring-1 ring-stone-900/[0.06] md:mt-14 md:px-14 md:py-20"
          aria-label={`Identidade da corretora ${corretora.name}`}
        >
          {/* Camada 2 — Glow radial top-right (golden hour) */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-32 h-[440px] w-[440px] rounded-full bg-amber-200/50 blur-3xl"
          />
          {/* Camada 3 — Glow radial bottom-left (profundidade) */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-32 h-[460px] w-[460px] rounded-full bg-orange-100/40 blur-3xl"
          />
          {/* Camada 4 — Top highlight catching light */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          />

          <div className="relative grid gap-10 md:grid-cols-12 md:gap-10">
            {/* Main: kicker + title + location */}
            <div className="md:col-span-8">
              {/* Kicker com brand mark inline */}
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 shrink-0 text-stone-900">
                  <PanelBrandMark className="h-full w-full" />
                </div>
                <span
                  aria-hidden
                  className="h-4 w-px bg-stone-900/20"
                />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-800">
                  Corretora verificada
                </p>
              </div>

              {/* Display title — o momento tipográfico */}
              <h1 className="mt-8 text-4xl font-semibold leading-[0.95] tracking-[-0.02em] text-stone-900 md:text-5xl lg:text-6xl">
                {corretora.name}
              </h1>

              {/* Location line */}
              <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-stone-700">
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
                    className="translate-y-[2px] text-amber-800/70"
                    aria-hidden
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {corretora.city}, {corretora.state}
                </span>
                {corretora.region && (
                  <>
                    <span aria-hidden className="text-stone-400">
                      ·
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {corretora.region}
                    </span>
                  </>
                )}
              </div>

              {isFeatured && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 ring-1 ring-amber-300/50 backdrop-blur-sm">
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
                {/* Logo frame — com gradient interno + top highlight */}
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white to-stone-50 ring-1 ring-stone-900/[0.1] md:h-32 md:w-32 md:self-end">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                  />
                  {corretora.logo_path ? (
                    <Image
                      src={absUrl(corretora.logo_path)}
                      alt={`Logo ${corretora.name}`}
                      width={128}
                      height={128}
                      className="relative h-full w-full object-cover"
                    />
                  ) : (
                    <div className="relative text-stone-300">
                      <PanelBrandMark className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Fact sheet */}
                <dl className="flex-1 divide-y divide-stone-900/[0.08] border-y border-stone-900/[0.08] md:mt-6 md:text-right">
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
          </div>
        </header>

        {/* ─── 01 / SOBRE ───────────────────────────────────────── */}
        {corretora.description && (
          <section className="mt-20 md:mt-28">
            <SectionLabel number="01" title="Sobre a corretora" />
            <div className="mt-8 max-w-2xl">
              {/* Barra lateral amber como marca editorial — detalhe premium */}
              <div className="relative pl-6">
                <span
                  aria-hidden
                  className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-amber-700/40 via-amber-700/20 to-transparent"
                />
                <p className="whitespace-pre-line text-lg leading-[1.55] text-stone-700 md:text-xl md:leading-[1.5]">
                  {corretora.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─── 02 / CANAIS DIRETOS ──────────────────────────────── */}
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

        {/* ─── 03 / FORMULÁRIO ─────────────────────────────────── */}
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

        {/* ─── 04 / MERCADO — Row com gradient warm ────────────────
            Esse gradient faz rima visual com o hero: abre e fecha a
            página com a mesma atmosfera warm, criando sanduíche. */}
        <section className="mt-20 md:mt-28">
          <SectionLabel number="04" title="Mercado" />
          <Link
            href="/news/cotacoes"
            className="group relative mt-8 flex items-center justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50/60 px-6 py-6 ring-1 ring-stone-900/[0.06] transition-all hover:from-amber-100/70 hover:to-orange-100/60 md:px-10 md:py-7"
          >
            {/* Mini glow top-right */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-200/35 blur-3xl"
            />
            {/* Top highlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
            />

            <div className="relative min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                Cotação do café arábica
              </p>
              <p className="mt-1.5 text-base font-semibold tracking-tight text-stone-900 md:text-lg">
                Acompanhe o preço em R$/saca 60kg antes de negociar
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                Dados atualizados do mercado internacional
              </p>
            </div>
            <span
              aria-hidden
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-900 text-stone-50 shadow-lg shadow-stone-900/20 transition-transform group-hover:translate-x-0.5"
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
// Marcador de seção editorial: hairline com fade gradient à direita
// (micro-refinamento em relação ao border-t chapado), número mono
// amber-800 tabular + título + subtítulo opcional.

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
    <div className="relative pt-6">
      {/* Hairline com fade — mais refinada que border-t chapado */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-stone-900/15 via-stone-900/10 to-transparent"
      />
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
