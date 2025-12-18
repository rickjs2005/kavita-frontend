"use client";

import React from "react";
import type { NewsPostListItem } from "@/types/kavita-news";

type Props = {
  items: NewsPostListItem[];
  isLoading?: boolean;

  onEdit: (post: NewsPostListItem) => void;
  onDelete: (post: NewsPostListItem) => void;
  onTogglePublish: (post: NewsPostListItem) => void;
  onPreview: (post: NewsPostListItem) => void;

  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function badge(status: string) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
  if (status === "published") return `${base} bg-emerald-100 text-emerald-700`;
  return `${base} bg-amber-100 text-amber-700`;
}

export default function PostsTable({
  items,
  isLoading,
  onEdit,
  onDelete,
  onTogglePublish,
  onPreview,
  page,
  totalPages,
  onPageChange,
}: Props) {
  return (
    <div className="w-full rounded-xl border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Título</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Atualizado</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>
                  Nenhum post encontrado.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{p.title}</div>
                    {p.excerpt ? (
                      <div className="line-clamp-1 text-xs text-gray-500">{p.excerpt}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className={badge(p.status)}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.category || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.updated_at ? new Date(p.updated_at).toLocaleString("pt-BR") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-white"
                        onClick={() => onPreview(p)}
                      >
                        Prévia
                      </button>

                      <button
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-white"
                        onClick={() => onEdit(p)}
                      >
                        Editar
                      </button>

                      <button
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-white"
                        onClick={() => onTogglePublish(p)}
                        title={p.status === "published" ? "Despublicar" : "Publicar"}
                      >
                        {p.status === "published" ? "Despublicar" : "Publicar"}
                      </button>

                      <button
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        onClick={() => onDelete(p)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t p-3">
        <div className="text-xs text-gray-600">
          Página <span className="font-semibold">{page}</span> de{" "}
          <span className="font-semibold">{Math.max(totalPages, 1)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </button>
          <button
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
