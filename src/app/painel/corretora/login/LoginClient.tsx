"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { safeInternalRedirect } from "@/utils/safeInternalRedirect";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import type { CorretoraUser } from "@/types/corretoraUser";

type LoginResponse = {
  user: CorretoraUser;
};

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const { markLoggedIn } = useCorretoraAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const redirectTo = useMemo(
    () => safeInternalRedirect(search.get("from"), "/painel/corretora"),
    [search],
  );

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setErrMsg(null);
    try {
      const data = await apiClient.post<LoginResponse>(
        "/api/corretora/login",
        { email, senha },
      );
      markLoggedIn(data.user);
      router.replace(redirectTo);
    } catch (err: unknown) {
      const ui = formatApiError(err, "Credenciais inválidas.");
      setErrMsg(ui.message);
      setLoading(false);
    }
  }, [email, senha, loading, redirectTo, router, markLoggedIn]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-emerald-50 to-white p-4 sm:p-6">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-200 sm:max-w-md sm:p-8">
        <header className="mb-6 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            ☕
          </div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
            Painel da Corretora
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Acesse para gerenciar seus contatos.
          </p>
          <div className="mt-4 min-h-[40px]">
            {errMsg && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {errMsg}
              </p>
            )}
          </div>
        </header>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="voce@corretora.com.br"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="senha"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="••••••••"
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading || !email || !senha}
          className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="mt-4 text-center">
          <Link
            href="/painel/corretora/esqueci-senha"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Ainda não tem acesso? Fale com o administrador do Kavita.
        </p>
      </section>
    </main>
  );
}
