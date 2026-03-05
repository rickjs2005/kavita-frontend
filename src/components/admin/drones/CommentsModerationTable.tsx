"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type CommentMedia = {
  id: number;
  media_type: "IMAGE" | "VIDEO";
  media_path: string;
};

type CommentRow = {
  id: number;
  display_name: string;
  comment_text: string;
  status?: "PENDENTE" | "APROVADO" | "REPROVADO"; // pode existir no backend, mas não é mais usado no fluxo
  created_at: string;
  updated_at: string;
  media: CommentMedia[];
};

export default function CommentsModerationTable() {
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [data, setData] = useState<{ items: CommentRow[]; total: number; totalPages: number } | null>(null);

  const [actingId, setActingId] = useState<number | null>(null);

  const items = useMemo(() => data?.items || [], [data]);

  async function load(p = page) {
    setMsg(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "20");

      // Se seu backend ainda exigir "status", você pode fixar aqui:
      // params.set("status", "aprovado");

      const data = await apiClient.get<any>(
        `/api/admin/drones/comentarios?${params.toString()}`
      );

      setData({
        items: Array.isArray(data?.items) ? data.items : [],
        total: Number(data?.total || 0),
        totalPages: Number(data?.totalPages || 1),
      });
      setPage(Number(data?.page || p));
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(err?.message || "Erro de rede ao carregar comentários.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id: number) {
    setMsg(null);
    setActingId(id);
    try {
      await apiClient.del(`/api/admin/drones/comentarios/${id}`);
      setMsg("Comentário excluído.");
      await load(1);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(err?.message || "Erro de rede ao excluir.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold">Comentários/Relatos (admin)</h2>
          <p className="mt-1 text-xs text-slate-300">
            Fluxo sem moderação: os comentários entram e aparecem no público. Aqui você pode apenas excluir.
          </p>
        </div>

        <button
          onClick={() => load(1)}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white border border-white/10 hover:bg-white/15"
        >
          Atualizar
        </button>
      </div>

      {msg ? <p className="mt-3 text-sm text-slate-200">{msg}</p> : null}

      {loading ? (
        <p className="mt-4 text-slate-300">Carregando...</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {c.display_name || "Cliente Kavita"}{" "}
                      <span className="text-xs text-slate-400 font-normal">• ID #{c.id}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleString()}
                      {c.status ? ` • status ${c.status}` : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => remove(c.id)}
                      disabled={actingId === c.id}
                      className="rounded-full bg-red-500/80 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {actingId === c.id ? "..." : "Excluir"}
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-200 whitespace-pre-wrap">{c.comment_text}</p>

                {c.media?.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {c.media.map((m) => {
                      const src = `${API_BASE}${m.media_path}`;
                      return m.media_type === "VIDEO" ? (
                        <video
                          key={m.id}
                          className="w-full rounded-xl border border-white/10"
                          src={src}
                          controls
                          playsInline
                        />
                      ) : (
                        <img
                          key={m.id}
                          className="w-full rounded-xl border border-white/10 object-cover"
                          src={src}
                          alt="mídia do comentário"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">Sem mídia anexada.</p>
                )}
              </div>
            ))}
          </div>

          {data?.totalPages && data.totalPages > 1 ? (
            <div className="mt-5 flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white border border-white/10 disabled:opacity-50"
              >
                Anterior
              </button>
              <p className="text-xs text-slate-300">
                Página {page} de {data.totalPages}
              </p>
              <button
                disabled={page >= data.totalPages}
                onClick={() => load(page + 1)}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white border border-white/10 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          ) : null}

          {!items.length ? (
            <p className="mt-4 text-sm text-slate-300">Nenhum comentário encontrado.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
