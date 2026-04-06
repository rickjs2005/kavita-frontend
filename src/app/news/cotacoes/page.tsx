// src/app/news/cotacoes/page.tsx
import { newsPublicApi, type PublicCotacao } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { CotacaoCard } from "@/components/news/CotacaoCard";

export const revalidate = 300; // ISR: revalidate every 5 minutes

type FetchResult =
  | { status: "ok"; items: PublicCotacao[] }
  | { status: "empty" }
  | { status: "error"; message: string };

async function loadCotacoes(): Promise<FetchResult> {
  try {
    const items = await newsPublicApi.cotacoesList();
    if (!Array.isArray(items) || items.length === 0) {
      return { status: "empty" };
    }
    return { status: "ok", items };
  } catch (err: any) {
    const message =
      err?.message || "Não foi possível carregar as cotações. Tente novamente em alguns instantes.";
    return { status: "error", message };
  }
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
            Quadro editorial de preços e variações do dia. Dados atualizados
            conforme as fontes oficiais.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              <span aria-hidden>⏱</span> Atualização contínua
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              <span aria-hidden>🌍</span> Fonte e horário visíveis
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              Leitura rápida em 3–5s
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        <SectionHeader
          title="Ativos monitorados"
          subtitle="Selecione um ativo para ver detalhes do mercado"
          href="/news"
          actionLabel="Voltar"
        />

        {result.status === "error" && (
          <section
            aria-label="Erro ao carregar cotações"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <span aria-hidden className="text-2xl">
                ⚠️
              </span>
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
            <section
              aria-label="Resumo do dia"
              className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                Resumo do dia
              </h2>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                A variação mostrada em cada card representa o movimento do dia.
                Para detalhes, fonte e horário de atualização, abra o ativo.
              </p>
            </section>

            <section
              aria-label="Lista de cotações"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
            >
              {result.items.map((c) => (
                <CotacaoCard key={c.id} item={c} />
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
