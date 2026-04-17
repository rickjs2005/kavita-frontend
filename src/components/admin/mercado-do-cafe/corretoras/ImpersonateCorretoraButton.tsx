"use client";

// src/components/admin/mercado-do-cafe/corretoras/ImpersonateCorretoraButton.tsx
//
// Botão admin para iniciar impersonação. O backend seta um
// corretoraToken curto (30 min) na resposta mesmo; aqui só precisamos
// abrir /painel/corretora em nova aba. Mantemos o adminToken
// intacto — os dois cookies coexistem no mesmo browser.

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type Props = {
  corretoraId: number | string;
  corretoraName: string;
  /** Controla habilitação (ex.: corretora inativa). */
  disabled?: boolean;
  disabledHint?: string;
};

type ImpersonateResponse = {
  redirect?: string;
};

export default function ImpersonateCorretoraButton({
  corretoraId,
  corretoraName,
  disabled,
  disabledHint,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    const confirm = window.confirm(
      `Entrar no painel como "${corretoraName}"?\n\n` +
        "O cookie da corretora será criado nesta sessão do navegador " +
        "(TTL 30 min). Seu acesso de admin continua intacto. " +
        "Toda ação será registrada na auditoria.",
    );
    if (!confirm) return;

    setLoading(true);
    try {
      const data = await apiClient.post<ImpersonateResponse>(
        `/api/admin/mercado-do-cafe/corretoras/${corretoraId}/impersonate`,
      );
      const target = data?.redirect || "/painel/corretora";
      // Nova aba para preservar a tela do admin. Same-origin: o
      // cookie corretoraToken setado pelo backend será válido lá.
      window.open(target, "_blank", "noopener,noreferrer");
      toast.success("Impersonação iniciada em nova aba.");
    } catch (err) {
      toast.error(
        formatApiError(err, "Não foi possível iniciar a impersonação.")
          .message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      title={disabled ? disabledHint : undefined}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
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
        <path d="M15 3h4a2 2 0 012 2v4M9 21H5a2 2 0 01-2-2v-4M21 3l-7 7M3 21l7-7" />
      </svg>
      {loading ? "Abrindo..." : "Entrar como corretora"}
    </button>
  );
}
