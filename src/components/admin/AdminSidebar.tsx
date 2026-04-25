"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { label: "Dashboard", href: "/admin", icon: "🏠", permission: "dashboard_view" },
      { label: "Pedidos", href: "/admin/pedidos", icon: "🧾", permission: "orders_view" },
      { label: "Ocorrências", href: "/admin/ocorrencias", icon: "📋", permission: "orders_view" },
      { label: "Carrinhos", href: "/admin/carrinhos", icon: "🛒", permission: "carts_view" },
      { label: "Clientes", href: "/admin/clientes", icon: "👥", permission: "customers_view" },
      { label: "Rotas de Entrega", href: "/admin/rotas", icon: "🛻", permission: "rotas.view" },
      { label: "Motoristas", href: "/admin/motoristas", icon: "🧑‍✈️", permission: "motoristas.view" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Produtos", href: "/admin/produtos", icon: "📦", permission: "products_manage" },
      { label: "Serviços", href: "/admin/servicos", icon: "🛠️", permission: "services_manage" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Marketing & Promoções", href: "/admin/destaques", icon: "⭐", permission: "highlights_manage" },
      { label: "Cupons", href: "/admin/cupons", icon: "🏷️", permission: "coupons_manage" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { label: "Kavita News", href: "/admin/kavita-news", icon: "📰", permission: "news_view" },
      { label: "Mercado do Café", href: "/admin/mercado-do-cafe", icon: "☕", permission: "mercado_cafe_manage" },
      // Auditoria do módulo café — vive ao lado do módulo principal
      // para deixar claro que é um drill-down operacional (quem fez o
      // quê sobre corretoras/reviews/planos), não uma auditoria global
      // do sistema. Rota mantida em /admin/auditoria para preservar
      // compatibilidade de deeplinks existentes.
      { label: "Histórico do Mercado do Café", href: "/admin/auditoria", icon: "🕒", permission: "logs_view" },
      { label: "Kavita Drones", href: "/admin/drones", icon: "🚁", permission: "drones_manage" },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { label: "Mensagens de Contato", href: "/admin/contato-mensagens", icon: "✉️", permission: "contato_mensagens_view" },
      { label: "Config. Atendimento", href: "/admin/atendimento-config", icon: "💬", permission: "settings_manage" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Relatórios", href: "/admin/relatorios", icon: "📊", permission: "reports_view" },
      { label: "Configurações", href: "/admin/configuracoes", icon: "⚙️", permission: "settings_manage" },
      { label: "Papéis & Permissões", href: "/admin/configuracoes/usuarios", icon: "🛡️", permission: "roles_permissions_manage" },
      { label: "Equipe", href: "/admin/equipe", icon: "🧑‍🌾", permission: "admins_manage" },
      { label: "Logs", href: "/admin/logs", icon: "📜", permission: "logs_view" },
    ],
  },
];

export default function AdminSidebar({
  className = "",
  hideLogoutButton = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, hasPermission } = useAdminAuth();

  // All groups start expanded
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
  };

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
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4">
        <nav className="space-y-1 text-sm">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.href === "/admin" ? true : hasPermission(item.permission),
            );
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsed[group.label] ?? false;

            // Check if any item in this group is active
            const hasActiveItem = visibleItems.some(
              (item) =>
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href)),
            );

            return (
              <div key={group.label} className="pt-2 first:pt-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-300"
                >
                  <span className="flex items-center gap-1.5">
                    {group.label}
                    {hasActiveItem && !isCollapsed && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                    {hasActiveItem && isCollapsed && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </span>
                  <svg
                    className={`h-3 w-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5 pl-0">
                    {visibleItems.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={isActive ? "page" : undefined}
                          className={[
                            "group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                            isActive
                              ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-slate-50",
                          ].join(" ")}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-base">
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
