// src/app/mercado-do-cafe/page.tsx
//
// Hub principal do Mercado do Café — RSC
//
// Direção: DARK COMMITTED em match com /mercado-do-cafe/corretoras e
// /mercado-do-cafe/corretoras/[slug]. Toda a página vive em stone-950
// com glass panels (bg-white/[0.04] ring-white/[0.08] backdrop-blur-sm),
// accent único amber-400 e 4 zonas atmosféricas warm light on dark.
//
// O hub é o ponto de entrada do módulo: market strip + hero editorial
// com brand mark + cotações em destaque + corretoras em destaque +
// CTA cadastro. Mesma DNA visual da listagem, mas com função diferente
// (resumo executivo do módulo em vez de scan de listagem).

import Link from "next/link";
import { fetchFeaturedCorretoras } from "@/server/data/corretoras";
import { fetchPublicCotacoes } from "@/server/data/cotacoes";
import { CorretoraCard } from "@/components/mercado-do-cafe/CorretoraCard";
import { CotacaoCard } from "@/components/news/CotacaoCard";
import { MarketCotacaoPill } from "@/components/mercado-do-cafe/MarketCotacaoPill";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import type { PublicCotacao } from "@/lib/newsPublicApi";

export const metadata = {
  title: "Mercado do Café — Zona da Mata | Kavita",
  description:
    "Cotações, corretoras e oportunidades para o produtor de café da Zona da Mata mineira.",
};

function pickCoffeeCotacao(list: PublicCotacao[]): PublicCotacao | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const bySlug = (s: string) => list.find((c) => c.slug === s);
  return (
    bySlug("cafe-arabica") ??
    bySlug("cafe-robusta") ??
    list.find((c) =>
      (c.name ?? c.title ?? "").toLowerCase().includes("café"),
    ) ??
    null
  );
}

