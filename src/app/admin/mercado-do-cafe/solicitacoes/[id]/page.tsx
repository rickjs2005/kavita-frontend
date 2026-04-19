// src/app/admin/mercado-do-cafe/solicitacoes/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import { formatApiError } from "@/lib/formatApiError";
import { absUrl } from "@/utils/absUrl";
import type { CorretoraSubmission } from "@/types/corretora";

// Extrai a causa exibível de um erro da API de admin. Prioriza:
//   1. details.fields (erro de validação Zod)
//   2. message + status + requestId (erro de negócio/servidor)
// Resultado vira tanto o texto do toast quanto do banner inline.
function describeAdminError(err: unknown, fallback: string): string {
  const ui = formatApiError(err, fallback);
  if (isApiError(err)) {
    const details = err.details as { fields?: { message?: string }[] } | null;
    if (Array.isArray(details?.fields) && details.fields.length > 0) {
      const msgs = details.fields
        .map((f) => f?.message)
        .filter((m): m is string => typeof m === "string" && m.length > 0);
      if (msgs.length > 0) {
        return `${ui.message} — ${msgs.join("; ")}`;
      }
    }
    const parts = [ui.message];
    if (err.status && err.status >= 500) parts.push(`(HTTP ${err.status})`);
    if (ui.requestId) parts.push(`(ref: ${ui.requestId})`);
    return parts.join(" ");
  }
  return ui.message;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sub, setSub] = useState<CorretoraSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  // Erro detalhado da última ação (approve/reject) — persiste até o
  // admin tentar de novo ou sair da tela.
  const [actionError, setActionError] = useState<string | null>(null);

  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get<CorretoraSubmission>(
          `/api/admin/mercado-do-cafe/submissions/${id}`
        );
        setSub(data);
      } catch (err) {
        toast.error(formatApiError(err, "Erro ao carregar solicitação.").message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleApprove = useCallback(async () => {
    setActing(true);
    setActionError(null);
    try {
      await apiClient.post(`/api/admin/mercado-do-cafe/submissions/${id}/approve`);
      toast.success("Corretora aprovada e publicada.");
      router.push("/admin/mercado-do-cafe");
    } catch (err) {
      const msg = describeAdminError(err, "Erro ao aprovar.");
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActing(false);
    }
  }, [id, router]);

  const handleReject = useCallback(async () => {
    if (reason.trim().length < 10) {
      setActionError("Motivo deve ter pelo menos 10 caracteres.");
      toast.error("Motivo deve ter pelo menos 10 caracteres.");
      return;
    }
    setActing(true);
    setActionError(null);
    try {
      await apiClient.post(`/api/admin/mercado-do-cafe/submissions/${id}/reject`, {
        reason: reason.trim(),
      });
      toast.success("Solicitação rejeitada.");
      router.push("/admin/mercado-do-cafe");
    } catch (err) {
      const msg = describeAdminError(err, "Erro ao rejeitar.");
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActing(false);
    }
  }, [id, reason, router]);

  const isPending = sub?.status === "pending";

  const statusBadge = () => {
    if (!sub) return null;
    const map: Record<string, { cls: string; label: string }> = {
      pending: { cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", label: "Pendente" },
      approved: { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", label: "Aprovada" },
      rejected: { cls: "bg-rose-500/15 text-rose-300 border-rose-500/30", label: "Rejeitada" },
    };
    const s = map[sub.status] ?? map.pending;
    return (
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen w-full">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
          <Link
            href="/admin/mercado-do-cafe"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 mb-2"
          >
            ← Voltar para solicitações
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
              Revisão de Solicitação #{id}
            </h1>
            {statusBadge()}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-3 pb-10 pt-4 sm:px-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}

        {!loading && !sub && (
          <p className="text-sm text-slate-400 text-center py-8">
            Solicitação não encontrada.
          </p>
        )}

        {!loading && sub && (
          <div className="space-y-6">
            {/* Data */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-100">Dados enviados</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Empresa</p>
                  <p className="font-medium text-slate-100">{sub.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Responsável</p>
                  <p className="text-slate-200">{sub.contact_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cidade</p>
                  <p className="text-slate-200">{sub.city}, {sub.state}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Região</p>
                  <p className="text-slate-200">{sub.region || "—"}</p>
                </div>
              </div>

              {sub.description && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Descrição</p>
                  <p className="text-sm text-slate-200 whitespace-pre-line">
                    {sub.description}
                  </p>
                </div>
              )}

              {sub.logo_path && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Logo</p>
                  <Image
                    src={absUrl(sub.logo_path)}
                    alt="Logo enviada"
                    width={80}
                    height={80}
                    className="rounded-lg border border-slate-700"
                  />
                </div>
              )}

              <h3 className="text-sm font-semibold text-slate-100 pt-2">Canais de contato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {sub.whatsapp && <div><span className="text-slate-500">WhatsApp:</span> <span className="text-slate-200">{sub.whatsapp}</span></div>}
                {sub.phone && <div><span className="text-slate-500">Telefone:</span> <span className="text-slate-200">{sub.phone}</span></div>}
                {sub.email && <div><span className="text-slate-500">E-mail:</span> <span className="text-slate-200">{sub.email}</span></div>}
                {sub.website && <div><span className="text-slate-500">Site:</span> <span className="text-slate-200">{sub.website}</span></div>}
                {sub.instagram && <div><span className="text-slate-500">Instagram:</span> <span className="text-slate-200">{sub.instagram}</span></div>}
                {sub.facebook && <div><span className="text-slate-500">Facebook:</span> <span className="text-slate-200">{sub.facebook}</span></div>}
              </div>

              <p className="text-xs text-slate-500 pt-2">
                Enviado em: {formatDate(sub.created_at)}
              </p>

              {sub.reviewed_at && (
                <p className="text-xs text-slate-500">
                  Revisado em: {formatDate(sub.reviewed_at)}
                </p>
              )}

              {sub.rejection_reason && (
                <div className="rounded-lg border border-rose-800 bg-rose-500/10 p-3">
                  <p className="text-xs font-semibold text-rose-300 mb-1">Motivo da rejeição</p>
                  <p className="text-sm text-rose-200">{sub.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isPending && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-100">Ação</h2>

                {/* Banner do último erro — aparece embaixo do título e fica
                    até a próxima tentativa (role=alert, aria-live=polite). */}
                {actionError && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-rose-500/40 bg-rose-500/[0.08] p-3.5 text-sm text-rose-100"
                  >
                    <div className="flex items-start gap-2.5">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0 text-rose-300"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div className="min-w-0">
                        <p className="font-semibold text-rose-100">
                          A ação não foi concluída
                        </p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-rose-200/90 break-words">
                          {actionError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!rejectMode ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={acting}
                      className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {acting ? "Aprovando..." : "✅ Aprovar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectMode(true)}
                      disabled={acting}
                      className="rounded-xl border border-rose-700 px-6 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-slate-300">
                      Motivo da rejeição *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[80px] resize-y"
                      placeholder="Descreva o motivo da rejeição (mínimo 10 caracteres)..."
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={acting}
                        className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
                      >
                        {acting ? "Rejeitando..." : "Confirmar rejeição"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectMode(false);
                          setReason("");
                        }}
                        className="rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
