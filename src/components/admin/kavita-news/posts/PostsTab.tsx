"use client";

import React, { useEffect, useMemo, useState } from "react";
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

export default function PostsTab() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | NewsPostStatus>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [items, setItems] = useState<NewsPostListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<NewsPostDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<NewsPostDetail | null>(null);

  const query = useMemo(
    () => ({ q, status, page, pageSize }),
    [q, status, page]
  );

  async function refresh() {
    setIsLoading(true);
    try {
      const res = await listNewsPosts(query);
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, page]);

  function openCreate() {
    setFormMode("create");
    setSelected(null);
    setFormOpen(true);
  }

  function openEdit(p: NewsPostListItem) {
    // Backend não tem GET /posts/:id, então edit usa dados já carregados na lista
    setFormMode("edit");
    setSelected(p as unknown as NewsPostDetail);
    setFormOpen(true);
  }

  function openPreview(p: NewsPostListItem) {
    // Backend não tem GET /posts/:id, então preview usa dados já carregados na lista
    setPreviewPost(p as unknown as NewsPostDetail);
    setPreviewOpen(true);
  }

  async function onSubmit(payload: NewsPostUpsertInput) {
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
  }

  async function onDelete(p: NewsPostListItem) {
    const ok = window.confirm(`Excluir o post "${p.title}"?`);
    if (!ok) return;

    setIsLoading(true);
    try {
      await deleteNewsPost(p.id);
      await refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function onTogglePublish(p: NewsPostListItem) {
    // Backend não tem PATCH /status, então usamos PUT /posts/:id atualizando status
    const nextStatus: NewsPostStatus = p.status === "published" ? "draft" : "published";

    setIsLoading(true);
    try {
      await updateNewsPost(p.id, {
        title: p.title,
        slug: p.slug,
        status: nextStatus,
        category: p.category ?? null,
        tags_csv: (p.tags || []).join(", "),
        cover_url: p.cover_url ?? null,
        excerpt: p.excerpt ?? null,
        content: (p as any)?.content ?? null,
      });
      await refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PostsToolbar
        q={q}
        status={status}
        onChangeQ={(v) => {
          setQ(v);
          setPage(1);
        }}
        onChangeStatus={(v) => {
          setStatus(v);
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
