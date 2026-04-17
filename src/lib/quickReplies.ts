// src/lib/quickReplies.ts
//
// Templates de resposta rápida via WhatsApp (Sprint 6 — Onda 2).
// Reduz o esforço de responder um lead de "digitar do zero" para
// "clicar no template certo e mandar". A renderização faz a
// substituição de variáveis e descarta linhas cujas variáveis não
// existem no contexto do lead (graceful degradation).
//
// Defaults cobrem as 4 situações mais frequentes na Zona da Mata:
// primeiro contato, pedido de amostra, cotação do dia, agendar visita.
// Customização por corretora (tabela dedicada) fica para polish
// posterior — o frontend ficará reativo a lista vinda do backend
// quando essa tabela existir; por enquanto consome só os defaults.

import type { CorretoraLead } from "@/types/lead";
import { TIPOS_CAFE, VOLUMES_LEAD } from "@/lib/regioes";

export type QuickReplyTemplate = {
  /** Identificador estável — usado em key e em analytics. */
  id: string;
  /** Texto curto mostrado no dropdown. */
  label: string;
  /** Pista do contexto (ex.: "primeiro contato após lead chegar"). */
  hint?: string;
  /**
   * Mensagem multilinha. Cada linha pode conter `{variável}`. Sintaxe:
   *   - `?:TEXTO`  → linha CONDICIONAL. Aparece só se todas as
   *                  variáveis declaradas tiverem valor; caso contrário
   *                  é descartada.
   *   - `:/TEXTO`  → linha FALLBACK. Aparece APENAS se a linha
   *                  condicional imediatamente anterior foi descartada.
   *                  Permite frase alternativa quando o campo faltou.
   *   - `TEXTO`    → linha comum. Sempre aparece; variáveis vazias
   *                  simplesmente somem (útil para sufixos opcionais).
   *
   * Exemplo:
   *   "Olá {nome}!"                    ← sempre
   *   "?:Vi que você é de {cidade}."   ← só se cidade tem valor
   *   ":/Onde vocêy planta?"           ← só se a de cima caiu
   *   "...café{sufixo_opcional}."      ← fica "...café." sem sufixo
   */
  body: string;
};

const CONDITIONAL_PREFIX = "?:";
const FALLBACK_PREFIX = ":/";

// ---------------------------------------------------------------------------
// Catálogo de defaults
// ---------------------------------------------------------------------------

export const DEFAULT_QUICK_REPLIES: QuickReplyTemplate[] = [
  {
    id: "primeiro_contato",
    label: "Primeiro contato",
    hint: "Apresentação logo após o lead chegar",
    body: [
      "Olá {nome}, aqui é da {corretora}.",
      "Recebi seu interesse pelo Kavita · Mercado do Café.",
      "?:Vi que você é de {cidade}.",
      "?:Vi que você falou do córrego {corrego}.",
      "Podemos conversar sobre seu café?",
    ].join("\n"),
  },
  {
    id: "pedir_amostra",
    label: "Pedir amostra",
    hint: "Combina retirada/entrega da amostra física",
    body: [
      "Olá {nome}, tudo bem?",
      "Para dar sequência, preciso de uma amostra do seu café{quantidade_sufixo}.",
      "?:Consegue nos enviar nesta semana? Posso passar na {corrego} se preferir combinar aí.",
      // Fallback sem córrego: mensagem ainda pede amostra, só não menciona lugar específico
      "Consegue nos enviar nesta semana?",
    ].join("\n"),
  },
  {
    id: "cotacao_dia",
    label: "Cotação do dia",
    hint: "Envia preço de referência atual",
    body: [
      "Olá {nome},",
      "?:Segue a cotação de hoje para o café {tipo_cafe_lc}.",
      // Fallback quando tipo_cafe não foi declarado
      "Segue a cotação de hoje para o café arábica.",
      "?:Referente ao volume de {volume}: posso fechar nesse patamar.",
      "Se fizer sentido, me confirma e já envio os próximos passos.",
    ].join("\n"),
  },
  {
    id: "agendar_visita",
    label: "Agendar visita",
    hint: "Propõe ir até a propriedade",
    body: [
      "Olá {nome},",
      "Quero conhecer seu café de perto.",
      "?:Posso passar na {corrego} esta semana, combina?",
      // Fallback sem córrego
      "Posso passar esta semana, combina?",
      "Me diga qual o melhor dia — levo balança e preço atualizado.",
    ].join("\n"),
  },
];

// Linhas-par contraditórias: quando a versão condicional está presente,
// a versão fallback deve sumir. Identificadas por markers sentinelas
// no template acima — as duplicatas resolvem-se via dedupe exato após
// o render (a primeira versão válida vence).
// Padrão atual usa o fallback como "sempre renderiza, mas fica duplicado
// se a condicional também renderizar" — detectamos no render via
// comparação de linhas normalizadas.

// ---------------------------------------------------------------------------
// Render de variáveis
// ---------------------------------------------------------------------------

