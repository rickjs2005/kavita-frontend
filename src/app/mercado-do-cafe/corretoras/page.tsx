// src/app/mercado-do-cafe/corretoras/page.tsx
//
// Listagem pública de corretoras — RSC
//
// Direção: DARK COMMITTED em match com a página interna da corretora
// (commit 76b7666). Mesmo paradigma (stone-950 + glass panels +
// amber-400 accent + 4 atmospheric glow zones) mas adaptado à função
// de listagem (grid 2-col scan-heavy em vez de editorial single-flow).
//
// A página interna e a listagem agora compartilham:
//   - Background stone-950
//   - Superfícies glass bg-white/[0.04] ring-white/[0.08] backdrop-blur-sm
//   - Accent único amber-400 (kickers, hovers, CTAs, glows)
//   - 4 zonas radiais atmosféricas amber/orange
//   - Tipografia stone-50/300/500 hierarchy
//
// O que é específico da listagem (diferente do detalhe):
//   - Grid 2-col de CorretoraCard em vez de 1-col editorial
//   - Market strip + hero com stats aside
//   - Filters command bar
//   - SectionHeader com kicker + count (não SectionLabel numerado 01-04)
//   - CTA cadastro no fim

import Link from "next/link";
import { Suspense } from "react";
import {
  fetchPublicCorretoras,
  fetchCorretorasCities,
} from "@/server/data/corretoras";
import { fetchPublicCotacoes } from "@/server/data/cotacoes";
import type { PublicCotacao } from "@/lib/newsPublicApi";
import { CorretoraCard } from "@/components/mercado-do-cafe/CorretoraCard";
import { CorretoraFilters } from "@/components/mercado-do-cafe/CorretoraFilters";
import { CityChips } from "@/components/mercado-do-cafe/CityChips";
import { MarketCotacaoPill } from "@/components/mercado-do-cafe/MarketCotacaoPill";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import { normalizeCityName, CIDADES_ZONA_DA_MATA } from "@/lib/regioes";

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

export const metadata = {
  title: "Corretoras de Café — Zona da Mata | Kavita",
  description:
    "Encontre corretoras de café verificadas que atuam na Zona da Mata mineira. Manhuaçu, Reduto, Simonésia e região.",
};

type Props = {
  searchParams: Promise<{ city?: string; search?: string; page?: string }>;
};

