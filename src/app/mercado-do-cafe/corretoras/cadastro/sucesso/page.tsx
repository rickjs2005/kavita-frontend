// src/app/mercado-do-cafe/corretoras/cadastro/sucesso/page.tsx
//
// Confirmação pós-cadastro — RSC
//
// Direção: DARK COMMITTED em coerência com o restante do módulo.
// Reforça o próximo passo do fluxo (aguardar aprovação + e-mail) com
// linguagem editorial em dark glass, accent amber-400 e CTAs de saída
// claros (voltar para o hub ou ir direto para o login do painel).

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

export const metadata = {
  title: "Cadastro enviado | Mercado do Café | Kavita",
};

export default function CadastroSucessoPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-120px)] items-center overflow-hidden bg-stone-950 text-stone-100">
      {/* ─── Atmospheric glows ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.10] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[300px] h-[500px] w-[600px] rounded-full bg-amber-700/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[200px] h-[500px] w-[600px] rounded-full bg-orange-700/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.05] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-xl px-4 py-14 md:px-6 md:py-20">
        {/* ─── Card central em dark glass ─── */}
        <section
          aria-label="Confirmação de cadastro"
          className="relative overflow-hidden rounded-3xl bg-white/[0.04] p-8 text-center ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm md:p-12"
        >
          {/* Top highlight amber */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
          />
          {/* Mini glow top-right */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-orange-700/15 blur-3xl"
          />

          {/* Brand mark com ring amber */}
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-amber-200 ring-1 ring-amber-400/30 shadow-lg shadow-amber-500/20 backdrop-blur-sm">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"
            />
            <PanelBrandMark className="relative h-9 w-9" />
          </div>

          <p className="relative inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
            <span
              aria-hidden
              className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
            />
            Sala Reservada · Recebido
          </p>

          <h1 className="relative mt-3 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
            Cadastro enviado
          </h1>

          <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-stone-300">
            Sua solicitação foi registrada e está na fila de análise. Assim
            que aprovada, você recebe um e-mail de confirmação e já pode
            entrar no painel com o e-mail e a senha que acabou de criar.
          </p>

          {/* Próximos passos em dark glass interno */}
          <div className="relative mt-8 overflow-hidden rounded-2xl bg-stone-950/40 p-5 text-left ring-1 ring-white/[0.08] backdrop-blur-sm md:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
              Próximos passos
            </p>
            <ol className="mt-3 space-y-3 text-[12px] leading-relaxed text-stone-300">
              <NextStep
                number="01"
                body="Nossa equipe revisa os dados — normalmente em poucos dias úteis."
              />
              <NextStep
                number="02"
                body="Você recebe um e-mail avisando que a conta foi aprovada."
              />
              <NextStep
                number="03"
                body="Acesse o painel com a senha que você criou agora."
              />
            </ol>
          </div>

          {/* CTAs */}
          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/mercado-do-cafe"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 hover:shadow-amber-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />
              <span className="relative">Voltar ao Mercado do Café</span>
            </Link>
            <Link
              href="/painel/corretora/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:text-amber-200 hover:ring-amber-400/30"
            >
              Ir para o login do painel
            </Link>
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] text-stone-500">
          Recebeu este cadastro por engano? Ignore — nenhuma conta é
          publicada sem aprovação da equipe.
        </p>
      </div>
    </main>
  );
}

// ─── Next step item ─────────────────────────────────────────────
function NextStep({ number, body }: { number: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-amber-400/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums tracking-[0.08em] text-amber-300 ring-1 ring-amber-400/20">
        {number}
      </span>
      <span>{body}</span>
    </li>
  );
}
