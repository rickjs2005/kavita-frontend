"use client";

// src/components/mercado-do-cafe/CnpjVerifierField.tsx
//
// Componente reutilizavel pra informar e verificar CNPJ.
// Usado no admin (CorretoraForm) e no painel da corretora (perfil).
//
// Comportamento:
//   1. campo de input com mascara CNPJ (12.345.678/0001-90)
//   2. botao "Verificar CNPJ" — chama endpoint passado por prop
//   3. exibe badge de status + razao social retornada
//   4. erros tecnicos viram mensagens humanas; erro de campo
//      aparece inline abaixo do input
//
// Backend faz a validacao real (algoritmo dos digitos verificadores
// + chamada ao provider). Aqui validamos so' tamanho pra UX rapida.

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { ApiError, isApiError } from "@/lib/errors";

type VerificationStatus =
  | "not_informed"
  | "pending"
  | "verified"
  | "invalid"
  | "error";

type VerifyResponse = {
  status: VerificationStatus;
  cnpj: string;
  razao_social: string | null;
  situacao_cadastral: string | null;
  verified_at: string | null;
  message: string;
  error_code: string | null;
};

type Props = {
  /** Valor inicial do CNPJ (apenas digitos ou formatado). */
  initialCnpj?: string | null;
  /** Status inicial vindo do backend. */
  initialStatus?: VerificationStatus;
  /** Razao social ja conhecida (preenchimento inicial). */
  initialRazaoSocial?: string | null;
  /** Endpoint que faz a verificacao. Recebe { cnpj } no body. */
  endpoint: string;
  /** Callback chamado depois de verificar com sucesso (ou falha
   *  controlada). UI consumer atualiza estado proprio. */
  onResult?: (result: VerifyResponse) => void;
  /** Apenas leitura (somente status, sem permitir editar/verificar). */
  readOnly?: boolean;
  /** Tema: 'admin' (slate) ou 'painel' (stone+amber, dark). Default: admin. */
  variant?: "admin" | "painel";
};

