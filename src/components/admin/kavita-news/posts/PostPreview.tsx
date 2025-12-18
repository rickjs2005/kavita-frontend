"use client";

import React, { useEffect, useMemo } from "react";
import type { NewsPostDetail } from "@/types/kavita-news";

type Props = {
  open: boolean;
  post: NewsPostDetail | null;
  onClose: () => void;
};

export default function PostPreview({ open, post, onClose }: Props) {
  const coverUrl = useMemo(() => {
    if (!post) return null;
    // compat: alguns fronts usam cover_url, backend usa cover_image_url
    const anyPost = post as any;
    return (
      anyPost.cover_image_url ||
      anyPost.coverUrl ||
      anyPost.cover_url ||
      null
    );
  }, [post]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // trava scroll do body enquanto preview está aberto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay clicável */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Fechar preview"
      />

      {/* painel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="sticky top-0 z-10 border-b bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-gray-900">
                {post.title}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold">
                  {post.status}
                </span>

                {post.slug ? (
                  <span className="rounded-md bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-gray-700">
                    {post.slug}
                  </span>
                ) : null}

                {post.category ? <span>• {post.category}</span> : null}

                {post.published_at ? (
                  <span className="text-gray-500">
                    • Publicado em {String(post.published_at)}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* body */}
        <div className="h-[calc(100%-73px)] overflow-y-auto p-4">
          {coverUrl ? (
            <div className="mb-4 overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt="Capa"
                className="h-56 w-full object-cover"
              />
            </div>
          ) : null}

          {post.excerpt ? (
            <div className="mb-4 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
              {post.excerpt}
            </div>
          ) : null}

          <div className="rounded-xl border bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Conteúdo
            </div>

            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {post.content || "(Sem conteúdo)"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
