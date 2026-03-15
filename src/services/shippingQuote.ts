// src/services/shippingQuote.ts
// Serviço de cotação de frete.
// Usa apiClient para garantir credentials condicionais e parse seguro.
// Valida a resposta com ShippingQuoteSchema antes de retornar dados ao caller.

import apiClient from "@/lib/apiClient";
import { ShippingQuoteSchema, strictParse } from "@/lib/schemas/api";
import type { ShippingQuote } from "@/lib/schemas/api";

export type { ShippingQuote };

export async function fetchShippingQuote(args: {
  cep: string;
  items: Array<{ id: number; quantidade: number }>;
}): Promise<ShippingQuote> {
  const cepDigits = String(args.cep || "").replace(/\D/g, "");
  if (cepDigits.length !== 8) throw new Error("CEP inválido");

  const items = (args.items || [])
    .map((i) => ({ id: Number(i.id), quantidade: Number(i.quantidade) }))
    .filter(
      (i) =>
        Number.isFinite(i.id) &&
        i.id > 0 &&
        Number.isFinite(i.quantidade) &&
        i.quantidade > 0,
    );

  if (!items.length) throw new Error("Carrinho vazio");

  const qs =
    `?cep=${encodeURIComponent(cepDigits)}` +
    `&items=${encodeURIComponent(JSON.stringify(items))}`;

  // apiClient.get já garante: parse seguro, erro padronizado (ApiError), sem credentials
  // para /api (condicional no client — GET público não precisa, mas não prejudica).
  const raw = await apiClient.get<unknown>(`/api/shipping/quote${qs}`, {
    // Frete é público — não precisa de cache do browser
    cache: "no-store" as RequestCache,
  } as Parameters<typeof apiClient.get>[1]);

  // Valida schema: rejeita preço inválido, NaN, Infinity, campos ausentes.
  // strictParse lança SchemaError se falhar — não retorna 0 silenciosamente.
  return strictParse(ShippingQuoteSchema, raw, "shipping/quote");
}
