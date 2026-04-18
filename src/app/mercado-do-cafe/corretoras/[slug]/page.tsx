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
import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchPublicCorretoraBySlug,
  fetchCorretoraTrackRecord,
} from "@/server/data/corretoras";
import { absUrl } from "@/utils/absUrl";
import { CorretoraContactChannels } from "@/components/mercado-do-cafe/CorretoraContactChannels";
import { CorretoraRegionalTrust } from "@/components/mercado-do-cafe/CorretoraRegionalTrust";
import { LeadContactForm } from "@/components/mercado-do-cafe/LeadContactForm";
import { WhatsAppDirectButton } from "@/components/mercado-do-cafe/WhatsAppDirectButton";
import { CorretoraReviews } from "@/components/mercado-do-cafe/CorretoraReviews";
import { FavoriteButton } from "@/components/mercado-do-cafe/FavoriteButton";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import { buildCoffeeMetadata } from "@/lib/coffeeMetadata";
import { buildCorretoraJsonLd } from "@/lib/corretoraJsonLd";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const result = await fetchPublicCorretoraBySlug(slug);

  // No redirect case, o metadata não renderiza na página (o render
  // aciona permanentRedirect antes), mas Next.js chama generateMetadata
  // em paralelo. Devolvemos metadata neutro para não quebrar.
  if (result.kind === "redirect") {
    return buildCoffeeMetadata({
      path: `/mercado-do-cafe/corretoras/${result.toSlug}`,
      title: "Corretora de Café | Kavita",
      description: "Corretora de café verificada na Zona da Mata mineira.",
    });
  }

  if (result.kind !== "found") {
    return buildCoffeeMetadata({
      path: `/mercado-do-cafe/corretoras/${slug}`,
      title: "Corretora não encontrada | Kavita",
      description: "A corretora solicitada não foi encontrada.",
      noIndex: true,
    });
  }

  const corretora = result.corretora;
  const ogImage = corretora.logo_path ? absUrl(corretora.logo_path) : null;
  return buildCoffeeMetadata({
    path: `/mercado-do-cafe/corretoras/${corretora.slug}`,
    title: `${corretora.name} — Corretora de Café | Kavita`,
    description:
      corretora.description ||
      `${corretora.name} — corretora de café em ${corretora.city}, ${corretora.state}.`,
    image: ogImage,
  });
}

