// src/app/news/clima/[slug]/page.tsx
//
// Detalhe de uma cidade monitorada — Central Climática.
//
// Redesign completo: deixa de ser "card grande em página clara" e
// passa a ser uma página de detalhe dark committed coerente com
// /news/clima e /news. Mesma identidade sky/cyan (água/chuva).
//
// Estrutura:
//   1. Atmospheric layer (4 glows sky/cyan + drift)
//   2. Live strip "MONITORANDO {CIDADE}" no topo
//   3. Hero editorial — kicker mono "K · CLIMA / DETALHE", coordenadas
//      visuais (UF), nome da cidade gigante com gradient sky→cyan
//   4. Bloco principal de métricas — duas tiles enormes (24h / 7d) com
//      números 6xl, ring sky e barra de proporção visual entre elas
//   5. Linha de status: fonte + última atualização + ao vivo
//   6. Bloco contextual "Como ler estes dados"
//   7. Footer mono

import Link from "next/link";
import { newsPublicApi } from "@/lib/newsPublicApi";
import type { PublicClima } from "@/lib/newsPublicApi";

export const revalidate = 120;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDateSafe(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(d);
}

function safeNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function formatMm(v: number | null) {
  return v === null ? "—" : v.toFixed(1);
}

// Classifica volume em 24h em uma escala qualitativa enxuta usada como
// label visual no card (não inventa dado: deriva do próprio mm_24h).
function classify24h(mm: number | null) {
  if (mm === null) return { label: "Sem dados", tone: "stone" as const };
  if (mm === 0) return { label: "Sem chuva", tone: "stone" as const };
  if (mm < 5) return { label: "Chuva fraca", tone: "sky" as const };
  if (mm < 25) return { label: "Chuva moderada", tone: "sky" as const };
  if (mm < 50) return { label: "Chuva forte", tone: "cyan" as const };
  return { label: "Chuva muito forte", tone: "cyan" as const };
}

