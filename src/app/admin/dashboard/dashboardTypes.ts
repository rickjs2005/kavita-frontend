import type { AdminRole } from "@/context/AdminAuthContext";
import type { AdminLog } from "@/types/admin";

export type { AdminLog };

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export type AdminResumoPrev = {
  totalVendas30Dias: number;
  totalPedidosUltimos30: number;
  totalClientes: number;
  ticketMedio: number;
};

export type AdminResumo = {
  totalProdutos: number;
  totalPedidosUltimos30: number;
  totalClientes: number;
  totalDestaques: number;
  totalServicos: number;
  totalVendas30Dias: number;
  ticketMedio: number;
  prev?: AdminResumoPrev;
};

export type VendaPoint = {
  date: string;
  total: number;
};


export type TopCliente = {
  id: number;
  nome: string;
  total_pedidos: number;
  total_gasto: number;
};

export type TopProduto = {
  id: number;
  nome: string;
  total_vendido: number;
  receita_total: number;
};

export type TopServico = {
  id: number;
  titulo: string;
  total_contratos: number;
  receita_total: number;
  nota_media?: number | null;
};

export type ModulesStatus = {
  news: { publicados: number; rascunhos: number };
  clima: { cidadesAtivas: number; ultimaSync: string | null };
  cotacoes: { ativas: number; ultimaAtualizacao: string | null; statusSync: string | null };
  drones: { modelos: number; comentariosPendentes: number };
  mercadoCafe: { corretorasAtivas: number; solicitacoesPendentes: number };
};

export type AlertNivel = "info" | "warning" | "danger";
export type AlertTipo = "pagamento" | "estoque" | "carrinhos" | "sistema" | "outro";

export type AlertItem = {
  id: string;
  nivel: AlertNivel;
  tipo: AlertTipo;
  titulo: string;
  mensagem: string;
  link?: string | null;
  link_label?: string | null;
};

// ---------------------------------------------------------------------------
// UI constants
// ---------------------------------------------------------------------------

export const ROLE_LABEL: Record<AdminRole, string> = {
  master: "Master",
  gerente: "Gerente",
  suporte: "Suporte",
  leitura: "Leitura",
};

export const ROLE_SHORT_LABEL: Record<AdminRole, string> = {
  master: "Nível master",
  gerente: "Nível gerente",
  suporte: "Nível suporte",
  leitura: "Acesso leitura",
};

export const ROLE_BADGE_CLASS: Record<AdminRole, string> = {
  master:
    "border-emerald-500/60 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.45)]",
  gerente:
    "border-sky-500/60 bg-sky-500/10 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]",
  suporte:
    "border-amber-500/60 bg-amber-500/10 text-amber-100 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]",
  leitura:
    "border-slate-500/60 bg-slate-800/80 text-slate-100 shadow-[0_0_0_1px_rgba(148,163,184,0.4)]",
};

