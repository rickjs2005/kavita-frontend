// src/utils/kavita-news/categoryColors.ts
//
// Mapa de cores das categorias editoriais do Kavita News.
// Cada categoria ganha um tom semantico que aparece nas tags coloridas
// dos cards "Destaques do dia" e nos seletores futuros do admin.
//
// As cores ficam alinhadas com o restante do dark theme: tons saturados
// porem 100-200 (visiveis sobre fundo escuro), com background semi-transparente
// e ring para dar profundidade no glass.

export type NewsCategoryKey =
  | "mercado"
  | "clima"
  | "exportacao"
  | "tecnologia"
  | "drones"
  | "cafe"
  | "pecuaria"
  | "geral";

type CategoryStyle = {
  /** Label final exibido (capitalizado, sem acento perdido). */
  label: string;
  /** Classes Tailwind do chip — bg + text + ring. */
  chip: string;
  /** Tom do dot/ponto luminoso (shadow style emerald-style). */
  dot: string;
};

const STYLES: Record<NewsCategoryKey, CategoryStyle> = {
  mercado: {
    label: "Mercado",
    chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
  },
  clima: {
    label: "Clima",
    chip: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]",
  },
  exportacao: {
    label: "Exportação",
    chip: "bg-indigo-500/15 text-indigo-300 ring-indigo-400/30",
    dot: "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]",
  },
  tecnologia: {
    label: "Tecnologia",
    chip: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
    dot: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]",
  },
  drones: {
    label: "Drones",
    chip: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
    dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]",
  },
  cafe: {
    label: "Café",
    chip: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  },
  pecuaria: {
    label: "Pecuária",
    chip: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]",
  },
  geral: {
    label: "Geral",
    chip: "bg-white/[0.06] text-stone-300 ring-white/10",
    dot: "bg-stone-400 shadow-[0_0_8px_rgba(168,162,158,0.5)]",
  },
};

function normalize(input?: string | null): NewsCategoryKey {
  if (!input) return "geral";
  const s = input
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

  if (!s) return "geral";

  // Aceita variações comuns: "mercado", "Mercado", "MERCADO", "preços", etc.
  if (s.includes("merc") || s.includes("preco") || s.includes("cotac"))
    return "mercado";
  if (s.includes("clima") || s.includes("chuva") || s.includes("tempo"))
    return "clima";
  if (s.includes("export") || s.includes("import") || s.includes("dolar"))
    return "exportacao";
  if (s.includes("tec") || s.includes("inova") || s.includes("digital"))
    return "tecnologia";
  if (s.includes("drone") || s.includes("aero")) return "drones";
  if (s.includes("cafe") || s.includes("coffee") || s.includes("arabic"))
    return "cafe";
  if (
    s.includes("pec") ||
    s.includes("boi") ||
    s.includes("gado") ||
    s.includes("carne") ||
    s.includes("leite")
  )
    return "pecuaria";

  return "geral";
}

export function getCategoryStyle(input?: string | null): CategoryStyle {
  return STYLES[normalize(input)];
}

export function getCategoryLabel(input?: string | null): string {
  return STYLES[normalize(input)].label;
}
