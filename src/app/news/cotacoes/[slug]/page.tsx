// src/app/news/cotacoes/[slug]/page.tsx
//
// Detalhe de uma cotação — Hub de Mercado.
//
// Redesign completo: deixa de ser "card grande sobre fundo claro" e
// vira uma página de detalhe dark committed coerente com /news/cotacoes
// e com o restante do Kavita News.
//
// Identidade do módulo Mercado:
//   - signature accent: emerald-400 (mercado/crescimento)
//   - secundário essencial: rose-400 (variação negativa)
//   - tipografia mono nos números (vibe terminal financeiro)
//
// Estrutura:
//   1. Atmospheric layer
//   2. Live strip "MERCADO · {NOME} · LIVE"
//   3. Hero — breadcrumb mono, nome do ativo gigante, badge de variação
//   4. Bloco PREÇO HERÓI — número 8xl em gradient, equivalência saca
//      em painel ao lado, monetary delta x preço anterior
//   5. Praça internacional — bolsa, cidade, contrato, câmbio
//   6. "O que essa cotação quer dizer" — narrativa contextual
//   7. "Entendendo a unidade" — quando aplicável
//   8. Tape histórico — últimas leituras como linhas de ticker
//   9. CTA Mercado do Café (inline dark amber)
//   10. Disclaimer + footer mono

import Link from "next/link";
import type { PublicCotacao } from "@/lib/newsPublicApi";
import {
  fetchPublicCotacaoBySlug,
  fetchCotacaoHistory,
  type CotacaoHistoryEntry,
} from "@/server/data/cotacoes";
import {
  safeNum,
  formatPrice,
  formatPct,
  formatDatePtBR,
  getMarketEmoji,
  hasPrice,
  describeTrend,
  convertToLocalUnit,
  simplifySource,
} from "@/utils/kavita-news/cotacoes";

export const revalidate = 120;

// ─── Static metadata por slug ────────────────────────────────────────────
const UNIT_EXPLANATIONS: Record<
  string,
  { intl: string; local: string; math: string }
> = {
  "cafe-arabica": {
    intl: "libras (lb)",
    local: "sacas de 60 kg",
    math: "1 saca = 60 kg = 132,28 libras",
  },
  "cafe-robusta": {
    intl: "toneladas métricas",
    local: "sacas de 60 kg",
    math: "1 saca = 60 kg = 0,06 toneladas",
  },
  soja: {
    intl: "bushels (bu)",
    local: "sacas de 60 kg",
    math: "1 saca = 60 kg ≈ 2,20 bushels",
  },
  milho: {
    intl: "bushels (bu)",
    local: "sacas de 60 kg",
    math: "1 saca = 60 kg ≈ 2,36 bushels",
  },
  "boi-gordo": {
    intl: "hundredweight (cwt)",
    local: "arrobas (@)",
    math: "1 cwt ≈ 45,36 kg ≈ 3,02 arrobas",
  },
};

const MARKET_CONTEXT: Record<
  string,
  { exchange: string; city: string; contract: string }
> = {
  "cafe-arabica": {
    exchange: "ICE (Intercontinental Exchange)",
    city: "Nova York",
    contract: "Café Arábica tipo C",
  },
  "cafe-robusta": {
    exchange: "ICE (Intercontinental Exchange)",
    city: "Londres",
    contract: "Café Robusta",
  },
  soja: {
    exchange: "CME (Chicago Mercantile Exchange)",
    city: "Chicago",
    contract: "Soja (Soybean)",
  },
  milho: {
    exchange: "CME (Chicago Mercantile Exchange)",
    city: "Chicago",
    contract: "Milho (Corn)",
  },
  "boi-gordo": {
    exchange: "CME (Chicago Mercantile Exchange)",
    city: "Chicago",
    contract: "Boi Gordo (Live Cattle)",
  },
  dolar: {
    exchange: "Banco Central do Brasil",
    city: "Brasília",
    contract: "PTAX (venda)",
  },
};

// ─── Data loading ────────────────────────────────────────────────────────
type FetchResult =
  | { status: "ok"; item: PublicCotacao; history: CotacaoHistoryEntry[] }
  | { status: "not_found" }
  | { status: "error"; message: string };

