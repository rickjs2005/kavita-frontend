// src/app/news/page.tsx
import { newsPublicApi } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { ClimaCard } from "@/components/news/ClimaCard";
import { CotacaoCard } from "@/components/news/CotacaoCard";
import { PostCard } from "@/components/news/PostCard";

export default async function NewsHomePage() {
  let data = null as any;

  try {
    const res = await newsPublicApi.overview(6);
    data = res.data;
  } catch {
    data = null;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Kavita News</h1>
        <p className="text-zinc-600 mt-2">
          Clima, cotações e conteúdo para o agro, atualizado pelo seu painel admin.
        </p>
      </header>

      {!data ? (
        <EmptyState
          title="Não foi possível carregar o Kavita News"
          subtitle="Verifique se o backend está no ar e se o NEXT_PUBLIC_API_URL está configurado."
        />
      ) : (
        <div className="space-y-10">
          {/* Clima */}
          <section className="space-y-4">
            <SectionHeader
              title="Clima"
              subtitle="Cidades monitoradas"
              href="/news/clima"
              actionLabel="Ver cidades"
            />
            {data.clima?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.clima.slice(0, 4).map((c: any) => (
                  <ClimaCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <EmptyState title="Sem cidades de clima ativas" subtitle="Ative uma cidade no admin." />
            )}
          </section>

          {/* Cotações */}
          <section className="space-y-4">
            <SectionHeader
              title="Cotações"
              subtitle="Principais ativos e referências"
              href="/news/cotacoes"
              actionLabel="Ver todas"
            />
            {data.cotacoes?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.cotacoes.slice(0, 6).map((c: any) => (
                  <CotacaoCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <EmptyState title="Sem cotações ativas" subtitle="Ative pelo menos uma cotação no admin." />
            )}
          </section>

          {/* Posts */}
          <section className="space-y-4">
            <SectionHeader
              title="Últimos posts"
              subtitle="Conteúdos publicados"
              href="/news/posts"
              actionLabel="Ver posts"
            />
            {data.posts?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.posts.slice(0, 6).map((p: any) => (
                  <PostCard key={p.id} item={p} />
                ))}
              </div>
            ) : (
              <EmptyState title="Sem posts publicados" subtitle="Publique um post no admin para aparecer aqui." />
            )}
          </section>
        </div>
      )}
    </main>
  );
}
