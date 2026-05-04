"use client";

import React from "react";

type AdminPageHeaderProps = {
  /** Pequeno rótulo uppercase acima do título (ex: "Kavita Admin"). */
  kicker?: React.ReactNode;
  /** Título principal da página. */
  title: React.ReactNode;
  /** Subtítulo curto, exibido abaixo do título. */
  subtitle?: React.ReactNode;
  /**
   * Ações secundárias (links/ícones). Renderizadas em wrap. No mobile, o
   * `@media (pointer: coarse)` global já força 44px mínimos, então cada
   * item naturalmente ocupa ~44×44 — o wrap evita overflow horizontal.
   */
  actions?: React.ReactNode;
  /**
   * Ação primária da página. Full-width no mobile, auto em sm+.
   * Use para o CTA principal (ex: "+ Nova Corretora").
   */
  primaryAction?: React.ReactNode;
  /** Slot extra renderizado dentro da coluna do título (ex: badges). */
  badges?: React.ReactNode;
  /** className passthrough para customização externa. */
  className?: string;
};

export default function AdminPageHeader({
  kicker,
  title,
  subtitle,
  actions,
  primaryAction,
  badges,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <header
      className={`flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${className}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
        {kicker && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {kicker}
          </p>
        )}
        <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-slate-400 sm:text-xs">{subtitle}</p>
        )}
      </div>

      {(actions || primaryAction) && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
          {primaryAction && (
            <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
              {primaryAction}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
