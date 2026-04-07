// src/app/mercado-do-cafe/corretoras/cadastro/sucesso/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Cadastro Enviado | Kavita",
};

export default function CadastroSucessoPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center">
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <span className="text-3xl" aria-hidden>✅</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-zinc-900">
          Cadastro enviado com sucesso!
        </h1>

        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
          Nossa equipe vai analisar sua solicitação. Assim que aprovado, sua
          corretora aparecerá na listagem pública para todos os produtores da
          região.
        </p>

        <p className="mt-2 text-xs text-zinc-400">
          O processo costuma levar poucos dias úteis.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/mercado-do-cafe"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Voltar para o Mercado do Café
          </Link>
          <Link
            href="/mercado-do-cafe/corretoras"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Ver corretoras
          </Link>
        </div>
      </div>
    </main>
  );
}
