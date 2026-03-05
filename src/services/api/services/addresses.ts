// src/services/api/services/addresses.ts
// Type-safe service functions for user address operations.

import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "../endpoints";

export interface UserAddress {
  id: number;
  apelido: string | null;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  ponto_referencia: string | null;
  telefone: string | null;
  is_default: 0 | 1 | boolean;
}

export interface UserAddressPayload {
  apelido?: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  ponto_referencia?: string;
  telefone?: string;
  is_default?: boolean;
}

/**
 * Get all saved addresses for the authenticated user.
 */
export async function getAddresses(): Promise<UserAddress[]> {
  return apiClient.get<UserAddress[]>(ENDPOINTS.USERS.ADDRESSES);
}

/**
 * Create a new address for the authenticated user.
 */
export async function createAddress(payload: UserAddressPayload): Promise<UserAddress> {
  return apiClient.post<UserAddress>(ENDPOINTS.USERS.ADDRESSES, payload);
}

/**
 * Update an existing address by ID.
 */
export async function updateAddress(id: number, payload: UserAddressPayload): Promise<UserAddress> {
  return apiClient.put<UserAddress>(ENDPOINTS.USERS.ADDRESS(id), payload);
}

/**
 * Delete an address by ID.
 */
export async function deleteAddress(id: number): Promise<void> {
  return apiClient.del<void>(ENDPOINTS.USERS.ADDRESS(id));
}
