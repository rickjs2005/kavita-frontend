// src/app/pricing/page.tsx
//
// Página pública de planos — estratégia de aquisição:
// 3 meses grátis → Pro → Premium. Foco em reduzir atrito de
// entrada e converter depois que a corretora já está operando.

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

export const metadata = {
  title: "Planos — Comece 3 meses grátis | Kavita · Mercado do Café",
  description:
    "Teste o Kavita por 3 meses sem compromisso. Planos pensados para corretoras de café da Zona da Mata Mineira.",
};

// ─── Planos (estáticos — fonte de verdade para a página pública) ──

type PlanDisplay = {
  slug: string;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  cta: string;
  ctaHref: string;
  featured: boolean;
  features: { text: string; included: boolean }[];
};

const PLANS: PlanDisplay[] = [
  {
    slug: "trial",
    name: "Teste grátis",
    price: "R$ 0",
    priceNote: "por 3 meses · sem cartão",
    description:
      "Conheça a plataforma sem compromisso. Teste o Kavita na rotina real da sua corretora e veja os resultados antes de investir.",
    cta: "Começar 3 meses grátis",
    ctaHref: "/mercado-do-cafe/corretoras/cadastro",
    featured: false,
    features: [
      { text: "1 usuário na equipe", included: true },
      { text: "Perfil público no Mercado do Café", included: true },
      { text: "Receber leads por email e painel", included: true },
      { text: "Painel operacional básico", included: true },
      { text: "Laudo de classificação", included: true },
      { text: "Envio de laudo via WhatsApp", included: true },
      { text: "Exportação CSV", included: false },
      { text: "Relatórios avançados", included: false },
      { text: "Destaque regional", included: false },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    price: "R$ 149",
    priceNote: "/mês",
    description:
      "Para corretoras que já estão operando e precisam de mais produtividade, mais controle e mais ferramentas no dia a dia.",
    cta: "Assinar plano Pro",
    ctaHref: "/mercado-do-cafe/corretoras/cadastro",
    featured: true,
    features: [
      { text: "Até 3 usuários na equipe", included: true },
      { text: "Tudo do plano gratuito", included: true },
      { text: "Exportação CSV de leads", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Filtros por bebida e amostra", included: true },
      { text: "Laudo completo com envio WhatsApp", included: true },
      { text: "Destaque regional", included: false },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    slug: "premium",
    name: "Premium",
    price: "R$ 299",
    priceNote: "/mês",
    description:
      "Para corretoras com volume maior, equipe dedicada e necessidade de presença regional forte nas cidades da Zona da Mata.",
    cta: "Falar com o time",
    ctaHref: "https://wa.me/5533999999999?text=Quero%20saber%20mais%20sobre%20o%20plano%20Premium%20do%20Kavita",
    featured: false,
    features: [
      { text: "Até 10 usuários na equipe", included: true },
      { text: "Tudo do plano Pro", included: true },
      { text: "Destaque regional nas cidades", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Onboarding assistido", included: true },
      { text: "Relatórios de performance por córrego", included: true },
    ],
  },
];

// ─── Render ────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      {/* Atmospheric glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[700px] rounded-full bg-amber-700/[0.05] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-16 md:px-6 md:pt-20">
        {/* ─── Hero ──────────────────────────────────────────── */}
        <header className="mb-14 text-center md:mb-16">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center text-amber-200">
            <PanelBrandMark className="h-full w-full" />
          </div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
            Planos · Kavita Mercado do Café
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-[1.05] tracking-tight text-stone-50 md:text-5xl">
            Comece{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              3 meses grátis
            </span>
            .
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-stone-300 md:text-base">
            Teste o Kavita na rotina real da sua corretora — sem compromisso,
            sem cartão de crédito. Quando sua operação crescer, evolua para o
            plano que fizer mais sentido.
          </p>
        </header>

        {/* ─── Plans grid ────────────────────────────────────── */}
        {/* Grid com items-stretch garante altura igual entre cards.
            Cada card é flex-col com o CTA empurrado para o fundo via
            mt-auto — independente da quantidade de features. */}
        <div className="grid items-stretch gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`relative flex flex-col overflow-hidden rounded-2xl p-6 ring-1 backdrop-blur-sm md:p-7 ${
                plan.featured
                  ? "bg-gradient-to-br from-amber-500/[0.08] to-stone-900/60 ring-amber-400/30 shadow-[0_0_40px_rgba(251,191,36,0.08)]"
                  : "bg-white/[0.04] ring-white/[0.08]"
              }`}
            >
              {/* Hairline + badge para featured */}
              {plan.featured && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                  />
                  <span className="absolute right-4 top-4 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-amber-400/40">
                    Recomendado
                  </span>
                </>
              )}

              {/* ── Topo fixo: nome + preço + descrição ── */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                  {plan.name}
                </p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums text-stone-50 md:text-4xl">
                    {plan.price}
                  </span>
                  <span className="text-sm text-stone-400">
                    {plan.priceNote}
                  </span>
                </div>
                <p className="mt-3 min-h-[3.5rem] text-[13px] leading-relaxed text-stone-400">
                  {plan.description}
                </p>
              </div>

              {/* ── Meio flexível: lista de features ── */}
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-start gap-2.5 text-[13px]"
                  >
                    {f.included ? (
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="mt-0.5 h-4 w-4 shrink-0 text-stone-600"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.28 4.22a.75.75 0 00-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 101.06 1.06L10 11.06l4.72 4.72a.75.75 0 101.06-1.06L11.06 10l4.72-4.72a.75.75 0 00-1.06-1.06L10 8.94 5.28 4.22z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span
                      className={`min-w-0 ${f.included ? "font-medium text-stone-200" : "text-stone-500"}`}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* ── Rodapé fixo: CTA ancorado no fundo ── */}
              <div className="mt-8 pt-2">
                <CtaButton plan={plan} />
              </div>
            </div>
          ))}
        </div>

        {/* ─── Confiança ─────────────────────────────────────── */}
        <div className="mt-10 text-center">
          <p className="text-[13px] text-stone-400">
            Sem pegadinha. Sem cartão para começar. Cancele quando quiser.
          </p>
        </div>

        {/* ─── FAQ ───────────────────────────────────────────── */}
        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <FaqCard
            question="Como funcionam os 3 meses grátis?"
            answer="Ao cadastrar sua corretora, você recebe acesso completo ao plano básico por 3 meses. Sem cartão, sem compromisso. Ao final do período, você pode evoluir para o Pro ou continuar com funcionalidades básicas."
          />
          <FaqCard
            question="Preciso pagar para receber leads?"
            answer="Não. Leads chegam no painel e por email em todos os planos. O que muda são ferramentas operacionais — exportação, equipe, relatórios e destaque regional."
          />
          <FaqCard
            question="Como funciona o destaque regional?"
            answer="Corretoras Premium aparecem em destaque nas cidades da Zona da Mata (Manhuaçu, Manhumirim, Lajinha, Caparaó e outras). É visibilidade prioritária para quem busca corretoras na região."
          />
          <FaqCard
            question="Posso cancelar quando quiser?"
            answer="Sim. Cancele a qualquer momento sem multa. Seu perfil público e histórico de leads são preservados — você não perde dados."
          />
        </section>
      </div>
    </main>
  );
}

const ctaBase =
  "block w-full rounded-xl px-4 py-3 text-center text-[12px] font-bold uppercase tracking-[0.14em] transition-all";
const ctaFeatured = `${ctaBase} bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 hover:from-amber-200 hover:to-amber-400`;
const ctaDefault = `${ctaBase} bg-white/[0.05] text-amber-200 ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-amber-400/30`;

function CtaButton({ plan }: { plan: PlanDisplay }) {
  const cls = plan.featured ? ctaFeatured : ctaDefault;
  if (plan.ctaHref.startsWith("http")) {
    return (
      <a href={plan.ctaHref} target="_blank" rel="noopener noreferrer" className={cls}>
        {plan.cta}
      </a>
    );
  }
  return (
    <Link href={plan.ctaHref} className={cls}>
      {plan.cta}
    </Link>
  );
}

function FaqCard({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08]">
      <h2 className="text-sm font-semibold text-stone-100">{question}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-stone-400">
        {answer}
      </p>
    </div>
  );
}
