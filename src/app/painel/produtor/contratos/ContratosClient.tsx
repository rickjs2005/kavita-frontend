"use client";

// src/app/painel/produtor/contratos/ContratosClient.tsx
//
// Lista de contratos do produtor. Client component porque o cookie
// producerToken só funciona via apiClient do browser (não há SSR
// autenticado neste contexto).

import Link from "next/link";
import { useProducerContratos } from "@/hooks/useProducerContratos";
import { ProducerContratoCard } from "@/components/painel-produtor/ProducerContratoCard";

export default function ContratosClient() {
  const { items, loading, error } = useProducerContratos();

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-8 md:px-6 md:pt-10">
      <header className="mb-8">
        <nav className="mb-4 text-xs text-stone-500">
          <Link href="/painel/produtor" className="hover:text-amber-700">
            ← Voltar ao painel
          </Link>
        </nav>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
          Meus contratos
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
          Contratos de Compra e Venda
        </h1>
        <p className="mt-2 text-sm text-stone-500 max-w-2xl">
          Aqui aparecem todos os instrumentos particulares em que você é
          parte. Quando a corretora envia para assinatura, o link chega
          no seu e-mail via ClickSign — este painel mostra o status em
          tempo real e permite baixar a via final quando assinada.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-stone-500">Carregando seus contratos…</p>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-stone-700">
            Você ainda não tem contratos
          </h2>
          <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
            Assim que uma corretora gerar um contrato de compra e venda
            com você, ele aparece aqui com o status atualizado.
          </p>
          <Link
            href="/mercado-do-cafe"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-600/20 hover:from-amber-400 hover:to-amber-500"
          >
            Ver corretoras →
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((c) => (
            <ProducerContratoCard key={c.id} contrato={c} />
          ))}
        </div>
      )}
    </main>
  );
}
