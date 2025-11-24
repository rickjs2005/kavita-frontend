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
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "🏠" },
  { label: "Produtos", href: "/admin/produtos", icon: "📦" },
  { label: "Destaques", href: "/admin/destaques", icon: "⭐" },
  { label: "Pedidos", href: "/admin/pedidos", icon: "🧾" },
  { label: "Serviços", href: "/admin/servicos", icon: "🛠️" },
  { label: "Clientes", href: "/admin/clientes", icon: "👥" },
  { label: "Carrinhos", href: "/admin/carrinhos", icon: "🛒" },
];

export default function AdminSidebar({
  className = "",
  hideLogoutButton = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className={`flex h-full min-h-0 flex-col justify-between bg-slate-950 text-slate-50 ${className}`}
    >
      {/* Topo */}
      <div className="px-5 pb-4 pt-5">
        <div className="mb-6 flex items-center gap-3">
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

        {/* Navegação */}
        <nav className="space-y-1 text-sm">
          {navItems.map((item) => {
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
                className={`${base} ${isActive ? active : inactive}`}
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

      {/* Rodapé (logout) */}
      {!hideLogoutButton && (
        <div className="border-t border-slate-800/80 bg-slate-950/95 px-5 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition-transform hover:translate-y-[1px] hover:shadow-rose-900/10"
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
