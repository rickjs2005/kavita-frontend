"use client";

// Navegação interna do admin /admin/drones.
// Tabs horizontais com underline animado — padrão SaaS premium
// (Vercel/Stripe/Linear). Sem sidebar secundária para não competir
// com o conteúdo. Mobile: scroll horizontal com snap.

import { useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";

import PageSettingsForm from "./PageSettingsForm";
import GalleryForm from "./DroneModelContentPanel";
import RepresentativeForm from "./RepresentativeForm";
import CommentsModerationTable from "./CommentsModerationTable";
import LeadsTable from "./LeadsTable";
import FaqTable from "./FaqTable";
import CasesTable from "./CasesTable";
import SectionsEditor from "./SectionsEditor";
import DronesDashboardOverview from "./DronesDashboardOverview";

type TabId =
  | "dashboard"
  | "modelos"
  | "leads"
  | "cases"
  | "comentarios"
  | "secoes"
  | "faq"
  | "representantes"
  | "landing";

type TabMeta = {
  id: TabId;
  label: string;
  icon: LucideIcon;
};

// Ordem importa: do mais frequente (Dashboard, Modelos) para o menos
// (Config landing). Inspiração: Stripe Dashboard, Vercel Project Settings.
const TAB_LIST: TabMeta[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "modelos", label: "Modelos", icon: Tag },
  { id: "leads", label: "Leads", icon: Inbox },
  { id: "cases", label: "Cases", icon: Star },
  { id: "comentarios", label: "Comentários", icon: MessageSquare },
  { id: "secoes", label: "Seções", icon: LayoutGrid },
  { id: "faq", label: "FAQ", icon: ClipboardList },
  { id: "representantes", label: "Representantes", icon: Building2 },
  { id: "landing", label: "Config landing", icon: Sparkles },
];

type Props = {
  pendingComments?: number;
  newLeads?: number;
};

export default function DronesTabs({ pendingComments, newLeads }: Props) {
  const [tab, setTab] = useState<TabId>("dashboard");

  const badgeFor = useMemo(
    () => ({
      leads: newLeads,
      comentarios: pendingComments,
    }),
    [newLeads, pendingComments],
  );

  return (
    <div className="grid gap-6">
      {/* Tabs horizontais com underline animado.
          kvt-scroll-fade-r mostra gradient à direita (mobile) indicando
          que há mais abas além do viewport — 9 abas não cabem em 375px. */}
      <div className="border-b border-white/8">
        <div className="kvt-scroll-fade-r">
          <div className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
            {TAB_LIST.map((t) => {
            const active = t.id === tab;
            const Icon = t.icon;
            const badge = (badgeFor as Record<string, number | undefined>)[t.id];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  "group relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-100",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-4 w-4 shrink-0 transition",
                    active ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300",
                  ].join(" ")}
                  aria-hidden
                />
                {t.label}
                {badge ? (
                  <span
                    className={[
                      "ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                      active
                        ? "bg-emerald-500 text-black"
                        : "bg-amber-500/20 text-amber-200",
                    ].join(" ")}
                  >
                    {badge}
                  </span>
                ) : null}

                {/* Underline */}
                <span
                  className={[
                    "absolute inset-x-2 -bottom-px h-[2px] rounded-full transition",
                    active
                      ? "bg-emerald-400"
                      : "bg-transparent group-hover:bg-white/20",
                  ].join(" ")}
                  aria-hidden
                />
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div>
        {tab === "dashboard" ? (
          <DronesDashboardOverview
            onNavigate={(t) => setTab(t)}
            pendingComments={pendingComments}
            newLeads={newLeads}
          />
        ) : null}
        {tab === "landing" ? <PageSettingsForm /> : null}
        {tab === "secoes" ? <SectionsEditor /> : null}
        {tab === "modelos" ? <GalleryForm /> : null}
        {tab === "leads" ? <LeadsTable /> : null}
        {tab === "cases" ? <CasesTable /> : null}
        {tab === "faq" ? <FaqTable /> : null}
        {tab === "representantes" ? <RepresentativeForm /> : null}
        {tab === "comentarios" ? <CommentsModerationTable /> : null}
      </div>
    </div>
  );
}
