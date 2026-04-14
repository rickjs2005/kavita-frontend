// src/app/email/descadastrar/page.tsx
//
// Landing de one-click unsubscribe. A URL chega de links em emails de
// marketing (follow-up, alertas). Chamamos o backend imediatamente para
// efetivar o opt-out — sem exigir clique extra. O usuário pode reativar.

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";

type State = "loading" | "unsubscribed" | "error" | "resubscribed";

function UnsubscribeClient() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const scope = params.get("scope") || "marketing";

  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  const runUnsub = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ email, token, scope });
      await apiClient.get(`/api/public/email/unsubscribe?${qs.toString()}`);
      setState("unsubscribed");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Não foi possível descadastrar.");
      } else {
        setError("Erro inesperado.");
      }
      setState("error");
    }
  }, [email, token, scope]);

  const runResub = useCallback(async () => {
    try {
      await apiClient.post("/api/public/email/resubscribe", { email, token, scope });
      setState("resubscribed");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      setState("error");
    }
  }, [email, token, scope]);

  useEffect(() => {
    if (!email || !token) {
      setState("error");
      setError("Link inválido.");
      return;
    }
    runUnsub();
  }, [email, token, runUnsub]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-900">
        ☕ Kavita · Preferência de email
      </h1>

      {state === "loading" && (
        <p className="mt-6 text-sm text-slate-500">Processando...</p>
      )}

      {state === "unsubscribed" && (
        <>
          <p className="mt-6 text-sm text-slate-700">
            Pronto. Você não receberá mais emails de marketing do Kavita em{" "}
            <strong>{email}</strong>.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Emails essenciais (confirmação de ações que você iniciar) seguem normalmente.
          </p>
          <button
            type="button"
            onClick={runResub}
            className="mt-6 rounded-lg border border-amber-600 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
          >
            Descadastrei por engano — reativar
          </button>
        </>
      )}

      {state === "resubscribed" && (
        <p className="mt-6 text-sm text-slate-700">
          Inscrição reativada para <strong>{email}</strong>.
        </p>
      )}

      {state === "error" && (
        <p className="mt-6 text-sm text-rose-600">
          {error || "Não foi possível processar seu pedido."}
        </p>
      )}

      <div className="mt-10">
        <Link href="/" className="text-xs text-slate-500 hover:text-amber-700">
          ← Voltar ao Kavita
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500">
          Carregando...
        </p>
      }
    >
      <UnsubscribeClient />
    </Suspense>
  );
}
