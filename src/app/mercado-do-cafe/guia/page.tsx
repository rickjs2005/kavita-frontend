// src/app/mercado-do-cafe/guia/page.tsx
//
// Guia do produtor — página única editorial com ancoragens, construída
// para SEO regional e educação do produtor iniciante. Resolve o gap
// apontado na auditoria: ausência de explicação do "por quê" e
// contexto básico do mercado de corretagem de café.
//
// Tópicos cobrem o produtor iniciante sem subestimar o experiente:
//   1. O que faz uma corretora de café
//   2. Corretora ou cooperativa
//   3. Como funciona a comissão
//   4. Calendário da safra na Zona da Mata
//   5. Matas de Minas — a Denominação de Origem
//   6. Glossário essencial

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

export const metadata = {
  title: "Guia do Produtor · Café | Kavita",
  description:
    "Entenda o que faz uma corretora de café, como funciona a comissão, o calendário da safra e o selo Matas de Minas. Guia para produtores de café do Brasil, com exemplos da Zona da Mata Mineira.",
};

const TOPICOS = [
  { id: "corretora", label: "01 · Corretora" },
  { id: "cooperativa", label: "02 · Cooperativa" },
  { id: "comissao", label: "03 · Comissão" },
  { id: "safra", label: "04 · Safra" },
  { id: "matas-de-minas", label: "05 · Matas de Minas" },
  { id: "glossario", label: "06 · Glossário" },
];

const GLOSSARIO = [
  { termo: "Saca", def: "Unidade padrão de 60 kg usada no comércio do café." },
  { termo: "Peneira", def: "Classificação do tamanho do grão (13 a 19). Peneiras maiores = grãos maiores = preço superior." },
  { termo: "Bebida mole", def: "Classificação sensorial superior: café com doçura natural e acidez equilibrada. Típico da Zona da Mata." },
  { termo: "Natural", def: "Método de processamento: secagem do fruto inteiro no terreiro, realçando doçura e corpo." },
  { termo: "Cereja descascado (CD)", def: "Processamento intermediário: retira-se a casca mas mantém-se parte da mucilagem." },
  { termo: "R&A", def: "Rio e Rio Zona — classificação de café com defeitos sensoriais, geralmente destino de indústria." },
  { termo: "Safra", def: "Ciclo anual de produção. Na Zona da Mata, colheita vai de maio a setembro." },
  { termo: "DO", def: "Denominação de Origem — reconhecimento oficial da origem geográfica e qualidade sensorial." },
];

