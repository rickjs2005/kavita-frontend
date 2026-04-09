"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

type AdminSidebarProps = {
  className?: string;
  hideLogoutButton?: boolean;
  onNavigate?: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: string;
  permission: string;
};

const navItems: NavItem[] = [
  // Dashboard
  {
    label: "Dashboard",
    href: "/admin",
    icon: "🏠",
    permission: "dashboard_view",
  },
  // Catálogo
  {
    label: "Produtos",
    href: "/admin/produtos",
    icon: "📦",
    permission: "products_manage",
  },
  {
    label: "marketing & Promoções",
    href: "/admin/destaques",
    icon: "⭐",
    permission: "highlights_manage",
  },
  {
    label: "Cupons",
    href: "/admin/cupons",
    icon: "🏷️",
    permission: "coupons_manage",
  },
  // Pedidos
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    icon: "🧾",
    permission: "orders_view",
  },
  // Serviços / Clientes
  {
    label: "Serviços",
    href: "/admin/servicos",
    icon: "🛠️",
    permission: "services_manage",
  },
  {
    label: "Clientes",
    href: "/admin/clientes",
    icon: "👥",
    permission: "customers_view",
  },
  // Carrinhos
  {
    label: "Carrinhos",
    href: "/admin/carrinhos",
    icon: "🛒",
    permission: "carts_view",
  },
  {
    label: "Kavita News",
    href: "/admin/kavita-news",
    icon: "📰",
    permission: "news_view",
  },
  {
    label: "Mercado do Café",
    href: "/admin/mercado-do-cafe",
    icon: "☕",
    permission: "mercado_cafe_manage",
  },
  {
    label: "kavita-drones",
    href: "/admin/drones",
    icon: "🚁",
    permission: "drones_manage",
  },
  // Atendimento
  {
    label: "Mensagens de Contato",
    href: "/admin/contato-mensagens",
    icon: "✉️",
    permission: "contato_mensagens_view",
  },
  // Relatórios
  {
    label: "Relatórios",
    href: "/admin/relatorios",
    icon: "📊",
    permission: "reports_view",
  },
  // Configurações gerais
  {
    label: "Configurações",
    href: "/admin/configuracoes",
    icon: "⚙️",
    permission: "settings_manage",
  },
  // Papéis & Permissões
  {
    label: "Papéis & Permissões",
    href: "/admin/configuracoes/usuarios",
    icon: "🛡️",
    permission: "roles_permissions_manage", // usamos como marcador
  },
  // Equipe (gestão de administradores)
  {
    label: "Equipe",
    href: "/admin/equipe",
    icon: "🧑‍🌾",
    permission: "admins_manage",
  },
  // Logs
  {
    label: "Logs",
    href: "/admin/logs",
    icon: "📜",
    permission: "logs_view",
  },
];

export default function AdminSidebar({
  className = "",
  hideLogoutButton = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, hasPermission } = useAdminAuth();

  const handleLogout = () => {
    logout();
  };

  // Filtra por permissão no momento da renderização
  const itemsVisiveis = navItems.filter((item) =>
    item.href === "/admin" ? true : hasPermission(item.permission),
  );

  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-slate-950 text-slate-50 ${className}`}
    >
      {/* TOPO (fixo) */}
      <div className="shrink-0 px-5 pb-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
              <span className="text-lg">🌱</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                Kavita
              </p>
              <p className="truncate text-sm font-semibold text-slate-50">
                Painel Admin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA SCROLLÁVEL (nav) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        <nav className="space-y-1 text-sm">
          {itemsVisiveis.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            const base =
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors";
            const active =
              "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40";
            const inactive =
              "text-slate-300 hover:bg-slate-800/80 hover:text-slate-50";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`${base} ${isActive ? active : inactive} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-base">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* RODAPÉ (logout fixo embaixo) */}
      {!hideLogoutButton && (
        <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/95 px-5 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition-transform hover:translate-y-[1px] hover:shadow-rose-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span>🚪</span>
            <span>Sair</span>
          </button>
          <p className="mt-2 text-[10px] text-slate-500">
            Acesso restrito a administradores Kavita.
          </p>
        </div>
      )}
    </div>
  );
}
