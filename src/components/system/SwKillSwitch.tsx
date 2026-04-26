"use client";

import { useEffect } from "react";

/**
 * Hotfix Fase 5 — kill-switch global do service worker.
 *
 * Localizado em components/system/ (vs motorista/_components/) pra ser
 * importado pelo root layout — SW antigo da Fase 5 foi registrado no
 * escopo "/" (cobre admin tambem), entao o cleanup precisa rodar em
 * qualquer pagina, nao so' /motorista/*.
 *
 * Comportamento:
 *   1. Pula totalmente quando NEXT_PUBLIC_ENABLE_PWA="true" (opt-in real
 *      via env publica). Nesse caso, o SW gerado pelo Serwist toma conta.
 *   2. Caso contrario, ao carregar:
 *      - Lista SWs registrados (qualquer escopo)
 *      - Se houver QUALQUER SW registrado, desregistra todos
 *      - Limpa caches relacionados (motorista, serwist, workbox, next)
 *      - Recarrega 1x se algo foi limpo (HTML servido pelo SW velho
 *        referencia chunks com hash invalido — reload busca HTML novo)
 *      - Guard via sessionStorage evita loop infinito de reload
 *
 * Custo zero quando nao ha SW registrado. Renderiza nada visivel.
 */
export default function SwKillSwitch() {
  useEffect(() => {
    // Pula se PWA esta intencionalmente ativo
    if (process.env.NEXT_PUBLIC_ENABLE_PWA === "true") return;

    // Pula se navegador nao suporta SW
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (cancelled || regs.length === 0) return;

        // Desregistra TODOS os SWs (cobre escopo / e /motorista/)
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));

        // Limpa caches do Serwist/Workbox/Fase 5
        if (typeof caches !== "undefined") {
          try {
            const keys = await caches.keys();
            await Promise.all(
              keys
                .filter(
                  (k) =>
                    k.includes("motorista") ||
                    k.includes("serwist") ||
                    k.includes("workbox") ||
                    k.startsWith("next-"),
                )
                .map((k) => caches.delete(k).catch(() => false)),
            );
          } catch {
            // ignora
          }
        }

        // Reload 1x — guard via sessionStorage pra evitar loop infinito
        try {
          const KEY = "kavita_sw_killswitch_reloaded";
          if (!sessionStorage.getItem(KEY)) {
            sessionStorage.setItem(KEY, "1");
            window.location.reload();
          }
        } catch {
          // sessionStorage indisponivel — sem reload
        }
      } catch {
        // Falha silenciosa — nao trava UI
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
