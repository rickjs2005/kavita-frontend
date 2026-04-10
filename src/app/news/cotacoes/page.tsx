// src/app/news/cotacoes/page.tsx
//
// /news/cotacoes — Hub de Inteligência de Mercado.
//
// Redesign completo: deixa de ser "listagem com header claro" e vira um
// hub dark committed coerente com o restante do Kavita News, mas com
// identidade própria do módulo Mercado:
//
//   - signature accent: emerald-400 (mercado / crescimento / dinheiro)
//   - secundário essencial: rose-400 (variação negativa)
//   - tratamento tipográfico denso e mono (vibe terminal financeiro)
//
// Estrutura:
//   1. Atmospheric layer (4 glows emerald/teal + drift)
//   2. Live ticker strip "MERCADO ABERTO · LIVE"
//   3. Hero editorial — kicker mono, headline gradient, sub
//   4. Tape strip: linha horizontal estilo "ticker" com variações
//   5. Stats strip: total / em alta / em queda / estáveis (computed)
//   6. Resumo do mercado (frase de overview)
//   7. Section "Ativos monitorados" com grid 3-col de CotacaoCards
//   8. CTA Mercado do Café (inline dark)
//   9. Disclaimer + footer mono

import type { PublicCotacao } from "@/lib/newsPublicApi";
import { fetchPublicCotacoes } from "@/server/data/cotacoes";
import { EmptyState } from "@/components/news/EmptyState";
import { CotacaoCard } from "@/components/news/CotacaoCard";
import {
  safeNum,
  formatPct,
  getMarketEmoji,
} from "@/utils/kavita-news/cotacoes";
import Link from "next/link";

export const revalidate = 120;

type FetchResult =
  | { status: "ok"; items: PublicCotacao[] }
  | { status: "empty" }
  | { status: "error"; message: string };

async function loadCotacoes(): Promise<FetchResult> {
  try {
    const items = await fetchPublicCotacoes();
    if (items.length === 0) return { status: "empty" };
    return { status: "ok", items };
  } catch (err: any) {
    const message =
      err?.message ||
      "Não foi possível carregar as cotações. Tente novamente em alguns instantes.";
    return { status: "error", message };
  }
}

function classifyMove(items: PublicCotacao[]) {
  let up = 0;
  let down = 0;
  let flat = 0;
  for (const it of items) {
    const v = safeNum(it.variation_day);
    if (v === null) {
      flat += 1;
      continue;
    }
    if (v > 0.3) up += 1;
    else if (v < -0.3) down += 1;
    else flat += 1;
  }
  return { up, down, flat };
}

function buildMarketSummary(items: PublicCotacao[]): string {
  const parts: string[] = [];
  for (const item of items) {
    const v = safeNum(item.variation_day);
    if (v === null) continue;
    const name = item.name ?? item.slug ?? "Ativo";
    if (v > 1) parts.push(`${name} em alta`);
    else if (v > 0.3) parts.push(`${name} com leve alta`);
    else if (v >= -0.3) parts.push(`${name} estável`);
    else if (v >= -1) parts.push(`${name} com leve queda`);
    else parts.push(`${name} em queda`);
  }
  if (parts.length === 0) return "Dados de mercado em atualização.";
  if (parts.length <= 3) return parts.join(", ") + ".";
  return parts.slice(0, 3).join(", ") + ` e mais ${parts.length - 3}.`;
}

