"use client";

// src/app/painel/corretora/primeiro-acesso/FirstAccessClient.tsx
//
// Tela de primeiro acesso da corretora. Copy diferente do reset
// ("Bem-vinda! Defina sua senha"), mas internamente consome o MESMO
// endpoint POST /api/corretora/reset-password — o token de convite
// é do mesmo tipo que o de reset (scope corretora_user), só muda o
// TTL (7d de convite vs 1h de forgot).
//
// Mantida como client separado para não acoplar o copy do reset
// (que é "você solicitou") ao copy do convite (que é "bem-vinda").

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { AuthShell } from "@/components/painel-corretora/AuthShell";

export default function FirstAccessClient() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrMsg(
        "Link de primeiro acesso inválido. Peça ao administrador para reenviar o convite.",
      );
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (senha.length < 8) {
      setErrMsg("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErrMsg("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setErrMsg(null);
    try {
      await apiClient.post("/api/corretora/reset-password", { token, senha });
      setDone(true);
      setTimeout(() => {
        router.replace("/painel/corretora/login");
      }, 2200);
    } catch (err) {
      setErrMsg(
        formatApiError(err, "Não foi possível definir a senha.").message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      kicker="Primeiro acesso"
      title="Bem-vinda à sua sala"
      subtitle="Defina sua senha para começar a usar o painel da corretora."
    >
      <div className="relative overflow-hidden rounded-2xl bg-stone-50 p-7 shadow-2xl shadow-black/60 ring-1 ring-stone-900/10 sm:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />

        {done ? (
          <div role="status" className="space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
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
              Senha definida
            </h2>
            <p className="text-sm text-stone-600">
              Tudo pronto. Redirecionando para o login...
            </p>
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
                htmlFor="senha"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600"
              >
                Crie sua senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Pelo menos 8 caracteres"
                disabled={!token}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.03] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="confirmacao"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600"
              >
                Confirme sua senha
              </label>
              <input
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="••••••••"
                disabled={!token}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.03] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !senha || !confirmacao}
              className="group relative h-11 w-full overflow-hidden rounded-xl bg-stone-900 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-all hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <span className="relative">
                {loading ? "Salvando..." : "Definir senha e entrar"}
              </span>
            </button>

            <div className="border-t border-stone-200 pt-4 text-center">
              <p className="text-[11px] text-stone-500">
                Link expirado ou inválido?
              </p>
              <Link
                href="/painel/corretora/esqueci-senha"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Pedir novo link
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
