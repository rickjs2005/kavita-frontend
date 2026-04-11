// src/app/news/posts/[slug]/page.tsx
//
// Detalhe de uma matéria — Hub Editorial Kavita.
//
// Redesign completo: deixa de ser "card grande em página clara" e
// passa a ser uma página de leitura editorial dark committed,
// coerente com /news/posts. Mesma identidade amber/orange (jornal
// premium, papel quente).
//
// Estrutura:
//   1. Atmospheric layer (4 glows amber/rose + drift)
//   2. Edition strip "MATÉRIA · LEITURA" no topo
//   3. Hero editorial — kicker breadcrumb mono, categoria, título
//      gigante com gradient amber, metadata (data/views), tags
//   4. Capa imersiva (ou estado sem capa, tratado com presença)
//   5. Bloco de leitura — excerpt em destaque + corpo com largura
//      controlada, tipografia maior, leading editorial
//   6. Footer mono + back link

import Link from "next/link";
import { newsPublicApi } from "@/lib/newsPublicApi";
import { absUrl } from "@/utils/absUrl";

export const revalidate = 120;

function safeText(htmlOrText?: string | null) {
  return String(htmlOrText || "");
}

function formatDateTimePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

function resolveCoverUrl(item: any): string | null {
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

  return absUrl(raw.trim());
}

function splitTags(tags?: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(/[,;|]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function readingTime(content?: string | null): number {
  const text = (content || "").trim();
  if (!text) return 0;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let post: any = null;
  try {
    post = await newsPublicApi.postBySlug(slug);
  } catch {
    post = null;
  }

  const currentYear = new Date().getFullYear();

  if (!post) {
    return (
      <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-amber-500/[0.07] blur-3xl" />
          <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-rose-400/[0.05] blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-3xl px-4 py-20 md:px-6">
          <div className="rounded-2xl bg-white/[0.04] p-10 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Edição indisponível
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-50">
              Matéria não encontrada
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Esta reportagem pode ter sido removida ou ainda não foi
              publicada. Verifique o endereço ou volte para a edição corrente.
            </p>
            <Link
              href="/news/posts"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/[0.05] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-400/30 transition-all hover:bg-white/[0.08] hover:ring-amber-400/50"
            >
              <span aria-hidden>←</span> Voltar para Notícias
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const coverUrl = resolveCoverUrl(post);
  const published = formatDateTimePtBR(post.published_at);
  const tags = splitTags(post.tags);
  const minutes = readingTime(post.content);

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ═══ Atmospheric layer ═══════════════════════════════════════════ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-amber-500/[0.10] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-32 h-[480px] w-[480px] rounded-full bg-orange-400/[0.07] blur-3xl kavita-drift-b" />
        <div className="absolute left-1/3 top-[55%] h-[420px] w-[420px] rounded-full bg-amber-400/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full bg-rose-500/[0.05] blur-3xl kavita-drift-a" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.55)_85%)]" />
      </div>

      {/* ═══ Conteúdo ════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* ─── Edition strip ─── */}
        <div className="border-b border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]" />
              </span>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                Matéria · Leitura editorial
              </p>
            </div>
            <Link
              href="/news/posts"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-amber-300"
            >
              ← Edição corrente
            </Link>
          </div>
        </div>

        {/* ─── Hero editorial ─── */}
        <header className="mx-auto w-full max-w-4xl px-4 pb-10 pt-14 md:px-6 md:pb-14 md:pt-20">
          {/* Breadcrumb mono */}
          <div className="flex items-center gap-3">
            <Link
              href="/news"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-amber-300"
            >
              K · NEWS
            </Link>
            <span className="text-stone-600" aria-hidden>
              /
            </span>
            <Link
              href="/news/posts"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-amber-300"
            >
              POSTS
            </Link>
            <span className="text-stone-600" aria-hidden>
              /
            </span>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              MATÉRIA
            </p>
          </div>

          {/* Categoria */}
          {post.category && (
            <div className="mt-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-400/30">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                  aria-hidden
                />
                {post.category}
              </span>
            </div>
          )}

          {/* Título gigante */}
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-stone-50 md:text-6xl lg:text-[64px]">
            {post.title}
            <span className="text-amber-300/80">.</span>
          </h1>

          {/* Excerpt como dek editorial */}
          {post.excerpt && (
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-stone-300 md:text-xl md:leading-[1.55]">
              {post.excerpt}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/[0.06] pt-6">
            {published && (
              <div className="flex items-center gap-2">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Publicado
                </p>
                <p className="text-xs font-semibold text-stone-200">{published}</p>
              </div>
            )}
            {minutes > 0 && (
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-stone-700" aria-hidden />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Leitura
                </p>
                <p className="text-xs font-semibold text-stone-200">
                  {minutes} min
                </p>
              </div>
            )}
            {typeof post.views === "number" && post.views > 0 && (
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-stone-700" aria-hidden />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Views
                </p>
                <p className="text-xs font-semibold text-stone-200">
                  {post.views}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* ─── Capa imersiva ─── */}
        <section
          aria-label="Capa da matéria"
          className="mx-auto w-full max-w-5xl px-4 md:px-6"
        >
          {coverUrl ? (
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/[0.08] shadow-2xl shadow-black/50">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-16 top-0 z-10 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt={`Capa da matéria: ${post.title}`}
                className="h-72 w-full object-cover md:h-[480px]"
                loading="eager"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/30"
              />
            </div>
          ) : (
            <div className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/30 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 md:h-[420px]">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl"
              />
              <div className="relative text-center">
                <div
                  className="font-mono text-7xl text-amber-300/30"
                  aria-hidden
                >
                  ¶
                </div>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">
                  Reportagem sem capa
                </p>
                <p className="mt-2 text-sm text-stone-400">
                  A matéria segue disponível para leitura completa abaixo.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ─── Corpo editorial ─── */}
        <article
          aria-label="Conteúdo da matéria"
          className="mx-auto w-full max-w-3xl px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-16"
        >
          {/* Drop cap + corpo */}
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -left-6 top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-amber-300/40 via-white/[0.06] to-transparent md:block"
            />

            <div className="whitespace-pre-wrap text-[17px] leading-[1.85] tracking-[0.005em] text-stone-200 md:text-[18px] md:leading-[1.9]">
              {safeText(post.content) || (
                <span className="text-stone-500">
                  Esta matéria ainda não possui corpo de texto publicado.
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-12 border-t border-white/[0.06] pt-8">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Marcadores
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-stone-300 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.07] hover:text-amber-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Encerramento editorial */}
          <div className="mt-12 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.08]" aria-hidden />
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/70"
              aria-hidden
            >
              ∎ Kavita News
            </span>
            <span className="h-px flex-1 bg-white/[0.08]" aria-hidden />
          </div>

          {/* Voltar */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/news/posts"
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-400/30 transition-all hover:bg-white/[0.08] hover:ring-amber-400/50"
            >
              <span aria-hidden>←</span> Voltar para a edição
            </Link>
          </div>
        </article>

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-stone-950/40 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                aria-hidden
              />
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                © {currentYear} Kavita News · Redação
              </p>
            </div>
            <Link
              href="/news/posts"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 transition-colors hover:text-amber-200"
            >
              ← Todas as matérias
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