/** Aplica máscara visual: "12345678000190" → "12.345.678/0001-90". */
function maskCnpj(value: string): string {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function StatusBadge({
  status,
  variant = "admin",
}: {
  status: VerificationStatus;
  variant?: "admin" | "painel";
}) {
  const baseAdmin = "border";
  const basePainel = "ring-1";
  const base =
    variant === "painel"
      ? `${basePainel} inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]`
      : `${baseAdmin} inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]`;

  const colors: Record<VerificationStatus, string> = {
    not_informed:
      variant === "painel"
        ? "bg-stone-800 text-stone-300 ring-white/[0.06]"
        : "border-slate-700 bg-slate-800/40 text-slate-400",
    pending:
      variant === "painel"
        ? "bg-amber-500/15 text-amber-200 ring-amber-400/30"
        : "border-amber-500/40 bg-amber-500/10 text-amber-300",
    verified:
      variant === "painel"
        ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    invalid:
      variant === "painel"
        ? "bg-rose-500/15 text-rose-200 ring-rose-400/30"
        : "border-rose-500/40 bg-rose-500/10 text-rose-300",
    error:
      variant === "painel"
        ? "bg-orange-500/15 text-orange-200 ring-orange-400/30"
        : "border-orange-500/40 bg-orange-500/10 text-orange-300",
  };

  const labels: Record<VerificationStatus, string> = {
    not_informed: "Não informado",
    pending: "Pendente",
    verified: "Verificado",
    invalid: "Inválido",
    error: "Erro na consulta",
  };

  const icons: Record<VerificationStatus, string> = {
    not_informed: "○",
    pending: "…",
    verified: "✓",
    invalid: "✕",
    error: "!",
  };

  return (
    <span className={`${base} ${colors[status]}`}>
      <span aria-hidden>{icons[status]}</span>
      {labels[status]}
    </span>
  );
}

export default function CnpjVerifierField({
  initialCnpj,
  initialStatus = "not_informed",
  initialRazaoSocial,
  endpoint,
  onResult,
  readOnly = false,
  variant = "admin",
}: Props) {
  const [cnpjInput, setCnpjInput] = useState(maskCnpj(initialCnpj ?? ""));
  const [status, setStatus] = useState<VerificationStatus>(initialStatus);
  const [razaoSocial, setRazaoSocial] = useState<string | null>(
    initialRazaoSocial ?? null,
  );
  const [verifying, setVerifying] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Quando initialCnpj muda (ex: parent recarregou dados), atualiza
  // o input. Sem isso, edicao "voltar e recarregar" nao reflete.
  useEffect(() => {
    if (initialCnpj !== undefined && initialCnpj !== null) {
      setCnpjInput(maskCnpj(initialCnpj));
    }
  }, [initialCnpj]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const digits = useMemo(() => cnpjInput.replace(/\D/g, ""), [cnpjInput]);
  const canSubmit = digits.length === 14 && !verifying && !readOnly;

  const isInputDark = variant === "painel";
  const inputClass = isInputDark
    ? "h-11 w-full rounded-xl border border-white/10 bg-stone-950 px-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/25 disabled:opacity-60 [color-scheme:dark]"
    : "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-60 [color-scheme:dark]";

  const buttonClass = isInputDark
    ? "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-4 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-950 shadow-md shadow-amber-500/20 transition-colors hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
    : "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";

  const handleVerify = async () => {
    setFieldError(null);
    setResultMessage(null);
    if (digits.length !== 14) {
      setFieldError("CNPJ deve ter 14 dígitos.");
      return;
    }
    setVerifying(true);
    try {
      const resp = await apiClient.post<VerifyResponse>(endpoint, {
        cnpj: digits,
      });
      setStatus(resp.status);
      setRazaoSocial(resp.razao_social);
      setResultMessage(resp.message);
      onResult?.(resp);
    } catch (err) {
      // Erro de validação (400) com fields → mostra inline.
      if (
        isApiError(err) &&
        err instanceof ApiError &&
        err.status === 400 &&
        err.details &&
        typeof err.details === "object"
      ) {
        const details = err.details as { fields?: Array<{ field: string; message: string }> };
        const cnpjField = details.fields?.find((f) => f.field === "cnpj");
        if (cnpjField) {
          setFieldError(cnpjField.message);
          setStatus("invalid");
          return;
        }
      }
      // Conflito (409 — CNPJ duplicado) ou erro técnico.
      const friendly = formatApiError(err, "Erro ao verificar CNPJ.");
      setResultMessage(friendly.message);
      if (isApiError(err) && err instanceof ApiError && err.status === 409) {
        setFieldError(friendly.message);
      } else {
        setStatus("error");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="cnpj-verifier-input"
          className={
            isInputDark
              ? "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400"
              : "text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
          }
        >
          CNPJ da empresa
        </label>
        <StatusBadge status={status} variant={variant} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id="cnpj-verifier-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          value={cnpjInput}
          maxLength={18}
          disabled={readOnly}
          onChange={(e) => {
            setCnpjInput(maskCnpj(e.target.value));
            if (fieldError) setFieldError(null);
            if (status !== "not_informed") {
              // Mudar o CNPJ depois de uma verificação volta para
              // estado neutro até nova verificação.
              setStatus("not_informed");
              setRazaoSocial(null);
              setResultMessage(null);
            }
          }}
          className={inputClass}
        />
        {!readOnly && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={!canSubmit}
            className={buttonClass}
          >
            {verifying ? "Verificando…" : "Verificar CNPJ"}
          </button>
        )}
      </div>

      {fieldError && (
        <p
          role="alert"
          className={
            isInputDark
              ? "text-[11px] font-medium text-rose-300"
              : "text-[11px] font-medium text-rose-400"
          }
        >
          {fieldError}
        </p>
      )}

      {!fieldError && resultMessage && (
        <p
          className={
            isInputDark
              ? `text-[11px] ${
                  status === "verified"
                    ? "text-emerald-300/90"
                    : status === "invalid"
                      ? "text-rose-300/90"
                      : "text-stone-400"
                }`
              : `text-[11px] ${
                  status === "verified"
                    ? "text-emerald-400"
                    : status === "invalid"
                      ? "text-rose-400"
                      : "text-slate-400"
                }`
          }
        >
          {resultMessage}
        </p>
      )}

      {razaoSocial && status === "verified" && (
        <div
          className={
            isInputDark
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] px-3 py-2 text-[12px] text-stone-200"
              : "rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] px-3 py-2 text-[12px] text-slate-200"
          }
        >
          <span className="font-semibold">Razão social:</span> {razaoSocial}
        </div>
      )}
    </div>
  );
}
