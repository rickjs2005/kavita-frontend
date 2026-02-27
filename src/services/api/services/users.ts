// src/services/api/services/users.ts
// Type-safe service functions for user profile operations.

import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "../endpoints";

export interface UserProfile {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string | null;
  ponto_referencia?: string | null;
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getMe(): Promise<UserProfile> {
  return apiClient.get<UserProfile>(ENDPOINTS.USERS.ME);
}

/**
 * Update the current user's profile.
 */
export async function updateMe(payload: Partial<UserProfile>): Promise<UserProfile> {
  return apiClient.put<UserProfile>(ENDPOINTS.USERS.ME, payload);
}
