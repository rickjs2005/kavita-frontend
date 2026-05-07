"use client";

// Aba "Dashboard" do admin drones — overview com atalhos rápidos para
// as outras seções, sem editar nada. Visual de painel operacional:
// blocos clicáveis que mudam para a aba alvo via setTab.

import {
  AlertCircle,
  Building2,
  ClipboardList,
  Inbox,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";

type TabId =
  | "landing"
  | "secoes"
  | "modelos"
  | "leads"
  | "cases"
  | "faq"
  | "representantes"
  | "comentarios";

type Card = {
  id: TabId;
  label: string;
  description: string;
  icon: LucideIcon;
  highlight?: "danger" | "warning" | "success" | "info";
};

const CARDS: Card[] = [
  {
    id: "leads",
    label: "Leads de interesse",
    description:
      "Quem demonstrou interesse pela landing. Atualize status e abra WhatsApp pré-preenchido.",
    icon: Inbox,
    highlight: "warning",
  },
  {
    id: "comentarios",
    label: "Comentários",
    description:
      "Aprove, reprove ou exclua comentários públicos. Comentários novos entram como Pendentes.",
    icon: MessageSquare,
    highlight: "danger",
  },
  {
    id: "cases",
    label: "Cases comerciais",
    description:
      "Histórias reais de uso (fazenda, hectares, modelo). LGPD obrigatória antes de publicar.",
    icon: Star,
    highlight: "success",
  },
  {
    id: "modelos",
    label: "Modelos DJI Agras",
    description:
      "Cadastre specs, features, benefícios, galeria e mídia hero/card de cada modelo.",
    icon: Tag,
  },
  {
    id: "representantes",
    label: "Representantes",
    description:
      "Lojas autorizadas DJI Agras. Endereço, WhatsApp, Instagram, ordem na lista pública.",
    icon: Building2,
  },
  {
    id: "secoes",
    label: "Seções da landing",
    description:
      "Edite Why, WhoIsFor, HowItWorks e Trust. Substitui o texto estático sem deploy.",
    icon: LayoutGrid,
  },
  {
    id: "faq",
    label: "FAQ pública",
    description:
      "Perguntas e respostas exibidas na landing. Itens inativos não aparecem no público.",
    icon: ClipboardList,
  },
  {
    id: "landing",
    label: "Config da landing",
    description:
      "Hero, CTA, copy global e ordem das seções. Vídeo e imagem de fundo.",
    icon: Sparkles,
  },
];

const HIGHLIGHT_CLASSES: Record<NonNullable<Card["highlight"]>, string> = {
  danger:
    "border-rose-400/30 bg-rose-500/10 hover:border-rose-300/50 hover:bg-rose-500/15",
  warning:
    "border-amber-400/30 bg-amber-500/10 hover:border-amber-300/50 hover:bg-amber-500/15",
  success:
    "border-emerald-400/30 bg-emerald-500/10 hover:border-emerald-300/50 hover:bg-emerald-500/15",
  info: "border-sky-400/30 bg-sky-500/10 hover:border-sky-300/50 hover:bg-sky-500/15",
};

const ICON_HIGHLIGHT: Record<NonNullable<Card["highlight"]>, string> = {
  danger: "text-rose-200",
  warning: "text-amber-200",
  success: "text-emerald-200",
  info: "text-sky-200",
};

type Props = {
  onNavigate: (tab: TabId) => void;
  pendingComments?: number;
  newLeads?: number;
};

export default function DronesDashboardOverview({
  onNavigate,
  pendingComments,
  newLeads,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Visão geral</h2>
          <p className="mt-1 text-xs text-slate-300">
            Atalhos diretos para as áreas operacionais do módulo.
          </p>
        </div>
      </div>

      {(pendingComments && pendingComments > 0) ||
      (newLeads && newLeads > 0) ? (
        <div className="mt-4 grid gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs text-amber-100">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-4 w-4" aria-hidden />
            Itens aguardando sua atenção
          </div>
          <ul className="ml-1 list-disc pl-4 text-amber-100/90">
            {pendingComments && pendingComments > 0 ? (
              <li>
                {pendingComments}{" "}
                {pendingComments === 1 ? "comentário" : "comentários"} para
                moderar
              </li>
            ) : null}
            {newLeads && newLeads > 0 ? (
              <li>
                {newLeads} {newLeads === 1 ? "lead novo" : "leads novos"}{" "}
                para contatar
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const cls = c.highlight
            ? HIGHLIGHT_CLASSES[c.highlight]
            : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]";
          const iconCls = c.highlight
            ? ICON_HIGHLIGHT[c.highlight]
            : "text-emerald-200";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onNavigate(c.id)}
              className={[
                "group rounded-2xl border p-5 text-left transition",
                cls,
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 transition group-hover:scale-105",
                    iconCls,
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-white">{c.label}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-300">
                    {c.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300/70">
                Abrir →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
