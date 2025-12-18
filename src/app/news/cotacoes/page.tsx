// src/app/news/cotacoes/page.tsx
import { newsPublicApi } from "@/lib/newsPublicApi";
import { SectionHeader } from "@/components/news/SectionHeader";
import { EmptyState } from "@/components/news/EmptyState";
import { CotacaoCard } from "@/components/news/CotacaoCard";

export default async function CotacoesListPage() {
  let items: any[] = [];
  try {
    const res = await newsPublicApi.cotacoesList();
    items = res.data || [];
  } catch {
    items = [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 space-y-6">
      <SectionHeader title="Cotações" subtitle="Ativos monitorados" href="/news" actionLabel="Voltar" />

      {items.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => (
            <CotacaoCard key={c.id} item={c} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma cotação ativa" subtitle="Ative cotações no admin para aparecer aqui." />
      )}
    </main>
  );
}
