"use client";

// LoteVendidoClient — UI da confirmação. Não busca dados antes
// (preserva privacidade); produtor lê a tela, confirma, backend
// valida HMAC e responde com agregado.

import { useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

type Result = {
  affected_count: number;
  already_marked: boolean;
};

export default function LoteVendidoClient({
  id,
  token,
}: {
  id: string;
  token: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmar = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post<Result>(
        `/api/public/corretoras/lote-vendido/${encodeURIComponent(id)}/${encodeURIComponent(token)}`,
      );
      setResult(res);
    } catch (err) {
      setError(formatApiError(err, "Não foi possível confirmar.").message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      {/* Atmospheric glows — coerência com o módulo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[700px] rounded-full bg-amber-700/[0.07] blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16">
        <div className="w-full overflow-hidden rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-12">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
          />

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center text-amber-200">
              <PanelBrandMark className="h-full w-full" />
            </div>

            <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
              Mercado do Café · Confirmação
            </p>

            {!result && !error && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Você já vendeu este lote?
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-300">
                  Se você fechou negócio com outra corretora, podemos avisar
                  todas as outras que receberam seu contato. Assim, ninguém
                  perde tempo cobrando uma amostra que não vai mais sair.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={confirmar}
                    disabled={submitting}
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    />
                    {submitting ? "Confirmando..." : "Sim, já vendi"}
                  </button>
                  <Link
                    href="/mercado-do-cafe"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-stone-200 backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
                  >
                    Cancelar
                  </Link>
                </div>

                <p className="mt-6 text-[11px] text-stone-500">
                  Esta ação não pode ser desfeita pela página. Em caso de
                  engano, fale diretamente com a corretora.
                </p>
              </>
            )}

            {result && (
              <>
                <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-6 w-6"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Tudo certo
                </h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-300">
                  {result.already_marked
                    ? "Este contato já estava marcado como vendido. Nenhuma corretora foi notificada novamente."
                    : `Avisamos ${result.affected_count} corretora${result.affected_count > 1 ? "s" : ""} que você já fechou negócio. Obrigado por cuidar do tempo da rede.`}
                </p>
                <Link
                  href="/mercado-do-cafe"
                  className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30"
                >
                  Voltar ao Mercado do Café
                </Link>
              </>
            )}

            {error && (
              <>
                <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-6 w-6"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Não foi possível confirmar
                </h1>
                <p className="mt-3 max-w-md text-sm text-stone-300">{error}</p>
                <p className="mt-2 text-[11px] text-stone-500">
                  Se o link veio direto da corretora, pode estar expirado ou
                  já ter sido usado. Avise a corretora diretamente.
                </p>
                <Link
                  href="/mercado-do-cafe"
                  className="mt-6 inline-flex items-center text-[11px] font-semibold text-amber-300 hover:text-amber-200"
                >
                  ← Voltar ao Mercado do Café
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
