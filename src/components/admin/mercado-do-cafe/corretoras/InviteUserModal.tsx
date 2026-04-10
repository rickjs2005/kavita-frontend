"use client";

// src/components/admin/mercado-do-cafe/corretoras/InviteUserModal.tsx
//
// Modal simples para o admin criar / reenviar convite de primeiro
// acesso de uma corretora. Consumido pela CorretorasTable.
//
// Mantém o visual do admin (slate-900 dark) em vez do visual do
// painel da corretora (stone light) — porque vive dentro do admin.

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/errors";

type Corretora = {
  id: number;
  name: string;
  contact_name?: string | null;
  email?: string | null;
};

type Props = {
  corretora: Corretora | null;
  onClose: () => void;
  onInvite: (
    id: number,
    payload: { nome: string; email: string },
  ) => Promise<{ ok: true; resent: boolean }>;
};

export default function InviteUserModal({
  corretora,
  onClose,
  onInvite,
}: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Pré-preenche com os dados do cadastro público da corretora quando
  // o modal abre. Admin pode corrigir antes de enviar.
  useEffect(() => {
    if (corretora) {
      setNome(corretora.contact_name ?? "");
      setEmail(corretora.email ?? "");
      setErrMsg(null);
    }
  }, [corretora]);

  if (!corretora) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!corretora || submitting) return;

    const n = nome.trim();
    const em = email.trim().toLowerCase();

    if (n.length < 3) {
      setErrMsg("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    if (!em.includes("@")) {
      setErrMsg("Informe um e-mail válido.");
      return;
    }

    setSubmitting(true);
    setErrMsg(null);

    try {
      await onInvite(corretora.id, { nome: n, email: em });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrMsg(err.message);
      } else {
        setErrMsg("Erro inesperado ao enviar o convite.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Criar acesso da corretora"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/60 sm:p-6">
        <header className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Acesso da corretora
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">
            Criar acesso por convite
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            A corretora{" "}
            <strong className="text-slate-200">{corretora.name}</strong>{" "}
            receberá um e-mail com um link para definir a senha. O link
            expira em 7 dias.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="min-h-[24px]">
            {errMsg && (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] font-medium text-rose-200"
              >
                {errMsg}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="invite-nome"
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Nome do responsável
            </label>
            <input
              id="invite-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:opacity-60"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="invite-email"
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              E-mail de acesso
            </label>
            <input
              id="invite-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:opacity-60"
              placeholder="corretora@exemplo.com.br"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Este e-mail será usado para login e recuperação de senha.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !nome.trim() || !email.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Enviando..." : "Enviar convite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
