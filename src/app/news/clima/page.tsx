// src/app/news/clima/page.tsx
import { newsPublicApi } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { ClimaCard } from "@/components/news/ClimaCard";

export default async function ClimaListPage() {
  let items: any[] = [];
  try {
    const res = await newsPublicApi.climaList();
    items = res.data || [];
  } catch {
    items = [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 space-y-6">
      <SectionHeader title="Clima" subtitle="Cidades ativas" href="/news" actionLabel="Voltar" />

      {items.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => (
            <ClimaCard key={c.id} item={c} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma cidade ativa" subtitle="Ative cidades no admin para aparecer aqui." />
      )}
    </main>
  );
}
