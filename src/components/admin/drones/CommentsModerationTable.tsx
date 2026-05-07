"use client";

// Tabela de moderação de comentários do admin de drones.
// Comentário público entra como PENDENTE — admin aprova/reprova antes
// de aparecer na landing. Filtro por status, badge colorido por estado,
// botões de ação e exclusão definitiva.

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import type { DroneCommentStatus } from "@/types/drones";

type CommentMedia = {
  id: number;
  media_type: "IMAGE" | "VIDEO";
  media_path: string;
};

type CommentRow = {
  id: number;
  display_name: string;
  comment_text: string;
  status: DroneCommentStatus;
  created_at: string;
  updated_at: string;
  media: CommentMedia[];
  media_count?: number;
};

type StatusFilter = "ALL" | DroneCommentStatus;

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "ALL", label: "Todos" },
  { id: "PENDENTE", label: "Pendentes" },
  { id: "APROVADO", label: "Aprovados" },
  { id: "REPROVADO", label: "Reprovados" },
];

const STATUS_BADGE: Record<
  DroneCommentStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  PENDENTE: {
    bg: "bg-amber-500/15",
    text: "text-amber-200",
    border: "border-amber-400/40",
    label: "Pendente",
  },
  APROVADO: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-200",
    border: "border-emerald-400/40",
    label: "Aprovado",
  },
  REPROVADO: {
    bg: "bg-rose-500/15",
    text: "text-rose-200",
    border: "border-rose-400/40",
    label: "Reprovado",
  },
};

export default function CommentsModerationTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDENTE");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [data, setData] = useState<{
    items: CommentRow[];
    total: number;
    totalPages: number;
  } | null>(null);

  const [actingId, setActingId] = useState<number | null>(null);

  const items = useMemo(() => data?.items || [], [data]);

  async function load(p = page, status: StatusFilter = statusFilter) {
    setMsg(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "20");
      if (status !== "ALL") params.set("status", status);

      const data = await apiClient.get<{
        items?: CommentRow[];
        total?: number;
        totalPages?: number;
        page?: number;
      }>(`/api/admin/drones/comentarios?${params.toString()}`);

      setData({
        items: Array.isArray(data?.items) ? data.items : [],
        total: Number(data?.total || 0),
        totalPages: Number(data?.totalPages || 1),
      });
      setPage(Number(data?.page || p));
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro de rede ao carregar comentários.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function approve(id: number) {
    await act(id, "aprovar", "Comentário aprovado.");
  }
  async function reject(id: number) {
    await act(id, "reprovar", "Comentário reprovado.");
  }
  async function remove(id: number) {
    setMsg(null);
    setActingId(id);
    try {
      await apiClient.del(`/api/admin/drones/comentarios/${id}`);
      setMsg("Comentário excluído.");
      await load(page, statusFilter);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro de rede ao excluir.");
    } finally {
      setActingId(null);
    }
  }

  async function act(id: number, action: "aprovar" | "reprovar", okMsg: string) {
    setMsg(null);
    setActingId(id);
    try {
      await apiClient.put(`/api/admin/drones/comentarios/${id}/${action}`, {});
      setMsg(okMsg);
      await load(page, statusFilter);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || `Erro ao ${action} comentário.`);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">
            Moderação de comentários
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Comentários enviados pelo público entram como{" "}
            <strong>Pendentes</strong>. Aprovados aparecem na landing.
          </p>
        </div>

        <button
          onClick={() => load(1, statusFilter)}
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15"
        >
          Atualizar
        </button>
      </div>

      {/* Filtro por status */}
      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {STATUS_TABS.map((t) => {
          const active = t.id === statusFilter;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setStatusFilter(t.id);
                setPage(1);
              }}
              className={[
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-emerald-400 bg-emerald-500 text-black"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {msg ? <p className="mt-3 text-sm text-slate-200">{msg}</p> : null}

      {loading ? (
        <p className="mt-4 text-slate-300">Carregando...</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {items.map((c) => {
              const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.PENDENTE;
              const acting = actingId === c.id;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-white">
                          {c.display_name || "Cliente Kavita"}
                        </p>
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                            badge.bg,
                            badge.text,
                            badge.border,
                          ].join(" ")}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ID #{c.id}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {c.status !== "APROVADO" && (
                        <button
                          onClick={() => approve(c.id)}
                          disabled={acting}
                          className="rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-bold text-black disabled:opacity-60 hover:brightness-110"
                        >
                          {acting ? "..." : "Aprovar"}
                        </button>
                      )}
                      {c.status !== "REPROVADO" && (
                        <button
                          onClick={() => reject(c.id)}
                          disabled={acting}
                          className="rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-100 disabled:opacity-60 hover:bg-amber-500/25"
                        >
                          {acting ? "..." : "Reprovar"}
                        </button>
                      )}
                      <button
                        onClick={() => remove(c.id)}
                        disabled={acting}
                        className="rounded-full bg-rose-500/80 px-4 py-2 text-xs font-bold text-white disabled:opacity-60 hover:brightness-110"
                      >
                        {acting ? "..." : "Excluir"}
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                    {c.comment_text}
                  </p>

                  {c.media?.length ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {c.media.map((m) => {
                        const src = absUrl(m.media_path);
                        return m.media_type === "VIDEO" ? (
                          <video
                            key={m.id}
                            className="block aspect-video w-full rounded-xl border border-white/10 bg-black/40 object-cover"
                            src={src}
                            controls
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            key={m.id}
                            className="block aspect-video w-full rounded-xl border border-white/10 bg-black/40 object-cover"
                            src={src}
                            alt="mídia do comentário"
                            loading="lazy"
                          />
                        );
                      })}
                    </div>
                  ) : c.media_count && c.media_count > 0 ? (
                    <p className="mt-3 text-xs text-slate-400">
                      {c.media_count} mídia(s) anexada(s).
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {data?.totalPages && data.totalPages > 1 ? (
            <div className="mt-5 flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1, statusFilter)}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Anterior
              </button>
              <p className="text-xs text-slate-300">
                Página {page} de {data.totalPages}
              </p>
              <button
                disabled={page >= data.totalPages}
                onClick={() => load(page + 1, statusFilter)}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          ) : null}

          {!items.length ? (
            <p className="mt-4 text-sm text-slate-300">
              Nenhum comentário {statusFilter === "ALL" ? "" : "neste status"}.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
