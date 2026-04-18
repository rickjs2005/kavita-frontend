// src/app/painel/corretora/leads/[id]/page.tsx
import LeadDetailClient from "./LeadDetailClient";

export const metadata = {
  title: "Lead | Painel da Corretora",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
        ID de lead inválido.
      </div>
    );
  }
  return <LeadDetailClient leadId={leadId} />;
}
