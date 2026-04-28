"use client";

// src/components/admin/mercado-do-cafe/reviews/ReviewsModeration.tsx
//
// Painel de moderação de reviews (Sprint 4). Lista as reviews com
// filtro por status e permite aprovar/rejeitar com 1 clique (reject
// abre prompt para rejection_reason opcional).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCorretoraReviewsAdmin } from "@/hooks/useCorretoraReviewsAdmin";
import type { AdminCorretoraReview } from "@/types/review";

type Props = {
  onUnauthorized?: () => void;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: AdminCorretoraReview["status"] }) {
  const map = {
    pending:
      "bg-amber-500/10 text-amber-200 ring-amber-500/30",
    approved: "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30",
    rejected: "bg-rose-500/10 text-rose-200 ring-rose-500/30",
  };
  const label = {
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Rejeitada",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400" : "text-slate-700"}`}
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
      <span className="ml-1 text-[11px] font-semibold tabular-nums text-slate-300">
        {rating}
      </span>
    </div>
  );
}

export default function ReviewsModeration({ onUnauthorized }: Props) {
  const { rows, loading, statusFilter, setStatusFilter, moderate } =
    useCorretoraReviewsAdmin({ onUnauthorized });
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const rejectInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (rejectingId !== null) {
      rejectInputRef.current?.focus();
    }
  }, [rejectingId]);

  const filters: { key: typeof statusFilter; label: string }[] = [
    { key: "pending", label: "Pendentes" },
    { key: "approved", label: "Aprovadas" },
    { key: "rejected", label: "Rejeitadas" },
    { key: "all", label: "Todas" },
  ];

  const handleReject = (id: number) => {
    if (rejectingId === id) {
      // Segundo clique — confirma
      moderate(id, "reject", rejectReason.trim() || undefined);
      setRejectingId(null);
      setRejectReason("");
    } else {
      setRejectingId(id);
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = f.key === statusFilter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                active
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                  : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-amber-500/30 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && rows.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-xs text-slate-400">
          Carregando avaliações...
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-sm text-slate-500">
          Nenhuma avaliação {statusFilter !== "all" ? `${statusFilter === "pending" ? "pendente" : statusFilter === "approved" ? "aprovada" : "rejeitada"}` : ""} no momento.
        </div>
      )}

      {rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">
                      {r.nome_autor}
                    </p>
                    <StatusBadge status={r.status} />
                    {r.lead_id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                        ✓ Lead vinculado
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <StarsDisplay rating={r.rating} />
                    {r.cidade_autor && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{r.cidade_autor}</span>
                      </>
                    )}
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{formatDate(r.created_at)}</span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400">
                    <span className="text-slate-500">Sobre:</span>{" "}
                    <Link
                      href={`/mercado-do-cafe/corretoras/${r.corretora_slug}`}
                      target="_blank"
                      className="font-medium text-amber-300 hover:text-amber-200"
                    >
                      {r.corretora_name}
                    </Link>{" "}
                    <span className="text-slate-500">· {r.corretora_city}</span>
                  </div>

                  {r.comentario && (
                    <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-900/60 p-3 text-sm text-slate-300 ring-1 ring-slate-800">
                      {r.comentario}
                    </p>
                  )}

                  {r.rejection_reason && (
                    <p className="mt-2 text-[11px] text-rose-300">
                      <span className="font-semibold">Motivo rejeição:</span>{" "}
                      {r.rejection_reason}
                    </p>
                  )}
                </div>

                {/* Ações — só para pendentes */}
                {r.status === "pending" && (
                  <div className="flex shrink-0 flex-col gap-2 md:items-end">
                    <button
                      type="button"
                      onClick={() => moderate(r.id, "approve")}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-500/25"
                    >
                      ✓ Aprovar
                    </button>

                    {rejectingId === r.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={rejectInputRef}
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Motivo (opcional)"
                          className="rounded-lg border border-rose-500/30 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleReject(r.id)}
                            className="flex-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/30 hover:bg-rose-500/25"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReject(r.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/30 transition-colors hover:bg-rose-500/25"
                      >
                        ✕ Rejeitar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
