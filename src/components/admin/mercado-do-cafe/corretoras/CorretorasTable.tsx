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

  // Labels/cores de sub_status compartilhados entre desktop e mobile.
  function subStatusLabel(s: unknown): string {
    if (s === "trialing") return "Teste";
    if (s === "active") return "Ativa";
    if (s === "past_due") return "Vencida";
    if (s === "expired") return "Expirada";
    return typeof s === "string" ? s : "";
  }
  function subStatusColor(s: unknown): string {
    if (s === "trialing") return "text-amber-300";
    if (s === "active") return "text-emerald-300";
    if (s === "expired") return "text-rose-300";
    return "text-slate-400";
  }

  return (
    <div className="rounded-xl border border-slate-800">
      {/* ── Desktop: tabela ── */}
      <div className="hidden md:block overflow-x-auto">
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
              const planName = (c as any).plan_name;
              const subStatus = (c as any).sub_status;

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
                    {planName ? (
                      <div>
                        <span className="text-xs font-semibold text-emerald-200">
                          {planName}
                        </span>
                        <span className={`ml-1.5 text-[10px] font-medium ${subStatusColor(subStatus)}`}>
                          {subStatusLabel(subStatus)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Sem plano</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        {isActive ? "Ativa" : "Inativa"}
                      </span>
                      {c.deleted_at && (
                        <span
                          className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rose-300 ring-1 ring-rose-500/30"
                          title="Corretora arquivada — não aparece na vitrine pública."
                        >
                          Arquivada
                        </span>
                      )}
                    </div>
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
      </div>

      {/* ── Mobile: cards ── */}
      <div className="divide-y divide-slate-800/60 md:hidden">
        {rows.map((c) => {
          const isActive = c.status === "active";
          const isFeatured = c.is_featured === true || Number(c.is_featured) === 1;
          const planName = (c as any).plan_name;
          const subStatus = (c as any).sub_status;

          return (
            <article key={c.id} className="space-y-3 p-4">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                    <span className="truncate">{c.name}</span>
                    {isFeatured && (
                      <span className="shrink-0 text-amber-400" title="Em destaque">
                        ⭐
                      </span>
                    )}
                  </h3>
                  {c.contact_name ? (
                    <p className="truncate text-xs text-slate-500">
                      {c.contact_name}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {c.city}, {c.state}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {isActive ? "Ativa" : "Inativa"}
                  </span>
                  {c.deleted_at && (
                    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rose-300 ring-1 ring-rose-500/30">
                      Arquivada
                    </span>
                  )}
                </div>
              </header>

              {/* Plano */}
              <p className="text-xs">
                {planName ? (
                  <>
                    <span className="font-semibold text-emerald-200">{planName}</span>
                    <span className={`ml-1.5 text-[10px] font-medium ${subStatusColor(subStatus)}`}>
                      {subStatusLabel(subStatus)}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">Sem plano</span>
                )}
              </p>

              {/* Acoes em grid 2 colunas, cada botao ocupa metade da largura */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInviteFor(c)}
                  disabled={!isActive}
                  className="rounded-lg border border-emerald-800 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Criar acesso
                </button>
                <Link
                  href={`/admin/mercado-do-cafe/corretoras/${c.id}`}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-medium text-slate-200 hover:border-emerald-500/40 hover:text-emerald-200 transition-colors"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    onToggleStatus(c.id, isActive ? "inactive" : "active")
                  }
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
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
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-amber-500/40 hover:text-amber-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isFeatured ? "★ Remover" : "☆ Destacar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <InviteUserModal
        corretora={inviteFor}
        onClose={() => setInviteFor(null)}
        onInvite={onInviteUser}
      />
    </div>
  );
}