export default async function ClimaDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let item: PublicClima | null = null;
  try {
    item = await newsPublicApi.climaBySlug(slug);
  } catch {
    item = null;
  }

  if (!item) {
    return (
      <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-sky-500/[0.07] blur-3xl" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.05] blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-3xl px-4 py-20 md:px-6">
          <div className="rounded-2xl bg-white/[0.04] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Sinal indisponível
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-50">
              Cidade não encontrada
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Verifique o endereço ou volte para a lista de cidades monitoradas
              pela Central Climática.
            </p>
            <Link
              href="/news/clima"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/[0.05] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300 ring-1 ring-sky-400/30 transition-all hover:bg-white/[0.08] hover:ring-sky-400/50"
            >
              <span aria-hidden>←</span> Voltar para Clima
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const updated = formatDateSafe(item.last_update_at);
  const mm24 = safeNum(item.mm_24h);
  const mm7 = safeNum(item.mm_7d);
  const cls = classify24h(mm24);

  // Proporção visual entre 24h e 7d (apenas para barra) — sem inventar
  // dado, é só razão dos próprios valores recebidos.
  const ratio24in7 =
    mm24 !== null && mm7 !== null && mm7 > 0
      ? Math.min(100, Math.round((mm24 / mm7) * 100))
      : null;

  const currentYear = new Date().getFullYear();

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer ═══════════════════════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-sky-500/[0.10] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-32 h-[480px] w-[480px] rounded-full bg-cyan-400/[0.08] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[55%] h-[420px] w-[420px] rounded-full bg-sky-400/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-blue-500/[0.06] blur-3xl kavita-drift-a" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.55)_85%)]" />
      </div>

      {/* ═══ Conteúdo ════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* ─── Live strip ─── */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.85)]" />
              </span>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                Monitorando · {item.city_name} · {item.uf}
              </p>
            </div>
            <Link
              href="/news/clima"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-sky-300"
            >
              ← Todas as cidades
            </Link>
          </div>
        </div>

        {/* ─── Hero ─── */}
        <header className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 md:px-6 md:pb-14 md:pt-20">
          <div className="flex items-center gap-3">
            <Link
              href="/news"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-sky-300"
            >
              K · NEWS
            </Link>
            <span className="text-stone-600" aria-hidden>
              /
            </span>
            <Link
              href="/news/clima"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-sky-300"
            >
              CLIMA
            </Link>
            <span className="text-stone-600" aria-hidden>
              /
            </span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
              DETALHE
            </p>
          </div>

          <div className="mt-6 flex items-end gap-5">
            <div
              className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 md:block"
              aria-hidden
            >
              <p>UF</p>
              <p className="mt-1 text-3xl font-bold text-sky-300">{item.uf}</p>
            </div>
            <span className="hidden h-16 w-px bg-white/[0.08] md:block" aria-hidden />
            <h1 className="text-5xl font-bold leading-[1.0] tracking-tight text-stone-50 md:text-7xl lg:text-8xl">
              {item.city_name}
              <span className="text-sky-300/80">.</span>
            </h1>
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg">
            Acumulado de chuva mais recente para a cidade monitorada — leitura
            rápida, dados públicos, atualização contínua. Use estes números
            como apoio operacional para decisões de campo.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-300 ring-1 ring-white/10">
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                aria-hidden
              />
              Ao vivo
            </span>
            {item.source && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10">
                Fonte · {item.source}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-medium text-stone-400 ring-1 ring-white/[0.06]">
              Dados públicos
            </span>
          </div>
        </header>

        {/* ─── Métricas principais ─── */}
        <section
          aria-label="Indicadores de chuva"
          className="mx-auto w-full max-w-6xl px-4 md:px-6"
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* 24h — herói */}
            <MetricCard
              kicker="01 · Janela curta"
              label="Chuva nas últimas 24 horas"
              value={formatMm(mm24)}
              unit="mm"
              tone={cls.tone}
              chip={cls.label}
              foot="Acumulado das últimas 24 horas, atualizado continuamente da fonte oficial."
              proportion={ratio24in7}
              proportionLabel="da chuva da semana caiu nas últimas 24h"
            />

            {/* 7d — referência semanal */}
            <MetricCard
              kicker="02 · Janela semanal"
              label="Chuva nos últimos 7 dias"
              value={formatMm(mm7)}
              unit="mm"
              tone="cyan"
              chip="Acumulado semanal"
              foot="Volume total registrado nas últimas 7 dias — referência para janela operacional."
            />
          </div>
        </section>

        {/* ─── Status / atualização ─── */}
        <section className="mx-auto mt-8 w-full max-w-6xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-7">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent"
            />
            <div className="relative grid gap-6 md:grid-cols-3">
              <StatusItem
                kicker="Última leitura"
                value={updated || "—"}
              />
              <StatusItem
                kicker="Origem"
                value={item.source || "—"}
              />
              <StatusItem
                kicker="Cobertura"
                value={`${item.city_name} · ${item.uf}`}
              />
            </div>
          </div>
        </section>

        {/* ─── Como ler ─── */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-sky-500/[0.05] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm md:p-14">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl"
            />

            <div className="relative grid gap-8 md:grid-cols-3 md:gap-10">
              <div className="md:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                  Como ler
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-50">
                  Janelas que importam para o campo.
                </h2>
              </div>

              <div className="space-y-5 md:col-span-2">
                <ReadingTip
                  number="24h"
                  title="Decisão imediata"
                  body="A janela de 24 horas mostra o que acabou de cair. Use para avaliar se o solo está encharcado, se há risco de erosão e se vale entrar com máquina hoje."
                />
                <ReadingTip
                  number="07d"
                  title="Planejamento semanal"
                  body="O acumulado de 7 dias é a referência de janela operacional — ajuda a decidir secagem, transporte e logística da próxima semana."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Central Climática
              </p>
            </div>
            <Link
              href="/news/clima"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 transition-colors hover:text-sky-200"
            >
              ← Todas as cidades monitoradas
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ─── Métrica ─────────────────────────────────────────────────────────────
function MetricCard({
  kicker,
  label,
  value,
  unit,
  tone,
  chip,
  foot,
  proportion,
  proportionLabel,
}: {
  kicker: string;
  label: string;
  value: string;
  unit: string;
  tone: "sky" | "cyan" | "stone";
  chip: string;
  foot: string;
  proportion?: number | null;
  proportionLabel?: string;
}) {
  const accentText =
    tone === "cyan"
      ? "text-cyan-300/90"
      : tone === "sky"
        ? "text-sky-300/90"
        : "text-stone-400";
  const accentRing =
    tone === "cyan"
      ? "ring-cyan-400/30"
      : tone === "sky"
        ? "ring-sky-400/30"
        : "ring-white/10";
  const accentBg =
    tone === "cyan"
      ? "bg-cyan-500/10"
      : tone === "sky"
        ? "bg-sky-500/10"
        : "bg-white/[0.05]";
  const valueGradient =
    tone === "cyan"
      ? "from-cyan-200 via-sky-200 to-sky-300"
      : tone === "sky"
        ? "from-sky-200 via-sky-100 to-cyan-200"
        : "from-stone-200 to-stone-400";

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm transition-colors hover:bg-white/[0.06] md:p-10">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-500/[0.08] blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${accentText}`}>
          {kicker}
        </p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ${accentBg} ${accentRing} ${accentText}`}
        >
          {chip}
        </span>
      </div>

      <p className="relative mt-6 text-sm font-semibold text-stone-300">
        {label}
      </p>

      <div className="relative mt-3 flex items-baseline gap-3">
        <p
          className={`bg-gradient-to-br bg-clip-text text-7xl font-extrabold leading-none tracking-tight text-transparent md:text-8xl ${valueGradient}`}
        >
          {value}
        </p>
        <p className="text-2xl font-bold text-stone-500">{unit}</p>
      </div>

      {proportion !== undefined && proportion !== null && (
        <div className="relative mt-6">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            <span>{proportionLabel}</span>
            <span className={accentText}>{proportion}%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${
                tone === "cyan"
                  ? "from-cyan-400 to-sky-400"
                  : "from-sky-400 to-cyan-400"
              }`}
              style={{ width: `${proportion}%` }}
            />
          </div>
        </div>
      )}

      <p className="relative mt-6 border-t border-white/[0.06] pt-4 text-[12px] leading-relaxed text-stone-400">
        {foot}
      </p>
    </div>
  );
}

// ─── Status item ─────────────────────────────────────────────────────────
function StatusItem({ kicker, value }: { kicker: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {kicker}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-stone-100">{value}</p>
    </div>
  );
}

// ─── Reading tip ─────────────────────────────────────────────────────────
function ReadingTip({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 font-mono text-xs font-bold uppercase tracking-[0.1em] text-sky-300 ring-1 ring-sky-400/30">
          {number}
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold text-stone-50">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-400">{body}</p>
      </div>
    </div>
  );
}
