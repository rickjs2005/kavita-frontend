import { AdminModuleTabs } from "@/components/admin/AdminModuleTabs";
import type { ReactNode } from "react";

const TABS = [
  { label: "Marketing & Promoções", href: "/admin/destaques",           exact: true },
  { label: "Carrossel Hero",         href: "/admin/destaques/site-hero" },
];

export default function DestaquesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col">
      <AdminModuleTabs tabs={TABS} />
      {children}
    </div>
  );
}
