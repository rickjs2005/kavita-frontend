// src/app/news/cotacoes/[slug]/page.tsx
import Link from "next/link";
import { newsPublicApi } from "@/lib/newsPublicApi";
import { EmptyState } from "@/components/news/EmptyState";

export default async function CotacaoDetailPage({ params }: { params: { slug: string } }) {
  let item: any = null;

  try {
    const res = await newsPublicApi.cotacaoBySlug(params.slug);
    item = res.data;
  } catch {
    item = null;
  }

  if (!item) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
        <EmptyState title="Cotação não encontrada" subtitle="Verifique se ela está ativa no admin." />
        <div className="mt-6">
          <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/news/cotacoes">
            Voltar para Cotações
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
      <div className="mb-6">
        <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" href="/news/cotacoes">
          Voltar para Cotações
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-zinc-900">{item.name}</h1>
        <p className="text-sm text-zinc-600 mt-1">
          {item.group_key ? item.group_key : "sem grupo"} • {item.type ?? "tipo -"} • {item.slug}
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm text-zinc-600">Preço</p>
            <p className="text-xl font-semibold text-zinc-900">
              {item.price ?? "-"} {item.unit ?? ""}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-sm text-zinc-600">Variação do dia</p>
            <p className="text-xl font-semibold text-zinc-900">
              {item.variation_day ?? "-"}%
            </p>
          </div>
        </div>

        <div className="mt-6 text-sm text-zinc-600">
          <p>{item.market ? `Mercado: ${item.market}` : "Mercado: -"}</p>
          <p>{item.source ? `Fonte: ${item.source}` : "Fonte: -"}</p>
          <p>{item.last_update_at ? `Atualizado em: ${item.last_update_at}` : ""}</p>
        </div>
      </div>
    </main>
  );
}
