// src/components/mercado-do-cafe/MercadoCafeCTA.tsx
import Link from "next/link";

type Props = {
  title?: string;
  description?: string;
  href?: string;
  buttonLabel?: string;
};

export function MercadoCafeCTA({
  title = "Quer vender seu café pelo melhor preço?",
  description = "Encontre corretoras de café que atuam na Zona da Mata mineira. Compare, conheça e entre em contato diretamente.",
  href = "/mercado-do-cafe/corretoras",
  buttonLabel = "Ver Corretoras",
}: Props) {
  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 md:p-6"
      aria-label="Mercado do Café"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-zinc-900">
            ☕ {title}
          </p>
          <p className="mt-1 text-sm text-zinc-600 leading-relaxed max-w-lg">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          {buttonLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
