// types/corretora.ts
// Shared types for the Mercado do Café / Corretoras module.

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
};

export type CorretoraAdmin = PublicCorretora & {
  status: "active" | "inactive";
  sort_order: number;
  submission_id?: number | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
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