export default async function CotacoesListPage() {
  const result = await loadCotacoes();
  const currentYear = new Date().getFullYear();

  const items = result.status === "ok" ? result.items : [];
  const moves = classifyMove(items);
  const total = items.length;
  const summary = items.length > 0 ? buildMarketSummary(items) : null;

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer ═══════════════════════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-emerald-500/[0.10] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-32 h-[480px] w-[480px] rounded-full bg-teal-400/[0.07] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[58%] h-[420px] w-[420px] rounded-full bg-emerald-400/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-3xl kavita-drift-a" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.55)_85%)]" />
      </div>

      <div className="relative">
        {/* ─── Live ticker strip ─── */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
              </span>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Mercado · Ticker Ativo · Live
              </p>
            </div>
            {total > 0 && (
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 md:block">
                {total} ativos · {moves.up} alta · {moves.down} queda ·{" "}
                {moves.flat} estável
              </p>
            )}
          </div>
        </div>

        {/* ─── Hero ─── */}
        <header className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 md:px-6 md:pb-14 md:pt-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <Link
                href="/news"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-emerald-300"
              >
                ← K · NEWS
              </Link>
              <span className="h-px w-12 bg-emerald-400/40" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Mercado · {currentYear}
              </p>
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-stone-50 md:text-6xl lg:text-7xl">
              Inteligência de{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                preço do agro
              </span>
              , no horário do mercado.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg">
              Cotações de referência convertidas em real, atualizadas a partir
              das principais bolsas internacionais. Para quem precisa decidir
              hoje com base no que o mercado está praticando agora.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10">
                <span aria-hidden>⏱</span>
                Atualizado ao longo do dia
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10">
                Fontes · BCB · ICE · CME
              </span>
            </div>
          </div>
        </header>

        {/* ─── Tape ticker (horizontal scroll de variações) ─── */}
        {result.status === "ok" && total > 0 && (
          <section
            aria-label="Ticker de mercado"
            className="mx-auto w-full max-w-7xl px-4 md:px-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
              />
              <div className="relative flex gap-1 overflow-x-auto px-2 py-3 scrollbar-hide">
                {items.map((it) => (
                  <TickerPill key={it.id} item={it} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Stats strip ─── */}
        {result.status === "ok" && total > 0 && (
          <section
            aria-label="Resumo do mercado"
            className="mx-auto mt-6 w-full max-w-7xl px-4 md:px-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
              />
              <div className="relative grid grid-cols-2 divide-x divide-white/[0.06] md:grid-cols-4">
                <Stat
                  kicker="Ativos monitorados"
                  value={String(total).padStart(2, "0")}
                  unit="referências"
                  tone="emerald"
                />
                <Stat
                  kicker="Em alta"
                  value={String(moves.up).padStart(2, "0")}
                  unit="ativos ▲"
                  tone="emerald"
                />
                <Stat
                  kicker="Em queda"
                  value={String(moves.down).padStart(2, "0")}
                  unit="ativos ▼"
                  tone="rose"
                />
                <Stat
                  kicker="Estáveis"
                  value={String(moves.flat).padStart(2, "0")}
                  unit="ativos ●"
                  tone="stone"
                />
              </div>

              {summary && (
                <div className="relative border-t border-white/[0.06] px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Resumo do dia
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-stone-200">
                      {summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Erro ─── */}
        {result.status === "error" && (
          <section
            aria-label="Erro ao carregar cotações"
            className="mx-auto mt-10 w-full max-w-3xl px-4 md:px-6"
          >
            <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-amber-400/30 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                Sinal interrompido
              </p>
              <p className="mt-2 text-base font-semibold text-stone-50">
                Erro ao carregar cotações
              </p>
              <p className="mt-1 max-w-md text-sm text-stone-400">
                {result.message}
              </p>
            </div>
          </section>
        )}

        {/* ─── Lista de ativos ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
                  aria-hidden
                >
                  01
                </span>
                <span
                  className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                  aria-hidden
                />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
                  Ativos monitorados
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                Painel de cotações
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
                Selecione um ativo para abrir a análise completa, com variação,
                conversão para saca brasileira e contexto da praça
                internacional.
              </p>
            </div>

            {total > 0 && (
              <span className="hidden shrink-0 items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-emerald-400/20 md:inline-flex">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                  aria-hidden
                />
                {total} {total === 1 ? "ativo" : "ativos"}
              </span>
            )}
          </div>

          <div className="mt-8">
            {result.status === "ok" ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((c) => (
                  <CotacaoCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] p-10 ring-1 ring-white/[0.06] backdrop-blur-sm">
                <EmptyState
                  title="Nenhuma cotação disponível no momento"
                  subtitle="Os dados são atualizados conforme as fontes oficiais. Volte em breve."
                />
              </div>
            )}
          </div>
        </section>

        {/* ─── CTA Mercado do Café (inline dark) ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-6">
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
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Mercado do Café
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                  Conheça corretoras que atuam na Zona da Mata.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-stone-300">
                  Cotação é referência. Negociação acontece com pessoas. Compare,
                  conheça e fale direto com corretoras de café da região.
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
                <span className="relative">Ver corretoras</span>
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
        <section className="mx-auto w-full max-w-3xl px-4 pb-10 text-center md:px-6">
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-stone-500">
            Os valores exibidos são referências de mercado internacional
            convertidas para real. O preço local pode variar conforme
            cooperativa, qualidade e condições de negociação.
          </p>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Hub de Mercado
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Atualização contínua · Cobertura nacional
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ─── Ticker pill (linha de tape) ─────────────────────────────────────────
function TickerPill({ item }: { item: PublicCotacao }) {
  const v = safeNum(item.variation_day);
  const isUp = v !== null && v > 0.3;
  const isDown = v !== null && v < -0.3;
  const tone = isUp
    ? "text-emerald-300"
    : isDown
      ? "text-rose-300"
      : "text-stone-400";
  const arrow = isUp ? "▲" : isDown ? "▼" : "●";
  const emoji = getMarketEmoji(item);

  return (
    <Link
      href={`/news/cotacoes/${item.slug}`}
      className="group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-300 transition-colors hover:bg-white/[0.05] hover:text-stone-50"
    >
      <span aria-hidden className="text-sm">
        {emoji}
      </span>
      <span className="truncate">{item.name}</span>
      <span className={tone}>
        {arrow} {v !== null ? formatPct(v) : "—"}
      </span>
    </Link>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────
function Stat({
  kicker,
  value,
  unit,
  tone,
}: {
  kicker: string;
  value: string;
  unit: string;
  tone: "emerald" | "rose" | "stone";
}) {
  const accent =
    tone === "emerald"
      ? "text-emerald-300/80"
      : tone === "rose"
        ? "text-rose-300/80"
        : "text-stone-400";

  return (
    <div className="px-6 py-5 md:px-7 md:py-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {kicker}
      </p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-stone-50 md:text-4xl">
        {value}
      </p>
      <p
        className={`mt-1 text-[11px] font-medium uppercase tracking-[0.12em] ${accent}`}
      >
        {unit}
      </p>
    </div>
  );
}
