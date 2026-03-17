import { AdminModuleTabs } from "@/components/admin/AdminModuleTabs";
import type { ReactNode } from "react";

const TABS = [
  { label: "Visão geral",  href: "/admin/relatorios",          exact: true },
  { label: "Vendas",       href: "/admin/relatorios/vendas" },
  { label: "Produtos",     href: "/admin/relatorios/produtos" },
  { label: "Clientes",     href: "/admin/relatorios/clientes" },
  { label: "Estoque",      href: "/admin/relatorios/estoque" },
  { label: "Serviços",     href: "/admin/relatorios/servicos" },
];

export default function RelatoriosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col">
      <AdminModuleTabs tabs={TABS} />
      {children}
    </div>
  );
}
