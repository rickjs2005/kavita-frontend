// src/app/mercado-do-cafe/page.tsx
// Hub principal do Mercado do Café — RSC
import Link from "next/link";
import { fetchFeaturedCorretoras } from "@/server/data/corretoras";
import { fetchPublicCotacoes } from "@/server/data/cotacoes";
import { CorretoraCard } from "@/components/mercado-do-cafe/CorretoraCard";
import { CotacaoCard } from "@/components/news/CotacaoCard";
import type { PublicCotacao } from "@/lib/newsPublicApi";

export const metadata = {
  title: "Mercado do Café — Zona da Mata | Kavita",
  description:
    "Cotações, corretoras e oportunidades para o produtor de café da Zona da Mata mineira.",
};

export default async function MercadoDoCafePage() {
  const [featured, allCotacoes] = await Promise.all([
    fetchFeaturedCorretoras(4),
    fetchPublicCotacoes().catch(() => [] as PublicCotacao[]),
  ]);

  // Filter coffee-related cotações
  const cafeCotacoes = allCotacoes.filter((c) => {
    const name = (c.name || c.slug || "").toLowerCase();
    return name.includes("café") || name.includes("cafe") || name.includes("coffee") || name.includes("arabica");
  });

  // If no coffee-specific ones, show first 4
  const cotacoesToShow = cafeCotacoes.length > 0 ? cafeCotacoes.slice(0, 4) : allCotacoes.slice(0, 4);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      {/* Header */}
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-9">
          <p className="text-xs font-semibold tracking-widest text-zinc-500">
            KAVITA • MERCADO DO CAFÉ
          </p>

          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            Mercado do Café — Zona da Mata
          </h1>

          <p className="mt-2 max-w-3xl text-sm md:text-base leading-relaxed text-zinc-600">
            Cotações, corretoras e oportunidades para o produtor de café da região.
            Acompanhe os preços, encontre quem compra e faça negócio com confiança.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              <span aria-hidden>☕</span> Zona da Mata Mineira
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              <span aria-hidden>📍</span> Manhuaçu, Reduto, Simonésia e região
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-10">
        {/* Cotações do Café */}
        {cotacoesToShow.length > 0 && (
          <section aria-label="Cotações do café">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Cotações do Café
                </h2>
                <p className="text-sm text-zinc-500">
                  Preços de referência atualizados
                </p>
              </div>
              <Link
                href="/news/cotacoes"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cotacoesToShow.map((c) => (
                <CotacaoCard key={c.id} item={c} />
              ))}
            </div>
          </section>
        )}

        {/* Corretoras em Destaque */}
        <section aria-label="Corretoras em destaque">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Corretoras em Destaque
              </h2>
              <p className="text-sm text-zinc-500">
                Corretoras de café verificadas na região
              </p>
            </div>
            <Link
              href="/mercado-do-cafe/corretoras"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Ver todas →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featured.map((c) => (
                <CorretoraCard key={c.id} corretora={c} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
              <p className="text-sm text-zinc-500">
                Em breve você encontrará corretoras de café da região aqui.
              </p>
              <Link
                href="/mercado-do-cafe/corretoras"
                className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Ver todas as corretoras →
              </Link>
            </div>
          )}
        </section>

        {/* CTA Cadastro */}
        <section
          className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 md:p-8"
          aria-label="Cadastro de corretora"
        >
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-lg font-semibold text-zinc-900">
              É corretor ou corretora de café?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
              Cadastre sua empresa gratuitamente e apareça para produtores de toda a
              Zona da Mata. É rápido, simples e sem custo.
            </p>
            <Link
              href="/mercado-do-cafe/corretoras/cadastro"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Cadastrar minha empresa
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
