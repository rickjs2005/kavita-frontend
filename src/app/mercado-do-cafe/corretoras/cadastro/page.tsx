// src/app/mercado-do-cafe/corretoras/cadastro/page.tsx
//
// Página pública de cadastro da corretora. Visual elevado ao padrão
// Sala Reservada (stone/amber/emerald, kickers, PanelCards) mas em
// contexto claro — pertence ao site público, não à área privada.
// Age como ponte visual entre o hub público e o painel premium.

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import { CorretoraSubmissionForm } from "@/components/mercado-do-cafe/CorretoraSubmissionForm";

export const metadata = {
  title: "Cadastre sua corretora | Mercado do Café | Kavita",
  description:
    "Cadastre sua corretora de café da Zona da Mata mineira, crie sua senha e, após aprovação, acesse o painel privado para receber contatos de produtores.",
};

export default function CadastroCorretoraPage() {
  return (
    <main className="relative min-h-[calc(100vh-120px)] bg-stone-50 text-stone-900">
      {/* Warm ambient gradient no topo — mesma linguagem do painel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-gradient-to-b from-amber-50/60 via-stone-50/40 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-12">
        {/* Back link */}
        <Link
          href="/mercado-do-cafe/corretoras"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 transition-colors hover:text-stone-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Voltar para corretoras
        </Link>

        {/* Hero */}
        <header className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-start md:gap-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center text-stone-900">
            <PanelBrandMark className="h-full w-full" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Sala Reservada · Cadastro
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
              Cadastre sua corretora
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 md:text-base">
              Informe os dados da sua empresa, crie sua senha e envie para
              análise. Assim que aprovada, sua corretora aparece no diretório
              público e seu acesso ao painel já estará pronto — com a senha que
              você acabou de definir.
            </p>
          </div>
        </header>

        {/* Form */}
        <CorretoraSubmissionForm />
      </div>
    </main>
  );
}
