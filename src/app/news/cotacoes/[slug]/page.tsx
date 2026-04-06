// src/app/news/cotacoes/[slug]/page.tsx
import Link from "next/link";
import type { PublicCotacao } from "@/lib/newsPublicApi";
import {
  fetchPublicCotacaoBySlug,
  fetchCotacaoHistory,
  type CotacaoHistoryEntry,
} from "@/server/data/cotacoes";
import { EmptyState } from "@/components/news/EmptyState";
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
      href="/news/cotacoes"
    >
      <span aria-hidden>←</span> Voltar para Cotações
    </Link>
  );
}

/** Unit explanation texts keyed by slug. */
const UNIT_EXPLANATIONS: Record<string, { intl: string; local: string; math: string }> = {
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

/** Market context text keyed by slug. */
const MARKET_CONTEXT: Record<string, { exchange: string; city: string; contract: string }> = {
  "cafe-arabica": { exchange: "ICE (Intercontinental Exchange)", city: "Nova York", contract: "Café Arábica tipo C" },
  "cafe-robusta": { exchange: "ICE (Intercontinental Exchange)", city: "Londres", contract: "Café Robusta" },
  soja: { exchange: "CME (Chicago Mercantile Exchange)", city: "Chicago", contract: "Soja (Soybean)" },
  milho: { exchange: "CME (Chicago Mercantile Exchange)", city: "Chicago", contract: "Milho (Corn)" },
  "boi-gordo": { exchange: "CME (Chicago Mercantile Exchange)", city: "Chicago", contract: "Boi Gordo (Live Cattle)" },
  dolar: { exchange: "Banco Central do Brasil", city: "Brasília", contract: "PTAX (venda)" },
};

// ─── Data loading ───────────────────────────────────────────────────────────

type FetchResult =
  | { status: "ok"; item: PublicCotacao; history: CotacaoHistoryEntry[] }
  | { status: "not_found" }
  | { status: "error"; message: string };

async function loadCotacao(slug: string): Promise<FetchResult> {
  try {
    const item = await fetchPublicCotacaoBySlug(slug);
    if (!item) return { status: "not_found" };

    // Fetch history in parallel (non-blocking — empty array on failure)
    const history = await fetchCotacaoHistory(slug, 10);

    return { status: "ok", item, history };
  } catch (err: any) {
    const message =
      err?.message || "Não foi possível carregar a cotação. Tente novamente em alguns instantes.";
    return { status: "error", message };
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function CotacaoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await loadCotacao(slug);

  if (result.status === "error") {
    return (
      <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
          <nav aria-label="Navegação" className="mb-6"><BackLink /></nav>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-2">
              <span aria-hidden className="text-2xl">⚠️</span>
              <p className="text-base font-semibold text-amber-900">Erro ao carregar cotação</p>
              <p className="max-w-md text-sm text-amber-700 leading-relaxed">{result.message}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (result.status === "not_found") {
    return (
      <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <EmptyState
              title="Cotação não encontrada"
              subtitle="Verifique o endereço ou volte para a lista de cotações do agro."
            />
            <div className="mt-6"><BackLink /></div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Derived data ───────────────────────────────────────────────────────
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

  const variationTone = isUp
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isDown
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-zinc-200 bg-zinc-50 text-zinc-700";
  const strongTone =
    varNum !== null && Math.abs(varNum) > 3
      ? isUp
        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
        : "border-rose-300 bg-rose-100 text-rose-800"
      : variationTone;
  const variationEmoji = isUp ? "📈" : isDown ? "📉" : "";

  const updated = formatDatePtBR(item.last_update_at, "medium");
  const localUnit = priceNum !== null ? convertToLocalUnit(priceNum, itemSlug) : null;

  // ─── History-based comparison (real data, not estimated) ────────────────
  // history[0] = most recent sync; history[1] = previous sync
  const prevEntry = history.length >= 2 ? history[1] : null;
  const prevPriceReal = prevEntry ? safeNum(prevEntry.price) : null;
  const prevPrice = prevPriceReal;

  // Variation in monetary value from real history
  const varMonetary =
    priceNum !== null && prevPriceReal !== null
      ? Math.abs(priceNum - prevPriceReal)
      : null;

  // Recent history entries — limit to 5 for clean UX
  const recentEntries = history.slice(0, 5);

  const unitExpl = UNIT_EXPLANATIONS[itemSlug];
  const mktCtx = MARKET_CONTEXT[itemSlug];

  // Exchange rate info from item (may be null if migration not run)
  const exchangeRate = safeNum((item as any).exchange_rate);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
        <nav aria-label="Navegação" className="mb-6"><BackLink /></nav>

        <article className="space-y-5">
          {/* ═══════════════════════════════════════════════════════════════
              BLOCO 1 — HERO
              ═══════════════════════════════════════════════════════════════ */}
          <header className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 md:p-8">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-zinc-400">
              KAVITA NEWS • COTAÇÃO
            </p>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">
                  {emoji} {item.name}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Referência internacional • {source}
                </p>
              </div>

              {varNum !== null && (
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${strongTone}`}
                >
                  {variationEmoji ? <span aria-hidden>{variationEmoji}</span> : null}
                  {varLabel}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden>⏱</span>
                {updated && updated !== "—" ? `Atualizado: ${updated}` : "Atualização: indisponível"}
              </span>
              {mktCtx && (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden>•</span>
                  {mktCtx.exchange}
                </span>
              )}
            </div>
          </header>

          {/* ═══════════════════════════════════════════════════════════════
              BLOCO 2 — PREÇO + VARIAÇÃO (acima da dobra)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preço principal */}
            <section
              aria-label="Preço de referência"
              className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Preço de referência
              </p>

              {hasPriceVal ? (
                <>
                  <p className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
                    {formatPrice(item.price)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {item.unit ?? ""}
                  </p>

                  {localUnit && (
                    <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
                      <p className="text-lg font-bold text-zinc-800">
                        ≈ R$ {formatPrice(localUnit.value)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        por {localUnit.label} (aproximado)
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4">
                  <p className="text-lg font-semibold text-zinc-400">Aguardando atualização</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    O preço será exibido após a primeira sincronização com a fonte.
                  </p>
                </div>
              )}
            </section>

            {/* Variação do dia */}
            <section
              aria-label="Variação do dia"
              className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Variação do dia
              </p>

              <p className="mt-2 text-lg font-bold text-zinc-800">{trend}</p>

              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xl font-bold ${strongTone}`}
                >
                  {variationEmoji ? <span aria-hidden>{variationEmoji}</span> : null}
                  {varLabel}
                </span>
              </div>

              {varMonetary !== null && hasPriceVal && (
                <p className="mt-3 text-sm text-zinc-600">
                  {isUp ? "+" : "-"}R$ {formatPrice(varMonetary)} por {(item.unit ?? "unidade").replace("R$/", "")}
                  <span className="text-zinc-400"> em relação à leitura anterior</span>
                </p>
              )}

              {prevPrice !== null && hasPriceVal && (
                <p className="mt-1 text-xs text-zinc-400">
                  Anterior: R$ {formatPrice(prevPrice)}
                </p>
              )}
            </section>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              BLOCO 3 — O QUE ESSA COTAÇÃO QUER DIZER
              ═══════════════════════════════════════════════════════════════ */}
          <section
            aria-label="Interpretação"
            className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 md:p-8"
          >
            <h2 className="text-base font-semibold text-zinc-900">
              O que essa cotação quer dizer
            </h2>

            <div className="mt-3 space-y-3 text-sm text-zinc-600 leading-relaxed">
              <p>
                Este valor é a referência {item.name ? `de ${item.name.toLowerCase()}` : "do ativo"} negociado
                {mktCtx ? ` na bolsa de ${mktCtx.city} (${mktCtx.exchange.split(" (")[0]})` : " no mercado internacional"}, convertido para real brasileiro
                {exchangeRate ? ` usando a taxa do Banco Central (R$ ${formatPrice(exchangeRate)})` : ""}.
              </p>

              <p>
                O preço que você recebe na cooperativa ou no comprador local pode ser diferente — ele depende
                da região, da qualidade do produto e das condições de negociação.
              </p>

              <div className="flex items-start gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 p-4">
                <span className="text-lg" aria-hidden>💡</span>
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">Dica:</span> use esta cotação como indicador de tendência do mercado,
                  não como preço final de venda.
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              BLOCO 4 — ENTENDENDO A UNIDADE
              ═══════════════════════════════════════════════════════════════ */}
          {unitExpl && localUnit && hasPriceVal && (
            <section
              aria-label="Conversão de unidades"
              className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 md:p-8"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                Entendendo a unidade
              </h2>

              <div className="mt-3 space-y-3 text-sm text-zinc-600 leading-relaxed">
                <p>
                  O mercado internacional usa <strong>{unitExpl.intl}</strong> como unidade.
                  No Brasil, usamos <strong>{unitExpl.local}</strong>.
                </p>

                <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider">Internacional</p>
                      <p className="mt-1 text-lg font-bold text-zinc-800">R$ {formatPrice(item.price)} <span className="text-sm font-normal text-zinc-500">/{(item.unit ?? "").replace("R$/", "")}</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider">Equivalência brasileira</p>
                      <p className="mt-1 text-lg font-bold text-zinc-800">≈ R$ {formatPrice(localUnit.value)} <span className="text-sm font-normal text-zinc-500">/{localUnit.label}</span></p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 pt-2 border-t border-zinc-100">
                    {unitExpl.math}. Conversão aproximada — valor real varia conforme praça e negociação.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              BLOCO 5 — DADOS TÉCNICOS (discreto)
              ═══════════════════════════════════════════════════════════════ */}
          <section
            aria-label="Dados técnicos"
            className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 md:p-8"
          >
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
              Sobre esta cotação
            </h2>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {mktCtx && (
                <>
                  <div className="flex justify-between sm:block">
                    <span className="text-zinc-400">Bolsa</span>
                    <span className="font-medium text-zinc-700 sm:ml-0"> {mktCtx.exchange}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-zinc-400">Praça</span>
                    <span className="font-medium text-zinc-700"> {mktCtx.city}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-zinc-400">Contrato</span>
                    <span className="font-medium text-zinc-700"> {mktCtx.contract}</span>
                  </div>
                </>
              )}
              {exchangeRate && (
                <div className="flex justify-between sm:block">
                  <span className="text-zinc-400">Câmbio (PTAX)</span>
                  <span className="font-medium text-zinc-700"> R$ {formatPrice(exchangeRate)}</span>
                </div>
              )}
              <div className="flex justify-between sm:block">
                <span className="text-zinc-400">Fonte dos dados</span>
                <span className="font-medium text-zinc-700"> {item.source ?? "-"}</span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-zinc-400">Categoria</span>
                <span className="font-medium text-zinc-700"> {item.group_key ?? "-"}</span>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              BLOCO 6 — EM BREVE (placeholder)
              ═══════════════════════════════════════════════════════════════ */}
          {recentEntries.length > 0 ? (
            <section
              aria-label="Leituras recentes"
              className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6 md:p-8"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                Leituras recentes
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Últimas atualizações de preço deste ativo, em R$.
              </p>

              <div className="mt-4 space-y-2">
                {recentEntries.map((entry, idx) => {
                  const ep = safeNum(entry.price);
                  const ev = safeNum(entry.variation_day);
                  const eUp = ev !== null && ev > 0;
                  const eDown = ev !== null && ev < 0;
                  const eColor = eUp ? "text-emerald-700" : eDown ? "text-rose-700" : "text-zinc-500";
                  const eBg = idx === 0 ? "bg-zinc-50 border-zinc-200" : "bg-white border-zinc-100";
                  const dateStr = formatDatePtBR(entry.created_at ?? entry.observed_at);

                  return (
                    <div
                      key={entry.id ?? idx}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${eBg}`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm ${idx === 0 ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"}`}>
                          {ep !== null ? `R$ ${formatPrice(ep)}` : "—"}
                        </p>
                        <p className="text-xs text-zinc-400">{dateStr}</p>
                      </div>

                      {ev !== null && (
                        <span className={`shrink-0 text-sm font-semibold ${eColor}`}>
                          {formatPct(ev)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
                Valores em reais (R$), referentes aos últimos 7 dias.
              </p>
            </section>
          ) : (
            <section
              aria-label="Histórico indisponível"
              className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30 p-6 md:p-8"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl text-zinc-300" aria-hidden>📊</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-500">Leituras recentes</p>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    O histórico ficará disponível após as primeiras atualizações deste ativo.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-zinc-400 text-center leading-relaxed max-w-xl mx-auto">
            Os valores exibidos são referências de mercado internacional convertidas para real (BRL).
            O preço na sua região pode variar conforme cooperativa, qualidade e condições de negociação.
          </p>
        </article>
      </div>
    </main>
  );
}
