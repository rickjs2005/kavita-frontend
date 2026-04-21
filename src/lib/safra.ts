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

/**
 * Rótulo da safra comercial ativa. Safra de café no hemisfério sul
 * cruza virada de ano — "2025/26" significa colhida a partir de maio
 * de 2025 e comercializada até abril de 2026. Antes de maio, o ano
 * corrente ainda é o "final" da safra anterior.
 *
 * Garante sempre 2 dígitos no segundo ano (nunca "2025/6").
 *
 * @example
 *   formatSafraAtualLabel(new Date("2026-04-20")) // "SAFRA 2025/26"
 *   formatSafraAtualLabel(new Date("2026-06-15")) // "SAFRA 2026/27"
 */
export function formatSafraAtualLabel(date: Date = new Date()): string {
  const year = date.getFullYear();
  // getMonth é 0-indexed. Antes de maio (índice 4) ainda é safra anterior.
  const isPreHarvest = date.getMonth() < SAFRA_START_MONTH;
  const startYear = isPreHarvest ? year - 1 : year;
  const endShort = String((startYear + 1) % 100).padStart(2, "0");
  return `SAFRA ${startYear}/${endShort}`;
}
