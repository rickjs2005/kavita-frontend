// src/app/mercado-do-cafe/lead-status/[id]/[token]/page.tsx
//
// Sprint 7 — Página pública de consulta do status do lead pelo
// produtor. Link único enviado no e-mail de confirmação após o
// envio do LeadContactForm. Token HMAC determinístico (sem DB).
//
// noindex: link privado. Embora o HMAC proteja o conteúdo, deixar
// indexado no Google seria ruído pra SEO e estranho de ver no SERP.

import LeadStatusClient from "./LeadStatusClient";

export const metadata = {
  title: "Acompanhar meu contato | Kavita · Mercado do Café",
  robots: { index: false, follow: false },
};

export default async function LeadStatusPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;
  return <LeadStatusClient id={id} token={token} />;
}
