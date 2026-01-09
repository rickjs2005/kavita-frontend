export type ShippingQuote = {
  price: number;
  prazo_dias: number | null;
  is_free?: boolean;
  ruleApplied?: "PRODUCT_FREE" | "ZONE" | "CEP_RANGE" | "PICKUP";
  zone?: any;
  freeItems?: Array<{ id: number; quantidade: number }>;
  cep?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchShippingQuote(args: {
  cep: string;
  items: Array<{ id: number; quantidade: number }>;
}): Promise<ShippingQuote> {
  const cepDigits = String(args.cep || "").replace(/\D/g, "");
  if (cepDigits.length !== 8) throw new Error("CEP inválido");

  const items = (args.items || [])
    .map((i) => ({ id: Number(i.id), quantidade: Number(i.quantidade) }))
    .filter((i) => Number.isFinite(i.id) && i.id > 0 && Number.isFinite(i.quantidade) && i.quantidade > 0);

  if (!items.length) throw new Error("Carrinho vazio");

  const url =
    `${API_BASE}/api/shipping/quote` +
    `?cep=${encodeURIComponent(cepDigits)}` +
    `&items=${encodeURIComponent(JSON.stringify(items))}`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const text = await res.text();

  if (!res.ok) {
    // backend pode mandar JSON com message; aqui mantemos robusto
    try {
      const j = JSON.parse(text);
      throw new Error(j?.message || `Falha ao cotar frete (${res.status}).`);
    } catch {
      throw new Error(text || `Falha ao cotar frete (${res.status}).`);
    }
  }

  const data = JSON.parse(text);
  // route retorna { success: true, ...quote } :contentReference[oaicite:3]{index=3}
  return {
    price: Number(data?.price || 0),
    prazo_dias: data?.prazo_dias === null || data?.prazo_dias === undefined ? null : Number(data.prazo_dias),
    is_free: Boolean(data?.is_free),
    ruleApplied: data?.ruleApplied,
    zone: data?.zone,
    freeItems: data?.freeItems,
    cep: data?.cep,
  };
}
