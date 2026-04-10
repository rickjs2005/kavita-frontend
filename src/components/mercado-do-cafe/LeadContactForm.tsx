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
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.02] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/40";
const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600";
const errorClass = "mt-1.5 text-[11px] font-medium text-red-700";

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
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-md shadow-stone-900/[0.05] ring-1 ring-stone-900/[0.06]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
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
        <h3 className="mt-3 text-base font-semibold text-stone-900">
          Mensagem enviada
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          A <strong className="text-stone-900">{corretoraName}</strong> vai
          receber seu contato por e-mail e pelo painel privado dela. Aguarde
          o retorno ou use os canais diretos listados ao lado.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 hover:text-emerald-900"
        >
          Enviar outra mensagem
          <span aria-hidden>→</span>
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-md shadow-stone-900/[0.05] ring-1 ring-stone-900/[0.06] md:p-6"
      aria-label={`Formulário de contato com ${corretoraName}`}
    >
      {/* Top highlight — catching light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
      />

      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
          Fale com esta corretora
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-stone-900">
          Envie uma mensagem direta
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          Seu contato chega no painel da corretora e por e-mail. Resposta
          pelos canais oficiais dela.
        </p>
      </div>

      <div className="space-y-4">

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
          className="group relative h-11 w-full overflow-hidden rounded-xl bg-stone-900 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-900/20 transition-colors hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
          <span className="relative">
            {submitting ? "Enviando..." : "Enviar mensagem"}
          </span>
        </button>

        <p className="text-center text-[10px] text-stone-400">
          Ao enviar, seus dados serão compartilhados apenas com a{" "}
          <span className="font-medium text-stone-500">{corretoraName}</span>.
        </p>
      </div>
    </form>
  );
}
