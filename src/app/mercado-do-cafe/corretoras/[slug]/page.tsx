// src/app/mercado-do-cafe/corretoras/[slug]/page.tsx
//
// Página individual da corretora — RSC
//
// Direção: DARK COMMITTED. A página INTEIRA vive em stone-950, com
// todas as superfícies como glass panels (bg-white/[0.04] ring-white/[0.08]
// backdrop-blur-sm), textos em stone-100/300, e amber-400 como único
// accent de assinatura. Paradigma inspirado em Kavita Drones, mas com
// identidade coffee própria (amber em vez de emerald/blue).
//
// O que mudou em relação à iteração anterior:
//   - Page background stone-50 → stone-950 (committed dark)
//   - Todas as seções (01 sobre, 02 canais, 03 msg, 04 mercado)
//     ganham tratamento glass dark uniforme
//   - Accent único amber-400 substitui o mix anterior de amber + emerald
//   - Form e switchboard de canais também migram para dark glass
//     (edits separados em LeadContactForm.tsx e CorretoraContactChannels.tsx)
//
// Lógica, fetch, estado — intocados. Só composição visual.

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
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ─── Atmospheric glows — 4 zonas ────────────────────────────
          Radial lights espalhados ao longo da página que criam
          profundidade e atmosfera "warm light on dark surface".
          Todos pointer-events-none e blur-3xl — custo zero em
          interação, GPU-accelerated. */}

      {/* Zona 1 — Top glow amber (atrás do hero) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      {/* Zona 2 — Left glow amber (atrás da seção sobre) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[720px] h-[600px] w-[700px] rounded-full bg-amber-700/[0.08] blur-3xl"
      />
      {/* Zona 3 — Right glow orange (atrás do form) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[1400px] h-[700px] w-[800px] rounded-full bg-orange-700/[0.07] blur-3xl"
      />
      {/* Zona 4 — Bottom glow amber (atrás do footer) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.05] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-4xl px-5 pb-24 pt-6 md:px-8 md:pb-32 md:pt-10">
        {/* ─── Back link ──────────────────────────────────────────── */}
        <Link
          href="/mercado-do-cafe/corretoras"
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-amber-300"
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

        {/* ─── HERO — dark espresso card com luzes driftando ────────
            Card contido com fundo gradient dark, duas luzes amber
            que animam lentamente (kavita-drift-a/b). Continua sendo
            o elemento mais dramático da página, mas agora integrado
            ao dark committed da página inteira. */}
        <header
          className="relative mt-10 overflow-hidden rounded-3xl bg-stone-900/60 px-6 py-14 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm md:mt-14 md:px-14 md:py-20"
          aria-label={`Identidade da corretora ${corretora.name}`}
        >
          {/* Layer 1 — Base gradient dark coffee */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950/70"
          />

          {/* Layer 2 — Drifting amber glow top-right */}
          <div
            aria-hidden
            className="kavita-drift-a pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-amber-600/35 blur-3xl"
          />

          {/* Layer 3 — Drifting orange glow bottom-left */}
          <div
            aria-hidden
            className="kavita-drift-b pointer-events-none absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-orange-800/40 blur-3xl"
          />

          {/* Layer 4 — Top highlight hairline */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
          />

          {/* Layer 5 — Vinheta inferior */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent"
          />

          <div className="relative grid gap-10 md:grid-cols-12 md:gap-10">
            {/* Main: kicker + title + location */}
            <div className="md:col-span-8">
              {/* Kicker com brand mark inline */}
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 shrink-0 text-amber-200">
                  <PanelBrandMark className="h-full w-full" />
                </div>
                <span aria-hidden className="h-4 w-px bg-white/15" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/90">
                  Corretora verificada
                </p>
              </div>

              {/* Display title */}
              <h1 className="mt-8 text-4xl font-semibold leading-[0.95] tracking-[-0.02em] text-stone-50 md:text-5xl lg:text-6xl">
                {corretora.name}
              </h1>

              {/* Location line */}
              <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-stone-300">
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
                    className="translate-y-[2px] text-amber-300/80"
                    aria-hidden
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {corretora.city}, {corretora.state}
                </span>
                {corretora.region && (
                  <>
                    <span aria-hidden className="text-stone-600">
                      ·
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-400">
                      {corretora.region}
                    </span>
                  </>
                )}
              </div>

              {isFeatured && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 ring-1 ring-amber-400/30 backdrop-blur-sm">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-amber-300"
                    aria-hidden
                  >
                    <path d="M12 2l2.39 7.36H22l-6.2 4.5 2.38 7.36L12 16.72l-6.18 4.5 2.38-7.36L2 9.36h7.61L12 2z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200">
                    Corretora em destaque na rede
                  </span>
                </div>
              )}
            </div>

            {/* Aside: logo + fact sheet */}
            <aside className="md:col-span-4">
              <div className="flex items-start gap-5 md:flex-col md:items-stretch">
                {/* Logo frame */}
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 ring-1 ring-white/10 md:h-32 md:w-32 md:self-end">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
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
                    <div className="relative text-amber-200/60">
                      <PanelBrandMark className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* Fact sheet */}
                <dl className="flex-1 divide-y divide-white/[0.08] border-y border-white/[0.08] md:mt-6 md:text-right">
                  <div className="py-3">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
                      Responsável
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-stone-100">
                      {corretora.contact_name}
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
                      Atuação
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-stone-100">
                      Compra e venda de café
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </header>

        {/* ─── 01 / SOBRE A CORRETORA ───────────────────────────── */}
        {corretora.description && (
          <section className="mt-20 md:mt-28">
            <SectionLabel number="01" title="Sobre a corretora" />
            <div className="mt-8 max-w-2xl">
              {/* Pull-quote editorial com barra amber vertical */}
              <div className="relative pl-7">
                <span
                  aria-hidden
                  className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[2px] rounded-full bg-gradient-to-b from-amber-400/80 via-amber-500/40 to-transparent"
                />
                <p className="whitespace-pre-line text-lg leading-[1.55] text-stone-300 md:text-xl md:leading-[1.5]">
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

        {/* ─── 03 / MENSAGEM DIRETA ────────────────────────────────
            Card atmosférico dark com duas luzes amber nas bordas.
            Grid 5/7 interno: pitch editorial à esquerda, form à direita.
            Tudo alinhado pelo mesmo grid. */}
        <section className="mt-20 md:mt-28">
          <SectionLabel
            number="03"
            title="Envie uma mensagem"
            subtitle="Alternativa ao contato direto. O lead cai no painel privado da corretora em segundos."
          />

          <div className="relative mt-10 overflow-hidden rounded-3xl bg-stone-900/60 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm">
            {/* Base gradient dark — mesma DNA do hero para coerência */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-stone-950/60 via-stone-900/80 to-amber-950/40"
            />
            {/* Glow amber top-right */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-amber-500/20 blur-3xl"
            />
            {/* Glow orange bottom-left */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-orange-700/20 blur-3xl"
            />
            {/* Top highlight amber */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
            />

            <div className="relative grid gap-10 px-6 py-12 md:grid-cols-12 md:gap-12 md:px-12 md:py-16 lg:px-14 lg:py-20">
              {/* Left column: pitch editorial + trust signals */}
              <div className="md:col-span-5">
                <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                  <span
                    aria-hidden
                    className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  />
                  Contato direto
                </p>

                <h3 className="mt-5 text-[1.75rem] font-semibold leading-[1.08] tracking-tight text-stone-50 md:text-[2rem] lg:text-[2.25rem]">
                  Deixe seu contato aqui
                </h3>

                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-300">
                  Sua mensagem vai direto para o painel privado da{" "}
                  <span className="font-semibold text-stone-100">
                    {corretora.name}
                  </span>
                  . A resposta chega pelos canais oficiais dela — você mantém
                  controle total da negociação.
                </p>

                {/* Trust signals */}
                <ul className="mt-8 space-y-3.5 text-[13px] leading-relaxed text-stone-300">
                  {[
                    "Seus dados chegam apenas à corretora selecionada",
                    "Resposta pelos canais oficiais dela",
                    "Protegido por verificação anti-bot",
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30"
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column: formulário dark glass */}
              <div className="md:col-span-7">
                <LeadContactForm
                  corretoraSlug={corretora.slug}
                  corretoraName={corretora.name}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 04 / MERCADO — Link para cotações ─────────────────── */}
        <section className="mt-20 md:mt-28">
          <SectionLabel number="04" title="Mercado" />
          <Link
            href="/news/cotacoes"
            className="group relative mt-8 flex items-center justify-between gap-5 overflow-hidden rounded-2xl bg-white/[0.04] px-6 py-6 ring-1 ring-white/[0.08] shadow-xl shadow-black/40 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:ring-amber-400/30 md:px-10 md:py-7"
          >
            {/* Mini glow top-right */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-500/15 blur-3xl"
            />
            {/* Top highlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
            />

            <div className="relative min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Cotação do café arábica
              </p>
              <p className="mt-1.5 text-base font-semibold tracking-tight text-stone-100 md:text-lg">
                Acompanhe o preço em R$/saca 60kg antes de negociar
              </p>
              <p className="mt-1 text-[11px] text-stone-400">
                Dados atualizados do mercado internacional
              </p>
            </div>
            <span
              aria-hidden
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 transition-transform group-hover:translate-x-0.5"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
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

// ─── Section label primitive — Dark version ──────────────────
// Número como pill amber glow, título em stone-50, subtítulo em
// stone-400, hairline em white/15 com fade gradient.

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
    <div className="relative pt-8">
      {/* Hairline com fade — white/15 sobre o dark background */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/15 via-white/[0.06] to-transparent"
      />
      <div className="flex items-baseline gap-5">
        {/* Número pill amber glow */}
        <span className="inline-flex items-center rounded-md bg-amber-400/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tabular-nums tracking-[0.1em] text-amber-300 ring-1 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-stone-50 md:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-stone-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
