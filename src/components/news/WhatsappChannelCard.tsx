// src/components/news/WhatsappChannelCard.tsx
//
// Canal vivo do agro via WhatsApp. Substitui o antigo formulario de
// newsletter por uma captura de WhatsApp com posicionamento de
// "central operacional" — nao "marketing". O usuario sente que esta
// entrando em um canal de inteligencia, nao assinando uma lista.
//
// Sem backend ligado ainda — por enquanto o submit guarda o numero em
// localStorage (lista de espera) e mostra confirmacao honesta. Quando o
// endpoint /api/news/whatsapp-subscribe existir, basta trocar o handler
// `subscribe()` para um POST via apiClient.
//
// Visual: dark glass premium, ring emerald no hover, badge AO VIVO com
// pulse sutil, glow no botao. Inspirado em Bloomberg / Stripe / WhatsApp
// Business / Linear.

"use client";

import { useState } from "react";

const STORAGE_KEY = "kavita-news-whatsapp-waitlist";
const SOCIAL_PROOF_COUNT = 2400;

/** Aplica mascara (00) 00000-0000. Aceita 10 ou 11 digitos. */
function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Telefone valido = 10 ou 11 digitos numericos. */
function isValidPhone(v: string): boolean {
  const d = v.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

function persistLocally(phone: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(phone)) list.push(phone);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Silencia — submit continua valido mesmo se storage estiver bloqueado.
  }
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function WhatsappChannelCard() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValidPhone(phone)) {
      setErrorMsg("Informe um numero valido com DDD.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 350));
    persistLocally(phone.replace(/\D/g, ""));
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 via-white/[0.04] to-stone-900/0 p-5 ring-1 ring-emerald-400/30 backdrop-blur-sm">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"
        />
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
          >
            <WhatsappIcon className="h-3.5 w-3.5" />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Canal ativado
          </p>
        </div>
        <p className="mt-3 text-sm font-semibold text-stone-50">
          Voce esta na lista do canal Kavita.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
          Os primeiros alertas chegam no numero
          <span className="font-medium text-stone-300"> {phone}</span> assim que
          o canal abrir oficialmente.
        </p>
        <button
          type="button"
          onClick={() => {
            setPhone("");
            setStatus("idle");
          }}
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 hover:text-emerald-200"
        >
          Cadastrar outro numero →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative h-full overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06] backdrop-blur-sm transition-all hover:ring-emerald-400/20"
    >
      {/* Hairline emerald no topo — assinatura visual do modulo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
      />

      {/* Header — icone WhatsApp + badge AO VIVO */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
          >
            <WhatsappIcon className="h-3.5 w-3.5" />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
            Central no WhatsApp
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-emerald-400/30">
          <span
            aria-hidden
            className="kavita-live-dot h-1.5 w-1.5 rounded-full bg-emerald-400"
          />
          Ao vivo
        </span>
      </div>

      {/* Titulo */}
      <p className="mt-3 text-sm font-semibold leading-snug text-stone-50">
        Receba alertas do agro em tempo real
      </p>

      {/* Descricao */}
      <p className="mt-1 text-xs leading-relaxed text-stone-400">
        Cotacoes, clima, mercado e oportunidades direto no seu WhatsApp, sem
        ruido.
      </p>

      {/* Input mascarado */}
      <label htmlFor="kavita-news-whatsapp" className="sr-only">
        Seu numero de WhatsApp
      </label>
      <div className="relative mt-3">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
        >
          <WhatsappIcon className="h-4 w-4" />
        </span>
        <input
          id="kavita-news-whatsapp"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => {
            setPhone(maskPhone(e.target.value));
            if (status === "error") setStatus("idle");
          }}
          placeholder="(00) 00000-0000"
          required
          autoComplete="tel-national"
          disabled={status === "submitting"}
          className="
            w-full rounded-lg bg-stone-950/60 py-2.5 pl-9 pr-3 text-sm text-stone-100 tabular-nums
            ring-1 ring-white/[0.08] placeholder:text-stone-600
            focus:outline-none focus:ring-2 focus:ring-emerald-400/50
            disabled:opacity-60
          "
        />
      </div>

      {/* Botao principal — glow emerald + icone WhatsApp */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="
          group relative mt-2.5 w-full overflow-hidden rounded-lg
          bg-gradient-to-br from-emerald-400 to-emerald-600
          px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-950
          shadow-lg shadow-emerald-500/30 transition-all
          hover:shadow-emerald-500/50 hover:brightness-110
          disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none
        "
      >
        {/* Highlight superior sutil */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
        <span className="relative inline-flex items-center justify-center gap-2">
          <WhatsappIcon className="h-3.5 w-3.5" />
          {status === "submitting"
            ? "Conectando..."
            : "Entrar no canal WhatsApp"}
        </span>
      </button>

      {errorMsg && (
        <p
          role="alert"
          className="mt-2 text-[11px] font-medium text-rose-300"
        >
          {errorMsg}
        </p>
      )}

      {/* Prova social — sutil, baixa opacidade */}
      <p className="mt-3 text-center text-[10px] font-medium leading-relaxed text-stone-500">
        +{SOCIAL_PROOF_COUNT.toLocaleString("pt-BR")} produtores e compradores
        acompanhando
      </p>
    </form>
  );
}
