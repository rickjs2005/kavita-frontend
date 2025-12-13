// src/lib/api/axiosClient.ts
import axios from "axios";
import { ApiError, type ApiErrorPayload } from "./errors";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Converte qualquer erro do axios para ApiError
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status ?? 0;
    const data = (error?.response?.data || {}) as ApiErrorPayload;

    const requestId =
      data.requestId ||
      error?.response?.headers?.["x-request-id"] ||
      error?.response?.headers?.["request-id"] ||
      undefined;

    const message =
      data.message ||
      (status ? `HTTP ${status}` : "Falha de conexão. Verifique sua internet e tente novamente.");

    throw new ApiError({
      status,
      code: data.code,
      message,
      details: data.details,
      requestId,
    });
  }
);