const LABEL_TIPO_CAFE = new Map(TIPOS_CAFE.map((t) => [t.value, t.label]));
const LABEL_VOLUME = new Map(VOLUMES_LEAD.map((v) => [v.value, v.label]));

/** Contexto injetado no template. Nome/corretora são obrigatórios; o resto é best-effort. */
export type QuickReplyContext = {
  lead: Pick<
    CorretoraLead,
    "nome" | "cidade" | "corrego_localidade" | "tipo_cafe" | "volume_range"
  >;
  corretoraNome: string;
};

/** Constrói o map de variáveis com os rótulos legíveis da lead. */
function buildVariables(ctx: QuickReplyContext): Record<string, string> {
  const { lead, corretoraNome } = ctx;
  const tipoCafeLabel = lead.tipo_cafe
    ? LABEL_TIPO_CAFE.get(lead.tipo_cafe) ?? null
    : null;
  const volumeLabel = lead.volume_range
    ? LABEL_VOLUME.get(lead.volume_range) ?? null
    : null;

  return {
    nome: lead.nome?.trim() ?? "",
    corretora: corretoraNome?.trim() ?? "",
    cidade: lead.cidade?.trim() ?? "",
    corrego: lead.corrego_localidade?.trim() ?? "",
    tipo_cafe: tipoCafeLabel ?? "",
    // "arábica especial" em minúsculo fica mais natural no meio da frase
    tipo_cafe_lc: tipoCafeLabel ? tipoCafeLabel.toLowerCase() : "",
    volume: volumeLabel ?? "",
    // Sufixo contextualizado para "Pedir amostra" — aparece só quando
    // há volume declarado. Formato " de ~X sacas" com espaço na frente.
    quantidade_sufixo: volumeLabel ? ` (~${volumeLabel})` : "",
  };
}

/** Substitui `{var}` e `{var_lc}` pelas strings do contexto. */
function substitute(line: string, vars: Record<string, string>): {
  text: string;
  missing: string[];
} {
  const missing: string[] = [];
  const text = line.replace(/\{([a-z_]+)\}/g, (_, name: string) => {
    const value = vars[name];
    if (value == null || value === "") {
      missing.push(name);
      return "";
    }
    return value;
  });
  return { text, missing };
}

/**
 * Renderiza o template para um lead. Descarta linhas cujas variáveis
 * declaradas ficaram vazias (ex.: lead sem córrego → a linha que
 * menciona {corrego} some em vez de virar "Vi que você falou do córrego .").
 *
 * Preserva linhas sem variáveis (saudação, rodapé) sempre.
 */
export function renderQuickReply(
  template: QuickReplyTemplate,
  ctx: QuickReplyContext,
): string {
  const vars = buildVariables(ctx);
  const lines = template.body.split("\n");
  const rendered: string[] = [];

  // Trackea se a última linha condicional foi aceita ou descartada —
  // para decidir se o fallback seguinte deve aparecer.
  let lastConditionalDropped = false;
  let lastWasConditional = false;

  for (const raw of lines) {
    let line = raw;
    let kind: "plain" | "conditional" | "fallback" = "plain";

    if (line.startsWith(CONDITIONAL_PREFIX)) {
      kind = "conditional";
      line = line.slice(CONDITIONAL_PREFIX.length);
    } else if (line.startsWith(FALLBACK_PREFIX)) {
      kind = "fallback";
      line = line.slice(FALLBACK_PREFIX.length);
    }

    // Fallback só roda quando a última condicional caiu. Fora desse
    // contexto, fallback é sempre descartado (segurança contra uso
    // errado do prefixo).
    if (kind === "fallback") {
      const shouldEmit = lastWasConditional && lastConditionalDropped;
      lastWasConditional = false;
      lastConditionalDropped = false;
      if (!shouldEmit) continue;
      // Renderiza fallback como linha comum.
      const { text } = substitute(line, vars);
      const cleaned = text.replace(/ {2,}/g, " ").trim();
      if (cleaned.length > 0) rendered.push(cleaned);
      continue;
    }

    const { text, missing } = substitute(line, vars);
    const cleaned = text.replace(/ {2,}/g, " ").trim();

    if (kind === "conditional") {
      const hasAllVars = missing.length === 0;
      lastWasConditional = true;
      lastConditionalDropped = !hasAllVars;
      if (hasAllVars && cleaned.length > 0) rendered.push(cleaned);
      continue;
    }

    // plain — sempre aparece se não vazio. Reseta rastreio condicional.
    lastWasConditional = false;
    lastConditionalDropped = false;
    if (cleaned.length > 0) rendered.push(cleaned);
  }

  return rendered.join("\n");
}

/**
 * URL WhatsApp pronta para abrir em nova aba. `telefone` entra em
 * digits-only; se vazio, retorna null para o caller decidir.
 */
export function buildWhatsAppUrl(
  telefone: string | null | undefined,
  renderedMessage: string,
): string | null {
  const digits = String(telefone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Se já tem DDI 55, mantém; senão prefixa.
  const withDdi = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withDdi}?text=${encodeURIComponent(renderedMessage)}`;
}
