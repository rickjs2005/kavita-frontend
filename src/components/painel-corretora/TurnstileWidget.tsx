"use client";

// src/components/painel-corretora/TurnstileWidget.tsx
//
// Widget Cloudflare Turnstile encapsulado para reuso nos formulários
// de autenticação da corretora (login, esqueci-senha, resetar-senha).
//
// Comportamento fail-closed: se o script não carregar (adblock/CSP) ou
// o desafio falhar, reporta o erro via `onError` e o pai mantém o
// submit bloqueado. Nunca libera o envio automaticamente.
//
// Contratos:
//   - Disparamos `onToken(token | null)` em callback/expiração.
//   - Disparamos `onError(msg | null)` em falhas de carregamento/desafio.
//   - Expomos `reset()` via ref para reiniciar após envio bem-sucedido
//     ou erro do backend (token é single-use).
//
// Quando `NEXT_PUBLIC_TURNSTILE_SITE_KEY` não existe (dev sem
// credenciais), renderiza null e o pai trata como "Turnstile desabilitado".

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

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

export type TurnstileHandle = {
  reset: () => void;
};

type Props = {
  onToken: (token: string | null) => void;
  onError: (message: string | null) => void;
  theme?: "light" | "dark";
  className?: string;
};

export const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);

export const TurnstileWidget = forwardRef<TurnstileHandle, Props>(
  function TurnstileWidget({ onToken, onError, theme = "light", className }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          const id = widgetIdRef.current;
          if (id && window.turnstile) {
            try {
              window.turnstile.reset(id);
            } catch {
              // ignore
            }
          }
        },
      }),
      [],
    );

    useEffect(() => {
      if (!TURNSTILE_ENABLED) return;

      let cancelled = false;
      onError(null);

      loadTurnstileScript()
        .then(() => {
          if (cancelled) return;
          const container = containerRef.current;
          if (!container || !window.turnstile) return;
          if (widgetIdRef.current) return;

          widgetIdRef.current = window.turnstile.render(container, {
            sitekey: TURNSTILE_SITE_KEY,
            theme,
            callback: (token) => {
              onToken(token);
              onError(null);
            },
            "error-callback": () => {
              onToken(null);
              onError(
                "A verificação anti-bot falhou. Recarregue a página e tente novamente.",
              );
            },
            "expired-callback": () => onToken(null),
          });
        })
        .catch((err) => {
          console.warn("[TurnstileWidget] falha ao carregar o script.", err);
          if (!cancelled) {
            onError(
              "Para sua segurança, desative bloqueadores de script nesta página e recarregue — a verificação anti-bot precisa carregar.",
            );
          }
        });

      return () => {
        cancelled = true;
        const id = widgetIdRef.current;
        if (id && window.turnstile) {
          try {
            window.turnstile.remove(id);
          } catch {
            // ignore
          }
        }
        widgetIdRef.current = null;
      };
      // onToken/onError intencionalmente fora do deps: são callbacks do
      // pai e não devem reinicializar o widget a cada render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme]);

    if (!TURNSTILE_ENABLED) return null;

    return (
      <div
        ref={containerRef}
        className={className ?? "flex justify-center"}
        aria-label="Verificação anti-bot"
      />
    );
  },
);
