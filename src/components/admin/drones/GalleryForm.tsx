"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type MediaType = "IMAGE" | "VIDEO";

export type DroneGalleryItem = {
  id: number;
  model_key: string | null;
  media_type: MediaType;
  media_path: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean | number | null;
};

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  sort_order: number;
  is_active: boolean;
  inferredType: MediaType;
  error?: string | null;
};

type PickTarget = "HERO" | "CARD";

function cx(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function isAuthError(res: Response) {
  return res.status === 401 || res.status === 403;
}

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.assign("/admin/login");
}

async function readSafe(res: Response) {
  const txt = await res.text();
  try {
    return { data: JSON.parse(txt) };
  } catch {
    return { data: null as any };
  }
}

function absUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function toBool(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return Boolean(v);
}

function normalizeMediaType(v: any): MediaType {
  const s = String(v || "").toUpperCase();
  return s === "VIDEO" ? "VIDEO" : "IMAGE";
}

function inferMediaType(file: File): MediaType {
  if (file.type?.startsWith("video/")) return "VIDEO";
  return "IMAGE";
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clampCaption(s: string) {
  return (s || "").slice(0, 160);
}

function GalleryLikeCard({
  item,
  selected,
  onClick,
}: {
  item: DroneGalleryItem;
  selected?: boolean;
  onClick?: () => void;
}) {
  const src = absUrl(item.media_path);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group overflow-hidden rounded-3xl border text-left transition",
        "border-white/10 bg-white/5 hover:bg-white/10",
        selected && "ring-2 ring-emerald-400/80"
      )}
      title="Clique para selecionar"
    >
      <div className="relative">
        {item.media_type === "VIDEO" ? (
          <video
            className="w-full aspect-video object-cover bg-black/40"
            src={src}
            controls
            playsInline
          />
        ) : (
          <img
            className="w-full aspect-video object-cover bg-black/40"
            src={src}
            alt={item.caption || "Galeria"}
            loading="lazy"
          />
        )}

        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {selected ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white/80">
            Selecionado
          </div>
        ) : null}
      </div>

      <div className="p-4">
        {item.caption ? (
          <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">
            {item.caption}
          </p>
        ) : (
          <p className="text-xs text-slate-400">Sem legenda</p>
        )}
      </div>
    </button>
  );
}

function PreviewBlock({ item, title }: { item: DroneGalleryItem; title: string }) {
  const src = absUrl(item.media_path);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h3 className="text-sm font-extrabold text-white">{title}</h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-slate-200">
          {item.media_type === "VIDEO" ? "VÍDEO" : "IMAGEM"}
        </span>
      </div>

      <div className="p-4 pt-3">
        {item.media_type === "VIDEO" ? (
          <video
            className="w-full aspect-video object-cover bg-black/30 rounded-2xl"
            src={src}
            controls
            playsInline
          />
        ) : (
          <img
            className="w-full aspect-video object-cover bg-black/30 rounded-2xl"
            src={src}
            alt={item.caption || title}
            loading="lazy"
          />
        )}

        {item.caption ? (
          <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-3">
            {item.caption}
          </p>
        ) : (
          <p className="mt-3 text-xs text-slate-400">Sem legenda</p>
        )}
      </div>
    </div>
  );
}

