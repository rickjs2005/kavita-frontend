// src/lib/rotas/offline.ts
//
// Fila offline minima para o motorista. Sem service worker, sem PWA.
// Soluciona 90% do caso rural com ~150 linhas de JS.
//
// Como funciona:
//   1. Cada acao mutativa (entregue/problema/posicao/abrir) tenta POST
//      imediato com Idempotency-Key (UUID v4 gerado no cliente).
//   2. Se a request falhar por rede ou timeout, enfileira em
//      localStorage.
//   3. Quando voltar online (event 'online' OU manual), replay envia
//      cada item da fila com a MESMA Idempotency-Key.
//   4. Backend (motorista_idempotency_keys) deduplica — replay e' seguro.

import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";

const STORAGE_KEY = "kavita_motorista_pending_actions_v1";
const ROTA_CACHE_KEY = "kavita_motorista_rota_v1";
const HEADER_KEY = "x-idempotency-key";

export interface PendingAction {
  idempotencyKey: string;
  endpoint: string; // ex: /api/motorista/paradas/123/entregue
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload?: unknown;
  /** Timestamp de quando entrou na fila. */
  enqueuedAt: number;
  /** N de tentativas (informacional). */
  tries: number;
  /** Description curta pra mostrar no banner. */
  label: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function safeUuid(): string {
  if (isBrowser() && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  // Fallback simples (suficiente pro motorista, e' apenas dedup)
  return "mfx-" + Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

export function readQueue(): PendingAction[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PendingAction[];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingAction[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // QuotaExceeded ou similar — ignora; pior caso fila perde, mas
    // nao quebra a UI.
  }
  notifyListeners();
}

function enqueue(action: PendingAction) {
  const all = readQueue();
  all.push(action);
  writeQueue(all);
}

function dequeueByKey(key: string) {
  const all = readQueue().filter((a) => a.idempotencyKey !== key);
  writeQueue(all);
}

function bumpTries(key: string) {
  const all = readQueue().map((a) =>
    a.idempotencyKey === key ? { ...a, tries: a.tries + 1 } : a,
  );
  writeQueue(all);
}

// ---------------------------------------------------------------------------
// Listeners para banner pendente
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();

export function subscribeQueue(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // ignora
    }
  });
}

// ---------------------------------------------------------------------------
// Cache da rota inteira (pra abrir mesmo offline)
// ---------------------------------------------------------------------------

export function cacheRota<T = unknown>(rota: T) {
  if (!isBrowser() || !rota) return;
  try {
    localStorage.setItem(ROTA_CACHE_KEY, JSON.stringify(rota));
  } catch {
    // ignora
  }
}

export function readCachedRota<T = unknown>(): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(ROTA_CACHE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearCachedRota() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(ROTA_CACHE_KEY);
  } catch {
    // ignora
  }
}

// ---------------------------------------------------------------------------
// Execucao com fila offline
// ---------------------------------------------------------------------------

/**
 * E' considerado "erro de rede" o que justifica enfileirar:
 *   - status === 0 (sem resposta — TIMEOUT, offline)
 *   - !navigator.onLine antes de tentar
 * 4xx/5xx voltam pelo throw normal (erro de logica, nao de conexao).
 */
function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 0 || err.code === "TIMEOUT";
  }
  // TypeError do fetch quando offline
  return err instanceof TypeError;
}

export interface ExecuteOptions<T> {
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  payload?: unknown;
  /** Texto curto pra mostrar no banner ("Marcar entregue parada #123"). */
  label: string;
  /**
   * Quando true (default), enfileira em caso de erro de rede.
   * Quando false, o erro e' propagado mesmo offline.
   */
  enqueueOnNetworkError?: boolean;
}

export interface ExecuteResult<T> {
  data: T | null;
  enqueued: boolean;
  idempotencyKey: string;
}

/**
 * Tenta executar uma acao mutativa do motorista. Em caso de falha de
 * rede, enfileira pro replay automatico depois.
 */
export async function executeWithOffline<T = unknown>(
  opts: ExecuteOptions<T>,
): Promise<ExecuteResult<T>> {
  const idempotencyKey = safeUuid();
  const method = opts.method ?? "POST";
  const enqueueOnNetwork = opts.enqueueOnNetworkError !== false;

  // Pre-check: navigator.onLine === false -> nem tenta, enfileira direto
  if (isBrowser() && !navigator.onLine && enqueueOnNetwork) {
    enqueue({
      idempotencyKey,
      endpoint: opts.endpoint,
      method,
      payload: opts.payload,
      enqueuedAt: Date.now(),
      tries: 0,
      label: opts.label,
    });
    return { data: null, enqueued: true, idempotencyKey };
  }

  try {
    const data = await apiClient.request<T>(opts.endpoint, {
      method,
      body: opts.payload as BodyInit | null | undefined,
      headers: { [HEADER_KEY]: idempotencyKey },
    });
    return { data, enqueued: false, idempotencyKey };
  } catch (err) {
    if (enqueueOnNetwork && isNetworkError(err)) {
      enqueue({
        idempotencyKey,
        endpoint: opts.endpoint,
        method,
        payload: opts.payload,
        enqueuedAt: Date.now(),
        tries: 0,
        label: opts.label,
      });
      return { data: null, enqueued: true, idempotencyKey };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Replay
// ---------------------------------------------------------------------------

let _replaying = false;

export async function replayQueue(): Promise<{
  processed: number;
  remaining: number;
}> {
  if (!isBrowser() || _replaying) {
    return { processed: 0, remaining: readQueue().length };
  }
  _replaying = true;
  let processed = 0;
  try {
    const initial = readQueue();
    for (const action of initial) {
      try {
        bumpTries(action.idempotencyKey);
        await apiClient.request(action.endpoint, {
          method: action.method,
          body: action.payload as BodyInit | null | undefined,
          headers: { [HEADER_KEY]: action.idempotencyKey },
        });
        // Sucesso (ou replay com chave conhecida -> backend devolve idempotente).
        dequeueByKey(action.idempotencyKey);
        processed += 1;
      } catch (err) {
        if (isNetworkError(err)) {
          // Continua offline, para o loop pra evitar drenar bateria
          break;
        }
        // 4xx (ex: parada nao existe mais) — drop pra evitar loop infinito.
        // Backend deveria responder 200 num replay legitimo via
        // motorista_idempotency_keys; se vier 4xx, e' algo de logica
        // (rota cancelada etc.). Removemos do queue.
        dequeueByKey(action.idempotencyKey);
        processed += 1;
      }
    }
  } finally {
    _replaying = false;
  }
  return { processed, remaining: readQueue().length };
}

// ---------------------------------------------------------------------------
// Auto-replay quando volta online (registrar 1x no client)
// ---------------------------------------------------------------------------

let _registered = false;

export function registerOnlineReplayer() {
  if (!isBrowser() || _registered) return;
  _registered = true;
  window.addEventListener("online", () => {
    void replayQueue();
  });
}

export const _internal = { STORAGE_KEY, ROTA_CACHE_KEY, HEADER_KEY };
