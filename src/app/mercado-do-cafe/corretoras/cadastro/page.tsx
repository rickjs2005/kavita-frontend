// src/app/mercado-do-cafe/corretoras/cadastro/page.tsx
//
// Cadastro público da corretora — RSC
//
// Direção: DARK COMMITTED em coerência com /mercado-do-cafe/corretoras
// e o detalhe da corretora. A page-shell vive em stone-950 com 4 zonas
// atmosféricas amber/orange e accent amber-400, e o formulário (que é
// um componente cliente light já existente) é apresentado dentro de uma
// "light island" sobre dark — padrão premium clássico (formulário em
// papel claro sobre mesa escura), preservando a UX do form sem mexer
// nas suas regras.

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import { CorretoraSubmissionForm } from "@/components/mercado-do-cafe/CorretoraSubmissionForm";
import { buildCoffeeMetadata } from "@/lib/coffeeMetadata";

export const metadata = buildCoffeeMetadata({
  path: "/mercado-do-cafe/corretoras/cadastro",
  title: "Cadastre sua corretora | Mercado do Café | Kavita",
  description:
    "Cadastre sua corretora de café — qualquer região produtora do Brasil. Crie sua senha e, após aprovação, acesse o painel privado para receber contatos de produtores.",
});

export default function CadastroCorretoraPage() {
  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* ─── Atmospheric glows — 4 zonas (mesma DNA do módulo) ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[600px] h-[600px] w-[700px] rounded-full bg-amber-700/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[1100px] h-[700px] w-[800px] rounded-full bg-orange-700/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.05] blur-3xl"
      />

      {/* ═══ MARKET STRIP — coerência com listagem ═══════════════════ */}
      <div className="relative border-b border-white/[0.08] bg-stone-950/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2.5 md:px-6">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </span>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-300">
            Mercado do Café
            <span className="mx-2 text-stone-600">·</span>
            <span className="text-stone-400">Sala Reservada</span>
            <span className="mx-2 text-stone-600">·</span>
            <span className="text-stone-400">Cadastro</span>
          </p>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-4 pb-20 pt-8 md:px-6 md:pb-28 md:pt-10">
        {/* ─── Back link ─── */}
        <Link
          href="/mercado-do-cafe/corretoras"
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-amber-300"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Voltar para corretoras
        </Link>

        {/* ─── HERO editorial ─── */}
        <header className="mt-8 md:mt-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center text-amber-200">
              <PanelBrandMark className="h-full w-full" />
            </div>
            <div className="h-6 w-px bg-white/15" aria-hidden />
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              <span
                aria-hidden
                className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
              />
              Sala Reservada · Cadastro
            </p>
          </div>

          <h1 className="mt-6 text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-4xl lg:text-5xl">
            Cadastre sua{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              corretora
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
            Informe os dados da sua empresa, crie sua senha e envie para
            análise. Assim que aprovada, sua corretora aparece no diretório
            público e seu acesso ao painel já estará pronto — com a senha que
            você acabou de definir.
          </p>
        </header>

        {/* ─── Trust ribbon — três promessas em dark glass ─── */}
        <section
          aria-label="Como funciona"
          className="relative mt-8 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-xl shadow-black/40 backdrop-blur-sm"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl"
          />

          <ol className="relative grid grid-cols-1 divide-y divide-white/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
            <Step
              number="01"
              title="Você envia"
              body="Preenche os dados da empresa e cria a senha que vai usar no painel privado."
            />
            <Step
              number="02"
              title="Equipe analisa"
              body="A análise é feita pela equipe Kavita e costuma sair em poucos dias úteis."
            />
            <Step
              number="03"
              title="Conta liberada"
              body="Você recebe um e-mail de aprovação e já entra direto no painel da corretora."
            />
          </ol>
        </section>

        {/* ─── Formulário (dark committed nativo) ─── */}
        <section aria-label="Formulário de cadastro" className="mt-10">
          <CorretoraSubmissionForm />
        </section>
      </div>
    </main>
  );
}

// ─── Step ─────────────────────────────────────────────────────────
function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <li className="relative p-5 md:p-6">
      <div className="flex items-baseline gap-3">
        <span className="inline-flex items-center rounded-md bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tabular-nums tracking-[0.1em] text-amber-300 ring-1 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          {number}
        </span>
        <p className="text-sm font-semibold tracking-tight text-stone-50">
          {title}
        </p>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-stone-400">
        {body}
      </p>
    </li>
  );
}
