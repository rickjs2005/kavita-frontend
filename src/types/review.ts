// src/types/review.ts

export type ReviewStatus = "pending" | "approved" | "rejected";

/** Review pública (listagem em /mercado-do-cafe/corretoras/[slug]). */
export type PublicCorretoraReview = {
  id: number;
  nome_autor: string;
  cidade_autor: string | null;
  rating: number; // 1-5
  comentario: string | null;
  verified_lead: boolean;
  created_at: string;
  // Sprint 8 — resposta pública da corretora (opcional, texto livre).
  // Aparece abaixo da review original quando presente. replied_by não
  // é exposto no público para evitar expor operação interna do tenant.
  corretora_reply: string | null;
  replied_at: string | null;
};

/** Review no painel da própria corretora (gestão de reply). */
export type PanelCorretoraReview = PublicCorretoraReview & {
  replied_by: number | null;
};

export type PublicReviewsResponse = {
  reviews: PublicCorretoraReview[];
  aggregate: {
    total: number;
    average: number | null;
  };
};

/** Review completa (painel admin de moderação). */
export type AdminCorretoraReview = {
  id: number;
  corretora_id: number;
  lead_id: number | null;
  nome_autor: string;
  cidade_autor: string | null;
  rating: number;
  comentario: string | null;
  status: ReviewStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  source_ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  // Join com corretora
  corretora_name: string;
  corretora_slug: string;
  corretora_city: string;
};

export type ReviewFormData = {
  nome_autor: string;
  cidade_autor: string;
  rating: number;
  comentario: string;
};
