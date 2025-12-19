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
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-9">
          <p className="text-xs font-semibold tracking-widest text-zinc-500">KAVITA NEWS • REPORTAGENS</p>

          {/* Exatamente 1 H1 */}
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            📰 Notícias do Agro
          </h1>

          <p className="mt-2 max-w-3xl text-sm md:text-base leading-relaxed text-zinc-600">
            Cobertura editorial com informações claras e úteis para quem vive o campo. Atualizado continuamente.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              Leitura rápida • Títulos objetivos
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
              Imagens de capa quando disponíveis
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        {/* SectionHeader (h2) do projeto */}
        <SectionHeader title="Últimas publicações" subtitle="Selecione uma matéria para ler" href="/news" actionLabel="Voltar" />

        {items.length ? (
          <section aria-label="Lista de matérias" className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {items.map((p) => (
              <PostCard key={p.id} item={p} />
            ))}
          </section>
        ) : (
          <section aria-label="Sem matérias publicadas" className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <EmptyState
              title="Nenhuma matéria publicada no momento"
              subtitle="Novos conteúdos serão adicionados em breve. Volte para acompanhar as atualizações."
            />
          </section>
        )}
      </div>
    </main>
  );
}
