// src/types/drones.ts

export type DronePageSettings = {
  hero_title: string;
  hero_subtitle: string | null;

  hero_video_path: string | null;
  hero_image_fallback_path: string | null;

  cta_title: string | null;
  cta_message_template: string | null;
  cta_button_label: string | null;

  specs_title: string | null;
  specs_items_json: any[] | null;

  features_title: string | null;
  features_items_json: any[] | null;

  benefits_title: string | null;
  benefits_items_json: any[] | null;

  sections_order_json: string[] | null;

  // novo (se você quiser renderizar no público depois)
  models_json: any[] | null;
};

export type DroneGalleryItem = {
  id: number;
  media_type: "IMAGE" | "VIDEO";
  media_path: string;
  caption: string | null;
  sort_order: number;
  is_active: 0 | 1;
  created_at: string;
};

export type DroneRepresentative = {
  id: number;
  name: string;
  whatsapp: string;
  cnpj: string;

  instagram_url: string | null;
  notes: string | null;

  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_uf: string | null;

  sort_order: number;
  is_active: 0 | 1;
  created_at: string;
};

export type DroneCommentMedia = {
  id: number;
  comment_id: number;
  media_type: "IMAGE" | "VIDEO";
  media_path: string;
  created_at: string;
};

export type DroneCommentStatus = "PENDENTE" | "APROVADO" | "REPROVADO";

export type DroneComment = {
  id: number;
  display_name: string;
  comment_text: string;
  status: DroneCommentStatus;
  created_at: string;
  media: DroneCommentMedia[];
};

export type PublicDronesPageResponse = {
  page: DronePageSettings | null;
  gallery: DroneGalleryItem[];
  representatives: DroneRepresentative[];
  comments: DroneComment[]; // apenas aprovados
};

export type DroneLeadStatus =
  | "NOVO"
  | "EM_CONTATO"
  | "NEGOCIACAO"
  | "CONVERTIDO"
  | "PERDIDO";

export type DroneLead = {
  id: number;
  nome: string;
  telefone: string;
  cidade: string | null;
  uf: string | null;
  modelo_interesse: string | null;
  mensagem: string | null;
  origem: string | null;
  status: DroneLeadStatus;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
};

export type DroneFaqItem = {
  id: number;
  question: string;
  answer: string;
  sort_order?: number;
  is_active?: 0 | 1;
};

export type DroneCase = {
  id: number;
  title: string;
  farm_name: string;
  producer_name: string | null;
  city: string | null;
  uf: string | null;
  hectares: number | null;
  model_key: string | null;
  summary: string | null;
  testimonial: string | null;
  cover_image_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  permission_to_use?: 0 | 1;
  sort_order?: number;
  is_active?: 0 | 1;
  created_at?: string;
  updated_at?: string;
};
