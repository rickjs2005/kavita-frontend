"use client";

// src/components/mercado-do-cafe/LeadContactForm.tsx
//
// Formulário público "Fale com esta corretora" — exibido no detalhe.
// Envia para POST /api/public/corretoras/:slug/leads.

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import type { LeadFormData } from "@/types/lead";

// Máscara simples de telefone brasileiro. Cliente só; o backend
// normaliza via normalizePhone(). Formatos aceitos:
//   (33) 9 9999-9999  (celular com 9 dígito)
//   (33) 9999-9999    (fixo ou celular antigo)
// Aceita máximo 11 dígitos. Mantém o que o usuário digita até 2
// dígitos de DDD, e só formata a partir daí.
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Fixo / celular antigo: (DD) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Celular 11 dígitos: (DD) 9 XXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// Opções dos novos chips — centralizadas aqui pra facilitar i18n/ajuste
// de copy sem espalhar strings pelo JSX. Copy em pt-BR regional rural.
const URGENCIA_OPTIONS = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mês" },
  { value: "sem_pressa", label: "Sem pressa" },
] as const;

const AMOSTRA_OPTIONS = [
  { value: "sim", label: "Tenho amostra" },
  { value: "nao", label: "Não tenho" },
  { value: "vou_colher", label: "Vou colher em breve" },
] as const;

const LAUDO_OPTIONS = [
  { value: "sim", label: "Já tenho laudo" },
  { value: "nao", label: "Ainda não" },
] as const;

const BEBIDA_OPTIONS = [
  { value: "mole", label: "Mole" },
  { value: "dura", label: "Dura" },
  { value: "riada", label: "Riada" },
  { value: "rio", label: "Rio" },
  { value: "especial", label: "Especial" },
  { value: "nao_sei", label: "Não sei" },
] as const;
import {
  CIDADES_ZONA_DA_MATA,
  OBJETIVOS_CONTATO,
  TIPOS_CAFE,
  VOLUMES_LEAD,
  CANAIS_CONTATO,
} from "@/lib/regioes";
import { getCurrentSafraTipo } from "@/lib/safra";
import { getCorregosSugeridos } from "@/lib/corregos";
import {
  loadLeadDraft,
  saveLeadDraft,
  clearLeadDraft,
} from "@/lib/leadDraft";

