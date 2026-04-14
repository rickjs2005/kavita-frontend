// src/types/producer.ts
//
// Tipos do produtor rural (Lote 1 — retenção).

export type Producer = {
  id: number;
  email: string;
  nome: string | null;
  cidade: string | null;
  telefone: string | null;
  telefone_normalizado: string | null;
};

export type ProducerFavorite = {
  id: number;
  corretora_id: number;
  created_at: string;
  corretora_name: string;
  corretora_slug: string;
  corretora_city: string;
  corretora_state: string;
  corretora_logo: string | null;
  corretora_featured: boolean | number;
};

export type ProducerLeadHistoryItem = {
  id: number;
  cidade: string | null;
  objetivo: string | null;
  tipo_cafe: string | null;
  volume_range: string | null;
  status: "new" | "contacted" | "closed" | "lost";
  amostra_status:
    | "nao_entregue"
    | "prometida"
    | "recebida"
    | "laudada"
    | null;
  lote_disponivel: boolean | number;
  corrego_localidade: string | null;
  safra_tipo: "atual" | "remanescente" | null;
  created_at: string;
  corretora_name: string;
  corretora_slug: string;
  corretora_city: string;
  corretora_logo: string | null;
};

export type ProducerAlert = {
  id: number;
  type: string;
  params: Record<string, unknown> | null;
  channel: "email";
  active: boolean | number;
  last_sent_at: string | null;
  created_at: string;
};
