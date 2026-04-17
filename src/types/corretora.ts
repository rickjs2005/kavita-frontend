// types/corretora.ts
// Shared types for the Mercado do Café / Corretoras module.

import type { TipoCafe } from "@/lib/regioes";

/** Perfil comercial da corretora: compra, vende ou ambos. */
export type PerfilCompra = "compra" | "venda" | "ambos";

export type PublicCorretora = {
  id: number;
  name: string;
  slug: string;
  contact_name: string;
  description?: string | null;
  logo_path?: string | null;
  city: string;
  state: string;
  region?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  is_featured: boolean | number;
  // Regionalização (Sprint 2) — todos opcionais para compat com registros antigos.
  // cidades_atendidas: array de slugs (não nomes); resolvidos no frontend via getCidadeBySlug.
  // tipos_cafe: array de valores do catálogo TIPOS_CAFE.
  cidades_atendidas?: string[] | null;
  tipos_cafe?: TipoCafe[] | null;
  perfil_compra?: PerfilCompra | null;
  horario_atendimento?: string | null;
  anos_atuacao?: number | null;
  foto_responsavel_path?: string | null;
  // Agregado de reviews aprovadas (Sprint 1 — vitrine rica). Vem do
  // SELECT da camada pública; null quando ainda não há reviews.
  reviews_count?: number | null;
  reviews_avg?: number | null;
  // SLA médio de primeira resposta em segundos, baseado em leads
  // efetivamente respondidos (first_response_seconds não-null).
  // Exibido como "Responde em média Xh" no detalhe quando a amostra
  // é confiável (>= 5 leads respondidos — controlado via UI).
  sla_avg_seconds?: number | null;
  sla_sample_count?: number | null;
};

export type CorretoraAdmin = PublicCorretora & {
  status: "active" | "inactive";
  sort_order: number;
  submission_id?: number | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  // Sprint 4 — soft delete. null quando ativo, timestamp quando
  // arquivado. Lista admin default filtra deleted_at IS NULL.
  deleted_at?: string | null;
};

export type CorretoraSubmission = {
  id: number;
  name: string;
  contact_name: string;
  description?: string | null;
  logo_path?: string | null;
  city: string;
  state: string;
  region?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  corretora_id?: number | null;
  created_at: string;
  updated_at: string;
};

export type CorretoraSubmissionFormData = {
  name: string;
  contact_name: string;
  description: string;
  city: string;
  state: string;
  region: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  senha: string;
  senha_confirmacao: string;
};