export default async function CorretorasListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [result, cities, cotacoes] = await Promise.all([
    fetchPublicCorretoras({
      city: params.city,
      search: params.search,
      page,
      limit: 20,
    }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    })),
    fetchCorretorasCities(),
    fetchPublicCotacoes().catch(() => [] as PublicCotacao[]),
  ]);

  const coffeeCotacao = pickCoffeeCotacao(cotacoes);

  const featured = result.items.filter(
    (c) => c.is_featured === true || c.is_featured === 1,
  );
  const regular = result.items.filter(
    (c) => c.is_featured !== true && c.is_featured !== 1,
  );

  const hasFilters = !!(params.city || params.search);

  const totalAtivas = result.total;
  const totalCidades = cities.length;

  const buildPageHref = (p: number) => {
    const qs = new URLSearchParams();
    qs.set("page", String(p));
    if (params.city) qs.set("city", params.city);
    if (params.search) qs.set("search", params.search);
    return `/mercado-do-cafe/corretoras?${qs.toString()}`;
  };

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ─── Atmospheric glows — 4 zonas ────────────────────────────
          Distribuídas pela altura da página para criar profundidade
          "warm light on dark surface". Todas pointer-events-none e
          blur-3xl, custo zero em interação. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[800px] h-[600px] w-[700px] rounded-full bg-amber-700/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[1500px] h-[700px] w-[800px] rounded-full bg-orange-700/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.05] blur-3xl"
      />

      {/* ═══ MARKET STRIP — tira fina no topo em dark ═══════════════
          Border-white/[0.08] hairline, pulse dot amber, cotação inline. */}
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

      {/* ═══ HERO ═══════════════════════════════════════════════════
          Brand mark + kicker + título display + subtítulo à esquerda,
          market intelligence stats em glass card à direita. */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 md:px-6 md:pb-14 md:pt-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
            {/* Left: brand + title + subtitle */}
            <div className="min-w-0 flex-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center text-amber-200">
                  <PanelBrandMark className="h-full w-full" />
                </div>
                <div className="h-6 w-px bg-white/15" aria-hidden />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                  Corretoras verificadas
                </p>
              </div>

              <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-4xl lg:text-5xl">
                A mesa do café da Zona&nbsp;da&nbsp;Mata
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
                Encontre corretoras que atuam na Zona da Mata mineira. Rede
                curada pelo Kavita — cada empresa listada passou pela análise
                da nossa equipe antes de aparecer aqui. Negocie com confiança,
                diretamente pelos canais de cada corretora.
              </p>
            </div>

            {/* Right: market intelligence block em dark glass */}
            <aside
              aria-label="Indicadores do mercado do café"
              className="relative shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:min-w-[460px]"
            >
              {/* Top highlight amber */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
              />
              {/* Mini glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl"
              />

              <div className="relative grid grid-cols-3 divide-x divide-white/[0.06]">
                <Stat
                  kicker="Ativas"
                  value={totalAtivas}
                  hint={totalAtivas === 1 ? "corretora" : "corretoras"}
                />
                <Stat
                  kicker="Cidades"
                  value={totalCidades}
                  hint={totalCidades === 1 ? "atendida" : "atendidas"}
                />
                <MarketCotacaoPill cotacao={coffeeCotacao} variant="stat" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ CONTEÚDO ═══════════════════════════════════════════════ */}
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 md:px-6">
        {/* Filtro regional por cidade — chips grandes acima dos filtros */}
        <div className="mb-5">
          <CityChips
            active={
              params.city
                ? (CIDADES_ZONA_DA_MATA.find(
                    (c) => normalizeCityName(c.nome) === normalizeCityName(params.city ?? ""),
                  )?.slug ?? "all")
                : "all"
            }
            tone="dark"
          />
        </div>

        {/* Filters em dark command bar */}
        <Suspense fallback={null}>
          <CorretoraFilters cities={cities} />
        </Suspense>

        {/* Empty state */}
        {result.items.length === 0 && (
          <section className="relative mt-8 overflow-hidden rounded-2xl bg-white/[0.04] p-10 text-center ring-1 ring-white/[0.08] backdrop-blur-sm">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
            />
            <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-amber-200/60 ring-1 ring-white/10">
              <PanelBrandMark className="h-7 w-7" />
            </div>
            <p className="relative text-sm font-semibold text-stone-100">
              {hasFilters
                ? "Nenhuma corretora encontrada para essa busca"
                : "A mesa ainda está sendo montada"}
            </p>
            <p className="relative mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-400">
              {hasFilters
                ? "Tente outro filtro ou remova os critérios de busca."
                : "Em breve novas corretoras verificadas aparecerão por aqui."}
            </p>
            {hasFilters && (
              <Link
                href="/mercado-do-cafe/corretoras"
                className="relative mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400"
              >
                Limpar filtros
              </Link>
            )}
          </section>
        )}

        {/* Featured section */}
        {featured.length > 0 && !hasFilters && (
          <section aria-label="Corretoras em destaque" className="mt-10">
            <SectionHeader
              kicker="Destaque"
              title="Corretoras em evidência"
              count={featured.length}
              hint="Selecionadas pela atividade e pelo perfil completo"
            />
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {featured.map((c) => (
                <CorretoraCard key={c.id} corretora={c} />
              ))}
            </div>
          </section>
        )}

        {/* All corretoras */}
        {(hasFilters ? result.items : regular).length > 0 && (
          <section
            aria-label="Todas as corretoras"
            className={featured.length > 0 && !hasFilters ? "mt-12" : "mt-10"}
          >
            <SectionHeader
              kicker={hasFilters ? "Resultados" : "Rede completa"}
              title={hasFilters ? "Resultados da busca" : "Todas as corretoras"}
              count={(hasFilters ? result.items : regular).length}
              hint={
                hasFilters
                  ? "Corretoras que correspondem aos filtros aplicados"
                  : "Toda a rede verificada do Mercado do Café"
              }
            />
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {(hasFilters ? result.items : regular).map((c) => (
                <CorretoraCard key={c.id} corretora={c} />
              ))}
            </div>
          </section>
        )}

        {/* Pagination em dark glass */}
        {result.totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-3"
            aria-label="Paginação"
          >
            {page > 1 ? (
              <Link
                href={buildPageHref(page - 1)}
                className="rounded-lg bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:text-amber-200 hover:ring-amber-400/30"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg bg-white/[0.02] px-3.5 py-2 text-xs font-semibold text-stone-600 ring-1 ring-white/[0.04]">
                ← Anterior
              </span>
            )}
            <span className="text-xs font-medium tabular-nums text-stone-400">
              Página {page} de {result.totalPages}
            </span>
            {page < result.totalPages ? (
              <Link
                href={buildPageHref(page + 1)}
                className="rounded-lg bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:text-amber-200 hover:ring-amber-400/30"
              >
                Próxima →
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg bg-white/[0.02] px-3.5 py-2 text-xs font-semibold text-stone-600 ring-1 ring-white/[0.04]">
                Próxima →
              </span>
            )}
          </nav>
        )}

        {/* CTA Cadastro — dark glass com botão amber */}
        <section className="relative mt-16 overflow-hidden rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-10">
          {/* Top highlight */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
          />
          {/* Warm glow */}
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
                Cadastre sua empresa na mesa do Kavita. A análise é gratuita
                e, após aprovação, você acessa um painel próprio para
                gerenciar contatos recebidos de produtores da região.
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
                Cadastrar empresa
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

// ─── Small building blocks — Dark version ──────────────

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
  count,
  hint,
}: {
  kicker: string;
  title: string;
  count?: number;
  hint?: string;
}) {
  return (
    <header className="relative pt-6">
      {/* Hairline com fade — white/15 sobre dark */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/15 via-white/[0.06] to-transparent"
      />
      <div className="flex items-baseline gap-3">
        {/* Kicker como pill amber glow */}
        <span className="inline-flex items-center rounded-md bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tabular-nums tracking-[0.1em] text-amber-300 ring-1 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          {kicker}
        </span>
        {typeof count === "number" && (
          <>
            <span aria-hidden className="h-px w-6 bg-white/15" />
            <span className="text-[11px] font-semibold text-stone-400 tabular-nums">
              {count} {count === 1 ? "corretora" : "corretoras"}
            </span>
          </>
        )}
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-stone-50 md:text-xl">
        {title}
      </h2>
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </header>
  );
}
