// src/lib/api/http.ts
// API pública (News etc). Mantida por compatibilidade, mas agora usa apiClient (padrão único).
import { apiClient } from "./apiClient";

export async function apiPublic<T>(path: string, init?: RequestInit): Promise<T> {
  return apiClient.request<T>(path, { ...(init || {}) });
}
