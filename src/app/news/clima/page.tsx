// src/app/news/clima/page.tsx
//
// /news/clima — Central de Monitoramento Climático.
//
// Redesign completo: a página deixa de ser um header claro + grid de
// cards e vira uma central dark committed com identidade própria do
// módulo Clima.
//
// Identidade visual:
//   - paradigma dark stone-950 (mesmo de Drones, Mercado do Café, /news)
//   - signature accent: sky-400 + cyan-400 (água, chuva, frio)
//   - secundário: emerald-400 só nos pulse dots "ao vivo"
//
// Estrutura:
//   1. Atmospheric layer (4 glows sky/cyan + drift)
//   2. Live strip "MONITORAMENTO ATIVO" no topo
//   3. Hero editorial — kicker mono, headline gradient, sub
//   4. Stats strip (cidades, total 24h, total 7d) com agregados reais
//      computados a partir dos próprios items — sem inventar nada
//   5. Grid 3-col de ClimaCards (component já em dark glass sky)
//   6. Faixa institucional curta com fonte
//   7. Footer mono

import { newsPublicApi } from "@/lib/newsPublicApi";
import { EmptyState } from "@/components/news/EmptyState";
import { ClimaCard } from "@/components/news/ClimaCard";
import type { PublicClima } from "@/lib/newsPublicApi";
import Link from "next/link";

export const revalidate = 120;

function safeNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function sumMm(items: PublicClima[], key: "mm_24h" | "mm_7d") {
  let total = 0;
  let count = 0;
  for (const it of items) {
    const n = safeNum(it[key]);
    if (n !== null) {
      total += n;
      count += 1;
    }
  }
  return { total, count };
}

function findHighest(items: PublicClima[], key: "mm_24h" | "mm_7d") {
  let best: { item: PublicClima; value: number } | null = null;
  for (const it of items) {
    const n = safeNum(it[key]);
    if (n === null) continue;
    if (!best || n > best.value) best = { item: it, value: n };
  }
  return best;
}

function uniqueUfs(items: PublicClima[]) {
  return new Set(items.map((i) => i.uf).filter(Boolean)).size;
}

function formatMm(v: number) {
  return v.toFixed(1);
}

