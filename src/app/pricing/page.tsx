// src/app/pricing/page.tsx
//
// Página pública de planos (Lote 2 — monetização).
// RSC que consome /api/public/plans. Sem client JS pesado.

import Link from "next/link";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import { API_BASE } from "@/utils/absUrl";

export const metadata = {
  title: "Planos e assinatura · Corretoras | Kavita · Mercado do Café",
  description:
    "Planos para corretoras de café da Zona da Mata Mineira — comece gratuito e evolua quando sua operação crescer.",
};

type Plan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_cycle: "monthly" | "yearly";
  capabilities: Record<string, unknown>;
};

const CAPABILITY_LABELS: Record<
  string,
  { label: string; format?: (v: unknown) => string }
> = {
  max_users: {
    label: "Usuários na equipe",
    format: (v) =>
      typeof v === "number" ? `${v} ${v === 1 ? "usuário" : "usuários"}` : "—",
  },
  leads_export: { label: "Exportar leads (CSV)" },
  regional_highlight: { label: "Destaque regional nas cidades" },
  advanced_reports: { label: "Relatórios avançados" },
};

async function fetchPlans(): Promise<Plan[]> {
  try {
    const base = String(API_BASE).replace(/\/$/, "").replace(/\/api$/, "");
    const res = await fetch(`${base}/api/public/plans`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatPrice(cents: number, cycle: Plan["billing_cycle"]): string {
  if (cents === 0) return "Gratuito";
  const brl = (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
  return `${brl}/${cycle === "yearly" ? "ano" : "mês"}`;
}

export default async function PricingPage() {
  const plans = await fetchPlans();

  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[700px] rounded-full bg-amber-700/[0.06] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-16 md:px-6 md:pt-20">
        {/* Hero */}
        <header className="mb-14 text-center">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center text-amber-200">
            <PanelBrandMark className="h-full w-full" />
          </div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
            Planos · Kavita
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-5xl">
            Comece gratuito.{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              Evolua
            </span>{" "}
            quando sua operação crescer.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
            Planos pensados para a realidade das corretoras da Zona da Mata
            Mineira. Sem pegadinha: tudo que está no Free continua no Free.
          </p>
        </header>

        {/* Plans grid */}
        {plans.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.04] p-8 text-center ring-1 ring-white/[0.08]">
            <p className="text-sm text-stone-400">
              Planos sendo finalizados. Em breve publicaremos os preços.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const isFeatured = plan.slug === "pro";
              return (
                <div
                  key={plan.id}
                  className={`relative overflow-hidden rounded-2xl p-6 ring-1 backdrop-blur-sm md:p-7 ${
                    isFeatured
                      ? "bg-gradient-to-br from-amber-500/[0.08] to-stone-900/60 ring-amber-400/30 shadow-[0_0_40px_rgba(251,191,36,0.08)]"
                      : "bg-white/[0.04] ring-white/[0.08]"
                  }`}
                >
                  {isFeatured && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
                    />
                  )}
                  {isFeatured && (
                    <span className="absolute right-4 top-4 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-amber-400/40">
                      Recomendado
                    </span>
                  )}
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                    {plan.name}
                  </p>
                  <p className="mt-4 text-3xl font-semibold tabular-nums text-stone-50 md:text-4xl">
                    {formatPrice(plan.price_cents, plan.billing_cycle)}
                  </p>
                  {plan.description && (
                    <p className="mt-3 text-sm leading-relaxed text-stone-400">
                      {plan.description}
                    </p>
                  )}

                  <ul className="mt-6 space-y-2.5">
                    {Object.entries(plan.capabilities ?? {}).map(([key, value]) => {
                      const meta = CAPABILITY_LABELS[key];
                      if (!meta) return null;
                      const isOn =
                        typeof value === "boolean"
                          ? value
                          : typeof value === "number"
                            ? value > 0
                            : false;
                      const text = meta.format
                        ? meta.format(value)
                        : isOn
                          ? "Incluído"
                          : "Não incluído";
                      return (
                        <li
                          key={key}
                          className="flex items-start gap-2 text-[13px]"
                        >
                          {isOn ? (
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
                          <span className="min-w-0">
                            <span className="font-medium text-stone-200">
                              {meta.label}
                            </span>
                            {typeof value === "number" && (
                              <span className="ml-1 text-stone-500">
                                · {text}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href="/mercado-do-cafe/corretoras/cadastro"
                      className={`block w-full rounded-xl px-4 py-2.5 text-center text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                        isFeatured
                          ? "bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 hover:from-amber-200 hover:to-amber-400"
                          : "bg-white/[0.05] text-amber-200 ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-amber-400/30"
                      }`}
                    >
                      {plan.price_cents === 0
                        ? "Cadastrar gratuitamente"
                        : "Falar com o time"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ simples */}
        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08]">
            <h2 className="text-sm font-semibold text-stone-100">
              Posso começar gratuitamente?
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Sim. O plano Free é permanente — perfil público, recepção de
              leads por email e painel operacional. Sem cartão.
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08]">
            <h2 className="text-sm font-semibold text-stone-100">
              Como funciona o destaque regional?
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Destaque pago por cidade coloca sua corretora no topo da
              listagem de Manhuaçu, Manhumirim, Lajinha ou qualquer outra.
              Contratável avulso pela equipe Kavita.
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08]">
            <h2 className="text-sm font-semibold text-stone-100">
              Preciso pagar para receber leads?
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Não. Leads chegam no painel e por email em todos os planos,
              inclusive no Free. O que muda é volume de ferramentas
              operacionais (exportação, equipe, relatórios).
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08]">
            <h2 className="text-sm font-semibold text-stone-100">
              Posso cancelar quando quiser?
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Sim. Cancele a qualquer momento e continue com o Free sem
              perder seu perfil nem o histórico.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
