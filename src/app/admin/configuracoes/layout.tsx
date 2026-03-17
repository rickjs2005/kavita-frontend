import { AdminModuleTabs } from "@/components/admin/AdminModuleTabs";
import type { ReactNode } from "react";

const TABS = [
  { label: "Loja",       href: "/admin/configuracoes",           exact: true },
  { label: "Categorias", href: "/admin/configuracoes/categorias" },
  { label: "Usuários",   href: "/admin/configuracoes/usuarios" },
];

export default function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col">
      <AdminModuleTabs tabs={TABS} />
      {children}
    </div>
  );
}
