"use client";

import React from "react";
import type { NewsPostDetail } from "@/types/kavita-news";

type Props = {
  open: boolean;
  post: NewsPostDetail | null;
  onClose: () => void;
};

export default function PostPreview({ open, post, onClose }: Props) {
  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fechar preview" />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-gray-900">{post.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold">{post.status}</span>
              <span className="font-mono">{post.slug}</span>
              {post.category ? <span>• {post.category}</span> : null}
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">
            Fechar
          </button>
        </div>

        <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
          {post.cover_url ? (
            <div className="mb-4 overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover_url} alt="Capa" className="h-48 w-full object-cover" />
            </div>
          ) : null}

          {post.excerpt ? (
            <div className="mb-4 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">{post.excerpt}</div>
          ) : null}

          <pre className="whitespace-pre-wrap rounded-xl border bg-white p-3 text-sm text-gray-800">
            {post.content || "(Sem conteúdo)"}
          </pre>
        </div>
      </div>
    </div>
  );
}
