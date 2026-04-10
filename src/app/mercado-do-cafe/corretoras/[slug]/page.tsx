// src/app/mercado-do-cafe/corretoras/[slug]/page.tsx
//
// Página individual da corretora — RSC
//
// Redesign visual premium: hero em dark mode (stone-950 com warm glow
// amber e padrão sutil de grãos de café inline em SVG), seções light
// com PanelCards coerentes com o resto do módulo, canais de contato
// refinados (stone palette + SVG icons + WhatsApp como canal primário),
// formulário acolhedor e CTA de cotações integrado inline.
//
// Lógica, fetch, rota e estado — tudo intocado. Só frontend visual.

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchPublicCorretoraBySlug } from "@/server/data/corretoras";
import { absUrl } from "@/utils/absUrl";
import { CorretoraContactChannels } from "@/components/mercado-do-cafe/CorretoraContactChannels";
import { LeadContactForm } from "@/components/mercado-do-cafe/LeadContactForm";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import { PanelCard } from "@/components/painel-corretora/PanelCard";

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

/**
 * Padrão SVG de grãos de café para o fundo do hero dark. Inline data
 * URI: zero requisição de rede, zero layout shift. Aparece em ~4% de
 * opacidade sobre o hero e em mais nada da página — uso disciplinado.
 *
 * Gerado artesanalmente: 3 elipses rotacionadas imitando grãos de
 * café dispersos, cada um com um traço central sugerindo a fenda
 * típica do grão.
 */
