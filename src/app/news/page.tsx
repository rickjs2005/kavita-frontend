// src/app/news/page.tsx
//
// Kavita News — Central de Inteligencia do Agro.
//
// Redesign do redesign (2026-05): a pagina ganha estrutura de produto
// premium inspirada em Bloomberg / Stripe / Arc. Hierarquia em 4 blocos:
//
//   1. Top strip "AO VIVO" (sinal vivo + atualizacao continua)
//   2. Hero hibrido: editorial a esquerda + manchete cinematografica a direita
//   3. "Destaques do dia" — grade magazine 4 cards horizontais com imagem
//      grande, overlay e tag colorida por categoria (Mercado/Clima/etc).
//   4. Painel de inteligencia inferior: 70% cotacoes compactas com sparkline
//      + 30% widget de clima compacto + form de newsletter.
//   5. Manifesto institucional + footer (assinatura)
//
// Os componentes auxiliares vivem em src/components/news/. Os antigos
// CotacaoCard/ClimaCard/PostCard continuam disponiveis para as paginas
// /news/cotacoes, /news/clima e /news/posts (listas detalhadas).

import { fetchNewsOverview } from "@/server/data/newsOverview";
import { EmptyState } from "@/components/news/EmptyState";
import { FeaturedNewsCard } from "@/components/news/FeaturedNewsCard";
import { CotacaoMini } from "@/components/news/CotacaoMini";
import { ClimaWidget } from "@/components/news/ClimaWidget";
import { WhatsappChannelCard } from "@/components/news/WhatsappChannelCard";
import Link from "next/link";

export const revalidate = 120;

