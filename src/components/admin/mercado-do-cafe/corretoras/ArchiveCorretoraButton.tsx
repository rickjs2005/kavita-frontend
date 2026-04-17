"use client";

// src/components/admin/mercado-do-cafe/corretoras/ArchiveCorretoraButton.tsx
//
// Ação de soft delete (arquivar) e restauração. O botão muda de forma
// dependendo do estado da corretora: ativa → "Arquivar" (tom rose),
// arquivada → "Restaurar" (tom emerald). Preserva um estilo distinto
// de toggleStatus porque arquivar é destrutivo (tira da vitrine +
// limpa destaque), enquanto inativar é pausa reversível.

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type Props = {
  corretoraId: number | string;
  corretoraName: string;
  isArchived: boolean;
  onDone?: () => void;
};

export default function ArchiveCorretoraButton({
  corretoraId,
  corretoraName,
  isArchived,
  onDone,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    if (!isArchived) {
      const ok = window.confirm(
        `Arquivar "${corretoraName}"?\n\n` +
          "Ação reversível, mas fecha a corretora da vitrine pública " +
          "imediatamente e remove qualquer destaque que ela tivesse. " +
          "O histórico de leads, avaliações e assinaturas é preservado.",
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      await apiClient.post(
        `/api/admin/mercado-do-cafe/corretoras/${corretoraId}/${isArchived ? "restore" : "archive"}`,
      );
      toast.success(
        isArchived ? "Corretora restaurada." : "Corretora arquivada.",
      );
      onDone?.();
    } catch (err) {
      toast.error(
        formatApiError(
          err,
          isArchived
            ? "Não foi possível restaurar."
            : "Não foi possível arquivar.",
        ).message,
      );
    } finally {
      setLoading(false);
    }
  }

  const styles = isArchived
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
    : "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:border-rose-400 hover:bg-rose-500/20";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {isArchived ? (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <path d="M3 7v13a1 1 0 001 1h16a1 1 0 001-1V7M3 7V4a1 1 0 011-1h16a1 1 0 011 1v3M3 7h18M10 12l2 2 4-4" />
          </svg>
          {loading ? "Restaurando..." : "Restaurar"}
        </>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <path d="M3 7v13a1 1 0 001 1h16a1 1 0 001-1V7M3 7V4a1 1 0 011-1h16a1 1 0 011 1v3M3 7h18M10 12h4" />
          </svg>
          {loading ? "Arquivando..." : "Arquivar"}
        </>
      )}
    </button>
  );
}
