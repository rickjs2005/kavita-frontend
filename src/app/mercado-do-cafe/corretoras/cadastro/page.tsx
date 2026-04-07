// src/app/mercado-do-cafe/corretoras/cadastro/page.tsx
"use client";

import Link from "next/link";
import { CorretoraSubmissionForm } from "@/components/mercado-do-cafe/CorretoraSubmissionForm";

export default function CadastroCorretoraPage() {
  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-7 md:py-9">
          <Link
            href="/mercado-do-cafe/corretoras"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 mb-4"
          >
            <span aria-hidden>←</span> Voltar para corretoras
          </Link>

          <p className="text-xs font-semibold tracking-widest text-zinc-500">
            KAVITA • MERCADO DO CAFÉ
          </p>

          <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
            Cadastre sua corretora
          </h1>

          <p className="mt-2 text-sm md:text-base leading-relaxed text-zinc-600">
            Preencha os dados abaixo para sua empresa aparecer na nossa listagem
            de corretoras de café. O cadastro é gratuito e será analisado pela
            nossa equipe.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-8 md:py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 md:p-8">
          <CorretoraSubmissionForm />
        </div>
      </div>
    </main>
  );
}
