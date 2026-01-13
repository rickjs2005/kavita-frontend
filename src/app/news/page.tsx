// src/app/news/page.tsx
import { newsPublicApi } from "@/lib/newsPublicApi";
import { EmptyState } from "@/components/news/EmptyState";
import { ClimaCard } from "@/components/news/ClimaCard";
import { CotacaoCard } from "@/components/news/CotacaoCard";
import { PostCard } from "@/components/news/PostCard";
import PromocoesHero from "@/components/products/DestaquesSection";
import Link from "next/link";

export const revalidate = 60; // Revalidate this page every 60 seconds

function pickFeaturedPost(posts: any[]) {
  if (!posts?.length) return null;
  return posts[0];
}

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

function SectionHeader(props: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  id?: string;
}) {
  const { eyebrow, title, subtitle, action, id } = props;

  return (
    <div className="flex items-start justify-between gap-4" id={id}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-1 text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-zinc-900">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-600 leading-relaxed">{subtitle}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function EditorialLink(props: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const { href, children, variant = "ghost" } = props;

  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

  const styles =
    variant === "primary"
      ? "bg-emerald-700 text-white hover:bg-emerald-800"
      : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

export default async function NewsHomePage() {
  let data = null as any;

  try {
    const res = await newsPublicApi.overview(6);
    data = res.data;
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <main className="min-h-[calc(100vh-120px)] bg-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-10">
          <EmptyState
            title="Não foi possível carregar o Kavita News"
            subtitle="Tente novamente em instantes. Caso persista, verifique sua conexão."
          />
        </div>
      </main>
    );
  }

  const posts = data.posts || [];
  const clima = data.clima || [];
  const cotacoes = data.cotacoes || [];

  const featured = pickFeaturedPost(posts);
  const morePosts = featured ? posts.slice(1, 6) : posts.slice(0, 6);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-zinc-50 text-zinc-900">
      {/* Masthead / identidade editorial */}
      <header className="bg-white border-b border-zinc-200">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-zinc-500">
                  JORNAL DO AGRO
                </p>

                <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950">
                  Kavita News
                </h1>

                <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-600 leading-relaxed">
                  Clima, mercado e notícias que impactam o agro brasileiro, em um só lugar.
                </p>

                <p className="mt-3 max-w-3xl text-sm text-zinc-600 leading-relaxed">
                  Acompanhe cotações agrícolas, clima regional e as principais notícias do agronegócio.
                  Informação clara, atualizada e feita para quem vive o campo.
                </p>
              </div>

              <nav className="flex flex-wrap items-center gap-2">
                <EditorialLink href="/news/posts" variant="ghost">
                  Ver notícias
                </EditorialLink>
                <EditorialLink href="/news/cotacoes" variant="primary">
                  Ver cotações
                </EditorialLink>
              </nav>
            </div>

            {/* Linha editorial / meta-benefícios */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Atualização contínua
                </span>
                <span className="hidden sm:inline text-zinc-400">•</span>
                <span>Economia rural, clima e mercado</span>
                <span className="hidden sm:inline text-zinc-400">•</span>
                <span className="font-medium text-zinc-800">Conteúdo informativo e confiável</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Corpo editorial */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10">
        {/* Grid principal */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-8 space-y-6">
            {/* Manchete */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="p-5 md:p-6 border-b border-zinc-100">
                <SectionHeader
                  title="Manchete"
                  subtitle="Cobertura de mercado, clima e notícias do agro."
                />
              </div>

              <div className="p-5 md:p-6">
                {featured ? (
                  <Link
                    href={`/news/posts/${postSlug(featured)}`}
                    className="
                      group block rounded-2xl border border-zinc-200 bg-white overflow-hidden
                      hover:border-zinc-300 hover:shadow-md transition
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2
                    "
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      <div className="md:col-span-7 p-5 md:p-7">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 font-semibold">
                          DESTAQUE
                        </p>

                        <h3 className="mt-3 text-2xl md:text-4xl font-extrabold leading-tight tracking-tight text-zinc-950">
                          {postTitle(featured)}
                        </h3>

                        {postExcerpt(featured) ? (
                          <p className="mt-3 text-sm md:text-base text-zinc-700 leading-relaxed line-clamp-4">
                            {postExcerpt(featured)}
                          </p>
                        ) : (
                          <p className="mt-3 text-sm md:text-base text-zinc-700 leading-relaxed">
                            Sem resumo disponível. O conteúdo completo está disponível na matéria.
                          </p>
                        )}

                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                          Ler matéria{" "}
                          <span className="transition-transform group-hover:translate-x-0.5">→</span>
                        </div>
                      </div>

                      {/* Capa opcional */}
                      <div className="md:col-span-5">
                        {postCover(featured) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={postCover(featured)}
                            alt=""
                            className="h-56 md:h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-56 md:h-full w-full bg-gradient-to-br from-zinc-50 to-emerald-50 border-t md:border-t-0 md:border-l border-zinc-200">
                            <div className="h-full w-full p-6 flex items-end">
                              <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
                                <p className="text-xs text-zinc-700">
                                  Sem imagem de capa. O conteúdo completo está disponível na matéria.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 md:p-8">
                    <EmptyState
                      title="Nenhuma matéria publicada ainda"
                      subtitle="Volte em breve para acompanhar as próximas atualizações."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Últimas publicações */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="p-5 md:p-6 border-b border-zinc-100">
                <SectionHeader
                  title="Últimas publicações"
                  subtitle="As notícias mais recentes do agro, organizadas para leitura rápida."
                  action={
                    <Link
                      href="/news/posts"
                      className="
                        text-sm font-semibold text-emerald-700 hover:text-emerald-800
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2
                        rounded-md px-2 py-1
                      "
                    >
                      Ver todas
                    </Link>
                  }
                />
              </div>

              <div className="p-5 md:p-6">
                {morePosts?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {morePosts.slice(0, 4).map((p: any) => (
                      <PostCard key={p.id} item={p} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhuma matéria publicada no momento."
                    subtitle="Novos conteúdos serão adicionados em breve."
                  />
                )}
              </div>
            </div>

            {/* Promoções (agora na coluna principal para não criar buraco no desktop) */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="p-5 md:p-6 border-b border-zinc-100">
                <SectionHeader
                  eyebrow="OFERTAS"
                  title="Produtos em promoção"
                  subtitle="Ofertas selecionadas para quem vive o agro."
                  action={
                    <EditorialLink href="/" variant="primary">
                      Ver ofertas
                    </EditorialLink>
                  }
                />
              </div>

              <div className="p-2 sm:p-3 pt-0">
                <PromocoesHero />
              </div>
            </div>
          </div>

          {/* Sidebar editorial (desktop) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Clima (sidebar) */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-100">
                <SectionHeader
                  eyebrow="CLIMA"
                  title="Cidades monitoradas"
                  subtitle="Condições recentes e volume de chuvas nas regiões acompanhadas."
                  action={<EditorialLink href="/news/clima">Ver detalhes</EditorialLink>}
                />
              </div>

              <div className="p-5 space-y-4">
                {clima?.length ? (
                  clima.slice(0, 3).map((c: any) => <ClimaCard key={c.id} item={c} />)
                ) : (
                  <EmptyState title="Nenhuma cidade monitorada no momento." subtitle="Volte em breve." />
                )}
              </div>
            </div>

            {/* Cotações (sidebar) */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-100">
                <SectionHeader
                  eyebrow="MERCADO"
                  title="Painel de cotações"
                  subtitle="Principais ativos e referências do agronegócio."
                  action={<EditorialLink href="/news/cotacoes">Ver todas</EditorialLink>}
                />
              </div>

              <div className="p-5 space-y-4">
                {cotacoes?.length ? (
                  cotacoes.slice(0, 3).map((c: any) => <CotacaoCard key={c.id} item={c} />)
                ) : (
                  <EmptyState title="Sem cotações disponíveis no momento." subtitle="Atualizado continuamente." />
                )}
              </div>
            </div>
          </aside>
        </section>

        {/* Mercado (faixa) */}
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 md:p-6 border-b border-zinc-100">
            <SectionHeader
              eyebrow="MERCADO"
              title="Painel de cotações"
              subtitle="Principais ativos e referências do agronegócio."
              action={<EditorialLink href="/news/cotacoes">Ver todas as cotações</EditorialLink>}
            />
          </div>

          <div className="p-5 md:p-6">
            {cotacoes?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cotacoes.slice(0, 6).map((c: any) => (
                  <CotacaoCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <EmptyState title="Sem cotações disponíveis no momento." subtitle="Volte em breve." />
            )}
          </div>
        </section>

        {/* Clima (faixa) */}
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 md:p-6 border-b border-zinc-100">
            <SectionHeader
              eyebrow="CLIMA"
              title="Cidades monitoradas"
              subtitle="Acompanhe o volume de chuvas e as condições recentes nas regiões acompanhadas."
              action={<EditorialLink href="/news/clima">Ver detalhes</EditorialLink>}
            />
          </div>

          <div className="p-5 md:p-6">
            {clima?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clima.slice(0, 4).map((c: any) => (
                  <ClimaCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhuma cidade monitorada no momento." subtitle="Volte em breve." />
            )}
          </div>
        </section>

        {/* Editorial (posts em grade) */}
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 md:p-6 border-b border-zinc-100">
            <SectionHeader
              eyebrow="EDITORIAL"
              title="Matérias e análises"
              subtitle="Leitura confortável, com foco em contexto e impacto no agro."
              action={<EditorialLink href="/news/posts" variant="primary">Ver notícias</EditorialLink>}
            />
          </div>

          <div className="p-5 md:p-6">
            {posts?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.slice(0, 6).map((p: any) => (
                  <PostCard key={p.id} item={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma matéria publicada no momento."
                subtitle="Novos conteúdos serão adicionados em breve."
              />
            )}
          </div>
        </section>

        {/* Seção institucional leve */}
        <section className="mt-10 rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-950">
              Informação que conecta o campo ao mercado
            </h2>
            <p className="mt-3 text-sm md:text-base text-zinc-700 leading-relaxed max-w-4xl">
              O Kavita News nasce para informar produtores, comerciantes e consumidores sobre o que realmente
              importa no agro: clima, mercado e contexto. Conteúdo direto, sem ruído, pensado para apoiar
              decisões no dia a dia.
            </p>
          </div>
        </section>
      </div>

      {/* Rodapé discreto */}
      <footer className="mt-10 border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs text-zinc-500">
            <span>© {new Date().getFullYear()} Kavita News</span>
            <span>Atualizado continuamente • Cobertura do agro brasileiro</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
