"use client";

// src/components/mercado-do-cafe/LeadContactForm.tsx
//
// Formulário público "Fale com esta corretora" — exibido no detalhe.
// Envia para POST /api/public/corretoras/:slug/leads.

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import type { LeadFormData } from "@/types/lead";

type Props = {
  corretoraSlug: string;
  corretoraName: string;
};

// --- Cloudflare Turnstile ---------------------------------------------------
// Tipagem mínima do objeto global injetado pelo script da Cloudflare.
// Só declaramos o que usamos aqui — qualquer outra API fica como "any".
type TurnstileRenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement | string,
        options: TurnstileRenderOptions,
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** Carrega o script do Turnstile uma única vez por sessão. */
let turnstileScriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile")));
      return;
    }
    const s = document.createElement("script");
    s.src = TURNSTILE_SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile"));
    document.head.appendChild(s);
  });

  return turnstileScriptPromise;
}

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
const errorClass = "mt-1 text-xs text-rose-600";

export function LeadContactForm({ corretoraSlug, corretoraName }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Turnstile — só entra em ação se houver site key. Sem key, o form
  // funciona como antes (útil em dev local sem credenciais Cloudflare).
  const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileEnabled) return;
    if (success) return; // form está escondido; widget será remontado

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        const container = turnstileContainerRef.current;
        if (!container || !window.turnstile) return;
        // Evita renderizar duas vezes no mesmo container (StrictMode / HMR).
        if (turnstileWidgetIdRef.current) return;

        turnstileWidgetIdRef.current = window.turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "light",
          callback: (token) => setTurnstileToken(token),
          "error-callback": () => setTurnstileToken(null),
          "expired-callback": () => setTurnstileToken(null),
        });
      })
      .catch(() => {
        // Script falhou em carregar (rede/adblock). Não trava UX — o
        // backend ainda exige o token, então o usuário verá o erro ao
        // tentar enviar. Em dev sem secret, passa direto.
        console.warn("Turnstile: falha ao carregar o script");
      });

    return () => {
      cancelled = true;
      const id = turnstileWidgetIdRef.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // ignore
        }
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [turnstileEnabled, success]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    defaultValues: {
      nome: "",
      telefone: "",
      cidade: "",
      mensagem: "",
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    if (turnstileEnabled && !turnstileToken) {
      toast.error("Aguarde a verificação anti-bot ser concluída.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        nome: data.nome.trim(),
        telefone: data.telefone.trim(),
      };
      if (data.cidade?.trim()) payload.cidade = data.cidade.trim();
      if (data.mensagem?.trim()) payload.mensagem = data.mensagem.trim();
      if (turnstileEnabled && turnstileToken) {
        payload["cf-turnstile-response"] = turnstileToken;
      }

      await apiClient.post(
        `/api/public/corretoras/${encodeURIComponent(corretoraSlug)}/leads`,
        payload,
      );
      toast.success("Mensagem enviada! A corretora receberá seu contato.");
      setSuccess(true);
      reset();
      // Token Turnstile é single-use; reset para o caso do usuário reabrir
      // o form via "Enviar outra mensagem".
      setTurnstileToken(null);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao enviar mensagem.").message);
      // Em erro (ex: token expirou), resetamos o widget para o usuário
      // obter um novo token sem precisar recarregar a página.
      setTurnstileToken(null);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="text-base font-semibold text-emerald-900">
          ✅ Mensagem enviada
        </h3>
        <p className="mt-1 text-sm text-emerald-800">
          A {corretoraName} vai receber seu contato por e-mail. Aguarde o
          retorno ou use os canais listados ao lado.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5"
      aria-label={`Formulário de contato com ${corretoraName}`}
    >
      <div>
        <h3 className="text-base font-semibold text-zinc-900">
          Fale com esta corretora
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Envie seus dados e a corretora entrará em contato.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="lead-nome">
          Seu nome *
        </label>
        <input
          id="lead-nome"
          autoComplete="name"
          {...register("nome", {
            required: "Nome é obrigatório.",
            minLength: { value: 3, message: "Mínimo 3 caracteres." },
          })}
          className={inputClass}
          placeholder="Seu nome completo"
        />
        {errors.nome && <p className={errorClass}>{errors.nome.message}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="lead-telefone">
          Telefone / WhatsApp *
        </label>
        <input
          id="lead-telefone"
          inputMode="tel"
          autoComplete="tel"
          {...register("telefone", {
            required: "Telefone é obrigatório.",
            minLength: { value: 8, message: "Telefone muito curto." },
          })}
          className={inputClass}
          placeholder="(33) 9 9999-9999"
        />
        {errors.telefone && (
          <p className={errorClass}>{errors.telefone.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="lead-cidade">
          Cidade
        </label>
        <input
          id="lead-cidade"
          {...register("cidade")}
          className={inputClass}
          placeholder="Onde você produz"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="lead-mensagem">
          Mensagem
        </label>
        <textarea
          id="lead-mensagem"
          rows={4}
          maxLength={1000}
          {...register("mensagem", {
            maxLength: { value: 1000, message: "Máximo 1000 caracteres." },
          })}
          className={inputClass}
          placeholder="Conte brevemente sobre sua produção, volume, tipo de café..."
        />
        {errors.mensagem && (
          <p className={errorClass}>{errors.mensagem.message}</p>
        )}
      </div>

      {turnstileEnabled && (
        <div
          ref={turnstileContainerRef}
          className="flex justify-center"
          aria-label="Verificação anti-bot"
        />
      )}

      <button
        type="submit"
        disabled={submitting || (turnstileEnabled && !turnstileToken)}
        className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Enviando..." : "Enviar mensagem"}
      </button>

      <p className="text-center text-[11px] text-zinc-400">
        Ao enviar, seus dados serão compartilhados apenas com a {corretoraName}.
      </p>
    </form>
  );
}
