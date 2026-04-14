// src/app/mercado-do-cafe/lote-vendido/[id]/[token]/page.tsx
//
// Sprint 7 — Página pública de confirmação de "lote vendido".
// Acessada via link único enviado pela corretora ao produtor
// (via WhatsApp/email). HMAC token é validado no backend.
import LoteVendidoClient from "./LoteVendidoClient";

export const metadata = {
  title: "Confirmar lote vendido | Kavita · Mercado do Café",
  robots: { index: false, follow: false },
};

export default async function LoteVendidoPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;
  return <LoteVendidoClient id={id} token={token} />;
}
