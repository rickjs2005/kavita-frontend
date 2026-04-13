"use client";

import Link from "next/link";
import type { ModulesStatus } from "../dashboardTypes";
import { LoadingSpinner } from "../dashboardUtils";

type Props = {
  status: ModulesStatus | null;
  loading: boolean;
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "nunca";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "nunca";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

type StatusDotColor = "green" | "amber" | "slate";

function StatusDot({ color }: { color: StatusDotColor }) {
  const colors: Record<StatusDotColor, string> = {
    green: "bg-emerald-400",
    amber: "bg-amber-400",
    slate: "bg-slate-500",
  };
  return <span className={`h-2 w-2 shrink-0 rounded-full ${colors[color]}`} />;
}

type ModuleCardProps = {
  icon: string;
  title: string;
  href: string;
  lines: { label: string; value: string | number; dotColor?: StatusDotColor }[];
};

function ModuleCard({ icon, title, href, lines }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-3 transition hover:border-emerald-500/40 hover:bg-slate-900"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-slate-100">{title}</span>
      </div>
      <div className="space-y-0.5">
        {lines.map((line) => (
          <div key={line.label} className="flex items-center gap-1.5 text-[11px]">
            {line.dotColor && <StatusDot color={line.dotColor} />}
            <span className="text-slate-400">{line.label}:</span>
            <span className="font-medium text-slate-200">{line.value}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

export function ModulesStatusSection({ status, loading }: Props) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
        <div className="flex items-center justify-center py-6 text-xs text-slate-400">
          <LoadingSpinner size="sm" />
          <span className="ml-2">Carregando status dos módulos...</span>
        </div>
      </section>
    );
  }

  if (!status) return null;

  const climaSyncAge = status.clima.ultimaSync
    ? (Date.now() - new Date(status.clima.ultimaSync).getTime()) / 3600000
    : Infinity;
  const climaDotColor: StatusDotColor =
    climaSyncAge < 6 ? "green" : climaSyncAge < 24 ? "amber" : "slate";

  const cotacoesDotColor: StatusDotColor =
    status.cotacoes.statusSync === "ok" ? "green" : status.cotacoes.statusSync === "error" ? "amber" : "slate";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">
          Módulos estratégicos
        </p>
        <h2 className="text-sm font-semibold text-slate-50">
          Status dos módulos de conteúdo e inteligência
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard
          icon="🖼️"
          title="Hero & Banners"
          href="/admin/destaques/site-hero"
          lines={[
            { label: "Slides ativos", value: status.hero.ativos, dotColor: status.hero.ativos > 0 ? "green" : "amber" },
            { label: "Inativos", value: status.hero.inativos },
          ]}
        />

        <ModuleCard
          icon="📰"
          title="News"
          href="/admin/kavita-news"
          lines={[
            { label: "Publicados", value: status.news.publicados },
            { label: "Rascunhos", value: status.news.rascunhos, dotColor: status.news.rascunhos > 0 ? "amber" : "green" },
          ]}
        />

        <ModuleCard
          icon="🌦️"
          title="Clima"
          href="/admin/kavita-news?tab=clima"
          lines={[
            { label: "Cidades ativas", value: status.clima.cidadesAtivas },
            { label: "Última sync", value: timeAgo(status.clima.ultimaSync), dotColor: climaDotColor },
          ]}
        />

        <ModuleCard
          icon="📈"
          title="Cotações"
          href="/admin/kavita-news?tab=cotacoes"
          lines={[
            { label: "Ativas", value: status.cotacoes.ativas },
            { label: "Atualização", value: timeAgo(status.cotacoes.ultimaAtualizacao), dotColor: cotacoesDotColor },
          ]}
        />

        <ModuleCard
          icon="🚁"
          title="Drones"
          href="/admin/drones"
          lines={[
            { label: "Modelos", value: status.drones.modelos },
            { label: "Para moderar", value: status.drones.comentariosPendentes, dotColor: status.drones.comentariosPendentes > 0 ? "amber" : "green" },
          ]}
        />

        <ModuleCard
          icon="☕"
          title="Mercado do Café"
          href="/admin/mercado-do-cafe"
          lines={[
            { label: "Corretoras", value: status.mercadoCafe.corretorasAtivas },
            { label: "Pendentes", value: status.mercadoCafe.solicitacoesPendentes, dotColor: status.mercadoCafe.solicitacoesPendentes > 0 ? "amber" : "green" },
          ]}
        />

        <ModuleCard
          icon="✉️"
          title="Mensagens"
          href="/admin/contato-mensagens"
          lines={[
            { label: "Não lidas", value: status.mensagens.naoLidas, dotColor: status.mensagens.naoLidas > 0 ? "amber" : "green" },
            { label: "Total", value: status.mensagens.total },
          ]}
        />
      </div>
    </section>
  );
}
