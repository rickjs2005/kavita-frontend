// src/app/news/posts/page.tsx
//
// /news/posts — Hub Editorial do Agro.
//
// Redesign completo: deixa de ser "header claro + grid de cards" e
// passa a ser um hub editorial dark committed coerente com /news,
// /news/clima e /news/cotacoes — porém com identidade própria do
// módulo Posts:
//
//   - paradigma dark stone-950 (mesma família visual de Clima/Cotações)
//   - signature accent: amber-300/400 (jornal premium, papel quente,
//     editorial, autoridade)
//   - secundário: rose-300 (selo "leitura" e detalhes editoriais)
//
// Estrutura:
//   1. Atmospheric layer (4 glows amber/orange + drift)
//   2. Edition strip "REDAÇÃO · NO AR" no topo
//   3. Hero editorial — kicker mono, headline gradient amber, sub
//   4. Stats strip (publicações / categorias / em destaque / atualização)
//      computados a partir dos próprios items — sem inventar dado
//   5. Featured matéria (primeiro post como capa de edição)
//   6. Section "Edição corrente" com grid 3-col de PostCards
//   7. Manifesto editorial
//   8. Footer mono

import { newsPublicApi } from "@/lib/newsPublicApi";
import type { PublicPost } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { PostCard } from "@/components/news/PostCard";
import { absUrl } from "@/utils/absUrl";
import Link from "next/link";

export const revalidate = 120;

function formatDatePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

function getCoverUrl(item: any): string | null {
  const candidates = [
    item?.cover_image_url,
    item?.cover,
    item?.cover_url,
    item?.coverImageUrl,
    item?.image_url,
    item?.thumbnail_url,
  ];
  const raw = candidates.find(
    (v) => typeof v === "string" && v.trim().length > 0,
  ) as string | undefined;
  if (!raw) return null;
  try {
    return encodeURI(absUrl(raw.trim()));
  } catch {
    return absUrl(raw.trim());
  }
}

function uniqueCategories(items: PublicPost[]) {
  return new Set(
    items
      .map((i) => (i.category || "").trim().toLowerCase())
      .filter(Boolean),
  ).size;
}

function mostRecentDate(items: PublicPost[]): string | null {
  let best: number | null = null;
  for (const it of items) {
    const v = it.published_at || it.created_at;
    if (!v) continue;
    const t = new Date(v).getTime();
    if (Number.isNaN(t)) continue;
    if (best === null || t > best) best = t;
  }
  return best === null ? null : new Date(best).toISOString();
}

