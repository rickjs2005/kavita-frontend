// Paleta de accent por modelo — reutilizada entre o card da landing
// e as páginas de detalhe /drones/[id]. Mantém coerência visual:
//   Cyan    → T25P (versatilidade, tecnologia leve)
//   Emerald → T70P (agro, produtividade)
//   Amber   → T100 (potência, premium)

export type Accent = {
  key: "t25p" | "t70p" | "t100" | "default";
  label: string;
  ring: string;
  glow: string;
  text: string;
  textSoft: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dot: string;
  primaryGradient: string;
  primaryShadow: string;
  halo: string;
  shadowRgb: string;
};

const ACCENTS: Record<string, Accent> = {
  t25p: {
    key: "t25p",
    label: "cyan",
    ring: "border-cyan-400/25",
    glow: "from-cyan-500/20 via-sky-500/10 to-transparent",
    text: "text-cyan-300",
    textSoft: "text-cyan-200/90",
    badgeBg: "bg-cyan-500/15",
    badgeBorder: "border-cyan-400/30",
    badgeText: "text-cyan-200",
    dot: "bg-cyan-400",
    primaryGradient: "from-cyan-500 via-sky-400 to-teal-400",
    primaryShadow: "shadow-[0_18px_60px_-22px_rgba(34,211,238,0.9)]",
    halo: "bg-cyan-500/12",
    shadowRgb: "34,211,238",
  },
  t70p: {
    key: "t70p",
    label: "emerald",
    ring: "border-emerald-400/25",
    glow: "from-emerald-500/20 via-teal-500/10 to-transparent",
    text: "text-emerald-300",
    textSoft: "text-emerald-200/90",
    badgeBg: "bg-emerald-500/15",
    badgeBorder: "border-emerald-400/30",
    badgeText: "text-emerald-200",
    dot: "bg-emerald-400",
    primaryGradient: "from-emerald-500 via-emerald-400 to-teal-400",
    primaryShadow: "shadow-[0_18px_60px_-22px_rgba(16,185,129,0.9)]",
    halo: "bg-emerald-500/12",
    shadowRgb: "16,185,129",
  },
  t100: {
    key: "t100",
    label: "amber",
    ring: "border-amber-400/25",
    glow: "from-amber-500/20 via-orange-500/10 to-transparent",
    text: "text-amber-300",
    textSoft: "text-amber-200/90",
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-400/30",
    badgeText: "text-amber-200",
    dot: "bg-amber-400",
    primaryGradient: "from-amber-500 via-orange-400 to-amber-400",
    primaryShadow: "shadow-[0_18px_60px_-22px_rgba(251,191,36,0.9)]",
    halo: "bg-amber-500/12",
    shadowRgb: "251,191,36",
  },
};

const DEFAULT_ACCENT: Accent = {
  key: "default",
  label: "slate",
  ring: "border-white/10",
  glow: "from-slate-500/15 via-slate-500/5 to-transparent",
  text: "text-slate-200",
  textSoft: "text-slate-200/80",
  badgeBg: "bg-slate-500/15",
  badgeBorder: "border-slate-400/30",
  badgeText: "text-slate-200",
  dot: "bg-slate-400",
  primaryGradient: "from-emerald-500 via-emerald-400 to-teal-400",
  primaryShadow: "shadow-[0_18px_60px_-25px_rgba(16,185,129,0.95)]",
  halo: "bg-white/5",
  shadowRgb: "148,163,184",
};

export function getAccent(key: string): Accent {
  return ACCENTS[String(key || "").toLowerCase()] ?? DEFAULT_ACCENT;
}
