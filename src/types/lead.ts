// src/types/lead.ts

export type LeadStatus = "new" | "contacted" | "closed" | "lost";

export type CorretoraLead = {
  id: number;
  corretora_id: number;
  nome: string;
  telefone: string;
  cidade?: string | null;
  mensagem?: string | null;
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
};
