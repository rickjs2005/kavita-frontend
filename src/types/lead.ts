// src/types/lead.ts

import type {
  ObjetivoContato,
  TipoCafe,
  VolumeRange,
  CanalContato,
} from "@/lib/regioes";

export type LeadStatus = "new" | "contacted" | "closed" | "lost";

export type SafraTipo = "atual" | "remanescente";

export type AmostraStatus =
  | "nao_entregue"
  | "prometida"
  | "recebida"
  | "laudada";

export type BebidaClassificacao =
  | "especial"
  | "dura"
  | "riado"
  | "rio"
  | "escolha";

export type MercadoIndicado =
  | "exportacao"
  | "mercado_interno"
  | "cafeteria"
  | "commodity"
  | "indefinido";

export type AptidaoOferta = "sim" | "nao" | "parcial";
export type PrioridadeComercial = "alta" | "media" | "baixa";

export type CorretoraLead = {
  id: number;
  corretora_id: number;
  nome: string;
  telefone: string;
  cidade?: string | null;
  mensagem?: string | null;
  // Qualificação regional (Sprint 2)
  objetivo?: ObjetivoContato | null;
  tipo_cafe?: TipoCafe | null;
  volume_range?: VolumeRange | null;
  canal_preferido?: CanalContato | null;
  // Operação física (Sprint 7)
  corrego_localidade?: string | null;
  safra_tipo?: SafraTipo | null;
  amostra_status?: AmostraStatus;
  lote_disponivel?: boolean;
  bebida_classificacao?: BebidaClassificacao | null;
  pontuacao_sca?: number | null;
  preco_referencia_saca?: number | null;
  // Classificação expandida
  umidade_pct?: number | null;
  peneira?: string | null;
  catacao_defeitos?: string | null;
  aspecto_lote?: string | null;
  obs_sensoriais?: string | null;
  obs_comerciais?: string | null;
  mercado_indicado?: MercadoIndicado | null;
  aptidao_oferta?: AptidaoOferta | null;
  prioridade_comercial?: PrioridadeComercial | null;
  altitude_origem?: number | null;
  variedade_cultivar?: string | null;
  status: LeadStatus;
  nota_interna?: string | null;
  created_at: string;
  updated_at: string;
  // Sprint 5 — dedupe por telefone_normalizado dentro da mesma
  // corretora. Sinaliza "este produtor já te procurou antes" no
  // painel. Vem do backend como COUNT(*); 0 quando é o primeiro
  // contato. Isolado por corretora (não vaza entre tenants).
  previous_contacts_count?: number;
};

export type LeadsSummary = {
  total: number;
  new: number;
  contacted: number;
  closed: number;
  lost: number;
};

export type LeadFormData = {
  nome: string;
  telefone: string;
  email?: string;
  cidade?: string;
  mensagem?: string;
  // Qualificação regional (Sprint 2) — opcionais
  objetivo?: ObjetivoContato;
  tipo_cafe?: TipoCafe;
  volume_range?: VolumeRange;
  canal_preferido?: CanalContato;
  // Operação física (Sprint 7) — opcionais
  corrego_localidade?: string;
  safra_tipo?: SafraTipo;
};
