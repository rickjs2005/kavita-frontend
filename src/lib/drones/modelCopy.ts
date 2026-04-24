// Conteúdo editorial e helpers de specs dos modelos DJI Agras.
//
// Fonte única de verdade para a landing /drones (cards) e para as
// páginas de detalhe /drones/[id] (hero + métricas). Mantém ambas
// coerentes: mesma tagline, mesma descrição, mesmo fallback quando
// o admin não preencheu specs suficientes.

export type ModelBenefit = { label: string; value: string };

export type ModelCopy = {
  badge: string;
  tagline: string;
  description: string;
  longDescription: string;
  benefits: ModelBenefit[];
};

export const MODEL_COPY: Record<string, ModelCopy> = {
  t25p: {
    badge: "Versátil",
    tagline: "Pulverização precisa para relevos variados",
    description:
      "Ideal para propriedades menores, agricultura familiar e áreas com relevo irregular. Compacto, cabe na picape e voa em qualquer talhão.",
    longDescription:
      "O T25P é o drone certo para quem está começando ou opera em áreas até ~300 ha com talhões recortados. Compacto o suficiente para transporte em picape comum, potente o suficiente para cobrir um dia cheio de voo com troca ágil de baterias.",
    benefits: [
      { label: "Operação", value: "Compacta" },
      { label: "Precisão", value: "Alta" },
      { label: "Manejo", value: "Ágil" },
    ],
  },
  t70p: {
    badge: "Alta Performance",
    tagline: "Mais hectares por dia sem perder precisão",
    description:
      "Para quem precisa cobrir mais área na janela de safra com economia de insumos. Produtividade elevada e vazão estável.",
    longDescription:
      "O T70P equilibra carga, autonomia e deslocamento para quem opera entre 300 e 800 ha por safra. É o modelo preferido de prestadores de serviço de médio porte — cobre mais hectares por jornada sem abrir mão da precisão por mapa.",
    benefits: [
      { label: "Capacidade", value: "70 kg" },
      { label: "Autonomia", value: "Longa" },
      { label: "Economia", value: "Insumos" },
    ],
  },
  t100: {
    badge: "Potência Máxima",
    tagline: "Máximo desempenho para operações intensas",
    description:
      "Desenhado para grandes lavouras, cooperativas e prestadores de serviço de alta vazão. Carga, alcance e tecnologia no topo da linha.",
    longDescription:
      "O T100 é o topo da linha DJI Agras. Feito para cooperativas, grandes produtores e prestadores de serviço que cobrem 800+ ha por safra. Carga máxima, vazão máxima e tecnologia de ponta para operação intensiva com margem operacional apertada.",
    benefits: [
      { label: "Capacidade", value: "100 kg" },
      { label: "Vazão", value: "Máxima" },
      { label: "Alcance", value: "Amplo" },
    ],
  },
};

export const MODEL_COPY_DEFAULT: ModelCopy = {
  badge: "Drone agrícola DJI Agras",
  tagline: "Pulverização com tecnologia DJI",
  description:
    "Fale com um representante para conhecer especificações e adequação à sua propriedade.",
  longDescription:
    "A Kavita é representante autorizada DJI Agras no Brasil. Fale com o representante regional para escolher o modelo que se encaixa na sua operação.",
  benefits: [
    { label: "Precisão", value: "DJI" },
    { label: "Suporte", value: "Regional" },
    { label: "Tecnologia", value: "Agras" },
  ],
};

export function getModelCopy(key: string): ModelCopy {
  return MODEL_COPY[String(key || "").toLowerCase()] ?? MODEL_COPY_DEFAULT;
}

// ─── Helpers de specs (extraídos do admin) ──────────────────────────

export type SpecsGroup = { title?: string; items?: string[] };

// Limites para aceitar um spec como "apresentável" em mini-card:
// rótulo curto + valor curto, separados por ":".
export const SPEC_LABEL_MAX = 22;
export const SPEC_VALUE_MAX = 22;

/**
 * Achata todos os grupos e retorna specs no formato "Rótulo: valor"
 * que caibam bem em mini-cards de 3 colunas. Specs descritivos de
 * manual técnico (sem ":" ou com label/valor longos) são rejeitados
 * silenciosamente — quem chama decide se cai em fallback.
 */
export function extractKeySpecs(
  specsItemsJson: SpecsGroup[] | null | undefined,
  max = 3,
): string[] {
  if (!specsItemsJson || !Array.isArray(specsItemsJson)) return [];

  const accepted: string[] = [];
  for (const group of specsItemsJson) {
    if (!group?.items) continue;
    for (const item of group.items) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      if (!trimmed) continue;

      const colonIdx = trimmed.indexOf(":");
      if (colonIdx <= 0) continue;

      const label = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();

      if (!label || label.length > SPEC_LABEL_MAX) continue;
      if (!value || value.length > SPEC_VALUE_MAX) continue;

      accepted.push(trimmed);
    }
  }
  if (!accepted.length) return [];

  // Termos comerciais entram primeiro — são os que o cliente busca.
  const priorityRe =
    /capacidade|tanque|vaz[ãa]o|largura|velocidade|autonomia|hectare/i;
  const priority = accepted.filter((s) => priorityRe.test(s));
  const rest = accepted.filter((s) => !priorityRe.test(s));

  return [...priority, ...rest].slice(0, max);
}

/** Divide "Rótulo: valor" em { label, value } — assume formato válido. */
export function splitSpec(s: string): { label: string; value: string } {
  const idx = s.indexOf(":");
  if (idx > 0) {
    return {
      label: s.slice(0, idx).trim(),
      value: s.slice(idx + 1).trim(),
    };
  }
  return { label: "Spec", value: s.trim() };
}
