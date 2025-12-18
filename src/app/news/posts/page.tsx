// src/app/news/posts/page.tsx
import { newsPublicApi } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { PostCard } from "@/components/news/PostCard";

export default async function PostsListPage() {
  let items: any[] = [];
  try {
    const res = await newsPublicApi.postsList(12, 0);
    items = res.data || [];
  } catch {
    items = [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 space-y-6">
      <SectionHeader title="Posts" subtitle="Conteúdo publicado" href="/news" actionLabel="Voltar" />

      {items.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((p) => (
            <PostCard key={p.id} item={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum post publicado" subtitle="Publique posts no admin para aparecer aqui." />
      )}
    </main>
  );
}
