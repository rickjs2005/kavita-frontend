import type { AdminRole } from "@/context/AdminAuthContext";
import type { AdminLog } from "@/types/admin";

export type { AdminLog };

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export type AdminResumo = {
  totalProdutos: number;
  totalPedidosUltimos30: number;
  totalClientes: number;
  totalDestaques: number;
  totalServicos: number;
  totalVendas30Dias: number;
  ticketMedio: number;
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

export type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: string;
  permission: string;
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

export const QUICK_LINKS: QuickLink[] = [
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    description: "Acompanhar pedidos, pagamentos e status",
    icon: "🧾",
    permission: "orders_view",
  },
  {
    href: "/admin/produtos",
    label: "Produtos",
    description: "Gerenciar catálogo, preços e estoque",
    icon: "📦",
    permission: "products_manage",
  },
  {
    href: "/admin/servicos",
    label: "Serviços",
    description: "Prestadores, agenda e avaliações",
    icon: "🛠️",
    permission: "services_manage",
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    description: "Ficha completa e CRM dos clientes",
    icon: "👥",
    permission: "customers_view",
  },
  {
    href: "/admin/relatorios",
    label: "Relatórios",
    description: "Vendas, clientes, estoque e serviços",
    icon: "📊",
    permission: "reports_view",
  },
  {
    href: "/admin/destaques",
    label: "Marketing & Promoções",
    description: "Campanhas, promoções e ofertas",
    icon: "📢",
    permission: "highlights_manage",
  },
  {
    href: "/admin/carrinhos",
    label: "Carrinhos",
    description: "Recuperação de carrinhos abandonados",
    icon: "🛒",
    permission: "carts_view",
  },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    description: "Loja, pagamentos e integrações",
    icon: "⚙️",
    permission: "settings_manage",
  },
];