export default async function MercadoDoCafePage() {
  const [featured, allCotacoes] = await Promise.all([
    fetchFeaturedCorretoras(4),
    fetchPublicCotacoes().catch(() => [] as PublicCotacao[]),
  ]);

  const cafeCotacoes = allCotacoes.filter((c) => {
    const name = (c.name || c.slug || "").toLowerCase();
    return (
      name.includes("café") ||
      name.includes("cafe") ||
      name.includes("coffee") ||
      name.includes("arabica")
    );
  });

  const cotacoesToShow =
    cafeCotacoes.length > 0
      ? cafeCotacoes.slice(0, 4)
      : allCotacoes.slice(0, 4);

  const coffeeCotacao = pickCoffeeCotacao(allCotacoes);

  const totalCorretoras = featured.length;
  const totalCotacoes = cotacoesToShow.length;

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ─── Atmospheric glows — 4 zonas (mesma DNA da listagem) ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[700px] h-[600px] w-[700px] rounded-full bg-amber-700/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[1300px] h-[700px] w-[800px] rounded-full bg-orange-700/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.05] blur-3xl"
      />

      {/* ═══ MARKET STRIP ═══════════════════════════════════════════ */}
      <div className="relative border-b border-white/[0.08] bg-stone-950/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 md:px-6">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </span>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-300">
            Mercado do Café
            <span className="mx-2 text-stone-600">·</span>
            <span className="text-stone-400">Zona da Mata</span>
            <span className="mx-2 text-stone-600">·</span>
            <span className="text-stone-400">MG</span>
          </p>
          <span
            aria-hidden
            className="ml-auto hidden h-3 w-px bg-white/20 md:inline-block"
          />
          <MarketCotacaoPill cotacao={coffeeCotacao} variant="strip" />
        </div>
      </div>

      {/* ═══ HERO ═══════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 md:px-6 md:pb-16 md:pt-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-10">
            {/* Left: brand + title + subtitle */}
            <div className="min-w-0 flex-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center text-amber-200">
                  <PanelBrandMark className="h-full w-full" />
                </div>
                <div className="h-6 w-px bg-white/15" aria-hidden />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                  Hub do produtor
                </p>
              </div>

              <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-4xl lg:text-5xl">
                Mercado do Café —{" "}
                <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                  Zona&nbsp;da&nbsp;Mata
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
                Cotações de referência, corretoras verificadas e
                oportunidades para o produtor de café da região. Acompanhe os
                preços, encontre quem compra e faça negócio com confiança —
                tudo em um único hub curado pelo Kavita.
              </p>
            </div>

            {/* Right: stats em dark glass */}
            <aside
              aria-label="Resumo do hub"
              className="relative shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:min-w-[420px]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl"
              />

              <div className="relative grid grid-cols-3 divide-x divide-white/[0.06]">
                <Stat
                  kicker="Cotações"
                  value={totalCotacoes}
                  hint={totalCotacoes === 1 ? "ativo" : "ativos"}
                />
                <Stat
                  kicker="Em destaque"
                  value={totalCorretoras}
                  hint={
                    totalCorretoras === 1 ? "corretora" : "corretoras"
                  }
                />
                <MarketCotacaoPill cotacao={coffeeCotacao} variant="stat" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ CONTEÚDO ═══════════════════════════════════════════════ */}
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 md:px-6">
        {/* ─── 01 / Cotações do café ────────────────────────────── */}
        {cotacoesToShow.length > 0 && (
          <section aria-label="Cotações do café" className="mt-2">
            <SectionHeader
              kicker="01 · Mercado"
              title="Cotações do café"
              hint="Preços de referência atualizados — base para negociar com a corretora certa"
              actionLabel="Ver todas"
              actionHref="/news/cotacoes"
            />
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {cotacoesToShow.map((c) => (
                <CotacaoCard key={c.id} item={c} />
              ))}
            </div>
          </section>
        )}

        {/* ─── 02 / Corretoras em destaque ──────────────────────── */}
        <section aria-label="Corretoras em destaque" className="mt-16 md:mt-20">
          <SectionHeader
            kicker="02 · Rede curada"
            title="Corretoras em destaque"
            hint="Empresas verificadas pela equipe Kavita atuando na Zona da Mata"
            actionLabel="Ver todas"
            actionHref="/mercado-do-cafe/corretoras"
            count={featured.length}
          />

          {featured.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {featured.map((c) => (
                <CorretoraCard key={c.id} corretora={c} />
              ))}
            </div>
          ) : (
            <div className="relative mt-6 overflow-hidden rounded-2xl bg-white/[0.04] p-10 text-center ring-1 ring-white/[0.08] backdrop-blur-sm">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
              />
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-amber-200/60 ring-1 ring-white/10">
                <PanelBrandMark className="h-7 w-7" />
              </div>
              <p className="relative text-sm font-semibold text-stone-100">
                A mesa ainda está sendo montada
              </p>
              <p className="relative mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-400">
                Em breve novas corretoras verificadas aparecerão por aqui.
              </p>
              <Link
                href="/mercado-do-cafe/corretoras"
                className="relative mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:ring-amber-400/30"
              >
                Ver todas as corretoras →
              </Link>
            </div>
          )}
        </section>

        {/* ─── 03 / CTA Cadastro ────────────────────────────────── */}
        <section
          aria-label="Cadastro de corretora"
          className="relative mt-16 overflow-hidden rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:mt-20 md:p-10"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-orange-700/15 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                <span
                  aria-hidden
                  className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                />
                Seja parte da rede
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-50 md:text-2xl">
                É corretor ou corretora de café?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                Cadastre sua empresa gratuitamente e apareça para produtores
                de toda a Zona da Mata. A análise é feita pela equipe Kavita
                e, após aprovação, você acessa um painel próprio para
                gerenciar contatos.
              </p>
            </div>
            <Link
              href="/mercado-do-cafe/corretoras/cadastro"
              className="group relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 hover:shadow-amber-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />
              <span className="relative flex items-center gap-2">
                Cadastrar minha empresa
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─── Building blocks (mesma DNA da listagem) ───────────────────────

function Stat({
  kicker,
  value,
  hint,
}: {
  kicker: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="p-4 md:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
        {kicker}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-stone-50 md:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-stone-500">{hint}</p>}
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  hint,
  count,
  actionLabel,
  actionHref,
}: {
  kicker: string;
  title: string;
  hint?: string;
  count?: number;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <header className="relative pt-6">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/15 via-white/[0.06] to-transparent"
      />
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="inline-flex items-center rounded-md bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tabular-nums tracking-[0.1em] text-amber-300 ring-1 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
              {kicker}
            </span>
            {typeof count === "number" && (
              <>
                <span aria-hidden className="h-px w-6 bg-white/15" />
                <span className="text-[11px] font-semibold tabular-nums text-stone-400">
                  {count}{" "}
                  {count === 1 ? "em destaque" : "em destaque"}
                </span>
              </>
            )}
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-stone-50 md:text-xl">
            {title}
          </h2>
          {hint && (
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone-400">
              {hint}
            </p>
          )}
        </div>

        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="group hidden shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.05] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:text-amber-200 hover:ring-amber-400/30 md:inline-flex"
          >
            {actionLabel}
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
