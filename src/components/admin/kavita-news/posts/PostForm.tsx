"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { NewsPostDetail, NewsPostStatus, NewsPostUpsertInput } from "@/types/kavita-news";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: NewsPostDetail | null;

  onClose: () => void;
  onSubmit: (payload: NewsPostUpsertInput) => Promise<void>;

  isSaving?: boolean;
};

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type CoverMode = "url" | "upload";

export default function PostForm({ open, mode, initial, onClose, onSubmit, isSaving }: Props) {
  const isEdit = mode === "edit";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [manualSlug, setManualSlug] = useState(false);

  const [status, setStatus] = useState<NewsPostStatus>("draft");
  const [category, setCategory] = useState("");
  const [tagsCsv, setTagsCsv] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  // Capa: URL ou Upload
  const [coverMode, setCoverMode] = useState<CoverMode>("url");
  const [coverFileName, setCoverFileName] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setTitle("");
      setSlug("");
      setManualSlug(false);
      setStatus("draft");
      setCategory("");
      setTagsCsv("");
      setCoverUrl("");
      setExcerpt("");
      setContent("");

      setCoverMode("url");
      setCoverFileName("");
      setCoverPreview("");

      return;
    }

    const p = initial;
    setTitle(p?.title || "");
    setSlug(p?.slug || "");
    setManualSlug(true);
    setStatus((p?.status as NewsPostStatus) || "draft");
    setCategory(p?.category || "");
    setTagsCsv((p?.tags || [])?.join(", ") || "");
    setCoverUrl(p?.cover_url || "");
    setExcerpt(p?.excerpt || "");
    setContent(p?.content || "");

    // Se já existe uma capa salva, a gente mantém como URL por padrão
    setCoverMode("url");
    setCoverFileName("");
    setCoverPreview(p?.cover_url || "");
  }, [open, isEdit, initial]);

  useEffect(() => {
    if (!open) return;
    if (manualSlug) return;
    setSlug(slugify(title));
  }, [title, manualSlug, open]);

  // ESC para fechar
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const headerTitle = useMemo(() => (isEdit ? "Editar Post" : "Novo Post"), [isEdit]);

  async function handleSubmit(publishNow: boolean) {
    const payload: NewsPostUpsertInput = {
      title: title.trim(),
      slug: slug.trim(),
      status: publishNow ? "published" : status,
      category: category.trim() || null,
      tags_csv: tagsCsv,
      cover_url: coverUrl.trim() || null,
      excerpt: excerpt.trim() || null,
      content,
      publish_now: publishNow,
    };

    if (!payload.title) throw new Error("Título é obrigatório.");
    if (!payload.slug) throw new Error("Slug é obrigatório.");

    await onSubmit(payload);
  }

  function clearCover() {
    setCoverUrl("");
    setCoverPreview("");
    setCoverFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onPickCoverFile(file: File | null) {
    if (!file) return;

    // Converte para base64 e salva em cover_url.
    // Vantagem: não depende de backend de upload agora.
    // Tradeoff: string grande no banco.
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      setCoverMode("upload");
      setCoverFileName(file.name);
      setCoverPreview(base64);
      setCoverUrl(base64);
    };
    reader.readAsDataURL(file);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Fechar"
      />

      {/* Container (sheet no mobile / modal no desktop) */}
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:inset-0 sm:flex sm:items-center sm:justify-center">
        <div
          className="
            relative z-10 w-full bg-white shadow-2xl
            rounded-t-2xl sm:rounded-2xl
            sm:max-w-3xl
            h-[92vh] sm:h-auto
            max-h-[92vh] sm:max-h-[90vh]
            overflow-hidden
          "
        >
          {/* Header fixo */}
          <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-bold text-gray-900">{headerTitle}</div>
                <div className="text-xs text-gray-500">
                  {isEdit ? "Atualize os dados do post." : "Crie um novo post para o público."}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Body com scroll */}
          <div className="h-[calc(92vh-140px)] sm:h-auto sm:max-h-[calc(90vh-140px)] overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Título */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-700">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Ex: Mercado do boi hoje"
                />
              </div>

              {/* Slug */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Slug</label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={manualSlug}
                      onChange={(e) => setManualSlug(e.target.checked)}
                    />
                    Editar manualmente
                  </label>
                </div>

                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!manualSlug}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-50"
                  placeholder="ex: mercado-do-boi-hoje"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NewsPostStatus)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Categoria</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Ex: Economia Rural"
                />
              </div>

              {/* Tags */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-700">Tags (CSV)</label>
                <input
                  value={tagsCsv}
                  onChange={(e) => setTagsCsv(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Ex: boi, arroba, cepea"
                />
              </div>

              {/* Capa */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Capa</label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCoverMode("url")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        coverMode === "url" ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                      }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverMode("upload")}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        coverMode === "upload" ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                      }`}
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {coverMode === "url" ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={coverUrl}
                      onChange={(e) => {
                        setCoverUrl(e.target.value);
                        setCoverPreview(e.target.value);
                      }}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={clearCover}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      Limpar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickCoverFile(e.target.files?.[0] || null)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Escolher imagem
                    </button>
                    <button
                      type="button"
                      onClick={clearCover}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      Remover
                    </button>
                  </div>
                )}

                {(coverPreview || coverUrl) && (
                  <div className="mt-3 overflow-hidden rounded-xl border bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreview || coverUrl}
                      alt="Prévia da capa"
                      className="h-44 w-full object-cover"
                    />
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-600">
                      <span className="truncate">
                        {coverMode === "upload" && coverFileName
                          ? `Upload: ${coverFileName}`
                          : coverUrl
                          ? "URL definida"
                          : "Capa"}
                      </span>
                      <span className="text-gray-400">Prévia</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-700">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="min-h-[96px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Resumo curto do post..."
                />
              </div>

              {/* Conteúdo */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-700">Conteúdo</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[260px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Conteúdo do post (markdown ou texto)..."
                />
                <div className="mt-2 text-xs text-gray-500">
                  Dica: por enquanto é texto/markdown. Depois dá para trocar por editor rico (Quill/Tiptap) sem quebrar a estrutura.
                </div>
              </div>
            </div>
          </div>

          {/* Footer fixo */}
          <div className="sticky bottom-0 z-10 border-t bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                disabled={!!isSaving}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={!!isSaving}
              >
                {isSaving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar"}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                disabled={!!isSaving}
                title="Define status=published"
              >
                {isSaving ? "Publicando..." : "Publicar agora"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