export default async function ClimaListPage() {
  let items: PublicClima[] = [];
  try {
    items = await newsPublicApi.climaList();
  } catch {
    items = [];
  }

  const cityCount = items.length;
  const ufCount = uniqueUfs(items);
  const sum24 = sumMm(items, "mm_24h");
  const sum7 = sumMm(items, "mm_7d");
  const peak24 = findHighest(items, "mm_24h");
  const currentYear = new Date().getFullYear();

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer — paleta sky/cyan (água) ═══════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-sky-500/[0.09] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-32 h-[480px] w-[480px] rounded-full bg-cyan-400/[0.07] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[58%] h-[420px] w-[420px] rounded-full bg-sky-400/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-blue-500/[0.06] blur-3xl kavita-drift-a" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.55)_85%)]" />
      </div>

      {/* ═══ Conteúdo ════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* ─── Live strip ─── */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.85)]" />
              </span>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                Central Climática · Monitoramento Ativo
              </p>
            </div>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 md:block">
              Cobertura nacional · Dados públicos · Atualização contínua
            </p>
          </div>
        </div>

        {/* ─── Hero ─── */}
        <header className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 md:px-6 md:pb-16 md:pt-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <Link
                href="/news"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-sky-300"
              >
                ← K · NEWS
              </Link>
              <span className="h-px w-12 bg-sky-400/40" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                Clima · {currentYear}
              </p>
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-stone-50 md:text-6xl lg:text-7xl">
              Chuva nas{" "}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                regiões do agro
              </span>
              , em tempo real.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg">
              Monitoramento contínuo de chuva acumulada em 24 horas e 7 dias,
              alimentado por fontes públicas de dados climáticos. Pensado para
              quem precisa decidir hoje com base no que aconteceu agora no
              campo.
            </p>
          </div>
        </header>

        {/* ─── Stats strip ─── */}
        {items.length > 0 && (
          <section
            aria-label="Resumo do monitoramento"
            className="mx-auto w-full max-w-7xl px-4 md:px-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent"
              />

              <div className="relative grid grid-cols-2 divide-x divide-white/[0.06] md:grid-cols-4">
                <Stat
                  kicker="Cidades monitoradas"
                  value={String(cityCount).padStart(2, "0")}
                  unit={cityCount === 1 ? "cidade" : "cidades"}
                />
                <Stat
                  kicker="Estados cobertos"
                  value={String(ufCount).padStart(2, "0")}
                  unit={ufCount === 1 ? "UF" : "UFs"}
                />
                <Stat
                  kicker="Acumulado 24h"
                  value={
                    sum24.count > 0 ? formatMm(sum24.total) : "—"
                  }
                  unit={sum24.count > 0 ? "mm somados" : "sem dados"}
                />
                <Stat
                  kicker="Acumulado 7d"
                  value={sum7.count > 0 ? formatMm(sum7.total) : "—"}
                  unit={sum7.count > 0 ? "mm somados" : "sem dados"}
                />
              </div>

              {peak24 && (
                <div className="relative border-t border-white/[0.06] px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                        aria-hidden
                      />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                        Maior chuva nas últimas 24h
                      </p>
                    </div>
                    <Link
                      href={`/news/clima/${peak24.item.slug}`}
                      className="group inline-flex items-center gap-2 text-sm font-semibold text-stone-50 transition-colors hover:text-sky-200"
                    >
                      <span>
                        {peak24.item.city_name}{" "}
                        <span className="text-stone-500">·</span>{" "}
                        <span className="text-stone-400">
                          {peak24.item.uf}
                        </span>
                      </span>
                      <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-300 ring-1 ring-sky-400/30">
                        {formatMm(peak24.value)} mm
                      </span>
                      <span
                        aria-hidden
                        className="text-sky-300 transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Cidades monitoradas ─── */}
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
                  className="h-1 w-1 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                  aria-hidden
                />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">
                  Rede de monitoramento
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                Cidades monitoradas
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
                Selecione uma cidade para abrir o histórico completo. Cada card
                mostra acumulado de chuva nas últimas 24 horas e nos últimos 7
                dias, com fonte original do dado.
              </p>
            </div>

            {items.length > 0 && (
              <span className="hidden shrink-0 items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 ring-1 ring-sky-400/20 md:inline-flex">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                  aria-hidden
                />
                {cityCount} {cityCount === 1 ? "região" : "regiões"} ativas
              </span>
            )}
          </div>

          <div className="mt-8">
            {items.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <ClimaCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] p-10 ring-1 ring-white/[0.06] backdrop-blur-sm">
                <EmptyState
                  title="Nenhuma cidade monitorada no momento"
                  subtitle="Novas regiões serão adicionadas em breve. Volte para acompanhar a expansão da rede."
                />
              </div>
            )}
          </div>
        </section>

        {/* ─── Manifesto ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-sky-500/[0.05] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm md:p-14">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl"
            />

            <div className="relative grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Por que clima
                </p>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                  Inteligência operacional para quem vive do tempo.
                </h2>
              </div>
              <p className="text-base leading-relaxed text-stone-300">
                Chuva define plantio, colheita, secagem e logística. A Central
                Climática Kavita reúne, em um só lugar, o que produtores,
                corretoras e cooperativas precisam saber para reagir rápido —
                sem precisar consultar dez fontes diferentes a cada manhã.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Central Climática
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Dados públicos · Atualização contínua
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────
function Stat({
  kicker,
  value,
  unit,
}: {
  kicker: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="px-6 py-5 md:px-7 md:py-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {kicker}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-stone-50 md:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-sky-300/80">
        {unit}
      </p>
    </div>
  );
}
