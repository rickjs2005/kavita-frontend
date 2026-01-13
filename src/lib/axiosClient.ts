// src/lib/axiosClient.ts
// DEPRECADO: não usar em código novo.
// Mantido temporariamente para migração gradual. Internamente, delega ao apiClient (fetch).
// Quando terminar a migração, remova este arquivo e o axios do bundle.

import apiClient, { type ApiRequestOptions } from "./apiClient";

// Interface mínima compatível com uso mais comum (api.get/post/put/delete).
// Se você estava usando recursos avançados do axios (interceptors/cancel token),
// migre para apiClient.request com AbortController.
export const api = {
  get: <T = any>(url: string, config?: ApiRequestOptions) => apiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: ApiRequestOptions) => apiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: ApiRequestOptions) => apiClient.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: ApiRequestOptions) => apiClient.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: ApiRequestOptions) => apiClient.del<T>(url, config),
};

export default api;
