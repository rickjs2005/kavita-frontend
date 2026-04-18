"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { safeInternalRedirect } from "@/utils/safeInternalRedirect";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import { AuthShell } from "@/components/painel-corretora/AuthShell";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
  type TurnstileHandle,
} from "@/components/painel-corretora/TurnstileWidget";
import type { CorretoraUser } from "@/types/corretoraUser";

type LoginResponse = {
  user?: CorretoraUser;
  // ETAPA 2.2 — quando o usuário tem 2FA ativo, o backend não devolve
  // cookie; devolve um challenge_token pro segundo passo.
  requires_totp?: boolean;
  challenge_token?: string;
};

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const { markLoggedIn } = useCorretoraAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  // ETAPA 2.2 — TOTP step
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const redirectTo = useMemo(
    () => safeInternalRedirect(search.get("from"), "/painel/corretora"),
    [search],
  );

  const handleLogin = useCallback(async () => {
    if (loading) return;
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setErrMsg(
        turnstileError ?? "Aguarde a verificação anti-bot ser concluída.",
      );
      return;
    }
    setLoading(true);
    setErrMsg(null);
    try {
      const payload: Record<string, string> = { email, senha };
      if (TURNSTILE_ENABLED && turnstileToken) {
        payload["cf-turnstile-response"] = turnstileToken;
      }
      const data = await apiClient.post<LoginResponse>(
        "/api/corretora/login",
        payload,
      );
      // ETAPA 2.2 — 2FA: segundo passo com challenge_token
      if (data?.requires_totp && data.challenge_token) {
        setChallengeToken(data.challenge_token);
        setLoading(false);
        // Turnstile já consumido — reset pra preparar retry caso o step
        // TOTP falhe e o usuário tenha que voltar.
        setTurnstileToken(null);
        turnstileRef.current?.reset();
        return;
      }
      if (!data?.user) {
        throw new Error("Resposta inesperada do servidor.");
      }
      markLoggedIn(data.user);
      router.replace(redirectTo);
    } catch (err: unknown) {
      const ui = formatApiError(err, "Credenciais inválidas.");
      setErrMsg(ui.message);
      setLoading(false);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }, [
    email,
    senha,
    loading,
    redirectTo,
    router,
    markLoggedIn,
    turnstileToken,
    turnstileError,
  ]);

  const handleTotpSubmit = useCallback(async () => {
    if (!challengeToken) return;
    if (loading) return;
    const trimmed = totpCode.trim();
    if (trimmed.length < 4) {
      setErrMsg("Digite o código do app ou um código de backup.");
      return;
    }
    setLoading(true);
    setErrMsg(null);
    try {
      const data = await apiClient.post<LoginResponse>(
        "/api/corretora/login/totp",
        { challenge_token: challengeToken, code: trimmed },
      );
      if (!data?.user) {
        throw new Error("Resposta inesperada do servidor.");
      }
      markLoggedIn(data.user);
      router.replace(redirectTo);
    } catch (err: unknown) {
      const ui = formatApiError(err, "Código inválido.");
      setErrMsg(ui.message);
      setLoading(false);
      setTotpCode("");
    }
  }, [challengeToken, loading, totpCode, markLoggedIn, router, redirectTo]);

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

        {/* ETAPA 2.2 — segundo passo 2FA. Oculta o form de senha
            quando tem challenge_token. Aceita código de 6 dígitos
            (do app) OU código de backup (8 chars). */}
        {challengeToken ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
                Autenticação em dois fatores
              </p>
              <p className="mt-1 text-[12px] text-stone-500">
                Digite o código de 6 dígitos do seu aplicativo autenticador,
                ou um código de backup de 8 caracteres.
              </p>
            </div>
            <div>
              <input
                id="totp-code"
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                autoFocus
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^0-9A-Z]/g, "")
                      .slice(0, 8),
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTotpSubmit();
                }}
                placeholder="000000"
                maxLength={8}
                className="h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-center font-mono text-lg tracking-[0.3em] text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={handleTotpSubmit}
              disabled={loading || totpCode.length < 4}
              className="block w-full rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-amber-600/30 transition-all hover:from-amber-500 hover:to-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Confirmar e entrar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setChallengeToken(null);
                setTotpCode("");
                setErrMsg(null);
              }}
              className="block w-full text-center text-[11px] font-semibold text-stone-500 hover:text-stone-900"
            >
              ← Trocar de usuário
            </button>
          </div>
        ) : (
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
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.03] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
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
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.03] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {TURNSTILE_ENABLED && (
            <div className="flex flex-col items-center gap-2" aria-live="polite">
              <TurnstileWidget
                ref={turnstileRef}
                theme="light"
                onToken={setTurnstileToken}
                onError={setTurnstileError}
              />
              {turnstileError && (
                <p className="max-w-xs text-center text-[11px] leading-relaxed text-red-700">
                  {turnstileError}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={
              loading ||
              !email ||
              !senha ||
              (TURNSTILE_ENABLED && !turnstileToken)
            }
            className="group relative h-11 w-full overflow-hidden rounded-xl bg-stone-900 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-all hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="text-xs font-medium text-stone-600 underline-offset-4 hover:text-amber-700 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>
        )}

        <div className="mt-6 border-t border-stone-200 pt-4">
          <p className="text-center text-[11px] text-stone-500">
            Ainda não tem acesso? Fale com o administrador do Kavita.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
