export type BackendLoginResponse =
  | { token?: string; id?: number | string; nome?: string; email?: string; user?: { id?: number | string; nome?: string; email?: string } }
  | Record<string, unknown>;

export type AuthUser = {
  id?: number | string | null;
  nome?: string | null;
  email?: string | null;
  token?: string | null;
};
