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

export type DroneComment = {
  id: number;
  display_name: string;
  comment_text: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  media: DroneCommentMedia[];
};

export type PublicDronesPageResponse = {
  page: DronePageSettings | null;
  gallery: DroneGalleryItem[];
  representatives: DroneRepresentative[];
  comments: DroneComment[]; // apenas aprovados
};
