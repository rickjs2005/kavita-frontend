"use client";

// src/app/painel/corretora/resetar-senha/ResetClient.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

export default function ResetClient() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Feedback imediato se o link veio sem token
  useEffect(() => {
    if (!token) {
      setErrMsg(
        "Link inválido. Solicite um novo em 'Esqueci minha senha'.",
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
      // Redireciona após 2s para o login
      setTimeout(() => {
        router.replace("/painel/corretora/login");
      }, 2000);
    } catch (err) {
      setErrMsg(formatApiError(err, "Não foi possível redefinir.").message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-emerald-50 to-white p-4 sm:p-6">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 sm:max-w-md sm:p-8">
        <header className="mb-6 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            🔐
          </div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
            Criar nova senha
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Use pelo menos 8 caracteres.
          </p>
        </header>

        {done ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <p className="font-semibold">✅ Senha redefinida</p>
            <p className="mt-1">Redirecionando para o login...</p>
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
                htmlFor="senha"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Nova senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="••••••••"
                disabled={!token}
              />
            </div>

            <div>
              <label
                htmlFor="confirmacao"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Confirmar nova senha
              </label>
              <input
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="••••••••"
                disabled={!token}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !senha || !confirmacao}
              className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>

            <div className="text-center">
              <Link
                href="/painel/corretora/esqueci-senha"
                className="text-sm font-medium text-zinc-500 hover:text-emerald-700"
              >
                Solicitar novo link
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
