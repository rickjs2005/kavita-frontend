// src/app/news/clima/[slug]/page.tsx
import Link from "next/link";
import { newsPublicApi } from "@/lib/newsPublicApi";
import { EmptyState } from "@/components/news/EmptyState";

function formatDateSafe(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(d);
}

export default async function ClimaDetailPage({ params }: { params: { slug: string } }) {
  let item: any = null;

  try {
    const res = await newsPublicApi.climaBySlug(params.slug);
    item = res.data;
  } catch {
    item = null;
  }

  if (!item) {
    return (
      <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <EmptyState
              title="Clima não encontrado"
              subtitle="Verifique o endereço ou volte para a lista de cidades monitoradas."
            />
            <div className="mt-6">
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
                href="/news/clima"
              >
                <span aria-hidden>←</span> Voltar para cidades monitoradas
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const updated = formatDateSafe(item.last_update_at);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
        <nav aria-label="Navegação" className="mb-6">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
            href="/news/clima"
          >
            <span aria-hidden>←</span> Voltar para Clima
          </Link>
        </nav>

        <article className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <header className="border-b border-zinc-100 p-6 md:p-8">
            <p className="text-xs font-semibold tracking-widest text-zinc-500">KAVITA NEWS • CLIMA</p>

            {/* Exatamente 1 H1 */}
            <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
              {item.city_name} <span className="text-zinc-400" aria-hidden>•</span> {item.uf}
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              Acumulado de chuva e atualização mais recente para a cidade monitorada.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                Atualização contínua
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                {item.source ? `Fonte: ${item.source}` : "Fonte: -"}
              </span>
            </div>
          </header>

          <section aria-label="Indicadores de chuva" className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-5">
                <p className="text-sm text-zinc-600">Chuva (últimas 24h)</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                  {item.mm_24h ?? "-"} <span className="text-base font-medium text-zinc-600">mm</span>
                </p>
                <p className="mt-2 text-xs text-zinc-500">Acumulado nas últimas 24 horas.</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-5">
                <p className="text-sm text-zinc-600">Chuva (últimos 7 dias)</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                  {item.mm_7d ?? "-"} <span className="text-base font-medium text-zinc-600">mm</span>
                </p>
                <p className="mt-2 text-xs text-zinc-500">Acumulado nos últimos 7 dias.</p>
              </div>
            </div>

            <footer className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-zinc-600">
                  Atualizado em: <span className="font-medium text-zinc-900">{updated || "-"}</span>
                </p>
                <p className="text-zinc-500">Dados públicos • Kavita News</p>
              </div>
            </footer>
          </section>
        </article>
      </div>
    </main>
  );
}
