"use client";

import { useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { AuthShell } from "@/components/painel-corretora/AuthShell";

export default function ForgotClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrMsg(null);
    try {
      await apiClient.post("/api/corretora/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setErrMsg(
        formatApiError(err, "Não foi possível enviar o e-mail.").message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Recuperar acesso"
      subtitle="Enviaremos um link seguro para o e-mail cadastrado."
    >
      <div className="relative overflow-hidden rounded-2xl bg-stone-50 p-7 shadow-2xl shadow-black/60 ring-1 ring-stone-900/10 sm:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />

        {sent ? (
          <div
            role="status"
            className="space-y-3 text-center"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              Pedido recebido
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">
              Se este e-mail estiver cadastrado, você receberá um link para
              redefinir a senha. O link expira em{" "}
              <span className="font-semibold text-stone-900">1 hora</span>.
            </p>
            <p className="text-[11px] text-stone-500">
              Não recebeu? Confira a caixa de spam.
            </p>
            <div className="pt-2">
              <Link
                href="/painel/corretora/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                ← Voltar para o login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="min-h-[28px]">
              {errMsg && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
                >
                  {errMsg}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600"
              >
                E-mail cadastrado
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@corretora.com.br"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.03] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="group relative h-11 w-full overflow-hidden rounded-xl bg-stone-900 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-all hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <span className="relative">
                {loading ? "Enviando..." : "Enviar link"}
              </span>
            </button>

            <div className="pt-1 text-center">
              <Link
                href="/painel/corretora/login"
                className="text-xs font-medium text-stone-600 hover:text-amber-700"
              >
                ← Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