export default function GuiaPage() {
  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[800px] h-[600px] w-[700px] rounded-full bg-amber-700/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[1600px] h-[700px] w-[800px] rounded-full bg-orange-700/[0.06] blur-3xl"
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
          <span className="text-amber-200">Guia do Produtor</span>
        </nav>

        {/* Hero */}
        <header className="mb-14">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center text-amber-200">
              <PanelBrandMark className="h-full w-full" />
            </div>
            <div className="h-6 w-px bg-white/15" aria-hidden />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              Educacional · Café
            </p>
          </div>

          <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-4xl lg:text-5xl">
            Guia do{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              produtor
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
            O que você precisa saber antes de negociar com uma corretora de
            café. Conteúdo direto, escrito para o produtor — com exemplos da
            Zona da Mata Mineira (nossa praça piloto) e aplicáveis a qualquer
            região produtora do Brasil.
          </p>
        </header>

        {/* TOC */}
        <nav
          aria-label="Tópicos do guia"
          className="mb-14 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] backdrop-blur-sm"
        >
          <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
            Tópicos
          </p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {TOPICOS.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="group flex items-center gap-2 text-sm text-stone-300 transition-colors hover:text-amber-200"
                >
                  <span className="font-mono text-[11px] text-amber-400">
                    {t.label.split(" · ")[0]}
                  </span>
                  <span aria-hidden className="h-px w-6 bg-white/10 transition-colors group-hover:bg-amber-400/40" />
                  <span>{t.label.split(" · ")[1]}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 01 — Corretora */}
        <Section id="corretora" n="01" title="O que faz uma corretora de café">
          <p>
            Uma <strong className="text-stone-100">corretora de café</strong> é uma
            empresa que atua como intermediária entre o produtor (vendedor) e o
            comprador — que pode ser um exportador, uma indústria de torrefação
            ou outra corretora. O papel da corretora é encontrar comprador com
            bom preço para o café do produtor e fechar o negócio com agilidade
            e transparência.
          </p>
          <p>
            Na prática, a corretora avalia o café (via amostra ou prova),
            negocia o preço com compradores, organiza a logística e intermedia
            o pagamento. O produtor ganha acesso a uma rede que sozinho
            levaria anos para construir.
          </p>
        </Section>

        {/* 02 — Cooperativa */}
        <Section id="cooperativa" n="02" title="Corretora ou cooperativa?">
          <p>
            Muitos produtores da Zona da Mata estão ligados a{" "}
            <strong className="text-stone-100">cooperativas</strong> como
            Cooabriel, Coocafé Manhuaçu ou Coopeavi. Cooperativa e corretora
            não são excludentes — muitos produtores trabalham com ambas.
          </p>
          <ul className="mt-3 space-y-2 text-stone-300">
            <li>
              <strong className="text-stone-100">Cooperativa:</strong>{" "}
              vantagem em escala, crédito de custeio e estrutura. Processo
              costuma ser mais burocrático.
            </li>
            <li>
              <strong className="text-stone-100">Corretora:</strong>{" "}
              agilidade e negociação direta. Bom para lotes específicos,
              café especial e compradores direcionados.
            </li>
          </ul>
        </Section>

        {/* 03 — Comissão */}
        <Section id="comissao" n="03" title="Como funciona a comissão">
          <p>
            A corretora ganha uma{" "}
            <strong className="text-stone-100">comissão por saca</strong>{" "}
            negociada. Os valores variam conforme o tipo de café e a
            complexidade do negócio, normalmente entre{" "}
            <strong className="text-stone-100">R$ 0,50 e R$ 5,00 por saca</strong>.
          </p>
          <p>
            Essa comissão é paga pelo produtor ou pelo comprador, dependendo
            da negociação. A Kavita{" "}
            <strong className="text-stone-100">não cobra nenhum valor</strong>{" "}
            sobre essas transações — ficamos de fora da relação comercial.
          </p>
        </Section>

        {/* 04 — Safra */}
        <Section id="safra" n="04" title="Calendário da safra — Zona da Mata">
          <p>
            A safra do café arábica na Zona da Mata Mineira acontece{" "}
            <strong className="text-stone-100">entre maio e setembro</strong>,
            com pico operacional em julho-agosto.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SafraCard
              periodo="Maio–Junho"
              titulo="Início de colheita"
              desc="Primeiras colheitas. Foco em peneira alta e café maduro."
            />
            <SafraCard
              periodo="Julho–Agosto"
              titulo="Pico"
              desc="Volume máximo de negociação. Corretoras em correria, resposta pode demorar mais."
            />
            <SafraCard
              periodo="Setembro"
              titulo="Final de safra"
              desc="Fechamento de colheita. Bom momento para micro-lotes e cafés especiais."
            />
          </div>
          <p className="mt-4 text-stone-400">
            Fora do período de safra (outubro a abril), a atividade é menor,
            mas corretoras continuam atuando com estoque, preparação e
            relacionamento.
          </p>
        </Section>

        {/* 05 — Matas de Minas */}
        <Section id="matas-de-minas" n="05" title="Matas de Minas — a Denominação de Origem">
          <p>
            <strong className="text-stone-100">Matas de Minas</strong> é a
            Denominação de Origem (DO) reconhecida pelo INPI para cafés
            produzidos em uma região da Zona da Mata Mineira que inclui
            Manhuaçu, Manhumirim, Lajinha, Caparaó e outros municípios.
          </p>
          <p>
            A DO reconhece características sensoriais específicas da região:
            bebida mole, doçura natural, corpo médio-alto e acidez
            equilibrada. Café com selo Matas de Minas tem valor diferenciado
            no mercado internacional.
          </p>
          <p className="text-stone-400">
            Se a sua corretora trabalha com cafés especiais da região,
            pergunte se ela atua com rotulagem Matas de Minas — pode abrir
            canais de exportação premium.
          </p>
        </Section>

        {/* 06 — Glossário */}
        <Section id="glossario" n="06" title="Glossário essencial">
          <dl className="divide-y divide-white/10">
            {GLOSSARIO.map((item) => (
              <div key={item.termo} className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  {item.termo}
                </dt>
                <dd className="text-sm leading-relaxed text-stone-300">
                  {item.def}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* CTA final */}
        <section className="mt-14 rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] backdrop-blur-sm md:p-8">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
            Próximo passo
          </p>
          <h2 className="mt-2 text-lg font-semibold text-stone-50 md:text-xl">
            Pronto para falar com uma corretora?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-300">
            Encontre corretoras verificadas na sua cidade da Zona da Mata.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/mercado-do-cafe/corretoras"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400"
            >
              Ver corretoras →
            </Link>
            <Link
              href="/mercado-do-cafe/cidade/manhuacu"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:ring-amber-400/30"
            >
              Corretoras em Manhuaçu →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Section({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <header className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-amber-400">
          {n}
        </span>
        <span aria-hidden className="h-px flex-1 max-w-[60px] bg-amber-400/30" />
        <h2 className="text-xl font-semibold tracking-tight text-stone-50 md:text-2xl">
          {title}
        </h2>
      </header>
      <div className="space-y-3 text-sm leading-relaxed text-stone-300 md:text-[15px]">
        {children}
      </div>
    </section>
  );
}

function SafraCard({
  periodo,
  titulo,
  desc,
}: {
  periodo: string;
  titulo: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/[0.08] backdrop-blur-sm">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
        {periodo}
      </p>
      <p className="mt-2 text-sm font-semibold text-stone-100">{titulo}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-stone-400">{desc}</p>
    </div>
  );
}
