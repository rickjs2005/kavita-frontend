"use client";

import { useMemo, useState } from "react";
import PageSettingsForm from "./PageSettingsForm";
import GalleryForm from "./DroneModelContentPanel";
import RepresentativeForm from "./RepresentativeForm";
import CommentsModerationTable from "./CommentsModerationTable";

type TabId = "landing" | "modelos" | "representantes" | "comentarios";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DronesTabs() {
  const [tab, setTab] = useState<TabId>("landing");

  const tabs = useMemo(
    () =>
      [
        { id: "landing" as const, label: "Config Landing" },
        { id: "modelos" as const, label: "Modelos" },
        { id: "representantes" as const, label: "Representantes" },
        { id: "comentarios" as const, label: "Comentários" },
      ],
    []
  );

  return (
    <div className="grid gap-5">
      {/* Tabs: mobile = scroll horizontal */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cx(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                "focus:outline-none focus:ring-2 focus:ring-white/10",
                active
                  ? "border-emerald-400 bg-emerald-500 text-black"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div className="grid gap-6">
        {tab === "landing" ? <PageSettingsForm /> : null}
        {tab === "modelos" ? <GalleryForm /> : null}
        {tab === "representantes" ? <RepresentativeForm /> : null}
        {tab === "comentarios" ? <CommentsModerationTable /> : null}
      </div>
    </div>
  );
}
