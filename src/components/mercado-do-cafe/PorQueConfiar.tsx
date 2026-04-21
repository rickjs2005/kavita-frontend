// src/components/mercado-do-cafe/PorQueConfiar.tsx
//
// Faixa editorial compacta na listagem de corretoras.
// Responde a pergunta que todo produtor faz ao chegar pela
// primeira vez: "por que confio aqui em vez de dar busca no
// Google?". 5 critérios concretos, sem tom publicitário.

const criterios: Array<{ title: string; desc: string; icon: React.ReactNode }> = [
  {
    title: "Corretoras passam por curadoria",
    desc: "Cada cadastro é revisado pela equipe do Kavita antes de aparecer na vitrine.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
      </svg>
    ),
  },
  {
    title: "Produtor não paga para falar",
    desc: "Pedir contato com uma corretora é sempre gratuito e sem compromisso.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9a3 3 0 00-3-2c-1.7 0-3 1-3 2.3 0 1.3 1 2 3 2.2 2 .3 3 1 3 2.3 0 1.2-1.3 2.2-3 2.2a3 3 0 01-3-2" />
        <path d="M12 6v2M12 16v2" />
      </svg>
    ),
  },
  {
    title: "Avaliações são moderadas",
    desc: "O que outros produtores falam da corretora passa pela curadoria antes de aparecer.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M21 12c0 4-4 7-9 7-1.6 0-3-.2-4.3-.8L3 20l1.3-3.5C3.5 15.2 3 13.6 3 12c0-4 4-7 9-7s9 3 9 7z" />
      </svg>
    ),
  },
  {
    title: "Tempo de resposta é acompanhado",
    desc: "O painel mostra há quanto tempo cada corretora costuma retornar aos produtores.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: "Informação regional sempre visível",
    desc: "Cidades atendidas, perfil e especialidade de cada corretora ficam abertos na ficha.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export function PorQueConfiar() {
  return (
    <section
      aria-label="Por que confiar na Kavita"
      className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-7"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
      />

      <header className="relative flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
            Por que confiar na Kavita
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-50 md:text-xl">
            Corretoras verificadas, produtor no centro
          </h2>
        </div>
        <p className="max-w-md text-[13px] leading-relaxed text-stone-400">
          O Mercado do Café não é um diretório aberto. Cada corretora listada
          aqui passou por curadoria. O objetivo é simples: ajudar produtores de
          café em qualquer região produtora do Brasil a encontrar atendimento
          sério e rastreável. Nascemos na Zona da Mata e atendemos todas as
          praças cafeeiras.
        </p>
      </header>

      <ul className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {criterios.map((c) => (
          <li
            key={c.title}
            className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]"
          >
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
              {c.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-stone-100">
                {c.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-stone-400">
                {c.desc}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
