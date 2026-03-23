// Canonical admin-domain types used across the entire application.
// Import from here rather than defining locally in pages or contexts.

import type { OrderAddress } from "./address";

// ---------------------------------------------------------------------------
// Auth / roles
// ---------------------------------------------------------------------------

export type AdminRole =
  | "master"
  | "gerente"
  | "suporte"
  | "leitura"
  | (string & {});

/** Admin staff member (the authenticated operator). */
export type AdminUser = {
  id: number;
  nome: string;
  email: string;
  role: AdminRole;
  role_id: number | null;
};

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

/**
 * Merged log row covering both the compact dashboard endpoint
 * (/api/admin/logs?limit=20) and the full logs page endpoint.
 * Fields only present in the full response are optional.
 */
export type AdminLog = {
  id: number;
  admin_nome: string;
  admin_email?: string;
  acao: string;
  entidade?: string;
  entidade_id?: number | null;
  detalhes?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  criado_em: string;
};

// ---------------------------------------------------------------------------
// Team management
// ---------------------------------------------------------------------------

/** Admin staff row in the /admin/equipe listing. */
export type AdminRow = {
  id: number;
  nome: string;
  email: string;
  role: AdminRole | string;
  ativo: 0 | 1;
  criado_em: string;
  ultimo_login: string | null;
};

/** Role definition row returned by the roles endpoint. */
export type RoleRow = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
};

// ---------------------------------------------------------------------------
// Customer management
// ---------------------------------------------------------------------------

export type StatusConta = "ativo" | "bloqueado" | null;

/** Customer row in the /admin/clientes listing. */
export type CustomerRow = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  cidade?: string | null;
  estado?: string | null;
  status_conta?: StatusConta;
};

/** Full customer record in the /admin/clientes/[id] detail page. */
export type CustomerDetail = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string | null;
  ponto_referencia?: string | null;
  status_conta?: StatusConta;
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type StatusPagamento = "pendente" | "pago" | "falhou" | "estornado";

export type StatusEntrega =
  | "em_separacao"
  | "processando"
  | "enviado"
  | "entregue"
  | "cancelado";

export type PedidoItem = {
  produto: string;
  quantidade: number;
  preco_unitario: number;
};

/** Order row in the /admin/pedidos listing. */
export type PedidoAdmin = {
  id: number;
  usuario_id?: number;
  usuario: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  endereco: OrderAddress | null;
  forma_pagamento: string;
  status_pagamento: StatusPagamento;
  status_entrega: StatusEntrega;
  /** Total final cobrado = subtotal de produtos + frete */
  total: number;
  /** Custo de frete separado (para conciliação financeira) */
  shipping_price: number;
  data_pedido: string;
  itens: PedidoItem[];
};