type Props = {
  corretoraSlug: string;
  corretoraName: string;
  // FIX #3 — backend sinaliza se SMS_PROVIDER está ativo. Sem ele,
  // escondemos o opt-in pra não prometer SMS que nunca chega.
  smsAvailable?: boolean;
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

// Fail-closed: se o widget não carregar ou falhar, o submit permanece
// travado e o usuário vê orientação para desabilitar bloqueadores. O
// backend (middleware/verifyTurnstile.js) também é fail-closed — não
// queremos brecha acidental em ataque combinado (CDN indisponível +
// spam no form).

export function LeadContactForm({
  corretoraSlug,
  corretoraName,
  smsAvailable = false,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Turnstile — só entra em ação se houver site key. Sem key, o form
  // funciona como antes (útil em dev local sem credenciais Cloudflare).
  const turnstileEnabled = Boolean(TURNSTILE_SITE_KEY);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Mensagem amigável quando a verificação fica indisponível (adblock,
  // CSP, rede). Quando setada, o submit permanece travado.
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileEnabled) return;
    if (success) return; // form está escondido; widget será remontado

    let cancelled = false;
    setTurnstileError(null);

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
            setTurnstileError(null);
          },
          "error-callback": () => {
            setTurnstileToken(null);
            setTurnstileError(
              "A verificação anti-bot falhou. Recarregue a página e tente novamente.",
            );
          },
          "expired-callback": () => setTurnstileToken(null),
        });
      })
      .catch((err) => {
        // Script não carregou (rede/adblock/CSP). Fail-closed: submit
        // permanece travado. Mensagem orienta o usuário a agir.
        console.warn(
          "[LeadContactForm] Turnstile: falha ao carregar o script.",
          err,
        );
        if (!cancelled) {
          setTurnstileError(
            "Para sua segurança, pedimos que desative bloqueadores de script nesta página e recarregue — a verificação anti-bot precisa carregar para concluir o envio.",
          );
        }
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

  // Flag para indicar que rehidratamos com draft do localStorage —
  // habilita o botão "limpar meus dados" no final do form.
  const [hasDraft, setHasDraft] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<LeadFormData>({
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      cidade: "",
      mensagem: "",
      objetivo: undefined,
      tipo_cafe: undefined,
      volume_range: undefined,
      canal_preferido: "whatsapp",
      // Sprint 7
      corrego_localidade: "",
      // Safra pré-selecionada pelo calendário (mai–set = atual). Produtor
      // troca com 1 clique se tiver estoque fora da janela. Reduz fricção
      // sem forçar — segue editável.
      safra_tipo: getCurrentSafraTipo(),
      // Fase 2 — novos campos regionais; todos opcionais exceto consent
      possui_amostra: undefined,
      possui_laudo: undefined,
      bebida_percebida: undefined,
      preco_esperado_saca: undefined,
      urgencia: undefined,
      observacoes: "",
      consentimento_contato: false,
      sms_optin: false,
      website_hp: "",
    },
  });

  // Rehidrata draft salvo do último envio (mesmo browser/produtor).
  // Roda em useEffect — localStorage é client-only. Se houver draft,
  // cada campo é aplicado individualmente via setValue para não
  // sobrescrever o default do safra_tipo calculado pelo calendário.
  useEffect(() => {
    const draft = loadLeadDraft();
    if (!draft) return;
    if (draft.nome) setValue("nome", draft.nome);
    if (draft.telefone) setValue("telefone", draft.telefone);
    if (draft.email) setValue("email", draft.email);
    if (draft.cidade) setValue("cidade", draft.cidade);
    if (draft.canal_preferido) setValue("canal_preferido", draft.canal_preferido);
    setHasDraft(true);
  }, [setValue]);

  // Watch do select de cidade — quando vazio, aplicamos a cor de
  // placeholder (stone-400) para manter hierarquia visual igual aos
  // inputs text. Também alimenta o datalist de córregos sugeridos.
  const cidadeValue = useWatch({ control, name: "cidade" });
  const corregosSugeridos = useMemo(
    () =>
      cidadeValue && cidadeValue !== "outra"
        ? getCorregosSugeridos(cidadeValue)
        : [],
    [cidadeValue],
  );

  const onSubmit = async (data: LeadFormData) => {
    // Fail-closed: sem token válido, não envia. Se o widget ficou
    // indisponível, a mensagem amigável abaixo já orienta o usuário.
    if (turnstileEnabled && !turnstileToken) {
      toast.error(
        turnstileError ?? "Aguarde a verificação anti-bot ser concluída.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string | number | boolean> = {
        nome: data.nome.trim(),
        telefone: data.telefone.trim(),
        consentimento_contato: data.consentimento_contato === true,
      };
      if (data.email?.trim()) payload.email = data.email.trim();
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
      // Fase 2 — campos regionais adicionais
      if (data.urgencia) payload.urgencia = data.urgencia;
      if (data.possui_amostra) payload.possui_amostra = data.possui_amostra;
      if (data.possui_laudo) payload.possui_laudo = data.possui_laudo;
      if (data.bebida_percebida) payload.bebida_percebida = data.bebida_percebida;
      if (
        data.preco_esperado_saca != null &&
        !Number.isNaN(Number(data.preco_esperado_saca)) &&
        Number(data.preco_esperado_saca) > 0
      ) {
        payload.preco_esperado_saca = Number(data.preco_esperado_saca);
      }
      if (data.observacoes?.trim()) payload.observacoes = data.observacoes.trim();
      // ETAPA 3.2 — opt-in SMS
      if (data.sms_optin) payload.sms_optin = true;
      // Honeypot — se preenchido, envia mesmo assim. Backend descarta
      // silenciosamente. Usuário real nunca vê o campo.
      if (data.website_hp?.trim()) payload.website_hp = data.website_hp.trim();
      if (turnstileEnabled && turnstileToken) {
        payload["cf-turnstile-response"] = turnstileToken;
      }

      const res = await apiClient.post<{
        data?: { deduplicated?: boolean };
        message?: string;
      }>(
        `/api/public/corretoras/${encodeURIComponent(corretoraSlug)}/leads`,
        payload,
      );
      if (res?.data?.deduplicated) {
        toast.success(
          "Já recebemos seu contato recentemente — avisamos a corretora que você voltou a chamar.",
        );
      } else {
        toast.success(
          "Mensagem enviada — a corretora já foi avisada e retorna em breve.",
        );
      }
      // Persist draft só no sucesso. Mantém só o que faz sentido
      // reusar em outra corretora (identidade + canal preferido).
      saveLeadDraft({
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        cidade: data.cidade,
        canal_preferido: data.canal_preferido,
      });
      setHasDraft(true);
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
                onChange: (e) => {
                  // Formata enquanto digita — backend normaliza de novo.
                  e.target.value = maskPhone(e.target.value);
                },
              })}
              className={inputClass}
              placeholder="(33) 9 9999-9999"
            />
            {errors.telefone && (
              <p className={errorClass}>{errors.telefone.message}</p>
            )}
          </div>
        </div>

        {/* E-mail opcional — fecha o loop do produtor. Quando preenchido,
            enviamos confirmação "seu interesse foi enviado para X" por
            e-mail. Explicitamente opcional para não afastar quem só quer
            WhatsApp. */}
        <div>
          <label className={labelClass} htmlFor="lead-email">
            E-mail (opcional)
          </label>
          <input
            id="lead-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            {...register("email", {
              maxLength: { value: 200, message: "Máximo 200 caracteres." },
              pattern: {
                value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "E-mail inválido.",
              },
            })}
            className={inputClass}
            placeholder="voce@email.com"
          />
          <p className={helperClass}>
            Se preencher, mandamos uma confirmação de que seu contato chegou
            na corretora.
          </p>
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
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

        {/* Córrego/localidade — com sugestões via <datalist>.
            Sugestões gerais de café especial (Serra do Brigadeiro,
            Pedra Bonita etc.) + cidade-específicas (Alto Manhuaçu
            quando cidade = Manhuaçu). Não restringe o input: é só
            autocomplete — produtor digita livremente. */}
        <div>
          <label className={labelClass} htmlFor="lead-corrego">
            Córrego ou localidade
          </label>
          <input
            id="lead-corrego"
            list="lead-corrego-sugestoes"
            {...register("corrego_localidade", {
              maxLength: { value: 120, message: "Máximo 120 caracteres." },
            })}
            className={inputClass}
            placeholder="Ex: Córrego Pedra Bonita"
            autoComplete="off"
          />
          {corregosSugeridos.length > 0 && (
            <datalist id="lead-corrego-sugestoes">
              {corregosSugeridos.map((termo) => (
                <option key={termo} value={termo} />
              ))}
            </datalist>
          )}
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

        {/* Fase 2 — Amostra disponível. Sinaliza logística pra corretora
            (precisa buscar? já está pronta?). Helpertext regional. */}
        <div>
          <label className={labelClass}>Você já tem amostra?</label>
          <div className="flex flex-wrap gap-2">
            {AMOSTRA_OPTIONS.map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={opt.value}
                  {...register("possui_amostra")}
                  className="peer sr-only"
                />
                <span className={chipClass}>{opt.label}</span>
              </label>
            ))}
          </div>
          <p className={helperClass}>
            Ajuda a corretora a decidir se vai até você buscar ou se você
            leva até a mesa dela.
          </p>
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

        {/* Fase 2 — Urgência. Ajuda a corretora a priorizar. */}
        <div>
          <label className={labelClass}>Qual a pressa?</label>
          <div className="flex flex-wrap gap-2">
            {URGENCIA_OPTIONS.map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={opt.value}
                  {...register("urgencia")}
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

      {/* ─── 4. Mais detalhes (colapsável) ──────────────────────────
          Fica escondido por default pra não pesar o form — produtores
          que não sabem esses termos técnicos nem veem. Quem quer
          passar laudo/classificação/preço clica pra abrir. */}
      <fieldset className="space-y-4 border-0 p-0 lg:space-y-5">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
              Mais detalhes do seu café
            </span>
            <span className="text-[12px] text-stone-300">
              Laudo, bebida, preço esperado — opcional, ajuda a corretora a
              responder com mais precisão.
            </span>
          </span>
          <span
            aria-hidden
            className={`shrink-0 text-amber-300/80 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          >
            <svg
              width="16"
              height="16"
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
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 lg:space-y-5">
            <div>
              <label className={labelClass}>Laudo / classificação</label>
              <div className="flex flex-wrap gap-2">
                {LAUDO_OPTIONS.map((opt) => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("possui_laudo")}
                      className="peer sr-only"
                    />
                    <span className={chipClass}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Bebida (se você já sabe)</label>
              <div className="flex flex-wrap gap-2">
                {BEBIDA_OPTIONS.map((opt) => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("bebida_percebida")}
                      className="peer sr-only"
                    />
                    <span className={chipClass}>{opt.label}</span>
                  </label>
                ))}
              </div>
              <p className={helperClass}>
                Se não tiver certeza, escolha &quot;Não sei&quot; — a
                corretora vai avaliar.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="lead-preco">
                Preço esperado por saca (R$, opcional)
              </label>
              <input
                id="lead-preco"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...register("preco_esperado_saca", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Preço não pode ser negativo." },
                  max: {
                    value: 100000,
                    message: "Valor acima do razoável — confira os dígitos.",
                  },
                })}
                className={inputClass}
                placeholder="Ex: 1250,00"
              />
              {errors.preco_esperado_saca && (
                <p className={errorClass}>
                  {errors.preco_esperado_saca.message as string}
                </p>
              )}
              <p className={helperClass}>
                Serve de balizamento. A corretora sempre vai comparar com a
                cotação do dia.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="lead-observacoes">
                Observações (opcional)
              </label>
              <textarea
                id="lead-observacoes"
                rows={2}
                maxLength={1000}
                {...register("observacoes", {
                  maxLength: { value: 1000, message: "Máximo 1000 caracteres." },
                })}
                className={inputClass}
                placeholder="Detalhes técnicos do lote, prazos, condições de retirada…"
              />
              {errors.observacoes && (
                <p className={errorClass}>
                  {errors.observacoes.message as string}
                </p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      {/* Honeypot — invisível a usuário humano e leitor de tela.
          Posicionado fora do viewport + tabindex=-1 + autocomplete=off
          para que autofill/keyboard-only não o preencham. Bots que
          percorrem todos os inputs cegamente caem aqui. Backend
          (controller) descarta o lead silenciosamente quando preenchido. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-10000px",
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="lead-website-hp">
          Website (não preencher)
          <input
            id="lead-website-hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website_hp")}
          />
        </label>
      </div>

        {/* Consentimento LGPD — obrigatório. Linguagem simples, sem jargão. */}
        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
            <input
              type="checkbox"
              {...register("consentimento_contato", {
                required:
                  "Precisamos da sua autorização para compartilhar com a corretora.",
              })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400/60 focus:ring-offset-0"
            />
            <span className="text-[12px] leading-relaxed text-stone-300">
              Autorizo a Kavita a compartilhar meus dados com{" "}
              <strong className="font-semibold text-stone-100">
                {corretoraName}
              </strong>{" "}
              para tratar do meu café. Posso pedir a exclusão dos dados depois.
            </span>
          </label>
          {errors.consentimento_contato && (
            <p className={errorClass}>
              {errors.consentimento_contato.message as string}
            </p>
          )}
        </div>

        {/* ETAPA 3.2 + FIX #3 — opt-in SMS só renderiza quando o
            backend confirma SMS_PROVIDER ativo. Sem provider, o
            checkbox some: evita o produtor marcar e não receber. */}
        {smsAvailable && (
        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
            <input
              type="checkbox"
              {...register("sms_optin")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400/60 focus:ring-offset-0"
            />
            <span className="text-[12px] leading-relaxed text-stone-300">
              <strong className="font-semibold text-stone-100">
                Quero um SMS
              </strong>{" "}
              quando a corretora visualizar meu contato. Útil se você não
              usa WhatsApp com frequência.
            </span>
          </label>
        </div>
        )}

        {turnstileEnabled && (
          <div
            className="flex flex-col items-center gap-2"
            aria-live="polite"
          >
            <div
              ref={turnstileContainerRef}
              className="flex justify-center"
              aria-label="Verificação anti-bot"
            />
            {!turnstileToken && !turnstileError && (
              <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
                Verificação de segurança em andamento…
              </p>
            )}
            {turnstileError && (
              <p className="max-w-md text-center text-[12px] leading-relaxed text-rose-300">
                {turnstileError}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting || (turnstileEnabled && !turnstileToken)
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

        {/* Limpar dados salvos. Aparece apenas quando de fato existe
            um draft — evita ruído em usuários novos. Limpar é só
            client-side (não toca no lead já enviado). */}
        {hasDraft && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                clearLeadDraft();
                reset({
                  nome: "",
                  telefone: "",
                  email: "",
                  cidade: "",
                  mensagem: "",
                  objetivo: undefined,
                  tipo_cafe: undefined,
                  volume_range: undefined,
                  canal_preferido: "whatsapp",
                  corrego_localidade: "",
                  safra_tipo: getCurrentSafraTipo(),
                  possui_amostra: undefined,
                  possui_laudo: undefined,
                  bebida_percebida: undefined,
                  preco_esperado_saca: undefined,
                  urgencia: undefined,
                  observacoes: "",
                  consentimento_contato: false,
                  website_hp: "",
                });
                setHasDraft(false);
                toast.success("Dados salvos no navegador removidos.");
              }}
              className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-300"
            >
              Limpar meus dados salvos
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

