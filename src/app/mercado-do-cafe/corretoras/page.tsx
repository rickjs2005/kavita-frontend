// src/app/mercado-do-cafe/corretoras/page.tsx
//
// Listagem pública de corretoras — RSC
//
// Refatoração visual premium: a página deixa de ser "listagem branca
// com cards" e passa a comunicar contexto de mercado/cotação do café.
// Lógica e fluxo 100% preservados — só frontend.
//
// Mudanças principais:
//   - Fundo stone-50 com warm ambient gradient (mesmo DNA do painel)
//   - Market strip no topo ("MERCADO DO CAFÉ · ZONA DA MATA · MG")
//     com pulse dot, sugerindo ambiente comercial ativo
//   - Hero com stats reais: corretoras ativas, cidades atendidas,
//     região. Dados derivados do que a API JÁ retorna (zero backend novo)
//   - Section headers com kicker uppercase + count
//   - Cards refatorados (ver CorretoraCard.tsx)
//   - Filtros em command bar (ver CorretoraFilters.tsx)
//   - CTA de cadastro premium (espresso button)

import Link from "next/link";
import { Suspense } from "react";
import {
  fetchPublicCorretoras,
  fetchCorretorasCities,
} from "@/server/data/corretoras";
import { CorretoraCard } from "@/components/mercado-do-cafe/CorretoraCard";
import { CorretoraFilters } from "@/components/mercado-do-cafe/CorretoraFilters";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

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

  const [result, cities] = await Promise.all([
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
  ]);

  const featured = result.items.filter(
    (c) => c.is_featured === true || c.is_featured === 1,
  );
  const regular = result.items.filter(
    (c) => c.is_featured !== true && c.is_featured !== 1,
  );

  const hasFilters = !!(params.city || params.search);

  // Stats reais derivados do que a API já retorna. Zero backend novo.
  const totalAtivas = result.total;
  const totalCidades = cities.length;
  const regionLabel = "Zona da Mata, MG";

  const buildPageHref = (p: number) => {
    const qs = new URLSearchParams();
    qs.set("page", String(p));
    if (params.city) qs.set("city", params.city);
    if (params.search) qs.set("search", params.search);
    return `/mercado-do-cafe/corretoras?${qs.toString()}`;
  };

  return (
    <main className="relative min-h-[calc(100vh-120px)] bg-stone-50 text-stone-900">
      {/* Warm ambient gradient — coerente com o painel privado */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-amber-50/70 via-stone-50/40 to-transparent"
      />

      {/* Market strip — tira fina no topo com pulse dot */}
      <div className="relative border-b border-stone-900/[0.05] bg-stone-900/[0.02] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 md:px-6">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
          </span>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
            Mercado do Café
            <span className="mx-2 text-stone-400">·</span>
            <span className="text-stone-500">Zona da Mata</span>
            <span className="mx-2 text-stone-400">·</span>
            <span className="text-stone-500">MG</span>
          </p>
          <span className="ml-auto hidden text-[10px] font-medium text-stone-500 md:inline">
            Rede de corretoras verificadas
          </span>
        </div>
      </div>

      {/* ═══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 md:px-6 md:pb-12 md:pt-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
            {/* Left: brand + kicker + title + subtitle */}
            <div className="min-w-0 flex-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center text-stone-900">
                  <PanelBrandMark className="h-full w-full" />
                </div>
                <div className="h-6 w-px bg-stone-300" aria-hidden />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  Corretoras verificadas
                </p>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl lg:text-5xl">
                A mesa do café da Zona&nbsp;da&nbsp;Mata
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
                Encontre corretoras que atuam na Zona da Mata mineira. Rede
                curada pelo Kavita — cada empresa listada passou pela análise
                da nossa equipe antes de aparecer aqui. Negocie com confiança,
                diretamente pelos canais de cada corretora.
              </p>
            </div>

            {/* Right: market intelligence stats */}
            <aside
              aria-label="Indicadores do mercado"
              className="grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-2xl bg-stone-900/[0.06] ring-1 ring-stone-900/[0.08] md:min-w-[420px]"
            >
              {/* Top highlight */}
              <div className="col-span-3 -mb-px hidden h-px bg-gradient-to-r from-transparent via-white to-transparent md:block" />

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
              <Stat kicker="Região" value={regionLabel} textual />
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ CONTEÚDO ══════════════════════════════════════════════ */}
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
        {/* Filters */}
        <Suspense fallback={null}>
          <CorretoraFilters cities={cities} />
        </Suspense>

        {/* Empty state */}
        {result.items.length === 0 && (
          <section className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.06]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <PanelBrandMark className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-stone-900">
              {hasFilters
                ? "Nenhuma corretora encontrada para essa busca"
                : "A mesa ainda está sendo montada"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
              {hasFilters
                ? "Tente outro filtro ou remova os critérios de busca."
                : "Em breve novas corretoras verificadas aparecerão por aqui."}
            </p>
            {hasFilters && (
              <Link
                href="/mercado-do-cafe/corretoras"
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-stone-50 shadow-sm shadow-stone-900/20 hover:bg-stone-800"
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

        {/* Pagination */}
        {result.totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-3"
            aria-label="Paginação"
          >
            {page > 1 ? (
              <Link
                href={buildPageHref(page - 1)}
                className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 shadow-sm shadow-stone-900/[0.03] transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-stone-200 bg-white/60 px-3.5 py-2 text-xs font-semibold text-stone-300">
                ← Anterior
              </span>
            )}
            <span className="text-xs font-medium tabular-nums text-stone-500">
              Página {page} de {result.totalPages}
            </span>
            {page < result.totalPages ? (
              <Link
                href={buildPageHref(page + 1)}
                className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 shadow-sm shadow-stone-900/[0.03] transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                Próxima →
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-stone-200 bg-white/60 px-3.5 py-2 text-xs font-semibold text-stone-300">
                Próxima →
              </span>
            )}
          </nav>
        )}

        {/* CTA Cadastro — estilo premium */}
        <section className="mt-16 overflow-hidden rounded-2xl bg-stone-900 p-7 text-stone-50 shadow-xl shadow-stone-900/20 ring-1 ring-stone-900/20 md:p-10">
          <div className="relative">
            {/* Top highlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-x-7 -top-7 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent md:-inset-x-10 md:-top-10"
            />
            {/* Warm glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"
            />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
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
                className="shrink-0 rounded-xl bg-stone-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-900 shadow-lg shadow-black/20 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
              >
                Cadastrar empresa →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─── Small building blocks (mesma página, baixa reuso) ──────────────

function Stat({
  kicker,
  value,
  hint,
  textual = false,
}: {
  kicker: string;
  value: number | string;
  hint?: string;
  textual?: boolean;
}) {
  return (
    <div className="bg-white p-4 md:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {kicker}
      </p>
      <p
        className={`mt-1.5 font-semibold tracking-tight text-stone-900 ${
          textual ? "text-sm md:text-base" : "text-2xl tabular-nums md:text-3xl"
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-[10px] text-stone-500">{hint}</p>
      )}
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
    <header className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
          {kicker}
        </p>
        {typeof count === "number" && (
          <>
            <span aria-hidden className="h-px w-6 bg-stone-300" />
            <span className="text-[11px] font-semibold text-stone-500 tabular-nums">
              {count} {count === 1 ? "corretora" : "corretoras"}
            </span>
          </>
        )}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-stone-900 md:text-xl">
        {title}
      </h2>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </header>
  );
}
