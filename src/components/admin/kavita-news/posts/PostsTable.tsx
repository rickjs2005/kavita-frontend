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
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";
  if (status === "published") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "archived") return `${base} bg-gray-200 text-gray-800`;
  return `${base} bg-amber-100 text-amber-800`; // draft
}

function pickUpdatedAt(p: any): Date | null {
  const raw =
    p?.updated_at ??
    p?.atualizado_em ??
    p?.atualizadoEm ??
    p?.updatedAt ??
    null;

  if (!raw) return null;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-72 rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-24 rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 rounded-full bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-20 rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-28 rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-8 w-20 rounded-lg bg-gray-100" />
          <div className="h-8 w-20 rounded-lg bg-gray-100" />
          <div className="h-8 w-28 rounded-lg bg-gray-100" />
          <div className="h-8 w-20 rounded-lg bg-gray-100" />
        </div>
      </td>
    </tr>
  );
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
  const safeTotalPages = Math.max(Number(totalPages || 1), 1);
  const safePage = Math.min(Math.max(Number(page || 1), 1), safeTotalPages);

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-800">Título</th>
              <th className="px-4 py-3 font-semibold text-gray-800">Slug</th>
              <th className="px-4 py-3 font-semibold text-gray-800">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-800">
                Categoria
              </th>
              <th className="px-4 py-3 font-semibold text-gray-800">
                Atualizado
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-800">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-gray-600" colSpan={6}>
                  Nenhum post encontrado.
                </td>
              </tr>
            ) : (
              items.map((p) => {
                const anyP: any = p as any;
                const updated = pickUpdatedAt(anyP);
                const slug = anyP?.slug ? String(anyP.slug) : "-";
                const category = anyP?.category ? String(anyP.category) : "-";

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {p.title}
                      </div>
                      {p.excerpt ? (
                        <div className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                          {p.excerpt}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-800">
                      {slug}
                    </td>

                    <td className="px-4 py-3">
                      <span className={badge(p.status)}>{p.status}</span>
                    </td>

                    <td className="px-4 py-3 text-gray-800">{category}</td>

                    <td className="px-4 py-3 text-gray-700">
                      {updated ? updated.toLocaleString("pt-BR") : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                          onClick={() => onPreview(p)}
                        >
                          Prévia
                        </button>

                        <button
                          type="button"
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                          onClick={() => onEdit(p)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                          onClick={() => onTogglePublish(p)}
                          title={
                            p.status === "published" ? "Despublicar" : "Publicar"
                          }
                        >
                          {p.status === "published"
                            ? "Despublicar"
                            : "Publicar"}
                        </button>

                        <button
                          type="button"
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 active:bg-red-200"
                          onClick={() => onDelete(p)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t bg-white p-3">
        <div className="text-xs text-gray-700">
          Página <span className="font-semibold">{safePage}</span> de{" "}
          <span className="font-semibold">{safeTotalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            disabled={isLoading || safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            disabled={isLoading || safePage >= safeTotalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
