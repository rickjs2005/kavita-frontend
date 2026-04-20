// src/server/data/verificarContrato.ts
//
// Server-only fetcher da página pública de verificação de contrato.
// O endpoint devolve projeção segura (sem telefone, e-mail ou valores).
// Nunca use este módulo em Client Components.
import "server-only";

import type { ContratoPublico } from "@/types/contrato";

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

// UUID v4 canônico — precaução extra além do que o backend faz.
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchContratoPublico(
  token: string,
): Promise<ContratoPublico | null> {
  if (!UUID_V4_RE.test(token)) return null;

  const base = String(API_BASE).replace(/\/$/, "");
  const url = `${base}/api/public/verificar-contrato/${encodeURIComponent(token)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      // Contrato assinado é imutável — revalidate curto é suficiente
      // para refletir mudanças de status (sent → signed).
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
  } catch {
    return null;
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    // Erros não-404 não devem derrubar a página — renderiza estado
    // de "indisponível" com retry.
    return null;
  }

  const body = (await res.json().catch(() => null)) as
    | { ok: boolean; data: ContratoPublico }
    | null;

  if (!body?.ok || !body?.data) return null;
  return body.data;
}
