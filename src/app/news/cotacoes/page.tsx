// src/app/news/cotacoes/page.tsx
import { newsPublicApi } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { CotacaoCard } from "@/components/news/CotacaoCard";

export default async function CotacoesListPage() {
  let items: any[] = [];
  try {
    const res = await newsPublicApi.cotacoesList();
    items = res.data || [];
  } catch {
    items = [];
  }

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-9">
          <p className="text-xs font-semibold tracking-widest text-zinc-500">KAVITA NEWS • MERCADO</p>

          {/* Exatamente 1 H1 */}
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            Cotações do Agro
          </h1>

          <p className="mt-2 max-w-3xl text-sm md:text-base leading-relaxed text-zinc-600">
            Quadro editorial de preços e variações do dia. Dados atualizados conforme as fontes oficiais.
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
        {/* SectionHeader (h2) – mantém o padrão do projeto */}
        <SectionHeader
          title="Ativos monitorados"
          subtitle="Selecione um ativo para ver detalhes do mercado"
          href="/news"
          actionLabel="Voltar"
        />

        {items.length ? (
          <>
            <section aria-label="Resumo do dia" className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
              <h2 className="text-base font-semibold text-zinc-900">Resumo do dia</h2>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                A variação mostrada em cada card representa o movimento do dia. Para detalhes, fonte e horário de atualização, abra o ativo.
              </p>
            </section>

            <section aria-label="Lista de cotações" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {items.map((c) => (
                <CotacaoCard key={c.id} item={c} />
              ))}
            </section>
          </>
        ) : (
          <section aria-label="Sem cotações" className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <EmptyState
              title="Nenhuma cotação disponível no momento"
              subtitle="Os dados são atualizados conforme as fontes oficiais. Volte em breve para acompanhar o mercado."
            />
          </section>
        )}
      </div>
    </main>
  );
}