export default async function PostsListPage() {
  let items: PublicPost[] = [];
  try {
    items = await newsPublicApi.postsList(12, 0);
  } catch {
    items = [];
  }

  const total = items.length;
  const catCount = uniqueCategories(items);
  const lastUpdate = mostRecentDate(items);
  const featured = items[0] || null;
  const rest = items.slice(1);
  const featuredCover = featured ? getCoverUrl(featured) : null;
  const featuredDate = featured ? formatDatePtBR(featured.published_at) : "";
  const currentYear = new Date().getFullYear();

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer — paleta amber (jornal premium) ═════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-amber-500/[0.09] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-32 h-[480px] w-[480px] rounded-full bg-orange-400/[0.06] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[58%] h-[420px] w-[420px] rounded-full bg-amber-400/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-rose-500/[0.05] blur-3xl kavita-drift-a" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.55)_85%)]" />
      </div>

      {/* ═══ Conteúdo ════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* ─── Edition strip ─── */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]" />
              </span>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                Redação Kavita · No ar
              </p>
            </div>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500 md:block">
              Jornalismo do agro · Conteúdo editorial · Atualização contínua
            </p>
          </div>
        </div>

        {/* ─── Hero ─── */}
        <header className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 md:px-6 md:pb-16 md:pt-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <Link
                href="/news"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-amber-300"
              >
                ← K · NEWS
              </Link>
              <span className="h-px w-12 bg-amber-400/40" aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                Edição · {currentYear}
              </p>
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-stone-50 md:text-6xl lg:text-7xl">
              Reportagens que{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                movem o campo
              </span>
              .
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg">
              Cobertura editorial do agro brasileiro — análises, contexto e
              leituras úteis para quem decide no campo. Conteúdo escrito com
              clareza, atualizado continuamente pela redação Kavita.
            </p>
          </div>
        </header>

        {/* ─── Stats strip ─── */}
        {total > 0 && (
          <section
            aria-label="Resumo da edição"
            className="mx-auto w-full max-w-7xl px-4 md:px-6"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
              />

              <div className="relative grid grid-cols-2 divide-x divide-white/[0.06] md:grid-cols-4">
                <Stat
                  kicker="Publicações na edição"
                  value={String(total).padStart(2, "0")}
                  unit={total === 1 ? "matéria" : "matérias"}
                />
                <Stat
                  kicker="Editorias cobertas"
                  value={String(catCount).padStart(2, "0")}
                  unit={catCount === 1 ? "categoria" : "categorias"}
                />
                <Stat
                  kicker="Em destaque"
                  value={featured ? "01" : "—"}
                  unit={featured ? "manchete" : "sem destaque"}
                />
                <Stat
                  kicker="Última atualização"
                  value={lastUpdate ? formatDatePtBR(lastUpdate) : "—"}
                  unit={lastUpdate ? "no ar" : "sem dados"}
                />
              </div>
            </div>
          </section>
        )}

        {/* ─── Featured / Manchete ─── */}
        {featured && (
          <section
            aria-label="Manchete da edição"
            className="mx-auto mt-10 w-full max-w-7xl px-4 md:mt-14 md:px-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <span
                className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
                aria-hidden
              >
                01
              </span>
              <span
                className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                aria-hidden
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                Manchete da edição
              </p>
            </div>

            <Link
              href={`/news/posts/${featured.slug}`}
              aria-label={`Abrir manchete: ${featured.title}`}
              className="group relative block overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:ring-amber-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-16 top-0 z-10 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
              />

              <div className="grid gap-0 md:grid-cols-5">
                {/* Capa */}
                <div className="relative md:col-span-3">
                  {featuredCover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredCover}
                      alt={`Capa da matéria: ${featured.title}`}
                      className="h-64 w-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100 md:h-full md:min-h-[420px]"
                      loading="eager"
                    />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/30 md:h-full md:min-h-[420px]">
                      <div className="text-center">
                        <div className="font-mono text-5xl text-amber-300/30" aria-hidden>
                          ¶
                        </div>
                        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                          Manchete sem capa
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Overlay editorial */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent md:bg-gradient-to-r md:from-transparent md:via-stone-950/10 md:to-stone-950/70"
                  />

                  {/* Selo manchete */}
                  <div className="absolute left-5 top-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300 ring-1 ring-amber-400/40 backdrop-blur-md">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                        aria-hidden
                      />
                      Manchete
                    </span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="relative flex flex-col justify-between gap-6 p-7 md:col-span-2 md:p-10">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
                      <span>{featured.category || "Editorial"}</span>
                      {featuredDate && (
                        <>
                          <span className="text-stone-600" aria-hidden>·</span>
                          <span className="text-stone-400">{featuredDate}</span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-5 text-2xl font-bold leading-[1.1] tracking-tight text-stone-50 transition-colors group-hover:text-white md:text-4xl">
                      {featured.title}
                    </h2>

                    {featured.excerpt && (
                      <p className="mt-5 text-[15px] leading-relaxed text-stone-300 line-clamp-4 md:text-base">
                        {featured.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Leitura editorial
                    </span>
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300 transition-transform group-hover:translate-x-0.5">
                      Ler matéria <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ─── Edição corrente ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.18em] text-stone-500"
                  aria-hidden
                >
                  02
                </span>
                <span
                  className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                  aria-hidden
                />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                  Edição corrente
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                Demais reportagens
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
                Selecione uma matéria para abrir a leitura completa. Cada card
                mostra a editoria, a data de publicação e um resumo direto.
              </p>
            </div>

            {total > 0 && (
              <span className="hidden shrink-0 items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-400/20 md:inline-flex">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                  aria-hidden
                />
                {total} {total === 1 ? "publicação" : "publicações"}
              </span>
            )}
          </div>

          <div className="mt-8">
            {rest.length ? (
              <div
                aria-label="Lista de matérias"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {rest.map((p) => (
                  <PostCard key={p.id} item={p} />
                ))}
              </div>
            ) : total > 0 ? (
              <div className="rounded-2xl bg-white/[0.03] p-10 ring-1 ring-white/[0.06] backdrop-blur-sm">
                <p className="text-center text-sm text-stone-400">
                  A manchete acima é a única publicação ativa nesta edição.
                  Novas matérias serão adicionadas em breve.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] p-10 ring-1 ring-white/[0.06] backdrop-blur-sm">
                <EmptyState
                  title="Nenhuma matéria publicada no momento"
                  subtitle="A redação está preparando novos conteúdos. Volte em instantes para acompanhar as próximas publicações."
                />
              </div>
            )}
          </div>

          {/* Fallback SectionHeader (mantém semântica e ação Voltar) */}
          {total === 0 && (
            <div className="mt-8">
              <SectionHeader
                title="Últimas publicações"
                subtitle="Selecione uma matéria para ler"
                href="/news"
                actionLabel="Voltar"
              />
            </div>
          )}
        </section>

        {/* ─── Manifesto editorial ─── */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-amber-500/[0.05] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm md:p-14">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl"
            />

            <div className="relative grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  Por que ler aqui
                </p>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
                  Jornalismo do agro, sem ruído.
                </h2>
              </div>
              <p className="text-base leading-relaxed text-stone-300">
                Reportagens com contexto, dados e linguagem direta para quem
                vive do campo. A redação Kavita escreve para produtores,
                cooperativas e corretoras que precisam entender o cenário
                rapidamente — sem manchete forçada e sem texto inflado.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Redação
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Conteúdo editorial · Atualização contínua
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────
function Stat({
  kicker,
  value,
  unit,
}: {
  kicker: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="px-6 py-5 md:px-7 md:py-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {kicker}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-stone-50 md:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-amber-300/80">
        {unit}
      </p>
    </div>
  );
}
