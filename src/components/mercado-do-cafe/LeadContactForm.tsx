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
import {
  CIDADES_ZONA_DA_MATA,
  OBJETIVOS_CONTATO,
  TIPOS_CAFE,
  VOLUMES_LEAD,
  CANAIS_CONTATO,
} from "@/lib/regioes";

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

// Dark glass inputs: superfície white/[0.05] com ring white/10,
// texto stone-100, placeholder stone-500, focus ring amber-400/50.
// O hover/focus puxa a luz amber-400 que é o accent de assinatura
// da página dark committed.
const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-stone-100 placeholder:text-stone-500 transition-colors focus:border-amber-400/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/25";
const labelClass =
  "mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80";
const errorClass = "mt-1.5 text-[11px] font-medium text-red-300";

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
      objetivo: undefined,
      tipo_cafe: undefined,
      volume_range: undefined,
      canal_preferido: "whatsapp",
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
      // Qualificação regional (opcional mas transmitida quando preenchida)
      if (data.objetivo) payload.objetivo = data.objetivo;
      if (data.tipo_cafe) payload.tipo_cafe = data.tipo_cafe;
      if (data.volume_range) payload.volume_range = data.volume_range;
      if (data.canal_preferido) payload.canal_preferido = data.canal_preferido;
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
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-8 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-10">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
        />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-6 w-6"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="relative mt-5 text-xl font-semibold tracking-tight text-stone-50 md:text-2xl">
          Mensagem enviada
        </h3>
        <p className="relative mt-2 max-w-md text-[15px] leading-relaxed text-stone-300">
          A <strong className="font-semibold text-stone-100">{corretoraName}</strong>{" "}
          vai receber seu contato por e-mail e pelo painel privado dela.
          Aguarde o retorno ou use os canais diretos listados acima.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="relative mt-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300 hover:text-amber-200"
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
      className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-8"
      aria-label={`Formulário de contato com ${corretoraName}`}
    >
      {/* Top highlight catching amber light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />

      <div className="relative space-y-5">

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

      {/* Cidade — select com catálogo da Zona da Mata + "Outra" para
          permitir produtores de municípios fora do catálogo. */}
      <div>
        <label className={labelClass} htmlFor="lead-cidade">
          Sua cidade
        </label>
        <select
          id="lead-cidade"
          {...register("cidade")}
          className={inputClass}
          defaultValue=""
        >
          <option value="">Selecione sua cidade</option>
          {CIDADES_ZONA_DA_MATA.map((c) => (
            <option key={c.slug} value={c.nome}>
              {c.nome} — {c.estado}
            </option>
          ))}
          <option value="outra">Outra cidade</option>
        </select>
      </div>

      {/* Objetivo do contato (qualificação 1 de 3) */}
      <div>
        <label className={labelClass}>Qual seu objetivo?</label>
        <div className="flex flex-wrap gap-2">
          {OBJETIVOS_CONTATO.map((opt) => (
            <label
              key={opt.value}
              className="group relative cursor-pointer"
            >
              <input
                type="radio"
                value={opt.value}
                {...register("objetivo")}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-stone-300 transition-all hover:bg-white/[0.08] peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-checked:text-amber-200">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipo de café (qualificação 2 de 3) */}
      <div>
        <label className={labelClass}>Tipo de café</label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_CAFE.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                {...register("tipo_cafe")}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-stone-300 transition-all hover:bg-white/[0.08] peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-checked:text-amber-200">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Volume estimado (qualificação 3 de 3) */}
      <div>
        <label className={labelClass}>Volume estimado (sacas de 60 kg)</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VOLUMES_LEAD.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                {...register("volume_range")}
                className="peer sr-only"
              />
              <span className="block rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center text-xs font-medium text-stone-300 transition-all hover:bg-white/[0.08] peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-checked:text-amber-200">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Canal preferido de retorno */}
      <div>
        <label className={labelClass}>Prefere receber retorno por</label>
        <div className="flex flex-wrap gap-2">
          {CANAIS_CONTATO.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                {...register("canal_preferido")}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-stone-300 transition-all hover:bg-white/[0.08] peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-checked:text-amber-200">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="lead-mensagem">
          Mensagem (opcional)
        </label>
        <textarea
          id="lead-mensagem"
          rows={3}
          maxLength={1000}
          {...register("mensagem", {
            maxLength: { value: 1000, message: "Máximo 1000 caracteres." },
          })}
          className={inputClass}
          placeholder="Algum detalhe extra sobre sua produção ou necessidade..."
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
          className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 hover:shadow-amber-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
          <span className="relative flex items-center gap-2">
            {submitting ? "Enviando..." : "Enviar mensagem"}
            {!submitting && (
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            )}
          </span>
        </button>
      </div>
    </form>
  );
}
