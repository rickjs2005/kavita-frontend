// src/types/contrato.ts
//
// Tipos do módulo de contratos (Fase 10.1).

export type ContratoTipo = "disponivel" | "entrega_futura";

export type ContratoStatus =
  | "draft"
  | "sent"
  | "signed"
  | "cancelled"
  | "expired";

export type Contrato = {
  id: number;
  tipo: ContratoTipo;
  status: ContratoStatus;
  pdf_url: string;
  hash_sha256: string;
  qr_verification_token: string;
  sent_at: string | null;
  signed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
};

// Payload dos campos dinâmicos por tipo — espelha schemas/contratoSchemas.js.
export type DataFieldsDisponivel = {
  safra: string;
  bebida_laudo: string;
  quantidade_sacas: number;
  preco_saca: number;
  prazo_pagamento_dias: number;
  nome_armazem_ou_fazenda: string;
  id_amostra?: string | null;
  observacoes?: string | null;
};

export type DataFieldsEntregaFutura = {
  safra: string;
  safra_futura: string;
  bebida_laudo: string;
  quantidade_sacas: number;
  diferencial_basis: number;
  data_referencia_cepea: string; // YYYY-MM-DD
  nome_armazem_ou_fazenda: string;
  id_amostra?: string | null;
  observacoes?: string | null;
};

export type ContratoDataFields = DataFieldsDisponivel | DataFieldsEntregaFutura;

// Resposta da geração (POST /api/corretora/contratos).
export type ContratoCriado = {
  id: number;
  lead_id: number;
  corretora_id: number;
  tipo: ContratoTipo;
  status: ContratoStatus;
  hash_sha256: string;
  qr_verification_token: string;
  numero_externo: string;
  verify_url: string;
};

// Resposta da verificação pública (GET /api/public/verificar-contrato/:token).
export type ContratoPublico = {
  tipo: ContratoTipo;
  status: ContratoStatus;
  hash_sha256: string;
  signed_at: string | null;
  created_at: string;
  corretora: {
    name: string;
    slug: string;
  };
  resumo: {
    safra: string | null;
    quantidade_sacas: number | null;
    produtor_iniciais: string | null;
  };
};

// Resposta do painel do produtor (GET /api/produtor/contratos).
// Inclui dados nested da corretora — projeção pensada pra renderizar
// card sem segunda requisição.
export type ProducerContrato = {
  id: number;
  tipo: ContratoTipo;
  status: ContratoStatus;
  hash_sha256: string;
  qr_verification_token: string;
  has_signed_pdf: boolean;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  corretora: {
    id: number;
    name: string;
    slug: string;
    logo_path: string | null;
  };
  resumo: {
    safra: string | null;
    quantidade_sacas: number | null;
    bebida_laudo: string | null;
    nome_armazem_ou_fazenda: string | null;
  };
};

// UI helpers.
export const CONTRATO_TIPO_LABEL: Record<ContratoTipo, string> = {
  disponivel: "Compra e Venda — Disponível",
  entrega_futura: "Compra e Venda — Entrega Futura",
};

export const CONTRATO_STATUS_LABEL: Record<ContratoStatus, string> = {
  draft: "Rascunho",
  sent: "Aguardando assinatura",
  signed: "Assinado",
  cancelled: "Cancelado",
  expired: "Expirado",
};
