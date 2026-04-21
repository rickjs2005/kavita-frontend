// src/types/privacy.ts

export type PrivacyRequestType = "export" | "delete";
export type PrivacyRequestStatus =
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "retained";

export type PrivacyRequestSummary = {
  id: number;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  status_reason: string | null;
  requested_at: string;
  processed_at: string | null;
  scheduled_purge_at: string | null;
};

export type MyPrivacyData = {
  conta: {
    id: number;
    email: string;
    nome: string | null;
    cidade: string | null;
    telefone: string | null;
    created_at: string;
    last_login_at: string | null;
    privacy_policy_version: string | null;
    privacy_policy_accepted_at: string | null;
    pending_deletion_at: string | null;
  };
  resumo_tratamentos: {
    leads_enviados: number;
    contratos_vinculados: number;
    contratos_assinados: number;
  };
  exclusao_agendada: {
    id: number;
    requested_at: string;
    scheduled_purge_at: string;
    status: PrivacyRequestStatus;
    dias_restantes: number | null;
  } | null;
  solicitacoes_recentes: PrivacyRequestSummary[];
};
