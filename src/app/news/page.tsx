// src/app/news/page.tsx
//
// /news — Central de Inteligência do Agro.
//
// Redesign completo: a página deixa de ser "blog + sidebar" e vira uma
// central premium dark committed (mesmo paradigma de Drones e Mercado
// do Café), porém com identidade própria:
//   - signature accent: emerald-400 (notícias / mercado)
//   - secundário: sky-400 (clima)
//   - acentos rose para variações negativas
//
// Estrutura:
//   1. Atmospheric layer (4 glows + 2 drift radial)
//   2. Market strip "AO VIVO" no topo
//   3. Hero editorial — kicker, headline, sub
//   4. Três pilares: Cotações | Clima | Notícias (3 colunas)
//   5. Manchete em destaque
//   6. Grade de últimas matérias
//   7. Bloco de promoções
//   8. Faixa institucional + footer
//
// Removidas as duplicações (clima e cotações apareciam 2x) e a sidebar
// genérica. Layout flui em pillars temáticos verticais.

import { fetchNewsOverview } from "@/server/data/newsOverview";
import { EmptyState } from "@/components/news/EmptyState";
import { ClimaCard } from "@/components/news/ClimaCard";
import { CotacaoCard } from "@/components/news/CotacaoCard";
import { PostCard } from "@/components/news/PostCard";
import PromocoesHero from "@/components/products/DestaquesSection";
import Link from "next/link";

export const revalidate = 120;

function postTitle(p: any) {
  return p?.title || p?.titulo || "Post";
}
function postExcerpt(p: any) {
  return p?.excerpt || p?.resumo || p?.summary || "";
}
function postCover(p: any) {
  return p?.cover_url || p?.capa_url || p?.cover || p?.image || "";
}
function postSlug(p: any) {
  return p?.slug || p?.id;
}

