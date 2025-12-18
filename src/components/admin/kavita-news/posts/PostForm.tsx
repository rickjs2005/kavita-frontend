"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { NewsPostDetail, NewsPostStatus, NewsPostUpsertInput } from "@/types/kavita-news";
import { uploadNewsCover } from "@/utils/kavita-news/posts";

type CoverMode = "url" | "upload";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: NewsPostDetail | null;

  onClose: () => void;
  onSubmit: (payload: NewsPostUpsertInput) => Promise<void>;

  isSaving?: boolean;
};

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function PostForm({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  isSaving,
}: Props) {
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

  // Ajuste visual da imagem (cover/contain)
  const [coverFit, setCoverFit] = useState<"cover" | "contain">("cover");

  // Erro amigável no modal (para não estourar "Unhandled Runtime Error")
  const [formError, setFormError] = useState<string>("");

  // estado simples de upload (evita “salvar” antes do upload terminar)
  const [coverUploading, setCoverUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const inputBase =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none " +
    "focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-50 disabled:text-gray-700";

  const textareaBase =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none " +
    "focus:ring-2 focus:ring-emerald-200";

  useEffect(() => {
    if (!open) return;

    setFormError("");

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
      setCoverFit("cover");
      setCoverUploading(false);

      if (fileInputRef.current) fileInputRef.current.value = "";
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

    setCoverMode("url");
    setCoverFileName("");
    setCoverPreview(p?.cover_url || "");
    setCoverFit("cover");
    setCoverUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, isEdit, initial]);

  useEffect(() => {
    if (!open) return;
    if (manualSlug) return;
    setSlug(slugify(title));
  }, [title, manualSlug, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const headerTitle = useMemo(() => (isEdit ? "Editar Post" : "Novo Post"), [isEdit]);

  function clearCover() {
    setFormError("");
    setCoverUrl("");
    setCoverPreview("");
    setCoverFileName("");
    setCoverUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onPickCoverFile(file: File | null) {
    setFormError("");
    if (!file) return;

    // preview imediato (UX)
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result) return;

      const base64 = String(reader.result);

      setCoverMode("upload");
      setCoverFileName(file.name);
      setCoverPreview(base64);
      // IMPORTANTE: não salva base64 no coverUrl (DB)
    };
    reader.readAsDataURL(file);

    // upload real
    try {
      setCoverUploading(true);
      const up = await uploadNewsCover(file);
      setCoverUrl(up.url); // ✅ URL real persistível no DB
    } catch (e: any) {
      setFormError(e?.message || "Erro ao enviar imagem.");
      // mantém preview, mas não força coverUrl inválida
      setCoverUrl("");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSubmit(publishNow: boolean) {
    try {
      setFormError("");

      if (coverUploading) {
        throw new Error("Aguarde o upload da imagem terminar.");
      }

      // Segurança: varchar(500)
      if ((coverUrl ?? "").length > 500) {
        throw new Error("URL da capa muito grande (máx 500 caracteres).");
      }

      const payload: NewsPostUpsertInput = {
        title: (title ?? "").trim(),
        slug: (slug ?? "").trim(),
        status: publishNow ? "published" : status,
        category: (category ?? "").trim() || null,
        tags_csv: (tagsCsv ?? "").trim() || "",
        cover_url: (coverUrl ?? "").trim() || null,
        excerpt: (excerpt ?? "").trim() || null,
        content: (content ?? "").trim(),
        publish_now: publishNow,
      };

      if (!payload.title) throw new Error("Título é obrigatório.");
      if (!payload.slug) throw new Error("Slug é obrigatório.");

      await onSubmit(payload);
    } catch (err: any) {
      setFormError(err?.message || "Erro ao salvar.");
    }
  }

  if (!open) return null;

  const previewSrc = (coverPreview || coverUrl) ?? "";
  const showPreview = !!previewSrc;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-4xl rounded-t-2xl bg-white shadow-2xl sm:inset-y-10 sm:bottom-auto sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div>
            <div className="text-base font-semibold text-gray-900">{headerTitle}</div>
            <div className="text-xs text-gray-500">Kavita News • Admin</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-4 py-4 sm:max-h-[70vh] sm:px-6">
          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-gray-700">Título</label>
              <input
                value={title ?? ""}
                onChange={(e) => setTitle(e.target.value)}
                className={inputBase}
                placeholder="Ex: Café sobe com clima seco"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">Slug</label>
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
                value={slug ?? ""}
                onChange={(e) => setSlug(e.target.value)}
                className={inputBase}
                placeholder="cafe-sobe-com-clima-seco"
                disabled={!manualSlug}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Status</label>
              <select
                value={status ?? "draft"}
                onChange={(e) => setStatus(e.target.value as NewsPostStatus)}
                className={inputBase}
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Categoria</label>
              <input
                value={category ?? ""}
                onChange={(e) => setCategory(e.target.value)}
                className={inputBase}
                placeholder="Ex: café"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Tags (CSV)</label>
              <input
                value={tagsCsv ?? ""}
                onChange={(e) => setTagsCsv(e.target.value)}
                className={inputBase}
                placeholder="cafe, clima, mercado"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-gray-700">Capa</label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCoverMode("url");
                      setFormError("");
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      coverMode === "url"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverMode("upload");
                      setFormError("");
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      coverMode === "upload"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Upload
                  </button>
                </div>
              </div>

              {coverMode === "url" ? (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={coverUrl ?? ""}
                    onChange={(e) => {
                      setFormError("");
                      setCoverUrl(e.target.value);
                      setCoverPreview(e.target.value);
                    }}
                    className={inputBase}
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={clearCover}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    key={coverMode}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickCoverFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-gray-200 bg-white text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-900 hover:file:bg-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    disabled={coverUploading}
                  >
                    {coverUploading ? "Enviando..." : "Escolher imagem"}
                  </button>
                  <button
                    type="button"
                    onClick={clearCover}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    disabled={coverUploading}
                  >
                    Remover
                  </button>
                </div>
              )}

              {showPreview && (
                <div className="mt-3 overflow-hidden rounded-xl border bg-gray-50">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-600">
                    <span className="truncate">
                      {coverMode === "upload" && coverFileName ? `Upload: ${coverFileName}` : "Prévia"}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Ajuste:</span>

                      <button
                        type="button"
                        onClick={() => setCoverFit("cover")}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                          coverFit === "cover"
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        Capa
                      </button>

                      <button
                        type="button"
                        onClick={() => setCoverFit("contain")}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                          coverFit === "contain"
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        Inteira
                      </button>
                    </div>
                  </div>

                  <div className="relative w-full bg-black/5 aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt="Prévia da capa"
                      className={`absolute inset-0 h-full w-full ${
                        coverFit === "cover" ? "object-cover" : "object-contain"
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-600">
                    <span className="truncate">
                      {coverMode === "upload" && coverFileName ? `Upload: ${coverFileName}` : ""}
                    </span>
                    <span className="text-gray-500">Capa</span>
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Excerpt</label>
              <textarea
                value={excerpt ?? ""}
                onChange={(e) => setExcerpt(e.target.value)}
                className={textareaBase}
                rows={3}
                placeholder="Resumo curto do post (opcional)"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Conteúdo</label>
              <textarea
                value={content ?? ""}
                onChange={(e) => setContent(e.target.value)}
                className={textareaBase}
                rows={10}
                placeholder="Conteúdo do post..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={!!isSaving || coverUploading}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={!!isSaving || coverUploading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSaving ? "Publicando..." : "Publicar agora"}
          </button>
        </div>
      </div>
    </div>
  );
}