export default function GalleryForm({
  modelKey,
  currentCardMediaId,
  currentHeroMediaId,
  onPickForCard,
  onPickForHero,
}: {
  modelKey: string;
  currentCardMediaId?: number | null;
  currentHeroMediaId?: number | null;
  onPickForCard?: (item: DroneGalleryItem) => Promise<void> | void;
  onPickForHero?: (item: DroneGalleryItem) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<"PICK" | "MANAGE">("PICK");
  const [pickTarget, setPickTarget] = useState<PickTarget>("HERO");

  const [pickedCardId, setPickedCardId] = useState<number | null>(currentCardMediaId ?? null);
  const [pickedHeroId, setPickedHeroId] = useState<number | null>(currentHeroMediaId ?? null);

  useEffect(() => setPickedCardId(currentCardMediaId ?? null), [currentCardMediaId]);
  useEffect(() => setPickedHeroId(currentHeroMediaId ?? null), [currentHeroMediaId]);

  const [items, setItems] = useState<DroneGalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);

  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<number, boolean>>({});
  const [replacingIds, setReplacingIds] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort(
      (a, b) =>
        (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
        (Number(a.id) || 0) - (Number(b.id) || 0)
    );
    return copy;
  }, [items]);

  const activeItems = useMemo(() => {
    const actives = sortedItems.filter((it) => toBool(it.is_active));
    return actives.length ? actives : sortedItems;
  }, [sortedItems]);

  const heroPickedItem = useMemo(() => {
    if (!pickedHeroId) return undefined;
    return items.find((x) => Number(x.id) === Number(pickedHeroId));
  }, [items, pickedHeroId]);

  const cardPickedItem = useMemo(() => {
    if (!pickedCardId) return undefined;
    return items.find((x) => Number(x.id) === Number(pickedCardId));
  }, [items, pickedCardId]);

  async function fetchList() {
    if (!modelKey) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/drones/models/${modelKey}/gallery`, {
        credentials: "include",
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);

      if (!res.ok) {
        throw new Error(data?.message || "Erro ao listar galeria.");
      }

      const raw = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.rows)
              ? data.rows
              : [];

      const normalized: DroneGalleryItem[] = raw
        .map((it: any) => ({
          id: Number(it.id),
          model_key: it.model_key ?? null,
          media_type: normalizeMediaType(it.media_type ?? it.type),
          media_path: String(it.media_path || ""),
          // ✅ tolerante: backend às vezes manda `title`
          caption: it.caption ?? it.title ?? null,
          sort_order: Number(it.sort_order) || 0,
          is_active: it.is_active ?? it.active ?? 1,
        }))
        .filter((x: { id: any; media_path: any; }) => x.id && x.media_path);

      setItems(normalized);
    } catch (e: any) {
      setMsg(e?.message || "Falha ao carregar galeria.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey]);

  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ se o item selecionado não existir mais (ex: deletou), limpa local
  useEffect(() => {
    if (pickedHeroId && !items.some((x) => Number(x.id) === Number(pickedHeroId))) {
      setPickedHeroId(null);
    }
    if (pickedCardId && !items.some((x) => Number(x.id) === Number(pickedCardId))) {
      setPickedCardId(null);
    }
  }, [items, pickedHeroId, pickedCardId]);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const baseSort = (() => {
      const maxSort = sortedItems.reduce((acc, it) => Math.max(acc, Number(it.sort_order) || 0), 0);
      return (maxSort || 0) + 10;
    })();

    const newOnes: PendingUpload[] = Array.from(files).map((file, idx) => ({
      id: uid(),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: "",
      sort_order: baseSort + idx * 10,
      is_active: true,
      inferredType: inferMediaType(file),
      error: null,
    }));

    setPending((prev) => [...prev, ...newOnes]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePending(id: string) {
    setPending((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function updatePending(id: string, patch: Partial<PendingUpload>) {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function uploadAllPending() {
    if (!pending.length) return;

    setUploading(true);
    setMsg(null);

    try {
      for (const p of pending) {
        const fd = new FormData();
        fd.append("media", p.file);
        fd.append("caption", clampCaption(p.caption));
        fd.append("sort_order", String(Number(p.sort_order) || 0));
        fd.append("is_active", p.is_active ? "1" : "0");

        const res = await fetch(`${API_BASE}/api/admin/drones/models/${modelKey}/gallery`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });

        if (isAuthError(res)) return redirectToLogin();

        const { data } = await readSafe(res);

        if (!res.ok) {
          updatePending(p.id, { error: data?.message || "Falha no upload." });
        } else {
          updatePending(p.id, { error: null });
        }
      }

      setPending((prev) => {
        const keep = prev.filter((p) => p.error);
        prev.filter((p) => !p.error).forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return keep;
      });

      await fetchList();
    } catch (e: any) {
      setMsg(e?.message || "Falha ao enviar arquivos.");
    } finally {
      setUploading(false);
    }
  }

  function setItemLocal(id: number, patch: Partial<DroneGalleryItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function saveItem(it: DroneGalleryItem) {
    setSavingIds((m) => ({ ...m, [it.id]: true }));
    setMsg(null);

    try {
      const fd = new FormData();
      fd.append("caption", clampCaption(it.caption || ""));
      fd.append("sort_order", String(Number(it.sort_order) || 0));
      fd.append("is_active", toBool(it.is_active) ? "1" : "0");

      const res = await fetch(`${API_BASE}/api/admin/drones/models/${modelKey}/gallery/${it.id}`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);
      if (!res.ok) throw new Error(data?.message || "Erro ao salvar item.");

      await fetchList();
    } catch (e: any) {
      setMsg(e?.message || "Falha ao salvar item.");
    } finally {
      setSavingIds((m) => ({ ...m, [it.id]: false }));
    }
  }

  async function replaceMedia(id: number, file: File) {
    setReplacingIds((m) => ({ ...m, [id]: true }));
    setMsg(null);

    try {
      const current = items.find((x) => x.id === id);
      if (!current) throw new Error("Item não encontrado.");

      const fd = new FormData();
      fd.append("media", file);
      fd.append("caption", clampCaption(current.caption || ""));
      fd.append("sort_order", String(Number(current.sort_order) || 0));
      fd.append("is_active", toBool(current.is_active) ? "1" : "0");

      const res = await fetch(`${API_BASE}/api/admin/drones/models/${modelKey}/gallery/${id}`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);
      if (!res.ok) throw new Error(data?.message || "Erro ao trocar mídia.");

      toast.success("Mídia trocada com sucesso.");
      await fetchList();
    } catch (e: any) {
      setMsg(e?.message || "Falha ao trocar mídia.");
      toast.error(e?.message || "Falha ao trocar mídia.");
    } finally {
      setReplacingIds((m) => ({ ...m, [id]: false }));
    }
  }

  async function deleteItem(id: number) {
    setDeletingIds((m) => ({ ...m, [id]: true }));
    setMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/drones/models/${modelKey}/gallery/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);
      if (!res.ok) throw new Error(data?.message || "Erro ao remover item.");

      toast.success("Mídia removida com sucesso.");

      setPickedCardId((prev) => (prev === id ? null : prev));
      setPickedHeroId((prev) => (prev === id ? null : prev));

      await fetchList();
    } catch (e: any) {
      setMsg(e?.message || "Falha ao remover item.");
      toast.error(e?.message || "Falha ao remover item.");
    } finally {
      setDeletingIds((m) => ({ ...m, [id]: false }));
    }
  }

  function moveItem(id: number, dir: -1 | 1) {
    const arr = [...sortedItems];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx < 0) return;

    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= arr.length) return;

    const a = arr[idx];
    const b = arr[swapIdx];

    const aSort = Number(a.sort_order) || 0;
    const bSort = Number(b.sort_order) || 0;

    setItemLocal(a.id, { sort_order: bSort });
    setItemLocal(b.id, { sort_order: aSort });
  }

  async function pickItem(item: DroneGalleryItem, forceTarget?: PickTarget) {
    setMsg(null);

    const target: PickTarget = forceTarget || pickTarget;

    try {
      if (target === "CARD") {
        setPickedCardId(item.id);
        await onPickForCard?.(item);
        toast.success("Mídia selecionada para o Card.");
        return;
      }

      setPickedHeroId(item.id);
      await onPickForHero?.(item);
      toast.success("Mídia selecionada para Destaque.");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao selecionar mídia.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Galeria</div>
            <div className="mt-0.5 text-xs text-white/60">
              Selecione a mídia do <b>Card</b> ou do <b>Destaque</b>. E gerencie uploads/edições.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("PICK")}
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-semibold border transition",
                tab === "PICK"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              Seleção rápida
            </button>

            <button
              type="button"
              onClick={() => setTab("MANAGE")}
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-semibold border transition",
                tab === "MANAGE"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              Gerenciar (CRUD)
            </button>

            <button
              type="button"
              onClick={fetchList}
              disabled={loading}
              className={cx(
                "rounded-xl px-4 py-2 text-sm font-medium border transition",
                "border-white/15 bg-white/5 text-white hover:bg-white/10",
                "disabled:opacity-60"
              )}
            >
              {loading ? "Carregando..." : "Recarregar"}
            </button>
          </div>
        </div>

        {tab === "PICK" ? (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-white/60">
              Clique em uma mídia para definir como <b className="text-white">Card</b> ou{" "}
              <b className="text-white">Destaque</b>.
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Selecionar para:</span>

              <button
                type="button"
                onClick={() => setPickTarget("HERO")}
                className={cx(
                  "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                  pickTarget === "HERO"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                )}
              >
                Destaque (Hero)
              </button>

              <button
                type="button"
                onClick={() => setPickTarget("CARD")}
                className={cx(
                  "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                  pickTarget === "CARD"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                )}
              >
                Card (Lista)
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {msg ? (
        <div className="rounded-2xl border border-amber-200/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {msg}
        </div>
      ) : null}

      {(heroPickedItem || cardPickedItem) ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Prévia do cliente (Destaque + Card)</div>
              <div className="text-xs text-white/60">Atualiza na hora quando você seleciona.</div>
            </div>

            <div className="hidden sm:block text-xs text-white/50">
              Card: <b className="text-white/80">{pickedCardId ? `#${pickedCardId}` : "—"}</b> •
              Destaque: <b className="text-white/80">{pickedHeroId ? `#${pickedHeroId}` : "—"}</b>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:gap-5 sm:grid-cols-2">
            {heroPickedItem ? (
              <PreviewBlock item={heroPickedItem} title="Destaque" />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Sem Destaque selecionado
              </div>
            )}

            {cardPickedItem ? (
              <PreviewBlock item={cardPickedItem} title="Card" />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Sem Card selecionado
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "PICK" ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Prévia igual ao cliente</div>
              <div className="text-xs text-white/60">
                Mostrando itens ativos (se nenhum estiver ativo, mostramos todos).
              </div>
            </div>

            <div className="hidden sm:block text-xs text-white/50">
              Card: <b className="text-white/80">{pickedCardId ? `#${pickedCardId}` : "—"}</b> •
              Destaque: <b className="text-white/80">{pickedHeroId ? `#${pickedHeroId}` : "—"}</b>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
              Carregando...
            </div>
          ) : activeItems.length ? (
            <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeItems.map((it) => {
                const selected =
                  pickTarget === "CARD" ? it.id === pickedCardId : it.id === pickedHeroId;
                return (
                  <GalleryLikeCard
                    key={it.id}
                    item={it}
                    selected={selected}
                    onClick={() => pickItem(it)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Nenhuma mídia encontrada para este modelo.
            </div>
          )}
        </div>
      ) : null}

      {tab === "MANAGE" ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Adicionar mídias</div>
                <div className="mt-0.5 text-xs text-white/60">
                  Aceita <b>jpg/png/webp</b> e <b>mp4</b>.
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label
                  className={cx(
                    "cursor-pointer rounded-xl px-4 py-2 text-sm font-medium",
                    "border border-white/15 bg-white/5 text-white hover:bg-white/10 transition"
                  )}
                >
                  Selecionar arquivos
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4"
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>

                <button
                  type="button"
                  onClick={uploadAllPending}
                  disabled={uploading || pending.length === 0}
                  className={cx(
                    "rounded-xl px-4 py-2 text-sm font-semibold",
                    "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition",
                    "disabled:opacity-60 disabled:hover:bg-emerald-500"
                  )}
                >
                  {uploading ? "Enviando..." : `Enviar (${pending.length})`}
                </button>
              </div>
            </div>

            {pending.length ? (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-black/40">
                      {p.inferredType === "VIDEO" ? (
                        <video className="h-full w-full object-cover" src={p.previewUrl} controls />
                      ) : (
                        <img className="h-full w-full object-cover" src={p.previewUrl} alt="preview" />
                      )}
                    </div>

                    <div className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-white/70">
                          {p.inferredType === "VIDEO" ? "Vídeo" : "Imagem"} •{" "}
                          {(p.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <button
                          type="button"
                          onClick={() => removePending(p.id)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                        >
                          Remover
                        </button>
                      </div>

                      <input
                        value={p.caption}
                        onChange={(e) => updatePending(p.id, { caption: clampCaption(e.target.value) })}
                        placeholder="Legenda (opcional)"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          value={p.sort_order}
                          onChange={(e) => updatePending(p.id, { sort_order: Number(e.target.value) || 0 })}
                          type="number"
                          className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
                          title="Ordem"
                        />

                        <label className="flex items-center gap-2 text-sm text-white/80">
                          <input
                            type="checkbox"
                            checked={p.is_active}
                            onChange={(e) => updatePending(p.id, { is_active: e.target.checked })}
                            className="h-4 w-4"
                          />
                          Ativo
                        </label>
                      </div>

                      {p.error ? (
                        <div className="rounded-xl border border-amber-200/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                          {p.error}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs text-white/50">
                Nenhum arquivo pendente. Use “Selecionar arquivos”.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Itens cadastrados</div>
                <div className="text-xs text-white/60">
                  Total: <b className="text-white">{sortedItems.length}</b>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                Carregando...
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="mt-3 text-sm text-white/60">Ainda não há mídias para este modelo.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedItems.map((it) => {
                  const active = toBool(it.is_active);
                  const busy = Boolean(savingIds[it.id] || deletingIds[it.id] || replacingIds[it.id]);

                  return (
                    <div
                      key={it.id}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-black/40">
                        {it.media_type === "VIDEO" ? (
                          <video className="h-full w-full object-cover" src={absUrl(it.media_path)} controls />
                        ) : (
                          <img className="h-full w-full object-cover" src={absUrl(it.media_path)} alt={it.caption || "mídia"} />
                        )}
                      </div>

                      <div className="space-y-2 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-white/70">
                            #{it.id} • {it.media_type === "VIDEO" ? "Vídeo" : "Imagem"} •{" "}
                            <span className={active ? "text-emerald-300" : "text-zinc-300"}>
                              {active ? "Ativo" : "Inativo"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveItem(it.id, -1)}
                              disabled={busy}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
                              title="Subir"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(it.id, 1)}
                              disabled={busy}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
                              title="Descer"
                            >
                              ↓
                            </button>
                          </div>
                        </div>

                        <input
                          value={it.caption || ""}
                          onChange={(e) => setItemLocal(it.id, { caption: clampCaption(e.target.value) })}
                          placeholder="Legenda (opcional)"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
                          disabled={busy}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={Number(it.sort_order) || 0}
                            onChange={(e) => setItemLocal(it.id, { sort_order: Number(e.target.value) || 0 })}
                            type="number"
                            className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
                            disabled={busy}
                            title="Ordem"
                          />

                          <label className="flex items-center gap-2 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={(e) => setItemLocal(it.id, { is_active: e.target.checked })}
                              className="h-4 w-4"
                              disabled={busy}
                            />
                            Ativo
                          </label>

                          <div className="ml-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => pickItem(it, "HERO")}
                              disabled={busy}
                              className={cx(
                                "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                                it.id === pickedHeroId
                                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                  : "border-white/15 bg-white/5 text-white hover:bg-white/10",
                                "disabled:opacity-60"
                              )}
                              title="Selecionar para Destaque (Hero)"
                            >
                              {it.id === pickedHeroId ? "Destaque ✓" : "Selecionar p/ Destaque"}
                            </button>

                            <button
                              type="button"
                              onClick={() => pickItem(it, "CARD")}
                              disabled={busy}
                              className={cx(
                                "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                                it.id === pickedCardId
                                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                  : "border-white/15 bg-white/5 text-white hover:bg-white/10",
                                "disabled:opacity-60"
                              )}
                              title="Selecionar para Card (Lista)"
                            >
                              {it.id === pickedCardId ? "Card ✓" : "Selecionar p/ Card"}
                            </button>

                            <label
                              className={cx(
                                "cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold",
                                "border border-white/15 bg-white/5 text-white hover:bg-white/10 transition",
                                busy && "opacity-60 cursor-not-allowed"
                              )}
                              title="Trocar arquivo (imagem/vídeo)"
                            >
                              {replacingIds[it.id] ? "Trocando..." : "Trocar mídia"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,video/mp4"
                                className="hidden"
                                disabled={busy}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) replaceMedia(it.id, f);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => saveItem(it)}
                              disabled={busy}
                              className={cx(
                                "rounded-xl px-3 py-2 text-xs font-semibold",
                                "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition",
                                "disabled:opacity-60 disabled:hover:bg-emerald-500"
                              )}
                            >
                              {savingIds[it.id] ? "Salvando..." : "Salvar"}
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteItem(it.id)}
                              disabled={busy}
                              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-60"
                            >
                              {deletingIds[it.id] ? "Removendo..." : "Excluir"}
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-white/45">
                          model_key: <b className="text-white/70">{String(it.model_key || "")}</b>
                        </div>
                      </div>

                      {!active ? (
                        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white/70">
                          Inativo
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
