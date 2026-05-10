// src/components/news/WhatsappStatusPanel.tsx
//
// Painel de status reutilizado pelas paginas publicas /news/confirmar e
// /news/sair. Mantem o visual dark glass premium do /news.
//
// Estados visuais:
//   loading  — spinner emerald + msg neutra
//   success  — accent emerald (canal ativo / saida confirmada)
//   info     — accent stone (ja era o estado, ex: ja confirmado / ja desinscrito)
//   error    — accent rose
//   warning  — accent amber (ex: token em opt-out, exige acao manual)

import Link from "next/link";

export type WhatsappStatusKind = "loading" | "success" | "info" | "warning" | "error";

const TONE: Record<
  WhatsappStatusKind,
  { ring: string; chipBg: string; chipText: string; iconBg: string; iconText: string; icon: string }
> = {
  loading: {
    ring: "ring-emerald-400/30",
    chipBg: "bg-emerald-500/10",
    chipText: "text-emerald-300",
    iconBg: "bg-emerald-500/15 ring-emerald-400/30",
    iconText: "text-emerald-300",
    icon: "...",
  },
  success: {
    ring: "ring-emerald-400/40",
    chipBg: "bg-emerald-500/10",
    chipText: "text-emerald-300",
    iconBg: "bg-emerald-500/20 ring-emerald-400/40",
    iconText: "text-emerald-300",
    icon: "✓",
  },
  info: {
    ring: "ring-white/15",
    chipBg: "bg-white/[0.06]",
    chipText: "text-stone-300",
    iconBg: "bg-stone-700/60 ring-white/10",
    iconText: "text-stone-200",
    icon: "·",
  },
  warning: {
    ring: "ring-amber-400/30",
    chipBg: "bg-amber-500/10",
    chipText: "text-amber-300",
    iconBg: "bg-amber-500/20 ring-amber-400/30",
    iconText: "text-amber-300",
    icon: "!",
  },
  error: {
    ring: "ring-rose-400/30",
    chipBg: "bg-rose-500/10",
    chipText: "text-rose-300",
    iconBg: "bg-rose-500/20 ring-rose-400/30",
    iconText: "text-rose-300",
    icon: "!",
  },
};

export type WhatsappStatusPanelProps = {
  kind: WhatsappStatusKind;
  /** Tag pequena no topo (uppercase, espaçada). */
  badge: string;
  /** Headline grande. */
  title: string;
  /** Texto explicativo abaixo do título. */
  description?: string;
  /** Lista opcional de bullets (ex: próximos passos). */
  details?: string[];
  /** Ação primária (CTA). */
  primaryAction?: { label: string; href: string };
  /** Ação secundária (link). */
  secondaryAction?: { label: string; href: string };
};

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent"
    />
  );
}

export function WhatsappStatusPanel({
  kind,
  badge,
  title,
  description,
  details,
  primaryAction,
  secondaryAction,
}: WhatsappStatusPanelProps) {
  const tone = TONE[kind];
  const isLoading = kind === "loading";

  return (
    <main
      className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {/* Atmospheric layer — copia leve do /news para consistencia visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.07] blur-3xl kavita-drift-a" />
        <div className="absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-sky-500/[0.05] blur-3xl kavita-drift-b" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.5)_85%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-16 md:px-6 md:py-24">
        <article
          className={`relative w-full overflow-hidden rounded-3xl bg-white/[0.04] p-8 ring-1 backdrop-blur-sm md:p-12 ${tone.ring}`}
        >
          {/* Hairline no topo */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
          />

          {/* Icone / spinner */}
          <div
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full ring-1 ${tone.iconBg} ${tone.iconText}`}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <span aria-hidden className="text-xl font-bold leading-none">
                {tone.icon}
              </span>
            )}
          </div>

          {/* Badge */}
          <div className="mt-6">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ring-white/10 ${tone.chipBg} ${tone.chipText}`}
            >
              {badge}
            </span>
          </div>

          {/* Titulo */}
          <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-stone-50 md:text-3xl">
            {title}
          </h1>

          {/* Descricao */}
          {description && (
            <p className="mt-3 text-base leading-relaxed text-stone-300">
              {description}
            </p>
          )}

          {/* Detalhes (bullets) */}
          {details && details.length > 0 && (
            <ul className="mt-5 space-y-2 text-sm text-stone-300">
              {details.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTAs */}
          {(primaryAction || secondaryAction) && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {primaryAction && (
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-emerald-500/30 transition-all hover:shadow-emerald-500/50 hover:brightness-110"
                >
                  {primaryAction.label}
                  <span aria-hidden>→</span>
                </Link>
              )}
              {secondaryAction && (
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-200 ring-1 ring-white/[0.08] backdrop-blur-sm transition-all hover:bg-white/[0.07] hover:ring-white/20"
                >
                  {secondaryAction.label}
                </Link>
              )}
            </div>
          )}

          {/* Footer minimal — assinatura institucional */}
          <p className="mt-8 border-t border-white/[0.06] pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Kavita News · Central de Inteligência do Agro
          </p>
        </article>
      </div>
    </main>
  );
}
