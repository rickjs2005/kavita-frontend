"use client";

import { useState } from "react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";

export default function MotoristaLoginPage() {
  const [telefone, setTelefone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (telefone.replace(/\D/g, "").length < 10) {
      toast.error("Informe seu telefone com DDD.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/api/public/motorista/magic-link", {
        telefone: telefone.trim(),
      });
      setSent(true);
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao enviar link.").message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
            Kavita · Entregas
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50">
            {sent ? "Confira seu WhatsApp" : "Entrar como motorista"}
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            {sent
              ? "Se seu telefone estiver cadastrado, enviamos um link de acesso. Abra o WhatsApp e clique."
              : "Informe seu telefone com DDD. Vamos enviar um link de acesso pelo WhatsApp."}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
              Telefone (DDD + número)
            </label>
            <input
              type="tel"
              autoFocus
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(33) 99999-1234"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-base text-stone-100 placeholder:text-stone-500 focus:border-amber-400/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/25"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Receber meu link"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setSent(false);
              setTelefone("");
            }}
            className="block mx-auto text-xs font-semibold text-amber-300 hover:text-amber-200"
          >
            Tentar com outro número
          </button>
        )}

        <p className="text-center text-[11px] text-stone-500">
          Sem senha. Você recebe um link válido por 15 minutos.
        </p>
      </div>
    </main>
  );
}
