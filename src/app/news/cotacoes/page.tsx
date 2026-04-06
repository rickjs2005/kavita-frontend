// src/app/news/cotacoes/page.tsx
import type { PublicCotacao } from "@/lib/newsPublicApi";
import { fetchPublicCotacoes } from "@/server/data/cotacoes";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { CotacaoCard } from "@/components/news/CotacaoCard";
import { safeNum, describeTrend } from "@/utils/kavita-news/cotacoes";

type FetchResult =
  | { status: "ok"; items: PublicCotacao[] }
  | { status: "empty" }
  | { status: "error"; message: string };

async function loadCotacoes(): Promise<FetchResult> {
  try {
    const items = await fetchPublicCotacoes();
    if (items.length === 0) {
      return { status: "empty" };
    }
    return { status: "ok", items };
  } catch (err: any) {
    const message =
      err?.message || "Não foi possível carregar as cotações. Tente novamente em alguns instantes.";
    return { status: "error", message };
  }
}

/**
 * Generates a one-line market summary from the cotações list.
 * E.g. "Café em alta, grãos estáveis, dólar recuando"
 */
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

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-9">
          <p className="text-xs font-semibold tracking-widest text-zinc-500">
            KAVITA NEWS • MERCADO
          </p>

          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            Cotações do Agro
          </h1>

          <p className="mt-2 max-w-3xl text-sm md:text-base leading-relaxed text-zinc-600">
            Preços de referência atualizados para quem vive o campo.
            Valores convertidos em real a partir das principais bolsas internacionais.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              <span aria-hidden>⏱</span> Dados atualizados ao longo do dia
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              <span aria-hidden>🌍</span> Fontes: BCB, ICE, CME
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        <SectionHeader
          title="Ativos monitorados"
          subtitle="Selecione um ativo para ver detalhes e referência por saca"
          href="/news"
          actionLabel="Voltar"
        />

        {result.status === "error" && (
          <section
            aria-label="Erro ao carregar cotações"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <span aria-hidden className="text-2xl">⚠️</span>
              <p className="text-base font-semibold text-amber-900">
                Erro ao carregar cotações
              </p>
              <p className="max-w-md text-sm text-amber-700 leading-relaxed">
                {result.message}
              </p>
            </div>
          </section>
        )}

        {result.status === "empty" && (
          <section
            aria-label="Sem cotações"
            className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8"
          >
            <EmptyState
              title="Nenhuma cotação disponível no momento"
              subtitle="Os dados são atualizados conforme as fontes oficiais. Volte em breve para acompanhar o mercado."
            />
          </section>
        )}

        {result.status === "ok" && (
          <>
            {/* Market summary — one-line overview */}
            <section
              aria-label="Resumo do mercado"
              className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                Resumo do mercado hoje
              </h2>
              <p className="mt-2 text-sm font-medium text-zinc-700 leading-relaxed">
                {buildMarketSummary(result.items)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Variação em relação ao fechamento anterior. Valores são referência — consulte sua cooperativa para preços locais.
              </p>
            </section>

            {/* Cotação cards */}
            <section
              aria-label="Lista de cotações"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
            >
              {result.items.map((c) => (
                <CotacaoCard key={c.id} item={c} />
              ))}
            </section>

            {/* Disclaimer */}
            <p className="text-xs text-zinc-400 text-center leading-relaxed max-w-2xl mx-auto">
              Os valores exibidos são referências de mercado internacional convertidas para real (BRL).
              O preço na sua região pode variar conforme cooperativa, qualidade do produto e condições locais.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
