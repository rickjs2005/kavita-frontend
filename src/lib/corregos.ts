// src/lib/corregos.ts
//
// Mirror frontend do catálogo de `lib/corregosEspeciais.js` no backend,
// acrescido de cidade-específicos. O backend usa a lista plana para
// heurística de prioridade; o frontend precisa dela para sugestão
// contextualizada por cidade no LeadContactForm.
//
// Estratégia: termos gerais sempre aparecem (Serra do Brigadeiro,
// Matas de Minas etc.); termos cidade-específicos (contêm nome da
// cidade) aparecem só quando a cidade bate.
//
// Manutenção: adicionar aqui + em kavita-backend/lib/corregosEspeciais.js
// para manter prioridade consistente entre sugestão e detecção.

import { normalizeCityName } from "@/lib/regioes";

// Termos universais reconhecidos como café especial. Subset do backend.
const TERMOS_GERAIS = [
  "Pedra Bonita",
  "Boa Vista",
  "Patrimônio",
  "Serra do Brigadeiro",
  "Serrinha",
  "Fazenda Velha",
  "Santa Rita",
  "Monte Verde",
];

// Termos fortemente associados a uma cidade. Chave é o slug
// (normalizeCityName aplica lowercase + remove acentos).
const TERMOS_POR_CIDADE: Record<string, string[]> = {
  manhuacu: ["Alto Manhuaçu"],
  "santana do manhuacu": ["Alto Manhuaçu"],
  caparao: ["Alto Caparaó"],
  manhumirim: [],
  reduto: [],
  simonesia: [],
  lajinha: [],
  matipo: [],
  "alto jequitiba": [],
  "alto caparao": [],
};

/**
 * Sugestões para o datalist do input `corrego_localidade`. Combina
 * termos gerais com os cidade-específicos. Dedupe case-insensitive.
 *
 * Ordem: cidade-específicos primeiro (mais relevantes), depois gerais.
 * Se a cidade for desconhecida, só gerais.
 */
export function getCorregosSugeridos(cidade?: string | null): string[] {
  const key = cidade ? normalizeCityName(cidade) : "";
  const specific = TERMOS_POR_CIDADE[key] ?? [];
  const combined = [...specific, ...TERMOS_GERAIS];

  // Dedupe preservando ordem. Compara case-insensitive para evitar
  // duplicata como "Alto Caparaó" vs "alto caparao".
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of combined) {
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}