// ─── Section header (dark) ───────────────────────────────────────────────
function SectionHeader({
  number,
  kicker,
  title,
  subtitle,
  action,
  accent = "emerald",
}: {
  number: string;
  kicker: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: "emerald" | "sky";
}) {
  const dot =
    accent === "sky"
      ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
      : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]";
  const kickerTone =
    accent === "sky" ? "text-sky-300/90" : "text-emerald-300/90";

  return (
    <div className="relative flex items-end justify-between gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
            aria-hidden
          >
            {number}
          </span>
          <span className={`h-1 w-1 rounded-full ${dot}`} aria-hidden />
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${kickerTone}`}
          >
            {kicker}
          </p>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 hidden md:block">{action}</div>}
    </div>
  );
}

function GhostLink({
  href,
  children,
  accent = "emerald",
}: {
  href: string;
  children: React.ReactNode;
  accent?: "emerald" | "sky";
}) {
  const tone =
    accent === "sky"
      ? "text-sky-300 hover:text-sky-200 ring-sky-400/30 hover:ring-sky-400/50 hover:bg-sky-400/[0.05]"
      : "text-emerald-300 hover:text-emerald-200 ring-emerald-400/30 hover:ring-emerald-400/50 hover:bg-emerald-400/[0.05]";

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 transition-all ${tone}`}
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────
export default async function NewsHomePage() {
  const data = await fetchNewsOverview(6);

  if (data.isEmpty && data.hasErrors) {
    return (
      <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6">
          <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-amber-400/20 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              Sinal interrompido
            </p>
            <p className="mt-2 text-base font-semibold text-stone-50">
              Erro ao carregar a Central de Inteligência
            </p>
            <p className="mt-1 max-w-md text-sm text-stone-400">
              Não foi possível conectar à fonte de dados. Tente novamente em
              instantes.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { posts, clima, cotacoes } = data;
  const featured = posts?.[0] ?? null;
  const morePosts = featured ? posts.slice(1, 7) : posts.slice(0, 6);
  const currentYear = new Date().getFullYear();

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer ═══════════════════════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-500/[0.07] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-40 h-[460px] w-[460px] rounded-full bg-sky-500/[0.06] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[55%] h-[400px] w-[400px] rounded-full bg-emerald-400/[0.04] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[480px] w-[480px] rounded-full bg-teal-500/[0.05] blur-3xl kavita-drift-a" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.5)_85%)]" />
      </div>

      {/* ═══ Conteúdo ════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Market strip — sinal "ao vivo" no topo */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Central de Inteligência · Agro Brasil · Ao Vivo
              </p>
            </div>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 md:block">
              Atualização contínua · {cotacoes?.length ?? 0} mercados ·{" "}
              {clima?.length ?? 0} regiões
            </p>
          </div>
        </div>

        {/* ─── Hero editorial ─── */}
        <header className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 md:px-6 md:pb-16 md:pt-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-[10px] font-semibold tracking-[0.22em] text-stone-500"
                aria-hidden
              >
                K · NEWS / 2026
              </span>
              <span className="h-px w-12 bg-emerald-400/40" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Inteligência do Agro
              </p>
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-stone-50 md:text-6xl lg:text-7xl">
              A central que conecta{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-sky-300 bg-clip-text text-transparent">
                campo e mercado
              </span>{" "}
              em tempo real.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg">
              Cotações, clima regional e as notícias que movem o agro brasileiro
              — em um único painel pensado para quem precisa decidir hoje, com a
              informação que chega agora.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/news/cotacoes"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                />
                <span className="relative">Ver cotações</span>
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
                Ler matérias
              </Link>
            </div>
          </div>
        </header>

        {/* ─── Pilar 01 — Cotações ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <SectionHeader
            number="01"
            kicker="Mercado"
            title="Cotações em movimento"
            subtitle="Os principais ativos do agro brasileiro com variação diária, conversão para unidade local e referência da fonte original."
            accent="emerald"
            action={<GhostLink href="/news/cotacoes">Todas as cotações</GhostLink>}
          />

          <div className="mt-8">
            {cotacoes?.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cotacoes.slice(0, 6).map((c: any) => (
                  <CotacaoCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] p-8 ring-1 ring-white/[0.06]">
                <EmptyState
                  title="Sem cotações no momento"
                  subtitle="Atualizado continuamente — volte em breve."
                />
              </div>
            )}
          </div>
        </section>

        {/* ─── Pilar 02 — Clima ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <SectionHeader
            number="02"
            kicker="Clima"
            title="Chuva nas regiões monitoradas"
            subtitle="Volume acumulado em 24 horas e em 7 dias nas cidades acompanhadas pela rede Kavita."
            accent="sky"
            action={
              <GhostLink href="/news/clima" accent="sky">
                Ver mapa climático
              </GhostLink>
            }
          />

          <div className="mt-8">
            {clima?.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {clima.slice(0, 6).map((c: any) => (
                  <ClimaCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] p-8 ring-1 ring-white/[0.06]">
                <EmptyState
                  title="Sem cidades monitoradas no momento"
                  subtitle="A rede de monitoramento será ativada em breve."
                />
              </div>
            )}
          </div>
        </section>

        {/* ─── Pilar 03 — Notícias ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <SectionHeader
            number="03"
            kicker="Editorial"
            title="O que está acontecendo agora"
            subtitle="Cobertura editorial focada em contexto e impacto: leitura direta, sem ruído, feita para quem trabalha o campo."
            accent="emerald"
            action={<GhostLink href="/news/posts">Todas as matérias</GhostLink>}
          />

          {/* Manchete em destaque */}
          {featured && (
            <Link
              href={`/news/posts/${postSlug(featured)}`}
              className="
                group relative mt-8 block overflow-hidden rounded-3xl bg-white/[0.04]
                ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm
                transition-all duration-300 hover:bg-white/[0.06] hover:ring-emerald-400/30
              "
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
              />

              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="relative p-8 md:p-12 lg:col-span-7">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      aria-hidden
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                      Manchete do dia
                    </p>
                  </div>

                  <h3 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-stone-50 md:text-4xl lg:text-5xl">
                    {postTitle(featured)}
                  </h3>

                  <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-300 line-clamp-4">
                    {postExcerpt(featured) ||
                      "Conteúdo completo disponível na matéria."}
                  </p>

                  <div className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300 transition-colors group-hover:text-emerald-200">
                    Ler matéria completa
                    <span
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                </div>

                <div className="relative lg:col-span-5">
                  {postCover(featured) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={postCover(featured)}
                      alt=""
                      className="h-64 w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100 lg:h-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-emerald-950/30 via-stone-900 to-stone-950 lg:h-full">
                      <span className="text-5xl opacity-30" aria-hidden>
                        📰
                      </span>
                    </div>
                  )}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/40 to-transparent lg:bg-gradient-to-l"
                  />
                </div>
              </div>
            </Link>
          )}

          {/* Grade de matérias */}
          <div className="mt-8">
            {morePosts?.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {morePosts.slice(0, 6).map((p: any) => (
                  <PostCard key={p.id} item={p} />
                ))}
              </div>
            ) : !featured ? (
              <div className="rounded-2xl bg-white/[0.03] p-8 ring-1 ring-white/[0.06]">
                <EmptyState
                  title="Nenhuma matéria publicada ainda"
                  subtitle="Volte em breve para acompanhar as próximas atualizações."
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* ─── Pilar 04 — Promoções ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <SectionHeader
            number="04"
            kicker="Ofertas"
            title="Produtos em destaque para o campo"
            subtitle="Seleção de itens com desconto pensados para quem produz, transporta ou processa."
            accent="emerald"
            action={<GhostLink href="/">Ver loja completa</GhostLink>}
          />

          <div className="mt-8 overflow-hidden rounded-3xl bg-white/[0.03] p-2 ring-1 ring-white/[0.06] backdrop-blur-sm sm:p-3">
            <PromocoesHero />
          </div>
        </section>

        {/* ─── Faixa institucional ─── */}
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
                Informação que conecta o campo ao mercado.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-stone-300 md:text-lg">
                A Central de Inteligência Kavita nasce para informar produtores,
                comerciantes e consumidores sobre o que realmente importa no
                agro: clima, mercado e contexto. Conteúdo direto, sem ruído,
                pensado para apoiar decisões reais no dia a dia.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Central de Inteligência do Agro
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Atualização contínua · Cobertura nacional
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
