// src/types/auth.ts
//
// NOTA: Os tipos de auth canônicos agora são derivados dos schemas Zod em src/lib/schemas/api.ts.
// Use AuthUserData e AdminUserData de lá para novos consumidores.
//
// Este arquivo mantém apenas tipos de envelope de request/response para compatibilidade
// com pontos que ainda precisam de migração.

/** Payload enviado ao POST /api/login */
export type LoginRequestPayload = {
  email: string;
  senha: string;
};

/** Payload enviado ao POST /api/users/register */
export type RegisterRequestPayload = {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
};

// REMOVIDO: BackendLoginResponse e AuthUser permissivos (token, id: string|number|null, etc.)
// Esses tipos deixavam o compilador aceitar shapes inválidos silenciosamente.
// Use AuthUserData de src/lib/schemas/api.ts como tipo de usuário autenticado.
