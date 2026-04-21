// src/app/mercado-do-cafe/verificacao/page.tsx
//
// Página institucional explicando o que significa "Corretora verificada
// pela Kavita" — trust anchor. Linkada do selo em cada corretora, da
// home e do menu de rodapé. SEO friendly.

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

export const metadata = {
  title: "Como verificamos as corretoras | Kavita · Mercado do Café",
  description:
    "Entenda como a Kavita audita corretoras de café antes de publicá-las — CNPJ, endereço, responsável e histórico. Rede nacional com praça piloto na Zona da Mata Mineira.",
};

const CRITERIOS = [
  {
    n: "01",
    titulo: "CNPJ ativo",
    desc: "Conferimos na Receita Federal se a empresa possui CNPJ ativo e situação regular.",
  },
  {
    n: "02",
    titulo: "Endereço físico confirmado",
    desc: "Validamos o endereço físico declarado na região cafeeira informada pela corretora, preferencialmente em município produtor de café.",
  },
  {
    n: "03",
    titulo: "Responsável identificado",
    desc: "Um contato humano pelo nome. Sem corretoras anônimas — o produtor sempre sabe com quem está falando.",
  },
  {
    n: "04",
    titulo: "Canais de contato válidos",
    desc: "Testamos telefone e WhatsApp antes da publicação. A corretora precisa ser acessível.",
  },
  {
    n: "05",
    titulo: "Histórico de atuação",
    desc: "Consideramos tempo de mercado, indicações locais e presença na região cafeeira.",
  },
];

const NAO_SOMOS = [
  "Não somos a corretora — apenas conectamos produtor e corretora",
  "Não definimos o preço — cada corretora negocia livremente",
  "Não temos comissão sobre negócios fechados entre produtor e corretora",
  "Não garantimos o fechamento do negócio — a relação comercial é entre as partes",
];

export default function VerificacaoPage() {
  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[700px] h-[600px] w-[700px] rounded-full bg-amber-700/[0.07] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-16 md:px-6 md:pt-20">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-[11px] text-stone-500"
        >
          <Link
            href="/mercado-do-cafe"
            className="transition-colors hover:text-amber-200"
          >
            Mercado do Café
          </Link>
          <span aria-hidden>/</span>
          <span className="text-amber-200">Verificação</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center text-amber-200">
              <PanelBrandMark className="h-full w-full" />
            </div>
            <div className="h-6 w-px bg-white/15" aria-hidden />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              Institucional · Confiança
            </p>
          </div>

          <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-4xl lg:text-5xl">
            Como verificamos as{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              corretoras
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
            Cada corretora com selo "Verificada pela Kavita" passou por uma
            análise da nossa equipe antes de aparecer no Mercado do Café.
            Entenda exatamente o que isso significa — e o que{" "}
            <em>não</em> significa.
          </p>
        </header>

        {/* Critérios */}
        <section className="mb-16 rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] backdrop-blur-sm md:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
          />

          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
            O que conferimos
          </p>
          <h2 className="mt-2 text-lg font-semibold text-stone-50 md:text-xl">
            Os 5 critérios da análise Kavita
          </h2>

          <ol className="mt-6 space-y-5">
            {CRITERIOS.map((c) => (
              <li key={c.n} className="flex gap-4">
                <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-amber-400">
                  {c.n}
                </span>
                <div className="flex-1 border-l border-white/10 pl-4">
                  <p className="text-sm font-semibold text-stone-100">
                    {c.titulo}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-400">
                    {c.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* O que NÃO somos */}
        <section className="mb-16 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6 md:p-8">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
            Transparência
          </p>
          <h2 className="mt-2 text-lg font-semibold text-stone-50 md:text-xl">
            O que a verificação não garante
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-300">
            Para ser justo com você, produtor, precisamos deixar claro o que
            está fora do nosso escopo:
          </p>
          <ul className="mt-4 space-y-2">
            {NAO_SOMOS.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-stone-300"
              >
                <span
                  aria-hidden
                  className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-amber-400/60"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Como reclamar */}
        <section className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] backdrop-blur-sm md:p-8">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
            Algo deu errado?
          </p>
          <h2 className="mt-2 text-lg font-semibold text-stone-50 md:text-xl">
            Como reportar problemas com uma corretora
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-300">
            Se você teve uma experiência ruim com uma corretora verificada
            (não respondeu, comportamento inadequado, informação divergente),
            entre em contato com a equipe Kavita. Levamos cada relato a sério:
            corretoras podem ser suspensas ou removidas após análise.
          </p>
          <div className="mt-5">
            <Link
              href="/contato"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:ring-amber-400/30"
            >
              Falar com a equipe Kavita →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
