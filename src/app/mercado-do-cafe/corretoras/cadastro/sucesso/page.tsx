// src/app/mercado-do-cafe/corretoras/cadastro/sucesso/page.tsx
//
// Confirmação pós-cadastro. Reforça o próximo passo do fluxo:
// a corretora já definiu a senha e só precisa aguardar a aprovação
// + o e-mail de "sua conta foi aprovada" para entrar no painel.

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import { PanelCard } from "@/components/painel-corretora/PanelCard";

export const metadata = {
  title: "Cadastro enviado | Mercado do Café | Kavita",
};

export default function CadastroSucessoPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-120px)] items-center bg-stone-50 text-stone-900">
      {/* Warm ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-gradient-to-b from-amber-50/60 via-stone-50/40 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-xl px-4 py-12 md:px-6 md:py-16">
        <PanelCard density="spacious" elevated className="text-center">
          {/* Brand mark */}
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center text-stone-900">
            <PanelBrandMark className="h-full w-full" />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Sala Reservada
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Cadastro enviado
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Sua solicitação foi registrada e está na fila de análise. Assim
            que aprovada, você recebe um e-mail de confirmação e já pode
            entrar no painel com o e-mail e a senha que acabou de criar.
          </p>

          <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
              Próximos passos
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-stone-700">
              <li>
                <strong className="text-stone-900">1.</strong> Nossa equipe
                revisa os dados (normalmente em poucos dias úteis).
              </li>
              <li>
                <strong className="text-stone-900">2.</strong> Você recebe um
                e-mail avisando que a conta foi aprovada.
              </li>
              <li>
                <strong className="text-stone-900">3.</strong> Acesse o painel
                com a senha que você criou agora.
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/mercado-do-cafe"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-colors hover:bg-stone-800"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <span className="relative">Voltar ao Mercado do Café</span>
            </Link>
            <Link
              href="/painel/corretora/login"
              className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 shadow-sm shadow-stone-900/[0.03] transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              Ir para o login do painel
            </Link>
          </div>
        </PanelCard>

        <p className="mt-6 text-center text-[11px] text-stone-500">
          Recebeu este cadastro por engano? Ignore este e-mail — nenhuma conta
          é publicada sem aprovação da equipe.
        </p>
      </div>
    </main>
  );
}
