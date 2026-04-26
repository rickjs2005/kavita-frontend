// Fase 5 — Service Worker dedicado ao painel /motorista/*.
//
// Estrategias:
//   - Navegacao /motorista/*: NetworkFirst (rede preferida; cache fallback
//     quando offline).
//   - Assets estaticos do Next: StaleWhileRevalidate (rapido + atualiza
//     em background).
//   - Imagens, JSON, fontes: cache padrao do Serwist.
//
// O que NAO e' cacheado:
//   - /api/* (sempre rede; falha vai pra fila offline do localStorage).
//   - /admin/* (admin precisa de dados frescos; PWA so' atende motorista).
//
// Sem prompt de install — registra silenciosamente. Para habilitar
// "Adicionar a tela inicial", basta o navegador detectar manifest.json.

/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, NetworkOnly } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // /api/* SEMPRE rede — fila offline ja cobre via localStorage
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    // /admin/* nao deve ser cacheado pelo SW do motorista
    {
      matcher: ({ url }) => url.pathname.startsWith("/admin/"),
      handler: new NetworkOnly(),
    },
    // Navegacao do painel motorista — NetworkFirst com fallback cache
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" && url.pathname.startsWith("/motorista"),
      handler: new NetworkFirst({
        cacheName: "motorista-pages",
        networkTimeoutSeconds: 4,
      }),
    },
    // Assets do Next + tudo o mais — usa estrategias padrao do Serwist
    ...defaultCache,
  ],
});

serwist.addEventListeners();
