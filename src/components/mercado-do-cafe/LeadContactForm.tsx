"use client";

// src/components/mercado-do-cafe/LeadContactForm.tsx
//
// Formulário público "Fale com esta corretora" — exibido no detalhe.
// Envia para POST /api/public/corretoras/:slug/leads.

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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

// Dark glass inputs — superfície white/[0.05] com ring white/10,
// texto stone-100, placeholder stone-400 (contraste >= 4.5:1 sobre
// o fundo glass), focus ring amber-400. Accent amber-400 é a luz
// de assinatura da página.
//
// Altura mínima 48px no mobile (py-3.5) para alvo de toque confortável.
const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-[15px] text-stone-100 placeholder:text-stone-400 transition-colors hover:bg-white/[0.06] focus:border-amber-400/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/25";

// Select trigger — mesmo chassi do input + pr-11 pra acomodar o
// chevron custom posicionado à direita. appearance-none remove a
// seta nativa em Firefox/Chrome; color-scheme:dark força o popup
// nativo a adotar tema escuro em iOS/Android (evita o bug de
// "texto branco sobre fundo branco" no popup do select).
const selectClass =
  "w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 pr-11 text-[15px] text-stone-100 transition-colors hover:bg-white/[0.06] focus:border-amber-400/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/25 [color-scheme:dark]";

// Quando o value é vazio (placeholder "Selecione..."), o texto fica
// em stone-400 (mesmo nível dos placeholders dos inputs). Assim que
// uma opção é escolhida, o JS remove este className e o texto vira
// stone-100. Implementado via `aria-selected` + atributo custom.
const selectPlaceholderClass = "!text-stone-400";

const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/90";
const helperClass = "mt-1.5 text-[12px] leading-relaxed text-stone-300";
const errorClass = "mt-1.5 text-[11px] font-medium text-red-300";

// Subtítulo de fieldset — hierarquia leve pra agrupar o form em blocos
// temáticos ("Seus dados" / "Seu café" / "Retorno") sem poluir visual.
const fieldsetLegendClass =
  "mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400";
const fieldsetHairlineClass =
  "h-px flex-1 bg-gradient-to-r from-white/15 to-transparent";

// Classes compartilhadas pelos chips (radio pill) e cards de opção.
// Alvo de toque mínimo 40px mobile / 44px desktop. Check visual
// discreto via dot amber que aparece no :checked.
const chipClass =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[13px] font-medium text-stone-200 transition-all hover:bg-white/[0.09] hover:text-stone-50 peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-checked:text-amber-100 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400/60 sm:min-h-[44px]";

const volumeCardClass =
  "flex min-h-[48px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-center text-[13px] font-medium text-stone-200 transition-all hover:bg-white/[0.09] hover:text-stone-50 peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-checked:text-amber-100 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400/60";

// Style inline para <option>. O popup nativo do <select> em iOS/Android
// ignora Tailwind e herda estilo do SO — por isso forçamos via inline
// style. Sem isso, em alguns browsers o texto da lista fica branco
// sobre fundo branco (bug de contraste grave). Com este style, o popup
// nativo vira cinza escuro com texto claro, consistente com o tema.
const OPTION_STYLE: React.CSSProperties = {
  backgroundColor: "#0c0a09", // stone-950
  color: "#f5f5f4", // stone-100
};

// Tempo máximo (ms) que o usuário espera pelo Turnstile antes de
// liberarmos o envio. Cobrimos o cenário de adblock / CSP / rede
// flutuando na CDN da Cloudflare. Se o desafio nunca resolver, o
// backend ainda vai rejeitar o lead (quando TURNSTILE_SECRET_KEY
// estiver setado), mas pelo menos o usuário recebe feedback — em vez
// de ficar com botão travado em disabled pra sempre.
const TURNSTILE_MAX_WAIT_MS = 8000;

