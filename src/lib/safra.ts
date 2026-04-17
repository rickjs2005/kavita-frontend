// src/lib/safra.ts
//
// Calendário da safra de café arábica no Brasil (hemisfério sul).
// A colheita concentra-se de **maio a setembro**, com pico entre junho
// e agosto na Zona da Mata mineira. Fora dessa janela, o café que o
// produtor oferece é tipicamente remanescente (estoque).
//
// Uso principal: pré-selecionar `safra_tipo` no LeadContactForm. Não
// força o valor — só evita o campo em branco no caso mais provável,
// sinalizando que o Kavita entende o momento do mercado.
//
// Fonte única de verdade para essa heurística. Se a regra mudar
// (ex.: Conilon tem safra diferente), parametrize aqui.

import type { SafraTipo } from "@/types/lead";

// Meses são 0-indexed: maio = 4, setembro = 8.
const SAFRA_START_MONTH = 4;
const SAFRA_END_MONTH = 8;

/**
 * Retorna o tipo de safra provável para uma data arbitrária. Em dev
 * e teste passa-se a Date; em produção o caller usa new Date().
 */
export function getSafraTipoForDate(date: Date): SafraTipo {
  const month = date.getMonth();
  if (month >= SAFRA_START_MONTH && month <= SAFRA_END_MONTH) {
    return "atual";
  }
  return "remanescente";
}

/** Shortcut de produção — usa a data corrente. */
export function getCurrentSafraTipo(): SafraTipo {
  return getSafraTipoForDate(new Date());
}
