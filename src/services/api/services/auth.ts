// src/services/api/services/auth.ts
// Type-safe service functions for authentication operations.

import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "../endpoints";
import type { UserProfile } from "./users";

export type { UserProfile } from "./users";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  password: string;
  telefone?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

/**
 * Authenticate a user and start a session.
 */
export async function login(payload: LoginPayload): Promise<UserProfile> {
  return apiClient.post<UserProfile>(ENDPOINTS.AUTH.LOGIN, payload);
}

/**
 * End the current session.
 */
export async function logout(): Promise<void> {
  return apiClient.post<void>(ENDPOINTS.AUTH.LOGOUT);
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

/**
 * Register a new user account.
 */
export async function register(payload: RegisterPayload): Promise<UserProfile> {
  return apiClient.post<UserProfile>(ENDPOINTS.AUTH.REGISTER, payload);
}

/**
 * Request a password reset email.
 */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  return apiClient.post<void>(ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
}

/**
 * Complete a password reset using a token.
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  return apiClient.post<void>(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
}