// ─── Page ────────────────────────────────────────────────────────────────
export default async function NewsHomePage() {
  const data = await fetchNewsOverview(8);

  if (data.isEmpty && data.hasErrors) {
    return (
      <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
          <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-amber-400/20 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              Sinal interrompido
            </p>
            <p className="mt-2 text-base font-semibold text-stone-50">
              Erro ao carregar a Central de Inteligencia
            </p>
            <p className="mt-1 max-w-md text-sm text-stone-400">
              Nao foi possivel conectar a fonte de dados. Tente novamente em
              instantes.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { posts, clima, cotacoes } = data;
  const featured = posts?.[0] ?? null;
  // Pega 4 para a faixa "Destaques do dia"; se nao houver featured, comeca do 0.
  const highlights = featured ? posts.slice(1, 5) : posts.slice(0, 4);
  const currentYear = new Date().getFullYear();
  const cotacoesMini = cotacoes?.slice(0, 4) ?? [];

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer — luzes radiais que respiram ═══════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-500/[0.07] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-40 h-[460px] w-[460px] rounded-full bg-sky-500/[0.06] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[55%] h-[400px] w-[400px] rounded-full bg-emerald-400/[0.04] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[480px] w-[480px] rounded-full bg-teal-500/[0.05] blur-3xl kavita-drift-a" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.5)_85%)]" />
      </div>

      <div className="relative">
        {/* ═══ 1. Top strip "AO VIVO" ═════════════════════════════════════ */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="kavita-live-dot relative h-2 w-2 rounded-full bg-emerald-400" />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Central de Inteligencia do Agro · Dados que conectam campo e
                mercado
              </p>
            </div>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 md:block">
              Atualizacao continua · {cotacoes?.length ?? 0} mercados ·{" "}
              {clima?.length ?? 0} regioes
            </p>
          </div>
        </div>

        {/* ═══ 2. HERO hibrido — editorial + manchete ═════════════════════ */}
        <header className="mx-auto w-full max-w-7xl px-4 pb-12 pt-12 md:px-6 md:pb-20 md:pt-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Coluna editorial — esquerda */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.22em] text-stone-500"
                  aria-hidden
                >
                  K · NEWS / 2026
                </span>
                <span className="h-px w-10 bg-emerald-400/40" aria-hidden />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Destaque
                </p>
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-stone-50 md:text-5xl lg:text-[3.4rem]">
                A central que conecta{" "}
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-sky-300 bg-clip-text text-transparent">
                  campo e mercado
                </span>{" "}
                em tempo real.
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-300 md:text-base">
                Cotacoes, clima regional e noticias que movem o agro brasileiro
                — em um unico painel pensado para quem precisa decidir hoje, com
                a informacao que chega agora.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/news/cotacoes"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:brightness-110"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  />
                  <span className="relative">Ver cotacoes</span>
                  <span
                    aria-hidden
                    className="relative transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
                <Link
                  href="/news/posts"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-200 ring-1 ring-white/[0.08] backdrop-blur-sm transition-all hover:bg-white/[0.07] hover:ring-white/20"
                >
                  Ver materias
                </Link>
              </div>
            </div>

            {/* Coluna manchete — direita (cinematografica) */}
            <div className="lg:col-span-7">
              {featured ? (
                <FeaturedNewsCard item={featured} variant="hero" />
              ) : (
                <div className="flex h-[420px] items-center justify-center rounded-3xl bg-white/[0.04] ring-1 ring-white/[0.08] md:h-[520px]">
                  <EmptyState
                    title="Sem manchete no momento"
                    subtitle="A primeira materia editorial estreia em breve."
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══ 3. "Destaques do dia" — grade magazine ═════════════════════ */}
        <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
                  aria-hidden
                >
                  02
                </span>
                <span className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Editorial
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                Destaques do dia
              </h2>
            </div>

            <Link
              href="/news/posts"
              className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 transition-colors hover:text-emerald-200"
            >
              Ver todas as materias <span aria-hidden>→</span>
            </Link>
          </div>

          {highlights?.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((p) => (
                <FeaturedNewsCard key={p.id} item={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.03] p-8 ring-1 ring-white/[0.06]">
              <EmptyState
                title="Nenhum destaque publicado ainda"
                subtitle="Volte em breve para acompanhar as proximas atualizacoes."
              />
            </div>
          )}
        </section>

        {/* ═══ 4. Painel inferior — Cotacoes (70%) + Clima + Newsletter ══ */}
        <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
                  aria-hidden
                >
                  03
                </span>
                <span className="kavita-live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Inteligencia ao vivo
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                Painel de mercado
              </h2>
            </div>
          </div>

          {/* Layout: 70/30 no desktop, empilhado no mobile */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Cotacoes em tempo real (70%) */}
            <div className="lg:col-span-8">
              <div className="relative h-full overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06] backdrop-blur-sm">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                      Cotacoes em tempo real
                    </p>
                    <span className="kavita-live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <Link
                    href="/news/cotacoes"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    Ver todas <span aria-hidden>→</span>
                  </Link>
                </div>

                {cotacoesMini.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {cotacoesMini.map((c) => (
                      <CotacaoMini key={c.id} item={c} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <EmptyState
                      title="Sem cotacoes no momento"
                      subtitle="Atualizado continuamente — volte em breve."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Clima compacto + canal WhatsApp (30%) */}
            <div className="grid grid-cols-1 gap-5 lg:col-span-4">
              <ClimaWidget items={clima ?? []} />
              <WhatsappChannelCard />
            </div>
          </div>
        </section>

        {/* ═══ 5. Manifesto institucional ═════════════════════════════════ */}
        <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-emerald-500/[0.04] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm md:p-16">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"
            />

            <div className="relative max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Manifesto
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-50 md:text-4xl">
                Informacao que conecta o campo ao mercado.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-stone-300 md:text-lg">
                A Central de Inteligencia Kavita nasce para informar produtores,
                comerciantes e consumidores sobre o que realmente importa no
                agro: clima, mercado e contexto. Conteudo direto, sem ruido,
                pensado para apoiar decisoes reais no dia a dia.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Footer ═════════════════════════════════════════════════════ */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Central de Inteligencia do Agro
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Atualizacao continua · Cobertura nacional
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
