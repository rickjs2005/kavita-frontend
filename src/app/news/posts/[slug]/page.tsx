// src/app/news/posts/[slug]/page.tsx
import Link from "next/link";
import { newsPublicApi } from "@/lib/newsPublicApi";
import { EmptyState } from "@/components/news/EmptyState";

function safeText(htmlOrText?: string | null) {
  // Por segurança, aqui eu renderizo como texto.
  // Se você quiser render HTML, a gente implementa sanitização.
  return String(htmlOrText || "");
}

function formatDateTimePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
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

  const raw = candidates.find((v) => typeof v === "string" && v.trim().length > 0) as string | undefined;
  if (!raw) return null;

  const trimmed = raw.trim();
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const absolute = trimmed.startsWith("/") ? `${base}${trimmed}` : trimmed;

  try {
    return encodeURI(absolute);
  } catch {
    return absolute;
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const res = await newsPublicApi.postBySlug(slug);
  let post: any = null;

  try {
    const res = await newsPublicApi.postBySlug((await params).slug);
    post = res.data;
  } catch {
    post = null;
  }

  if (!post) {
    return (
      <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <EmptyState
              title="Matéria não encontrada"
              subtitle="Ela pode não estar disponível no momento. Verifique o endereço ou volte para a listagem."
            />
            <div className="mt-6">
              <Link
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
                href="/news/posts"
              >
                Voltar para Notícias
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const coverUrl = resolveCoverUrl(post);
  const published = formatDateTimePtBR(post.published_at);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
            href="/news/posts"
          >
            ← Voltar para Notícias
          </Link>

          <div className="text-xs text-zinc-500">
            {published ? published : ""} {post.views ? `• ${post.views} views` : ""}
          </div>
        </div>

        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Capa da matéria: ${post.title}`}
            className="w-full h-56 md:h-72 object-cover rounded-2xl border border-zinc-200 bg-white"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-56 md:h-72 rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-100 to-white flex items-center justify-center text-center px-6">
            <div>
              <div className="text-3xl" aria-hidden>📰</div>
              <p className="mt-2 text-sm font-medium text-zinc-700">Sem imagem de capa</p>
              <p className="mt-1 text-xs text-zinc-500">A matéria segue disponível para leitura.</p>
            </div>
          </div>
        )}

        <article className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 md:p-7">
          {/* Exatamente 1 H1 na página */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-600">
            {post.category ? <span>Categoria: {post.category}</span> : null}
            {post.tags ? <span>Tags: {post.tags}</span> : null}
          </div>

          {post.excerpt ? (
            <p className="mt-6 text-zinc-700 font-medium leading-relaxed">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-6 whitespace-pre-wrap text-zinc-800 leading-relaxed">
            {safeText(post.content)}
          </div>
        </article>
      </div>
    </main>
  );
}
