"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { safeInternalRedirect } from "@/utils/safeInternalRedirect";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import { AuthShell } from "@/components/painel-corretora/AuthShell";
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
    <AuthShell
      title="Bem-vinda de volta"
      subtitle="Entre com suas credenciais para acessar seu espaço no Mercado do Café."
    >
      <div className="relative overflow-hidden rounded-2xl bg-stone-50 p-7 shadow-2xl shadow-black/60 ring-1 ring-stone-900/10 sm:p-8">
        {/* Top highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />

        {/* Error banner */}
        <div className="min-h-[28px]">
          {errMsg && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
            >
              {errMsg}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600"
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
              placeholder="voce@corretora.com.br"
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.03] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600"
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
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.03] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || !email || !senha}
            className="group relative h-11 w-full overflow-hidden rounded-xl bg-stone-900 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-all hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* Highlight top */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
            <span className="relative">
              {loading ? "Entrando..." : "Entrar"}
            </span>
          </button>

          <div className="pt-1 text-center">
            <Link
              href="/painel/corretora/esqueci-senha"
              className="text-xs font-medium text-stone-600 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-stone-200 pt-4">
          <p className="text-center text-[11px] text-stone-500">
            Ainda não tem acesso? Fale com o administrador do Kavita.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
