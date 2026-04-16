// src/components/admin/mercado-do-cafe/corretoras/CorretorasTable.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { CorretoraAdmin } from "@/types/corretora";
import InviteUserModal from "./InviteUserModal";

type Props = {
  rows: CorretoraAdmin[];
  loading: boolean;
  onToggleStatus: (id: number, status: "active" | "inactive") => void;
  onToggleFeatured: (id: number, featured: boolean) => void;
  onInviteUser: (
    id: number,
    payload: { nome: string; email: string },
  ) => Promise<{ ok: true; resent: boolean }>;
};

export default function CorretorasTable({
  rows,
  loading,
  onToggleStatus,
  onToggleFeatured,
  onInviteUser,
}: Props) {
  const [inviteFor, setInviteFor] = useState<CorretoraAdmin | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-slate-400">Nenhuma corretora cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Cidade</th>
            <th className="px-4 py-3">Plano</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Destaque</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {rows.map((c) => {
            const isActive = c.status === "active";
            const isFeatured = c.is_featured === true || Number(c.is_featured) === 1;

            return (
              <tr
                key={c.id}
                className="transition-colors hover:bg-slate-900/40"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-100">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.contact_name}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {c.city}, {c.state}
                </td>
                <td className="px-4 py-3">
                  {(c as any).plan_name ? (
                    <div>
                      <span className="text-xs font-semibold text-emerald-200">
                        {(c as any).plan_name}
                      </span>
                      <span className={`ml-1.5 text-[10px] font-medium ${
                        (c as any).sub_status === "trialing"
                          ? "text-amber-300"
                          : (c as any).sub_status === "active"
                            ? "text-emerald-300"
                            : (c as any).sub_status === "expired"
                              ? "text-rose-300"
                              : "text-slate-400"
                      }`}>
                        {(c as any).sub_status === "trialing"
                          ? "Teste"
                          : (c as any).sub_status === "active"
                            ? "Ativa"
                            : (c as any).sub_status === "past_due"
                              ? "Vencida"
                              : (c as any).sub_status === "expired"
                                ? "Expirada"
                                : (c as any).sub_status ?? ""}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Sem plano</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {isActive ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isFeatured && (
                    <span className="text-amber-400" title="Em destaque">⭐</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteFor(c)}
                      disabled={!isActive}
                      className="rounded-lg border border-emerald-800 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        isActive
                          ? "Criar acesso por convite (envia e-mail de primeiro acesso)"
                          : "Ative a corretora para poder criar acesso"
                      }
                    >
                      Criar acesso
                    </button>
                    <Link
                      href={`/admin/mercado-do-cafe/corretoras/${c.id}`}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/40 hover:text-emerald-200 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(c.id, isActive ? "inactive" : "active")
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "border-rose-800 text-rose-300 hover:bg-rose-500/10"
                          : "border-emerald-800 text-emerald-300 hover:bg-emerald-500/10"
                      }`}
                    >
                      {isActive ? "Inativar" : "Ativar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFeatured(c.id, !isFeatured)}
                      disabled={!isActive && !isFeatured}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-500/40 hover:text-amber-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isFeatured ? "Remover destaque" : "Destacar"}
                    >
                      {isFeatured ? "★ Remover" : "☆ Destacar"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <InviteUserModal
        corretora={inviteFor}
        onClose={() => setInviteFor(null)}
        onInvite={onInviteUser}
      />
    </div>
  );
}
