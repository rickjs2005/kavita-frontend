"use client";

// src/app/painel/corretora/esqueci-senha/ForgotClient.tsx

import { useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

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
    <main className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-emerald-50 to-white p-4 sm:p-6">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 sm:max-w-md sm:p-8">
        <header className="mb-6 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            🔑
          </div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
            Recuperar senha
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enviaremos um link para o seu e-mail cadastrado.
          </p>
        </header>

        {sent ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <p className="font-semibold">✅ Pedido recebido</p>
            <p className="mt-1">
              Se este e-mail estiver cadastrado, você receberá um link para
              redefinir a senha. O link expira em 1 hora.
            </p>
            <p className="mt-3 text-xs text-emerald-700">
              Não recebeu? Confira a caixa de spam ou tente novamente em
              instantes.
            </p>
            <Link
              href="/painel/corretora/login"
              className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
            >
              ← Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errMsg && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {errMsg}
              </p>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-zinc-700"
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
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="voce@corretora.com.br"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <div className="text-center">
              <Link
                href="/painel/corretora/login"
                className="text-sm font-medium text-zinc-500 hover:text-emerald-700"
              >
                ← Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
