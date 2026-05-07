"use client";

// Navegação interna do admin /admin/drones.
// Desktop: sidebar vertical à esquerda + conteúdo à direita.
// Mobile: tabs horizontais com scroll-snap (mantém comportamento original).
//
// Estado externo opcional para permitir overview-cards atalharem para
// uma aba específica (Dashboard tab → "abrir Leads").

import { useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Settings2,
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
  | "landing"
  | "secoes"
  | "modelos"
  | "leads"
  | "cases"
  | "faq"
  | "representantes"
  | "comentarios";

type TabMeta = {
  id: TabId;
  label: string;
  icon: LucideIcon;
  group?: "Visão geral" | "Conteúdo" | "Operação";
};

const TAB_LIST: TabMeta[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Visão geral" },
  { id: "landing", label: "Config landing", icon: Sparkles, group: "Conteúdo" },
  { id: "secoes", label: "Seções", icon: LayoutGrid, group: "Conteúdo" },
  { id: "modelos", label: "Modelos", icon: Tag, group: "Conteúdo" },
  { id: "faq", label: "FAQ", icon: ClipboardList, group: "Conteúdo" },
  { id: "leads", label: "Leads", icon: Inbox, group: "Operação" },
  { id: "cases", label: "Cases", icon: Star, group: "Operação" },
  { id: "comentarios", label: "Comentários", icon: MessageSquare, group: "Operação" },
  { id: "representantes", label: "Representantes", icon: Building2, group: "Operação" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  /** Sinalizadores opcionais para mostrar contagem nos atalhos do dashboard. */
  pendingComments?: number;
  newLeads?: number;
};

export default function DronesTabs({ pendingComments, newLeads }: Props) {
  const [tab, setTab] = useState<TabId>("dashboard");

  // Agrupa para a sidebar desktop. Mobile usa lista linear.
  const grouped = useMemo(() => {
    const groups = new Map<string, TabMeta[]>();
    for (const t of TAB_LIST) {
      const g = t.group ?? "Outros";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(t);
    }
    return Array.from(groups.entries());
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-white/10 bg-black/30 p-3">
          {grouped.map(([groupName, tabs]) => (
            <div key={groupName} className="mb-3 last:mb-0">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {groupName}
              </p>
              <div className="grid gap-1">
                {tabs.map((t) => {
                  const active = t.id === tab;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cx(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                        active
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                          : "border-transparent text-slate-200 hover:border-white/10 hover:bg-white/5",
                      )}
                    >
                      <Icon
                        className={cx(
                          "h-4 w-4 shrink-0",
                          active ? "text-emerald-200" : "text-slate-400",
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{t.label}</span>
                      {t.id === "leads" && newLeads ? (
                        <span className="ml-auto rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-200">
                          {newLeads}
                        </span>
                      ) : null}
                      {t.id === "comentarios" && pendingComments ? (
                        <span className="ml-auto rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-200">
                          {pendingComments}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400">
            <Settings2 className="mb-1 h-3.5 w-3.5" aria-hidden />
            <p>
              As mudanças entram na landing pública assim que salvas.
              Itens inativos ficam invisíveis no público.
            </p>
          </div>
        </div>
      </aside>

      {/* Tabs horizontais mobile/tablet */}
      <div className="lg:hidden -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TAB_LIST.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cx(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                "focus:outline-none focus:ring-2 focus:ring-white/10",
                active
                  ? "border-emerald-400 bg-emerald-500 text-black"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div className="grid gap-6">
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
