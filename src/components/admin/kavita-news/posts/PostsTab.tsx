"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  NewsPostDetail,
  NewsPostListItem,
  NewsPostStatus,
  NewsPostUpsertInput,
} from "@/types/kavita-news";

import {
  createNewsPost,
  deleteNewsPost,
  listNewsPosts,
  updateNewsPost,
} from "@/utils/kavita-news/posts";

import PostsToolbar from "./PostsToolbar";
import PostsTable from "./PostsTable";
import PostForm from "./PostForm";
import PostPreview from "./PostPreview";

/**
 * Normaliza tags para CSV aceitando:
 * - array (string[])
 * - string (já CSV ou single tag)
 * - campo alternativo tags_csv
 * - valores inesperados (null/undefined/obj) -> ""
 */
function normalizeTagsCsv(p: any): string {
  const raw = p?.tags ?? p?.tags_csv ?? p?.tagsCsv ?? null;

  if (Array.isArray(raw)) {
    return raw
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join(", ");
  }

  if (typeof raw === "string") {
    // se já é CSV, só limpa espaços duplicados
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
  }

  // caso venha algo estranho (ex: objeto), tenta extrair valores
  if (raw && typeof raw === "object") {
    try {
      const vals = Object.values(raw)
        .map((x) => String(x ?? "").trim())
        .filter(Boolean);
      return vals.join(", ");
    } catch {
      return "";
    }
  }

  return "";
}

export default function PostsTab() {
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<"all" | NewsPostStatus>("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const [items, setItems] = useState<NewsPostListItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<NewsPostDetail | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewPost, setPreviewPost] = useState<NewsPostDetail | null>(null);

  const query = useMemo(
    () => ({
      q: q ?? "",
      status: status ?? "all",
      page: page ?? 1,
      pageSize,
    }),
    [q, status, page, pageSize]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listNewsPosts(query);
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Number(res?.totalPages || 1));
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotalPages(1);
      // aqui você pode plugar seu toast padronizado
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = useCallback(() => {
    setFormMode("create");
    setSelected(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((p: NewsPostListItem) => {
    setFormMode("edit");
    // Mantém compatível com seu backend atual (sem GET detail)
    setSelected(p as unknown as NewsPostDetail);
    setFormOpen(true);
  }, []);

  const openPreview = useCallback((p: NewsPostListItem) => {
    setPreviewPost(p as unknown as NewsPostDetail);
    setPreviewOpen(true);
  }, []);

  const onSubmit = useCallback(
    async (payload: NewsPostUpsertInput) => {
      setIsSaving(true);
      try {
        if (formMode === "create") {
          await createNewsPost(payload);
        } else if (selected?.id) {
          await updateNewsPost(selected.id, payload);
        }
        setFormOpen(false);
        await refresh();
      } finally {
        setIsSaving(false);
      }
    },
    [formMode, selected?.id, refresh]
  );

  const onDelete = useCallback(
    async (p: NewsPostListItem) => {
      const ok = window.confirm(`Excluir o post "${p.title}"?`);
      if (!ok) return;

      setIsLoading(true);
      try {
        await deleteNewsPost(p.id);
        // se apagar e ficar numa página vazia, volta uma página
        if (items.length === 1 && page > 1) setPage((prev) => prev - 1);
        await refresh();
      } finally {
        setIsLoading(false);
      }
    },
    [items.length, page, refresh]
  );

  const onTogglePublish = useCallback(
    async (p: NewsPostListItem) => {
      const nextStatus: NewsPostStatus =
        p.status === "published" ? "draft" : "published";

      setIsLoading(true);
      try {
        const anyP: any = p as any;

        await updateNewsPost(
          p.id,
          {
            title: p.title,
            slug: (anyP?.slug ?? p.slug ?? "") as any,
            status: nextStatus,
            category: (anyP?.category ?? p.category ?? null) as any,
            tags_csv: normalizeTagsCsv(anyP),
            cover_url: (anyP?.cover_url ?? p.cover_url ?? null) as any,
            excerpt: (anyP?.excerpt ?? p.excerpt ?? null) as any,
            content: anyP?.content ?? null,
            publish_now: nextStatus === "published",
          } as any
        );

        await refresh();
      } finally {
        setIsLoading(false);
      }
    },
    [refresh]
  );

  return (
    <div className="flex flex-col gap-4">
      <PostsToolbar
        q={q ?? ""}
        status={(status ?? "all") as any}
        onChangeQ={(v) => {
          setQ(v ?? "");
          setPage(1);
        }}
        onChangeStatus={(v) => {
          setStatus((v ?? "all") as any);
          setPage(1);
        }}
        onClickNew={openCreate}
        onClickRefresh={refresh}
        isLoading={isLoading}
      />

      <PostsTable
        items={items}
        isLoading={isLoading}
        onEdit={openEdit}
        onPreview={openPreview}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <PostForm
        open={formOpen}
        mode={formMode}
        initial={selected}
        onClose={() => setFormOpen(false)}
        onSubmit={onSubmit}
        isSaving={isSaving}
      />

      <PostPreview
        open={previewOpen}
        post={previewPost}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
