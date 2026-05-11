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

// ─── Auditoria do contrato (Fase 10.5) ──────────────────────────────────────
//
// Espelha o ENUM event_type da migration
// 2026051000000001-create-contract-audit-log.js. Mantém em sync ao
// adicionar tipos novos: a UI lida com `unknown` como fallback (badge
// neutro) para sobreviver a backend mais novo que o front.
export type AuditEventType =
  | "created"
  | "sent_to_signature"
  | "signed"
  | "cancelled"
  | "expired"
  | "blocked_by_plan"
  | "blocked_by_kyc"
  | "downloaded"
  | "webhook_applied"
  | "webhook_blocked"
  | "immutable_blocked";

export type AuditActorType =
  | "admin"
  | "corretora_user"
  | "producer"
  | "system"
  | "webhook";

// Linha bruta retornada por GET /api/admin/contratos/:id/audit-log.
// Espelha o schema do banco (snake_case) — o front converte na UI.
export type ContractAuditEvent = {
  id: number;
  contrato_id: number;
  corretora_id: number | null;
  lead_id: number | null;
  event_type: AuditEventType | string;
  actor_type: AuditActorType | string;
  actor_id: number | null;
  ip: string | null;
  user_agent: string | null;
  previous_status: string | null;
  new_status: string | null;
  provider: string | null;
  provider_document_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

// Labels amigáveis em pt-BR — o que aparece no header de cada linha
// da timeline. Mantém em sync com AuditEventType.
export const AUDIT_EVENT_LABEL: Record<AuditEventType, string> = {
  created: "Contrato criado",
  sent_to_signature: "Enviado para assinatura",
  signed: "Contrato assinado",
  cancelled: "Contrato cancelado",
  expired: "Contrato expirado",
  blocked_by_plan: "Bloqueado por plano",
  blocked_by_kyc: "Bloqueado por KYC",
  downloaded: "PDF baixado",
  webhook_applied: "Webhook aplicado",
  webhook_blocked: "Webhook bloqueado",
  immutable_blocked: "Tentativa em contrato imutável",
};

export const AUDIT_ACTOR_LABEL: Record<AuditActorType, string> = {
  admin: "Admin Kavita",
  corretora_user: "Usuário da corretora",
  producer: "Produtor",
  system: "Sistema",
  webhook: "Webhook (provider)",
};
