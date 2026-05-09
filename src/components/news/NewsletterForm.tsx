// src/components/news/NewsletterForm.tsx
//
// Form de inscricao da Kavita News. Sem backend ligado ainda — por
// enquanto o submit guarda o e-mail em localStorage como "lista de
// espera" e mostra confirmacao. Quando o endpoint /api/news/subscribe
// for criado, basta trocar `subscribe()` para um POST via apiClient.
//
// O componente nao mente: o copy de sucesso fala "anotamos seu
// interesse", nao "voce esta inscrito".

"use client";

import { useState } from "react";

const STORAGE_KEY = "kavita-news-newsletter-waitlist";

function isValidEmail(v: string) {
  // Pragmatic — RFC5322 completo nao vale a pena no client.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function persistLocally(email: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(email)) list.push(email);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage cheio / bloqueado — silencia, o submit continua valido.
  }
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setErrorMsg("Informe um e-mail valido.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    // Pequena pausa pra UX nao parecer instantanea (evita ar de "fake").
    await new Promise((r) => setTimeout(r, 350));
    persistLocally(trimmed);
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 via-white/[0.04] to-stone-900/0 p-5 ring-1 ring-emerald-400/30 backdrop-blur-sm">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Anotado
        </p>
        <p className="mt-2 text-sm font-semibold text-stone-50">
          Seu interesse foi registrado.
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
          A primeira edicao oficial da Kavita News chega no seu e-mail
          <span className="font-medium text-stone-300"> {email}</span> assim que
          a lista abrir.
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail("");
            setStatus("idle");
          }}
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 hover:text-emerald-200"
        >
          Cadastrar outro e-mail →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative h-full overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06] backdrop-blur-sm"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
      />

      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
        Newsletter
      </p>
      <p className="mt-1.5 text-sm font-semibold text-stone-50">
        Receba a Kavita News
      </p>
      <p className="mt-1 text-xs leading-relaxed text-stone-400">
        As principais noticias e analises do agro direto no seu e-mail, toda
        semana.
      </p>

      <label htmlFor="kavita-news-email" className="sr-only">
        Seu e-mail
      </label>
      <input
        id="kavita-news-email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        placeholder="seu@email.com"
        required
        autoComplete="email"
        disabled={status === "submitting"}
        className="
          mt-3 w-full rounded-lg bg-stone-950/60 px-3 py-2.5 text-sm text-stone-100
          ring-1 ring-white/[0.08] placeholder:text-stone-600
          focus:outline-none focus:ring-2 focus:ring-emerald-400/50
          disabled:opacity-60
        "
      />

      <button
        type="submit"
        disabled={status === "submitting"}
        className="
          mt-2.5 w-full rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600
          px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950
          shadow-lg shadow-emerald-500/30 transition-all
          hover:shadow-emerald-500/50 hover:brightness-110
          disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none
        "
      >
        {status === "submitting" ? "Enviando..." : "Receber newsletter"}
      </button>

      {errorMsg && (
        <p
          role="alert"
          className="mt-2 text-[11px] font-medium text-rose-300"
        >
          {errorMsg}
        </p>
      )}
    </form>
  );
}