const COFFEE_PATTERN = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'>
    <g fill='white' fill-opacity='1'>
      <g transform='translate(30 40) rotate(-20)'>
        <ellipse cx='0' cy='0' rx='10' ry='14'/>
      </g>
      <g transform='translate(140 60) rotate(15)'>
        <ellipse cx='0' cy='0' rx='10' ry='14'/>
      </g>
      <g transform='translate(85 130) rotate(-8)'>
        <ellipse cx='0' cy='0' rx='10' ry='14'/>
      </g>
      <g transform='translate(175 170) rotate(30)'>
        <ellipse cx='0' cy='0' rx='10' ry='14'/>
      </g>
      <g transform='translate(50 180) rotate(-35)'>
        <ellipse cx='0' cy='0' rx='10' ry='14'/>
      </g>
    </g>
    <g stroke='rgba(0,0,0,0.3)' stroke-width='1' fill='none' stroke-linecap='round'>
      <path d='M 24 30 Q 30 40 36 50'/>
      <path d='M 134 50 Q 140 60 146 70'/>
      <path d='M 79 120 Q 85 130 91 140'/>
      <path d='M 169 160 Q 175 170 181 180'/>
      <path d='M 44 170 Q 50 180 56 190'/>
    </g>
  </svg>`
    .replace(/\s+/g, " ")
    .trim(),
);

const COFFEE_PATTERN_URL = `url("data:image/svg+xml,${COFFEE_PATTERN}")`;

export default async function CorretoraDetailPage({ params }: Props) {
  const { slug } = await params;
  const corretora = await fetchPublicCorretoraBySlug(slug);

  if (!corretora) notFound();

  const isFeatured =
    corretora.is_featured === true || corretora.is_featured === 1;

  return (
    <main className="relative min-h-[calc(100vh-120px)] bg-stone-50 text-stone-900">
      {/* Warm ambient gradient no topo — mesma linguagem do resto do
          módulo Mercado do Café, dando coerência entre listagem e detalhe. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-amber-50/60 via-stone-50/30 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-6 md:px-6 md:pb-20 md:pt-8">
        {/* Back link */}
        <Link
          href="/mercado-do-cafe/corretoras"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 transition-colors hover:text-stone-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Voltar para corretoras
        </Link>

        {/* ═══ HERO DARK PREMIUM ════════════════════════════════════ */}
        <header
          className="relative overflow-hidden rounded-3xl bg-stone-950 p-6 text-stone-50 shadow-xl shadow-stone-900/20 ring-1 ring-stone-900/20 md:p-10"
          aria-label={`Identidade da corretora ${corretora.name}`}
        >
          {/* Padrão sutil de grãos de café — só aqui, só neste bloco */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: COFFEE_PATTERN_URL,
              backgroundSize: "220px 220px",
            }}
          />

          {/* Warm glow top-right — luz de torrefação */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl"
          />

          {/* Warm glow bottom-left para dar profundidade */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-600/[0.06] blur-3xl"
          />

          {/* Top highlight edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />

          <div className="relative">
            {/* Kicker row: brand mark + context */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center text-stone-100">
                <PanelBrandMark className="h-full w-full" />
              </div>
              <div className="h-5 w-px bg-stone-700" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
                Corretora verificada · Mercado do Café
              </p>
            </div>

            {/* Main row: logo + title + meta */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
              {/* Logo em moldura premium */}
              <div className="shrink-0">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-stone-900 ring-1 ring-white/10 md:h-28 md:w-28">
                  {/* Inner top highlight */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                  {corretora.logo_path ? (
                    <Image
                      src={absUrl(corretora.logo_path)}
                      alt={`Logo ${corretora.name}`}
                      width={112}
                      height={112}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-stone-300">
                      <PanelBrandMark className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl lg:text-4xl">
                    {corretora.name}
                  </h1>
                  {isFeatured && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200 ring-1 ring-amber-400/30">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M12 2l2.39 7.36H22l-6.2 4.5 2.38 7.36L12 16.72l-6.18 4.5 2.38-7.36L2 9.36h7.61L12 2z" />
                      </svg>
                      Verificada
                    </span>
                  )}
                </div>

                {/* Location + region as chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-stone-300 ring-1 ring-white/10">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {corretora.city}, {corretora.state}
                  </span>
                  {corretora.region && (
                    <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 uppercase tracking-[0.1em] text-stone-400 ring-1 ring-white/10">
                      {corretora.region}
                    </span>
                  )}
                </div>

                {/* Responsável */}
                <p className="mt-4 text-xs text-stone-400">
                  Responsável comercial:{" "}
                  <span className="font-semibold text-stone-200">
                    {corretora.contact_name}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ═══ CONTEÚDO ABAIXO DO HERO ══════════════════════════════ */}

        {/* Description */}
        {corretora.description && (
          <section
            aria-label="Sobre a corretora"
            className="mt-8 md:mt-10"
          >
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Sobre a corretora
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-900">
                O que a {corretora.name} faz
              </h2>
            </div>
            <PanelCard density="spacious">
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">
                {corretora.description}
              </p>
            </PanelCard>
          </section>
        )}

        {/* Canais diretos + Formulário (2 colunas no desktop) */}
        <section
          aria-label="Fale com a corretora"
          className="mt-10 grid gap-6 md:grid-cols-5 md:gap-8"
        >
          {/* Canais diretos */}
          <div className="md:col-span-2">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Canais diretos
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-900">
                Entre em contato
              </h2>
              <p className="mt-1 text-[11px] text-stone-500">
                Converse diretamente pelos canais oficiais da corretora.
              </p>
            </div>
            <CorretoraContactChannels corretora={corretora} variant="full" />
          </div>

          {/* Formulário */}
          <div className="md:col-span-3">
            <LeadContactForm
              corretoraSlug={corretora.slug}
              corretoraName={corretora.name}
            />
          </div>
        </section>

        {/* ═══ CTA COTAÇÕES — inline premium ═══════════════════════ */}
        <section
          aria-label="Cotação do café"
          className="mt-14 overflow-hidden rounded-2xl bg-stone-900 p-6 text-stone-50 shadow-xl shadow-stone-900/20 ring-1 ring-stone-900/20 md:p-8"
        >
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-x-6 -top-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent md:-inset-x-8 md:-top-8"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl"
            />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                  Inteligência de mercado
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-stone-50 md:text-xl">
                  Acompanhe os preços antes de negociar
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-300">
                  Veja a cotação atualizada do café arábica em R$/saca 60kg
                  e acompanhe as variações do mercado internacional. Decisão
                  melhor informada, negociação mais confiante.
                </p>
              </div>
              <Link
                href="/news/cotacoes"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-stone-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-900 shadow-lg shadow-black/20 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
              >
                Ver cotações
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
