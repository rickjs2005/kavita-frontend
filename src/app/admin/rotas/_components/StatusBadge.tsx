import type { ParadaStatus, RotaStatus } from "@/lib/rotas/types";

const ROTA_STYLES: Record<RotaStatus, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-gray-700 text-gray-200" },
  pronta: { label: "Pronta", cls: "bg-amber-600/30 text-amber-300 ring-1 ring-amber-500/30" },
  em_rota: { label: "Em rota", cls: "bg-emerald-600/30 text-emerald-300 ring-1 ring-emerald-500/30" },
  finalizada: { label: "Finalizada", cls: "bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/30" },
  cancelada: { label: "Cancelada", cls: "bg-rose-600/30 text-rose-300 ring-1 ring-rose-500/30" },
};

const PARADA_STYLES: Record<ParadaStatus, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-gray-700 text-gray-200" },
  em_andamento: { label: "Em andamento", cls: "bg-amber-600/30 text-amber-300" },
  entregue: { label: "Entregue", cls: "bg-emerald-600/30 text-emerald-300" },
  problema: { label: "Problema", cls: "bg-rose-600/30 text-rose-300" },
  reagendado: { label: "Reagendado", cls: "bg-purple-600/30 text-purple-300" },
};

export function RotaStatusBadge({ status }: { status: RotaStatus }) {
  const s = ROTA_STYLES[status] ?? { label: status, cls: "bg-gray-600 text-white" };
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function ParadaStatusBadge({ status }: { status: ParadaStatus }) {
  const s = PARADA_STYLES[status] ?? { label: status, cls: "bg-gray-600 text-white" };
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}
