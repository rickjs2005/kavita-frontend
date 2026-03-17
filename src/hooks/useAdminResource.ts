"use client";

/**
 * useAdminResource<T>
 *
 * Generic CRUD hook for admin list pages.
 * Handles: fetch, refetch, create, update, remove, loading, saving, error,
 * auth redirect (401/403) and success toasts.
 *
 * Convention (all relative to `endpoint`):
 *   LIST   → GET    endpoint
 *   CREATE → POST   endpoint          body = payload
 *   UPDATE → PUT    endpoint/:id      body = payload
 *   REMOVE → DELETE endpoint/:id
 *
 * Usage:
 *   const { items, loading, saving, error, refetch, create, update, remove } =
 *     useAdminResource<Coupon>({ endpoint: "/api/admin/cupons" });
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { formatApiError } from "@/lib/formatApiError";
import { isApiError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminResourceMessages = {
  /** Toast on successful create. Set false to silence. Default: "Criado com sucesso." */
  created?: string | false;
  /** Toast on successful update. Set false to silence. Default: "Atualizado com sucesso." */
  updated?: string | false;
  /** Toast on successful remove. Set false to silence. Default: "Removido com sucesso." */
  deleted?: string | false;
};

export type AdminResourceOptions<T> = {
  /**
   * Base REST endpoint.
   * e.g. "/api/admin/cupons"
   */
  endpoint: string;

  /**
   * Transform the raw API response into T[].
   * Handles the three most common backend shapes out of the box:
   *   - T[]                → used as-is
   *   - { rows: T[] }      → .rows
   *   - { data: T[] }      → .data
   *   - { items: T[] }     → .items
   * Override when your endpoint uses a different shape.
   */
  select?: (raw: unknown) => T[];

  /** Custom toast messages per operation. */
  messages?: AdminResourceMessages;

  /**
   * Whether to fetch on mount.
   * Set false when you want to trigger `refetch()` manually.
   * Default: true
   */
  fetchOnMount?: boolean;
};

export type AdminResourceResult<T> = {
  /** Current list of items. */
  items: T[];
  /** True while the list is being loaded (initial fetch or refetch). */
  loading: boolean;
  /** True while a create or update request is in flight. */
  saving: boolean;
  /** Non-null when the last list fetch failed. Cleared on the next successful fetch. */
  error: string | null;

  /** Re-runs the list fetch. */
  refetch: () => Promise<void>;

  /** POST endpoint → returns the created item, then refetches the list. */
  create: (payload: unknown) => Promise<T>;

  /** PUT endpoint/:id → returns the updated item, then refetches the list. */
  update: (id: number, payload: unknown) => Promise<T>;

  /** DELETE endpoint/:id → then refetches the list. */
  remove: (id: number) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Handles the 3 most common list-response shapes from this backend:
 *   T[] | { rows: T[] } | { data: T[] } | { items: T[] }
 */
function defaultSelect<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["rows", "data", "items", "results"] as const) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

const DEFAULT_MESSAGES: Required<AdminResourceMessages> = {
  created: "Criado com sucesso.",
  updated: "Atualizado com sucesso.",
  deleted: "Removido com sucesso.",
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminResource<T>(
  options: AdminResourceOptions<T>,
): AdminResourceResult<T> {
  const {
    endpoint,
    select = defaultSelect<T>,
    messages = {},
    fetchOnMount = true,
  } = options;

  const msgs = { ...DEFAULT_MESSAGES, ...messages };

  const { logout } = useAdminAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Auth error handler — stable reference
  // ---------------------------------------------------------------------------
  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch via SWR
  // ---------------------------------------------------------------------------
  const {
    data: rawData,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR(
    fetchOnMount ? endpoint : null,
    (url) => apiClient.get<unknown>(url),
    {
      revalidateOnFocus: false,
      onError(err) {
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          handleUnauthorized();
          return;
        }
        const { message } = formatApiError(err, "Erro ao carregar dados.");
        toast.error(message);
      },
    },
  );

  const items = rawData !== undefined ? select(rawData) : [];
  const error = swrError
    ? (formatApiError(swrError, "Erro ao carregar dados.").message)
    : null;

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------
  const create = useCallback(
    async (payload: unknown): Promise<T> => {
      setSaving(true);
      try {
        const created = await apiClient.post<T>(endpoint, payload);
        if (msgs.created !== false) toast.success(msgs.created as string);
        await mutate();
        return created;
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          handleUnauthorized();
        }
        const { message } = formatApiError(err, "Erro ao criar.");
        toast.error(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [endpoint, msgs, mutate, handleUnauthorized],
  );

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  const update = useCallback(
    async (id: number, payload: unknown): Promise<T> => {
      setSaving(true);
      try {
        const updated = await apiClient.put<T>(`${endpoint}/${id}`, payload);
        if (msgs.updated !== false) toast.success(msgs.updated as string);
        await mutate();
        return updated;
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          handleUnauthorized();
        }
        const { message } = formatApiError(err, "Erro ao atualizar.");
        toast.error(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [endpoint, msgs, mutate, handleUnauthorized],
  );

  // ---------------------------------------------------------------------------
  // Remove
  // ---------------------------------------------------------------------------
  const remove = useCallback(
    async (id: number): Promise<void> => {
      try {
        await apiClient.del(`${endpoint}/${id}`);
        if (msgs.deleted !== false) toast.success(msgs.deleted as string);
        await mutate();
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          handleUnauthorized();
          return;
        }
        const { message } = formatApiError(err, "Erro ao remover.");
        toast.error(message);
        throw err;
      }
    },
    [endpoint, msgs, mutate, handleUnauthorized],
  );

  return { items, loading: isLoading, saving, error, refetch, create, update, remove };
}
