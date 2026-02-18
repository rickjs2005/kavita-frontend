// src/lib/api.ts
// Legado: mantido apenas para compatibilidade. Prefira usar apiClient.ts.
// Isso evita divergência de credentials/erros.

import { apiClient } from "./apiClient";

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  return apiClient.request<T>(path, { ...(init || {}) });
}
