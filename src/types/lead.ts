// src/types/lead.ts

import type {
  ObjetivoContato,
  TipoCafe,
  VolumeRange,
  CanalContato,
} from "@/lib/regioes";

export type LeadStatus = "new" | "contacted" | "closed" | "lost";

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
  status: LeadStatus;
  nota_interna?: string | null;
  created_at: string;
  updated_at: string;
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
  cidade?: string;
  mensagem?: string;
  // Qualificação regional (Sprint 2) — opcionais
  objetivo?: ObjetivoContato;
  tipo_cafe?: TipoCafe;
  volume_range?: VolumeRange;
  canal_preferido?: CanalContato;
};
