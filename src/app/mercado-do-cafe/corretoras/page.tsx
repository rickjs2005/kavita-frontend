// src/app/mercado-do-cafe/corretoras/page.tsx
// Listagem pública de corretoras — RSC
import Link from "next/link";
import { Suspense } from "react";
import { fetchPublicCorretoras, fetchCorretorasCities } from "@/server/data/corretoras";
import { CorretoraCard } from "@/components/mercado-do-cafe/CorretoraCard";
import { CorretoraFilters } from "@/components/mercado-do-cafe/CorretoraFilters";

export const metadata = {
  title: "Corretoras de Café — Zona da Mata | Kavita",
  description:
    "Encontre corretoras de café que atuam na Zona da Mata mineira. Manhuaçu, Reduto, Simonésia e região.",
};

type Props = {
  searchParams: Promise<{ city?: string; search?: string; page?: string }>;
};

export default async function CorretorasListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [result, cities] = await Promise.all([
    fetchPublicCorretoras({
      city: params.city,
      search: params.search,
      page,
      limit: 20,
    }).catch(() => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 1 })),
    fetchCorretorasCities(),
  ]);

  const featured = result.items.filter(
    (c) => c.is_featured === true || c.is_featured === 1
  );
  const regular = result.items.filter(
    (c) => c.is_featured !== true && c.is_featured !== 1
  );

  const hasFilters = !!(params.city || params.search);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-9">
          <p className="text-xs font-semibold tracking-widest text-zinc-500">
            KAVITA • MERCADO DO CAFÉ
          </p>

          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            Corretoras de Café
          </h1>

          <p className="mt-2 max-w-3xl text-sm md:text-base leading-relaxed text-zinc-600">
            Encontre corretoras de café que atuam na Zona da Mata mineira.
            Entre em contato diretamente e negocie com confiança.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        {/* Filters */}
        <Suspense fallback={null}>
          <CorretoraFilters cities={cities} />
        </Suspense>

        {/* Empty state */}
        {result.items.length === 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 text-center">
            <span className="text-3xl" aria-hidden>🔍</span>
            <p className="mt-3 text-base font-semibold text-zinc-900">
              {hasFilters
                ? "Nenhuma corretora encontrada para essa busca"
                : "Nenhuma corretora cadastrada ainda"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {hasFilters
                ? "Tente outro filtro ou remova os critérios de busca."
                : "Em breve novas corretoras aparecerão aqui."}
            </p>
            {hasFilters && (
              <Link
                href="/mercado-do-cafe/corretoras"
                className="mt-4 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Limpar filtros
              </Link>
            )}
          </section>
        )}

        {/* Featured section */}
        {featured.length > 0 && !hasFilters && (
          <section aria-label="Corretoras em destaque">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">
              ⭐ Destaque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featured.map((c) => (
                <CorretoraCard key={c.id} corretora={c} />
              ))}
            </div>
          </section>
        )}

        {/* All corretoras */}
        {(hasFilters ? result.items : regular).length > 0 && (
          <section aria-label="Todas as corretoras">
            {!hasFilters && featured.length > 0 && (
              <h2 className="text-base font-semibold text-zinc-900 mb-3">
                Todas as corretoras
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(hasFilters ? result.items : regular).map((c) => (
                <CorretoraCard key={c.id} corretora={c} />
              ))}
            </div>
          </section>
        )}

        {/* Pagination */}
        {result.totalPages > 1 && (
          <nav className="flex justify-center gap-2" aria-label="Paginação">
            {page > 1 && (
              <Link
                href={`/mercado-do-cafe/corretoras?page=${page - 1}${params.city ? `&city=${params.city}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                ← Anterior
              </Link>
            )}
            <span className="flex items-center px-3 text-sm text-zinc-500">
              Página {page} de {result.totalPages}
            </span>
            {page < result.totalPages && (
              <Link
                href={`/mercado-do-cafe/corretoras?page=${page + 1}${params.city ? `&city=${params.city}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Próxima →
              </Link>
            )}
          </nav>
        )}

        {/* CTA Cadastro */}
        <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-zinc-900">
                É corretor ou corretora de café?
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Cadastre-se gratuitamente e apareça para produtores da região.
              </p>
            </div>
            <Link
              href="/mercado-do-cafe/corretoras/cadastro"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Cadastrar empresa
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
