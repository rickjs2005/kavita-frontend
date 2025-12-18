// src/app/news/posts/[slug]/page.tsx
import Link from "next/link";
import { newsPublicApi } from "@/lib/newsPublicApi";
import { EmptyState } from "@/components/news/EmptyState";

function safeText(htmlOrText?: string | null) {
  // Por segurança, aqui eu renderizo como texto.
  // Se você quiser render HTML, a gente implementa sanitização.
  return String(htmlOrText || "");
}

export default async function PostDetailPage({ params }: { params: { slug: string } }) {
  let post: any = null;

  try {
    const res = await newsPublicApi.postBySlug(params.slug);
    post = res.data;
  } catch {
    post = null;
  }

  if (!post) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
        <EmptyState title="Post não encontrado" subtitle="Ele pode não estar publicado ou não está ativo." />
        <div className="mt-6">
          <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/news/posts">
            Voltar para Posts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/news/posts">
          Voltar para Posts
        </Link>
        <div className="text-xs text-zinc-500">
          {post.published_at ? post.published_at : ""} {post.views ? `• ${post.views} views` : ""}
        </div>
      </div>

      {post.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="w-full h-56 md:h-72 object-cover rounded-2xl border border-zinc-200"
        />
      ) : null}

      <article className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">{post.title}</h1>

        <div className="mt-2 text-sm text-zinc-600 flex flex-wrap gap-3">
          {post.category ? <span>Categoria: {post.category}</span> : null}
          {post.tags ? <span>Tags: {post.tags}</span> : null}
        </div>

        {post.excerpt ? (
          <p className="mt-6 text-zinc-700 font-medium">{post.excerpt}</p>
        ) : null}

        <div className="mt-6 whitespace-pre-wrap text-zinc-800 leading-relaxed">
          {safeText(post.content)}
        </div>
      </article>
    </main>
  );
}