async function loadCotacao(slug: string): Promise<FetchResult> {
  try {
    const item = await fetchPublicCotacaoBySlug(slug);
    if (!item) return { status: "not_found" };
    const history = await fetchCotacaoHistory(slug, 10);
    return { status: "ok", item, history };
  } catch (err: any) {
    const message =
      err?.message ||
      "Não foi possível carregar a cotação. Tente novamente em alguns instantes.";
    return { status: "error", message };
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ─── Page ────────────────────────────────────────────────────────────────
export default async function CotacaoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await loadCotacao(slug);
  const currentYear = new Date().getFullYear();

  if (result.status === "error" || result.status === "not_found") {
    const errorMessage =
      result.status === "error"
        ? result.message
        : "Verifique o endereço ou volte para a lista de cotações do agro.";
    const title =
      result.status === "error"
        ? "Erro ao carregar cotação"
        : "Cotação não encontrada";

    return (
      <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.07] blur-3xl" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-teal-400/[0.05] blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-3xl px-4 py-20 md:px-6">
          <div className="rounded-2xl bg-white/[0.04] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Sinal indisponível
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-50">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              {errorMessage}
            </p>
            <Link
              href="/news/cotacoes"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/[0.05] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-emerald-400/30 transition-all hover:bg-white/[0.08] hover:ring-emerald-400/50"
            >
              <span aria-hidden>←</span> Voltar para Cotações
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ─── Derived data ──────────────────────────────────────────────────────
  const { item, history } = result;
  const itemSlug = String(item.slug ?? slug);
  const emoji = getMarketEmoji(item);
  const source = simplifySource(itemSlug, item.source);

  const priceNum = safeNum(item.price);
  const varNum = safeNum(item.variation_day);
  const hasPriceVal = hasPrice(item.price);

  const varLabel = formatPct(varNum);
  const trend = describeTrend(varNum);
  const isUp = varNum !== null && varNum > 0;
  const isDown = varNum !== null && varNum < 0;

  const updated = formatDatePtBR(item.last_update_at, "medium");
  const localUnit = priceNum !== null ? convertToLocalUnit(priceNum, itemSlug) : null;

  const prevEntry = history.length >= 2 ? history[1] : null;
  const prevPriceReal = prevEntry ? safeNum(prevEntry.price) : null;
  const varMonetary =
    priceNum !== null && prevPriceReal !== null
      ? Math.abs(priceNum - prevPriceReal)
      : null;

  const recentEntries = history.slice(0, 5);

  const unitExpl = UNIT_EXPLANATIONS[itemSlug];
  const mktCtx = MARKET_CONTEXT[itemSlug];
  const exchangeRate = safeNum((item as any).exchange_rate);

  // Tons usados pelo número herói e pelos badges
  const trendTone = isUp
    ? {
        text: "text-emerald-300",
        bg: "bg-emerald-500/15",
        ring: "ring-emerald-400/30",
        gradient: "from-emerald-200 via-emerald-100 to-teal-200",
        glow: "bg-emerald-500/[0.10]",
        arrow: "▲",
      }
    : isDown
      ? {
          text: "text-rose-300",
          bg: "bg-rose-500/15",
          ring: "ring-rose-400/30",
          gradient: "from-rose-200 via-rose-100 to-orange-200",
          glow: "bg-rose-500/[0.10]",
          arrow: "▼",
        }
      : {
          text: "text-stone-300",
          bg: "bg-white/[0.06]",
          ring: "ring-white/15",
          gradient: "from-stone-100 via-stone-200 to-stone-300",
          glow: "bg-white/[0.04]",
          arrow: "●",
        };

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer ═══════════════════════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-emerald-500/[0.10] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-32 h-[480px] w-[480px] rounded-full bg-teal-400/[0.07] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[55%] h-[420px] w-[420px] rounded-full bg-emerald-400/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-3xl kavita-drift-a" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.55)_85%)]" />
      </div>

      <div className="relative">
        {/* ─── Live strip ─── */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
              </span>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Mercado · {item.name} · Live
              </p>
            </div>
            <Link
              href="/news/cotacoes"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-emerald-300"
            >
              ← Todas as cotações
            </Link>
          </div>
        </div>

        {/* ─── Hero ─── */}
        <header className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 md:px-6 md:pb-14 md:pt-20">
          <div className="flex items-center gap-3">
            <Link
              href="/news"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-emerald-300"
            >
              K · NEWS
            </Link>
            <span className="text-stone-600" aria-hidden>
              /
            </span>
            <Link
              href="/news/cotacoes"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-emerald-300"
            >
              MERCADO
            </Link>
            <span className="text-stone-600" aria-hidden>
              /
            </span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              {itemSlug.toUpperCase()}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-end gap-5">
              <div
                className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 md:block"
                aria-hidden
              >
                <p>Ativo</p>
                <p className="mt-1 text-3xl">{emoji}</p>
              </div>
              <span
                className="hidden h-16 w-px bg-white/[0.08] md:block"
                aria-hidden
              />
              <h1 className="text-4xl font-bold leading-[1.0] tracking-tight text-stone-50 md:text-6xl lg:text-7xl">
                {item.name}
                <span className="text-emerald-300/80">.</span>
              </h1>
            </div>

            {varNum !== null && (
              <div className="flex flex-col items-start md:items-end">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Variação do dia
                </p>
                <span
                  className={`mt-1.5 inline-flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-2xl font-bold ring-1 ${trendTone.bg} ${trendTone.ring} ${trendTone.text} md:text-3xl`}
                >
                  <span aria-hidden>{trendTone.arrow}</span>
                  {varLabel}
                </span>
              </div>
            )}
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg">
            Referência internacional convertida para real, com leitura
            operacional para quem toma decisão de mercado todos os dias.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                aria-hidden
              />
              Ao vivo
            </span>
            {source && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10">
                Fonte · {source}
              </span>
            )}
            {updated && updated !== "—" && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-medium text-stone-400 ring-1 ring-white/[0.06]">
                <span aria-hidden>⏱</span>
                {updated}
              </span>
            )}
          </div>
        </header>

        {/* ═══ Bloco PREÇO HERÓI ════════════════════════════════════════ */}
        <section
          aria-label="Preço de referência"
          className="mx-auto w-full max-w-6xl px-4 md:px-6"
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            {/* Preço internacional — herói */}
            <div className="relative overflow-hidden rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-10 lg:col-span-3">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"
              />
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full ${trendTone.glow} blur-3xl`}
              />

              <div className="relative flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                  01 · Preço internacional
                </p>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Referência
                </span>
              </div>

              {hasPriceVal ? (
                <>
                  <div className="relative mt-6 flex items-baseline gap-3">
                    <p
                      className={`bg-gradient-to-br bg-clip-text font-mono text-7xl font-extrabold leading-none tracking-tight text-transparent md:text-8xl ${trendTone.gradient}`}
                    >
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="relative mt-3 font-mono text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">
                    {item.unit ?? ""}
                  </p>

                  {/* Linha de variação monetária real */}
                  {varMonetary !== null && (
                    <p className="relative mt-4 text-sm text-stone-400">
                      <span className={`font-bold ${trendTone.text}`}>
                        {isUp ? "+" : "−"}R$ {formatPrice(varMonetary)}
                      </span>{" "}
                      em relação à leitura anterior
                      {prevPriceReal !== null && (
                        <span className="text-stone-500">
                          {" "}
                          (R$ {formatPrice(prevPriceReal)})
                        </span>
                      )}
                    </p>
                  )}

                  <p className="relative mt-1 text-[11px] font-medium text-stone-500">
                    {trend}
                  </p>
                </>
              ) : (
                <div className="relative mt-6">
                  <p className="text-2xl font-semibold text-stone-400">
                    Aguardando atualização
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    O preço será exibido após a primeira sincronização com a
                    fonte.
                  </p>
                </div>
              )}
            </div>

            {/* Equivalência em saca brasileira — herói paralelo */}
            {localUnit && hasPriceVal ? (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-emerald-500/[0.08] p-8 ring-1 ring-emerald-400/20 shadow-2xl shadow-black/40 backdrop-blur-sm md:p-10 lg:col-span-2">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/[0.12] blur-3xl"
                />

                <div className="relative flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    02 · Equivalência local
                  </p>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/30">
                    BRL
                  </span>
                </div>

                <div className="relative mt-6">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                    R$
                  </p>
                  <p className="mt-1 bg-gradient-to-br from-emerald-200 via-emerald-100 to-teal-200 bg-clip-text font-mono text-5xl font-extrabold leading-none tracking-tight text-transparent md:text-6xl">
                    {formatPrice(localUnit.value)}
                  </p>
                  <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                    por {localUnit.label}
                  </p>
                </div>

                <p className="relative mt-6 border-t border-emerald-400/10 pt-4 text-[11px] leading-relaxed text-stone-400">
                  Conversão aproximada da referência internacional para a
                  unidade praticada no Brasil. Use como apoio operacional —
                  preço real varia por praça.
                </p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] p-8 ring-1 ring-white/[0.06] backdrop-blur-sm md:p-10 lg:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  02 · Equivalência local
                </p>
                <p className="mt-6 text-sm text-stone-500">
                  Conversão indisponível para este ativo.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ Praça internacional ══════════════════════════════════════ */}
        {(mktCtx || exchangeRate || item.source) && (
          <section
            aria-label="Praça internacional"
            className="mx-auto mt-6 w-full max-w-6xl px-4 md:px-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-8">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
              />
              <p className="relative text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
                03 · Praça internacional
              </p>

              <div className="relative mt-5 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                {mktCtx && (
                  <>
                    <DataItem kicker="Bolsa" value={mktCtx.exchange.split(" (")[0]} />
                    <DataItem kicker="Praça" value={mktCtx.city} />
                    <DataItem kicker="Contrato" value={mktCtx.contract} />
                  </>
                )}
                {exchangeRate !== null && (
                  <DataItem
                    kicker="Câmbio PTAX"
                    value={`R$ ${formatPrice(exchangeRate)}`}
                    mono
                  />
                )}
                {!mktCtx && item.source && (
                  <DataItem kicker="Fonte" value={item.source} />
                )}
              </div>
            </div>
          </section>
        )}

        {/* ═══ Interpretação ════════════════════════════════════════════ */}
        <section
          aria-label="Interpretação"
          className="mx-auto mt-14 w-full max-w-6xl px-4 md:px-6 md:mt-20"
        >
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
                  aria-hidden
                >
                  04
                </span>
                <span
                  className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                  aria-hidden
                />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
                  Como ler
                </p>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                O que essa cotação quer dizer.
              </h2>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <p className="text-base leading-relaxed text-stone-300">
                Este valor é a referência{" "}
                {item.name ? `de ${item.name.toLowerCase()}` : "do ativo"}{" "}
                negociado
                {mktCtx
                  ? ` na bolsa de ${mktCtx.city} (${mktCtx.exchange.split(" (")[0]})`
                  : " no mercado internacional"}
                , convertido para real brasileiro
                {exchangeRate
                  ? ` usando a taxa do Banco Central (R$ ${formatPrice(exchangeRate)})`
                  : ""}
                .
              </p>
              <p className="text-base leading-relaxed text-stone-300">
                O preço que você recebe na cooperativa ou no comprador local
                pode ser diferente — ele depende da região, da qualidade do
                produto e das condições de negociação.
              </p>

              <div className="relative overflow-hidden rounded-2xl bg-emerald-500/[0.06] p-5 ring-1 ring-emerald-400/20">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Recomendação
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-200">
                  Use esta cotação como{" "}
                  <span className="font-semibold text-emerald-200">
                    indicador de tendência do mercado
                  </span>
                  , não como preço final de venda. Negociações concretas
                  acontecem na praça.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Entendendo a unidade ═════════════════════════════════════ */}
        {unitExpl && localUnit && hasPriceVal && (
          <section
            aria-label="Conversão de unidades"
            className="mx-auto mt-14 w-full max-w-6xl px-4 md:px-6 md:mt-20"
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
                aria-hidden
              >
                05
              </span>
              <span
                className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                aria-hidden
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
                Conversão
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
              Entendendo a unidade.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
              O mercado internacional usa <strong>{unitExpl.intl}</strong> como
              unidade. No Brasil, a referência é{" "}
              <strong>{unitExpl.local}</strong>.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <ConversionCard
                kicker="Internacional"
                price={`R$ ${formatPrice(item.price)}`}
                unit={`/${(item.unit ?? "").replace("R$/", "")}`}
              />
              <ConversionCard
                kicker="Brasil"
                price={`R$ ${formatPrice(localUnit.value)}`}
                unit={`/${localUnit.label}`}
                highlight
              />
            </div>

            <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-stone-500">
              {unitExpl.math}. Conversão aproximada — valor real varia conforme
              praça e negociação.
            </p>
          </section>
        )}

        {/* ═══ Histórico — tape de leituras ═════════════════════════════ */}
        <section
          aria-label="Leituras recentes"
          className="mx-auto mt-14 w-full max-w-6xl px-4 md:px-6 md:mt-20"
        >
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
              aria-hidden
            >
              06
            </span>
            <span
              className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
              Histórico
            </p>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
            Leituras recentes.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            Últimas atualizações de preço deste ativo, em real, com variação
            relativa à leitura anterior.
          </p>

          <div className="mt-6">
            {recentEntries.length > 0 ? (
              <div className="overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm">
                <span
                  aria-hidden
                  className="pointer-events-none absolute h-px w-full bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
                />
                <div className="divide-y divide-white/[0.06]">
                  {recentEntries.map((entry, idx) => {
                    const ep = safeNum(entry.price);
                    const ev = safeNum(entry.variation_day);
                    const eLocal =
                      ep !== null ? convertToLocalUnit(ep, itemSlug) : null;
                    const eUp = ev !== null && ev > 0;
                    const eDown = ev !== null && ev < 0;
                    const eTone = eUp
                      ? "text-emerald-300"
                      : eDown
                        ? "text-rose-300"
                        : "text-stone-400";
                    const eArrow = eUp ? "▲" : eDown ? "▼" : "●";
                    const dateStr = formatDatePtBR(
                      entry.created_at ?? entry.observed_at,
                    );

                    return (
                      <div
                        key={entry.id ?? idx}
                        className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03] md:px-6 ${
                          idx === 0 ? "bg-emerald-500/[0.04]" : ""
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-4">
                          <span
                            className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              idx === 0 ? "text-emerald-300" : "text-stone-500"
                            }`}
                            aria-hidden
                          >
                            {idx === 0
                              ? "ATUAL"
                              : `T-${idx.toString().padStart(2, "0")}`}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`font-mono text-base font-bold tracking-tight ${
                                idx === 0 ? "text-stone-50" : "text-stone-200"
                              }`}
                            >
                              {ep !== null
                                ? `R$ ${formatPrice(ep)}`
                                : "—"}
                              <span className="ml-1.5 text-[11px] font-medium text-stone-500">
                                {(item.unit ?? "").replace("R$/", "/")}
                              </span>
                            </p>
                            {eLocal && (
                              <p className="mt-0.5 text-[11px] text-stone-500">
                                ≈ R$ {formatPrice(eLocal.value)} /{eLocal.label}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          {ev !== null && (
                            <span
                              className={`font-mono text-sm font-bold ${eTone}`}
                            >
                              <span aria-hidden>{eArrow}</span>{" "}
                              {formatPct(ev)}
                            </span>
                          )}
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] p-8 ring-1 ring-dashed ring-white/[0.08] backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Histórico
                </p>
                <p className="mt-2 text-sm text-stone-400">
                  O histórico ficará disponível após as primeiras atualizações
                  deste ativo.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ CTA Mercado do Café (inline dark amber) ══════════════════ */}
        <section className="mx-auto mt-14 w-full max-w-6xl px-4 md:mt-20 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-amber-500/[0.05] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm md:p-14">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl"
            />
            <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Mercado do Café
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                  Está acompanhando essa cotação?
                </h2>
                <p className="mt-3 text-base leading-relaxed text-stone-300">
                  Conheça corretoras de café que atuam na Zona da Mata e
                  negocie com confiança a partir do que o mercado está
                  praticando agora.
                </p>
              </div>
              <Link
                href="/mercado-do-cafe/corretoras"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                />
                <span className="relative">Encontrar corretoras</span>
                <span
                  aria-hidden
                  className="relative transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Disclaimer ─── */}
        <section className="mx-auto w-full max-w-3xl px-4 py-12 text-center md:px-6">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-stone-500">
            Os valores exibidos são referências de mercado internacional
            convertidas para real. O preço local pode variar conforme
            cooperativa, qualidade e condições de negociação.
          </p>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Hub de Mercado
              </p>
            </div>
            <Link
              href="/news/cotacoes"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 transition-colors hover:text-emerald-200"
            >
              ← Todas as cotações
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ─── Data item ───────────────────────────────────────────────────────────
function DataItem({
  kicker,
  value,
  mono = false,
}: {
  kicker: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {kicker}
      </p>
      <p
        className={`mt-1.5 text-sm font-semibold text-stone-100 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Conversion card ─────────────────────────────────────────────────────
function ConversionCard({
  kicker,
  price,
  unit,
  highlight = false,
}: {
  kicker: string;
  price: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 ring-1 backdrop-blur-sm md:p-7 ${
        highlight
          ? "bg-gradient-to-br from-emerald-500/[0.10] to-white/[0.02] ring-emerald-400/20"
          : "bg-white/[0.04] ring-white/[0.08]"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
          highlight ? "text-emerald-300" : "text-stone-500"
        }`}
      >
        {kicker}
      </p>
      <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
        {price}
        <span className="ml-1.5 text-[11px] font-medium text-stone-500">
          {unit}
        </span>
      </p>
    </div>
  );
}
