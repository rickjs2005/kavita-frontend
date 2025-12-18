"use client";

import React from "react";
import type { NewsPostStatus } from "@/types/kavita-news";

type Props = {
  q: string;
  status: "all" | NewsPostStatus;
  onChangeQ: (v: string) => void;
  onChangeStatus: (v: "all" | NewsPostStatus) => void;

  onClickNew: () => void;
  onClickRefresh?: () => void;

  isLoading?: boolean;
};

export default function PostsToolbar({
  q,
  status,
  onChangeQ,
  onChangeStatus,
  onClickNew,
  onClickRefresh,
  isLoading,
}: Props) {
  return (
    <div className="w-full rounded-xl border bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-md">
            <input
              value={q}
              onChange={(e) => onChangeQ(e.target.value)}
              placeholder="Buscar por título, slug, tag..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={status}
              onChange={(e) => onChangeStatus(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="all">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>

          {onClickRefresh && (
            <button
              type="button"
              onClick={onClickRefresh}
              disabled={!!isLoading}
              className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {isLoading ? "Atualizando..." : "Atualizar"}
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClickNew}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Novo Post
          </button>
        </div>
      </div>
    </div>
  );
}