export default async function CorretoraDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = await fetchPublicCorretoraBySlug(slug);

  // Slug antigo mapeado no corretora_slug_history → 301 para o atual.
  // Preserva tráfego orgânico/compartilhado que veio do link antigo.
  if (result.kind === "redirect") {
    permanentRedirect(`/mercado-do-cafe/corretoras/${result.toSlug}`);
  }
  if (result.kind !== "found") notFound();
  const corretora = result.corretora;

  // Fase 8 — track record anonimizado. Fire-and-forget: se falhar,
  // a ficha renderiza sem o pill (track-record é null).
  const trackRecord = await fetchCorretoraTrackRecord(slug);

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

      {/* ─── JSON-LD (LocalBusiness + BreadcrumbList) ──────────────
          Rich results no Google: card da corretora com endereço,
          rating e redes. Injetado como script — Next.js recomenda
          dangerouslySetInnerHTML para structured data em RSC. */}
      <script
        type="application/ld+json"
        // Serializado aqui (não lazy) — é objeto estático derivado do
        // RSC, sem risco de injection já que todos os campos vêm do
        // banco e passaram pelo Zod na criação/edição.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildCorretoraJsonLd(corretora)),
        }}
      />

      <div className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-5 sm:px-5 md:px-8 md:pb-32 md:pt-10 lg:max-w-5xl xl:max-w-6xl">
        {/* ─── Breadcrumb (substitui back link puro) ────────────────
            Semântica <nav aria-label="breadcrumb"> + <ol> para leitor
            de tela. Complementa o JSON-LD BreadcrumbList acima. */}
        <nav aria-label="breadcrumb" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href="/mercado-do-cafe"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-amber-300"
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
            </li>
            <li aria-hidden className="text-stone-600">
              /
            </li>
            <li>
              <Link
                href="/mercado-do-cafe/corretoras"
                className="transition-colors hover:text-amber-300"
              >
                Corretoras
              </Link>
            </li>
            <li aria-hidden className="text-stone-600">
              /
            </li>
            <li aria-current="page" className="truncate text-amber-300/80">
              {corretora.name}
            </li>
          </ol>
        </nav>

        {/* ─── HERO — dark espresso card com luzes driftando ────────
            Card contido com fundo gradient dark, duas luzes amber
            que animam lentamente (kavita-drift-a/b). Continua sendo
            o elemento mais dramático da página, mas agora integrado
            ao dark committed da página inteira. */}
        <header
          className="relative mt-6 overflow-hidden rounded-[1.75rem] bg-stone-900/60 px-5 py-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm sm:mt-8 sm:rounded-3xl sm:px-6 sm:py-12 md:mt-14 md:px-14 md:py-20"
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

          {/* Mobile: logo + favoritar flutuando acima do título.
              Desktop: grid 8/4 mantido com logo/factsheet à direita. */}
          <div className="relative grid gap-8 md:grid-cols-12 md:gap-10">
            {/* Main column: kicker + title + location */}
            <div className="md:col-span-8">
              {/* Linha topo mobile: logo + favoritar. Logo menor (64px)
                  para não brigar com o título. No desktop some (aparece
                  na aside à direita). */}
              <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 ring-1 ring-white/10">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
                  />
                  {corretora.logo_path ? (
                    <Image
                      src={absUrl(corretora.logo_path)}
                      alt={`Logo ${corretora.name}`}
                      width={96}
                      height={96}
                      className="relative h-full w-full object-cover"
                    />
                  ) : (
                    <div className="relative text-amber-200/60">
                      <PanelBrandMark className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <FavoriteButton
                  corretoraId={corretora.id}
                  corretoraSlug={corretora.slug}
                />
              </div>

              {/* Kicker com brand mark inline — vocabulário regional */}
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 shrink-0 text-amber-200 sm:h-6 sm:w-6">
                  <PanelBrandMark className="h-full w-full" />
                </div>
                <span aria-hidden className="h-4 w-px bg-white/15" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/90 sm:tracking-[0.24em]">
                  Corretora verificada · Matas de Minas
                </p>
              </div>

              {/* Display title — desktop mantém FavoriteButton inline */}
              <div className="mt-5 flex items-start justify-between gap-4 md:mt-8">
                <h1 className="text-[2rem] font-semibold leading-[1] tracking-[-0.02em] text-stone-50 sm:text-[2.5rem] md:text-5xl md:leading-[0.95] lg:text-6xl">
                  {corretora.name}
                </h1>
                <div className="hidden shrink-0 pt-2 md:block">
                  <FavoriteButton
                    corretoraId={corretora.id}
                    corretoraSlug={corretora.slug}
                  />
                </div>
              </div>

              {/* Location line */}
              <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-stone-300 md:mt-7 md:gap-x-4">
                <span className="inline-flex items-baseline gap-2 text-base font-medium tracking-tight sm:text-lg md:text-xl">
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
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400 sm:text-sm">
                      {corretora.region}
                    </span>
                  </>
                )}
              </div>

              {isFeatured && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 ring-1 ring-amber-400/30 backdrop-blur-sm md:mt-6">
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

              {/* Fact sheet MOBILE — grid 2 colunas compacto abaixo da
                  location. No desktop, vai pra aside à direita. */}
              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/[0.08] pt-5 md:hidden">
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
                    Responsável
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-100">
                    {corretora.contact_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
                    Atuação
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-stone-100">
                    Compra e venda de café
                  </dd>
                </div>
              </dl>
            </div>

            {/* Aside DESKTOP: logo + fact sheet à direita */}
            <aside className="hidden md:col-span-4 md:block">
              <div className="flex flex-col items-stretch gap-6">
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center self-end overflow-hidden rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 ring-1 ring-white/10">
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

                <dl className="divide-y divide-white/[0.08] border-y border-white/[0.08] text-right">
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
                      {corretora.perfil_compra === "compra"
                        ? "Compra de café na região"
                        : corretora.perfil_compra === "venda"
                          ? "Venda de café da região"
                          : "Compra e venda de café"}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </header>

        {/* ─── TRUST REGIONAL — aparece logo após o hero ───────────
            Prova social compacta: responsável, cidades atendidas,
            resposta média e verificação Kavita. Reduz a sensação de
            risco do primeiro contato (importante na realidade de
            Manhuaçu, onde palavra vale e confiança pesa). */}
        <section className="mt-8 md:mt-10">
          <CorretoraRegionalTrust corretora={corretora} />
        </section>

        {/* Fase 8 — track record agregado. Só renderiza quando houve
            pelo menos 1 lote fechado nos últimos 365 dias. Nada de
            preço/produtor — só agregado anonimizado. */}
        {trackRecord && trackRecord.total_lots > 0 && (
          <section className="mt-6 md:mt-8">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-5 sm:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                Histórico verificado · últimos 12 meses
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <p className="font-serif text-[28px] font-semibold leading-none text-stone-50 md:text-[32px]">
                  {trackRecord.total_lots}
                  <span className="ml-2 text-[13px] font-sans font-normal text-stone-300">
                    {trackRecord.total_lots === 1 ? "lote" : "lotes"} fechados
                  </span>
                </p>
                {trackRecord.estimated_sacas > 0 && (
                  <p className="text-[13px] text-stone-300">
                    ≈{" "}
                    <span className="font-semibold tabular-nums text-stone-100">
                      {new Intl.NumberFormat("pt-BR").format(
                        trackRecord.estimated_sacas,
                      )}
                    </span>{" "}
                    sacas negociadas
                  </p>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-stone-400">
                Número agregado com base nos lotes que passaram pela mesa da{" "}
                {corretora.name} — sem expor produtor ou preço individual.
              </p>
            </div>
          </section>
        )}

        {/* ─── 01 / SOBRE A CORRETORA ───────────────────────────── */}
        {corretora.description && (
          <section className="mt-14 sm:mt-20 md:mt-28">
            <SectionLabel number="01" title="Sobre a corretora" />
            <div className="mt-6 max-w-2xl md:mt-8">
              {/* Pull-quote editorial com barra amber vertical */}
              <div className="relative pl-5 sm:pl-7">
                <span
                  aria-hidden
                  className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[2px] rounded-full bg-gradient-to-b from-amber-400/80 via-amber-500/40 to-transparent"
                />
                <p className="whitespace-pre-line text-[17px] leading-[1.6] text-stone-300 sm:text-lg sm:leading-[1.55] md:text-xl md:leading-[1.5]">
                  {corretora.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─── 02 / CANAIS DIRETOS ──────────────────────────────── */}
        <section className="mt-14 sm:mt-20 md:mt-28">
          <SectionLabel
            number="02"
            title="Canais diretos"
            subtitle="Converse pelos canais oficiais da corretora."
          />

          {/* Botão WhatsApp direto em destaque — realidade regional
              é WhatsApp-first. Produtor prefere 1 clique a formulário.
              Mobile: CTA full-width pra ser o alvo de toque dominante. */}
          {corretora.whatsapp && (
            <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-stone-900/60 to-stone-950/80 p-5 ring-1 ring-emerald-500/20 backdrop-blur-sm md:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
                    Mais rápido
                  </p>
                  <p className="mt-1 text-[15px] font-semibold leading-snug text-stone-50 md:text-lg">
                    Fale agora com {corretora.name} no WhatsApp
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    Mensagem já vem preenchida. Basta editar se quiser.
                  </p>
                </div>
                <WhatsAppDirectButton
                  whatsapp={corretora.whatsapp}
                  corretoraNome={corretora.name}
                  variant="primary"
                  className="w-full justify-center shrink-0 sm:w-auto"
                />
              </div>
            </div>
          )}

          <div className="mt-6 md:mt-8">
            <CorretoraContactChannels corretora={corretora} variant="full" />
          </div>

          {/* Fase 8 — sinais operacionais regionais. Aparecem como
              chips de dados (volume mínimo, especial, retirada,
              exportação, cooperativas). Só renderizam quando há ao
              menos um true, pra não poluir fichas antigas. */}
          {(corretora.compra_cafe_especial ||
            corretora.faz_retirada_amostra ||
            corretora.trabalha_exportacao ||
            corretora.trabalha_cooperativas ||
            (corretora.volume_minimo_sacas != null &&
              corretora.volume_minimo_sacas > 0)) && (
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
                Como a mesa opera
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {corretora.volume_minimo_sacas != null &&
                  corretora.volume_minimo_sacas > 0 && (
                    <span className="inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-stone-200 ring-1 ring-white/10">
                      Mín. {corretora.volume_minimo_sacas} sacas
                    </span>
                  )}
                {corretora.compra_cafe_especial && (
                  <span className="inline-flex items-center rounded-full bg-amber-400/[0.08] px-2.5 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-400/25">
                    Café especial
                  </span>
                )}
                {corretora.faz_retirada_amostra && (
                  <span className="inline-flex items-center rounded-full bg-emerald-400/[0.08] px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-400/25">
                    Retira amostra
                  </span>
                )}
                {corretora.trabalha_exportacao && (
                  <span className="inline-flex items-center rounded-full bg-sky-400/[0.08] px-2.5 py-1 text-[11px] font-semibold text-sky-200 ring-1 ring-sky-400/25">
                    Exportação
                  </span>
                )}
                {corretora.trabalha_cooperativas && (
                  <span className="inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-stone-200 ring-1 ring-white/10">
                    Atende cooperativas
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Fase 5 — link Google Maps sem API key. Fase 8 enriquece
              com endereco_textual quando disponível (pin direto no
              endereço, não na região). */}
          <div className="mt-5">
            {corretora.endereco_textual && (
              <p className="mb-1.5 text-[12px] text-stone-300">
                {corretora.endereco_textual}
              </p>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                corretora.endereco_textual
                  ? `${corretora.endereco_textual} ${corretora.city} ${corretora.state}`
                  : `${corretora.name} ${corretora.city} ${corretora.state}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-300 transition-colors hover:text-amber-200"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Ver localização no Google Maps
              <span aria-hidden>↗</span>
            </a>
          </div>
        </section>

        {/* ─── 02b / COMO FUNCIONA (Fase 5) ────────────────────────
            Passo-a-passo editorial posicionado entre "Contato direto"
            e o formulário. Ajuda o produtor a entender o caminho
            inteiro antes de preencher — reduz fricção e desconfiança. */}
        <section className="mt-14 sm:mt-20 md:mt-28">
          <SectionLabel
            number="02b"
            title="Como funciona"
            subtitle="Do seu primeiro envio até a compra — sem intermediário."
          />
          <ol className="mt-8 grid gap-3 sm:gap-4 md:mt-10 md:grid-cols-5">
            {[
              {
                n: "1",
                title: "Você envia os dados",
                desc: "Córrego, safra, volume, bebida — leva 1 minuto.",
              },
              {
                n: "2",
                title: "A corretora analisa",
                desc: `${corretora.name} recebe o lead na hora.`,
              },
              {
                n: "3",
                title: "Contato direto",
                desc: "WhatsApp ou ligação pelo canal que você preferir.",
              },
              {
                n: "4",
                title: "Amostra e laudo",
                desc: "Se fizer sentido, combinam retirada da amostra.",
              },
              {
                n: "5",
                title: "Proposta e compra",
                desc: "Preço negociado e fechamento direto com a corretora.",
              },
            ].map((step) => (
              <li
                key={step.n}
                className="relative overflow-hidden rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06] sm:p-5"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
                />
                <span
                  aria-hidden
                  className="font-mono text-[10px] font-bold tracking-[0.18em] text-amber-400"
                >
                  ETAPA {step.n}
                </span>
                <p className="mt-2 font-serif text-[15px] font-semibold text-stone-100">
                  {step.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-stone-400">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[12px] leading-relaxed text-stone-500">
            <Link
              href="/mercado-do-cafe/verificacao"
              className="text-amber-300 transition-colors hover:text-amber-200"
            >
              Como verificamos as corretoras →
            </Link>
          </p>
        </section>

        {/* ─── 03 / MENSAGEM DIRETA ────────────────────────────────
            Card atmosférico dark com duas luzes amber nas bordas.
            Grid 5/7 interno: pitch editorial à esquerda, form à direita.
            Tudo alinhado pelo mesmo grid. */}
        <section id="fale-corretora" className="mt-14 sm:mt-20 md:mt-28 scroll-mt-24">
          <SectionLabel
            number="03"
            title="Fale sobre seu café"
            subtitle="Conte o que você tem na tulha. A corretora recebe na hora e retorna pelo canal que você preferir."
          />

          <div className="relative mt-8 overflow-hidden rounded-[1.75rem] bg-stone-900/60 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm sm:rounded-3xl md:mt-10">
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

            {/* Desktop reequilibrado: no lg+, esquerda passa a ser 4/12
                (mais compacta), direita 8/12 (respira + 2-col internas
                quando útil). No md, mantemos 5/7 pra tablets; no mobile
                stackado. Aligns=start pra a esquerda nao centralizar
                verticalmente enquanto o form é longo. */}
            <div className="relative grid items-start gap-8 px-5 py-10 sm:gap-10 sm:px-6 sm:py-12 md:grid-cols-12 md:gap-12 md:px-12 md:py-16 lg:gap-16 lg:px-14 lg:py-20 xl:gap-20">
              {/* Left column: pitch editorial + trust signals.
                  Sticky no desktop pro usuário sempre ver o pitch
                  enquanto preenche o form longo. */}
              <div className="md:col-span-5 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                  <span
                    aria-hidden
                    className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  />
                  Contato direto
                </p>

                <h3 className="mt-5 text-[1.75rem] font-semibold leading-[1.08] tracking-tight text-stone-50 md:text-[2rem] lg:text-[2.25rem] xl:text-[2.5rem]">
                  Quero falar com a corretora
                </h3>

                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-300 lg:text-[15.5px] lg:leading-[1.7]">
                  Informe o café que você tem — córrego, safra, volume — e a{" "}
                  <span className="font-semibold text-stone-100">
                    {corretora.name}
                  </span>{" "}
                  retorna pelo seu canal preferido (WhatsApp, ligação ou e-mail).
                  Sem intermediário, sem taxa: o contato é direto com quem compra.
                </p>

                {/* Trust signals — linguagem regional */}
                <ul className="mt-8 space-y-3.5 text-[13px] leading-relaxed text-stone-300 lg:mt-10 lg:space-y-4 lg:text-[13.5px]">
                  {[
                    "Sua mensagem vai só para a corretora escolhida",
                    "Retorno pelo canal que você preferir",
                    "Cadastro rápido: menos de 1 minuto pelo celular",
                    "Verificação anti-bot da Cloudflare",
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

                {/* Hairline amber separando esquerda/direita em lg+ */}
                <div
                  aria-hidden
                  className="mt-10 hidden h-px bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent lg:block"
                />
              </div>

              {/* Right column: formulário dark glass */}
              <div className="md:col-span-7 lg:col-span-8">
                <LeadContactForm
                  corretoraSlug={corretora.slug}
                  corretoraName={corretora.name}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── 04 / AVALIAÇÕES (Sprint 4) ────────────────────────── */}
        <section className="mt-14 sm:mt-20 md:mt-28">
          <SectionLabel
            number="04"
            title="Avaliações"
            subtitle="Experiências reais de produtores que usaram esta corretora."
          />
          <div className="mt-8">
            <CorretoraReviews
              corretoraSlug={corretora.slug}
              corretoraName={corretora.name}
            />
          </div>
        </section>

        {/* ─── 05 / MERCADO — Link para cotações ─────────────────── */}
        <section className="mt-14 sm:mt-20 md:mt-28">
          <SectionLabel number="05" title="Mercado" />
          <Link
            href="/news/cotacoes"
            className="group relative mt-6 flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-white/[0.04] px-5 py-5 ring-1 ring-white/[0.08] shadow-xl shadow-black/40 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:ring-amber-400/30 sm:px-6 sm:py-6 md:mt-8 md:gap-5 md:px-10 md:py-7"
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
              <p className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-stone-100 md:text-lg">
                Preço em R$/saca 60kg antes de negociar
              </p>
              <p className="mt-1 hidden text-[11px] text-stone-400 sm:block">
                Dados atualizados do mercado internacional
              </p>
            </div>
            <span
              aria-hidden
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 transition-transform group-hover:translate-x-0.5 sm:h-11 sm:w-11"
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
