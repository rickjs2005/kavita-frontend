// src/types/corretoraUser.ts

export type CorretoraRole = "owner" | "manager" | "sales" | "viewer";

export type CorretoraUser = {
  id: number;
  nome: string;
  email: string;
  role: CorretoraRole;
  corretora_id: number;
  corretora_name: string;
  corretora_slug: string;
};

/** Membro da equipe (listagem em /painel/corretora/equipe). */
export type CorretoraTeamMember = {
  id: number;
  nome: string;
  email: string;
  role: CorretoraRole;
  is_active: boolean;
  activated: boolean; // password_hash != null
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export const ROLE_LABELS: Record<CorretoraRole, string> = {
  owner: "Dono(a)",
  manager: "Gerente",
  sales: "Comercial",
  viewer: "Visualização",
};

export const ROLE_DESCRIPTIONS: Record<CorretoraRole, string> = {
  owner: "Acesso total. Gerencia equipe, perfil e leads.",
  manager: "Edita perfil e leads. Não gerencia equipe.",
  sales: "Vê e atende leads. Não edita perfil.",
  viewer: "Apenas leitura. Útil para financeiro, contador.",
};

/** Capabilities espelhadas de lib/corretoraPermissions.js (backend). */
const CAPABILITIES: Record<string, CorretoraRole[]> = {
  "leads.view": ["owner", "manager", "sales", "viewer"],
  "leads.update": ["owner", "manager", "sales"],
  "leads.export": ["owner", "manager"],
  "profile.edit": ["owner", "manager"],
  "team.view": ["owner", "manager"],
  "team.invite": ["owner"],
  "team.remove": ["owner"],
  "team.change_role": ["owner"],
};

export function can(
  role: CorretoraRole | null | undefined,
  capability: keyof typeof CAPABILITIES,
): boolean {
  if (!role) return false;
  return CAPABILITIES[capability]?.includes(role) ?? false;
}