export function LeadContactForm({ corretoraSlug, corretoraName }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Turnstile — só entra em ação se houver site key. Sem key, o form
  // funciona como antes (útil em dev local sem credenciais Cloudflare).
  const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Sinaliza "desisti do Turnstile" — libera o submit para o backend
  // decidir. Evita UX travada por bloqueio de CDN/adblock.
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileEnabled) return;
    if (success) return; // form está escondido; widget será remontado

    let cancelled = false;
    setTurnstileFailed(false);

    // Watchdog: se em TURNSTILE_MAX_WAIT_MS o token ainda não chegou,
    // marcamos como "failed" e liberamos o submit.
    const watchdog = setTimeout(() => {
      if (cancelled) return;
      setTurnstileFailed((prev) => {
        if (prev) return prev;
        console.warn(
          "[LeadContactForm] Turnstile não respondeu em tempo hábil. " +
            "Liberando envio — o backend validará via fail-closed se " +
            "TURNSTILE_SECRET_KEY estiver configurado.",
        );
        return true;
      });
    }, TURNSTILE_MAX_WAIT_MS);

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
          callback: (token) => {
            setTurnstileToken(token);
            setTurnstileFailed(false);
          },
          "error-callback": () => {
            setTurnstileToken(null);
            setTurnstileFailed(true);
          },
          "expired-callback": () => setTurnstileToken(null),
        });
      })
      .catch((err) => {
        // Script falhou em carregar (rede/adblock/CSP). Libera o
        // submit — backend fail-closed decide.
        console.warn(
          "[LeadContactForm] Turnstile: falha ao carregar o script.",
          err,
        );
        if (!cancelled) setTurnstileFailed(true);
      });

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
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
    control,
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
      // Sprint 7
      corrego_localidade: "",
      safra_tipo: undefined,
    },
  });

  // Watch do select de cidade — quando vazio, aplicamos a cor de
  // placeholder (stone-400) para manter hierarquia visual igual aos
  // inputs text.
  const cidadeValue = useWatch({ control, name: "cidade" });

  const onSubmit = async (data: LeadFormData) => {
    // Só bloqueia o envio se o Turnstile está habilitado E ainda não
    // respondeu E também não desistiu (turnstileFailed). Com
    // turnstileFailed=true, deixamos o backend decidir (fail-closed
    // se ele tiver secret configurado; sucesso se estivermos em dev).
    if (turnstileEnabled && !turnstileToken && !turnstileFailed) {
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
      // Operação física (Sprint 7)
      if (data.corrego_localidade?.trim()) {
        payload.corrego_localidade = data.corrego_localidade.trim();
      }
      if (data.safra_tipo) payload.safra_tipo = data.safra_tipo;
      if (turnstileEnabled && turnstileToken) {
        payload["cf-turnstile-response"] = turnstileToken;
      }

      await apiClient.post(
        `/api/public/corretoras/${encodeURIComponent(corretoraSlug)}/leads`,
        payload,
      );
      toast.success(
        "Mensagem enviada — a corretora já foi avisada e retorna em breve.",
      );
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
      const ui = formatApiError(err, "Erro ao enviar mensagem.");
      // Log explícito para diagnóstico em produção: status, code e
      // detalhes do ApiError ficam visíveis no DevTools do usuário
      // (e em relatórios de suporte). Sem isso, só víamos o toast.
      console.error("[LeadContactForm] envio falhou:", {
        status: ui.status,
        code: ui.code,
        requestId: ui.requestId,
        message: ui.message,
        raw: err,
      });
      toast.error(ui.message);
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
          Contato enviado
        </h3>
        <p className="relative mt-2 max-w-md text-[15px] leading-relaxed text-stone-300">
          A{" "}
          <strong className="font-semibold text-stone-100">{corretoraName}</strong>{" "}
          já foi avisada e retorna pelo canal que você escolheu. Se tiver
          pressa, chame direto no WhatsApp pelos canais acima.
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
      className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6 md:p-8 lg:p-10"
      aria-label={`Formulário de contato com ${corretoraName}`}
    >
      {/* Top highlight catching amber light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />

      <div className="relative space-y-8 lg:space-y-10">

      {/* ─── 1. Seus dados ─────────────────────────────────────────
          Em lg+, nome e telefone ficam lado a lado (pares naturais).
          Mobile/tablet mantém stack vertical. */}
      <fieldset className="space-y-4 border-0 p-0 lg:space-y-5">
        <legend className={fieldsetLegendClass}>
          <span>Seus dados</span>
          <span aria-hidden className={fieldsetHairlineClass} />
        </legend>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
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
        </div>

        {/* Cidade — select custom com chevron amber.
            As <option> recebem style inline forçando bg stone-950 +
            texto stone-100. Isso resolve o bug do popup nativo em
            iOS/Chrome onde o SO pinta o dropdown em branco e deixa o
            texto invisível. O atributo color-scheme:dark no trigger
            ajuda browsers modernos a adotarem o tema escuro no popup
            também (iOS 15+, Chromium). */}
        <div>
          <label className={labelClass} htmlFor="lead-cidade">
            Sua cidade
          </label>
          <div className="relative">
            <select
              id="lead-cidade"
              {...register("cidade")}
              className={`${selectClass} ${!cidadeValue ? selectPlaceholderClass : ""}`}
              defaultValue=""
            >
              <option value="" style={OPTION_STYLE}>
                Selecione sua cidade
              </option>
              {CIDADES_ZONA_DA_MATA.map((c) => (
                <option key={c.slug} value={c.nome} style={OPTION_STYLE}>
                  {c.nome} — {c.estado}
                </option>
              ))}
              <option value="outra" style={OPTION_STYLE}>
                Outra cidade
              </option>
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-amber-300/80"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </fieldset>

      {/* ─── 2. Seu café ─────────────────────────────────────────── */}
      <fieldset className="space-y-4 border-0 p-0 lg:space-y-5">
        <legend className={fieldsetLegendClass}>
          <span>Seu café</span>
          <span aria-hidden className={fieldsetHairlineClass} />
        </legend>

        {/* Córrego/localidade */}
        <div>
          <label className={labelClass} htmlFor="lead-corrego">
            Córrego ou localidade
          </label>
          <input
            id="lead-corrego"
            {...register("corrego_localidade", {
              maxLength: { value: 120, message: "Máximo 120 caracteres." },
            })}
            className={inputClass}
            placeholder="Ex: Córrego Pedra Bonita"
          />
          <p className={helperClass}>
            Ajuda a identificar a qualidade pela altitude e microrregião.
          </p>
        </div>

        {/* Safra — sempre 2 colunas (mesmo mobile) porque são só 2 opções */}
        <div>
          <label className={labelClass}>Esse café é de qual safra?</label>
          <div className="grid gap-2 grid-cols-2">
            {[
              {
                value: "atual",
                title: "Safra atual",
                desc: "Colheita em andamento",
              },
              {
                value: "remanescente",
                title: "Estoque",
                desc: "Safras anteriores",
              },
            ].map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={opt.value}
                  {...register("safra_tipo")}
                  className="peer sr-only"
                />
                <span className="safra-card relative flex min-h-[64px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition-all hover:bg-white/[0.09] peer-checked:border-amber-400/60 peer-checked:bg-amber-400/15 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400/60 peer-checked:[&_.safra-title]:text-amber-100 peer-checked:[&_.safra-check]:border-amber-400 peer-checked:[&_.safra-check]:bg-amber-400 peer-checked:[&_.safra-check]:text-stone-950">
                  <span className="min-w-0">
                    <span className="safra-title block text-sm font-semibold text-stone-50">
                      {opt.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-stone-300">
                      {opt.desc}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="safra-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-transparent transition-all"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Objetivo */}
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
                <span className={chipClass}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tipo de café */}
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
                <span className={chipClass}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Volume — 2 colunas mobile → 4 colunas a partir de sm.
            Em lg+ mantém 4 colunas com mais gap (respira mais). */}
        <div>
          <label className={labelClass}>Volume estimado (sacas de 60 kg)</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
            {VOLUMES_LEAD.map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={opt.value}
                  {...register("volume_range")}
                  className="peer sr-only"
                />
                <span className={volumeCardClass}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* ─── 3. Retorno ──────────────────────────────────────────── */}
      <fieldset className="space-y-4 border-0 p-0 lg:space-y-5">
        <legend className={fieldsetLegendClass}>
          <span>Retorno</span>
          <span aria-hidden className={fieldsetHairlineClass} />
        </legend>

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
                <span className={chipClass}>{opt.label}</span>
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
      </fieldset>

        {turnstileEnabled && (
          <div
            className="flex flex-col items-center gap-1"
            aria-live="polite"
          >
            <div
              ref={turnstileContainerRef}
              className="flex justify-center"
              aria-label="Verificação anti-bot"
            />
            {!turnstileToken && !turnstileFailed && (
              <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
                Verificação de segurança em andamento…
              </p>
            )}
            {turnstileFailed && (
              <p className="text-[11px] leading-relaxed text-amber-200/80">
                Verificação anti-bot indisponível (possível bloqueador).
                Você ainda pode tentar enviar a mensagem.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            (turnstileEnabled && !turnstileToken && !turnstileFailed)
          }
          className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 hover:shadow-amber-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px] sm:w-auto sm:px-10 lg:h-[56px] lg:px-12 lg:text-[12px]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
          <span className="relative flex items-center gap-2">
            {submitting ? "Enviando..." : "Falar com a corretora"}
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

