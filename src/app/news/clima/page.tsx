// src/app/news/clima/page.tsx
import { newsPublicApi } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { ClimaCard } from "@/components/news/ClimaCard";

export default async function ClimaListPage() {
  let items: any[] = [];
  try {
    const res = await newsPublicApi.climaList();
    items = res.data || [];
  } catch {
    items = [];
  }

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-9">
          {/* Exatamente 1 H1 */}
          <p className="text-xs font-semibold tracking-widest text-zinc-500">KAVITA NEWS • CLIMA</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">Clima</h1>
          <p className="mt-2 max-w-3xl text-sm md:text-base leading-relaxed text-zinc-600">
            Acompanhe o acumulado de chuva nas cidades monitoradas, com atualização contínua e dados públicos.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Atualização contínua
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              Dados públicos • Leitura rápida
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        {/* SectionHeader (h2) reaproveitado, sem alterar componente */}
        <SectionHeader title="Cidades monitoradas" subtitle="Selecione uma cidade para ver os detalhes" href="/news" actionLabel="Voltar" />

        {items.length ? (
          <>
            <section aria-label="Resumo do monitoramento" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                Monitorando <span className="font-semibold text-zinc-900">{items.length}</span>{" "}
                {items.length === 1 ? "cidade" : "cidades"}.
              </p>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  Atualização contínua
                </span>
              </div>
            </section>

            <section aria-label="Lista de cidades" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {items.map((c) => (
                <ClimaCard key={c.id} item={c} />
              ))}
            </section>
          </>
        ) : (
          <section aria-label="Sem cidades monitoradas" className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <EmptyState
              title="Nenhuma cidade monitorada no momento"
              subtitle="Novas cidades podem ser adicionadas futuramente. Volte em breve para acompanhar as atualizações."
            />
          </section>
        )}
      </div>
    </main>
  );
}
