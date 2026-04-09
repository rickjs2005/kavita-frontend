"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

/* ── Types ──────────────────────────────────────────────────────── */

type Status = "nova" | "lida" | "respondida" | "arquivada";

type Mensagem = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
  status: Status;
  created_at: string;
};

type Stats = {
  nova: number;
  lida: number;
  respondida: number;
  arquivada: number;
  total: number;
};

type Analytics = {
  topTopics: { topic: string; views: number }[];
  topSearches: { term: string; searches: number }[];
  eventCounts: { event_type: string; total: number }[];
};

type ApiListResponse = {
  ok: boolean;
  data: Mensagem[];
  meta: { total: number; page: number; limit: number; pages: number };
};

/* ── Status config ──────────────────────────────────────────────── */

const STATUS_LABELS: Record<Status, string> = {
  nova: "Nova",
  lida: "Lida",
  respondida: "Respondida",
  arquivada: "Arquivada",
};

const STATUS_CLASSES: Record<Status, string> = {
  nova: "border-blue-200 bg-blue-50 text-blue-700",
  lida: "border-amber-200 bg-amber-50 text-amber-700",
  respondida: "border-green-200 bg-green-50 text-green-700",
  arquivada: "border-gray-200 bg-gray-100 text-gray-500",
};

const STATUS_OPTIONS: Status[] = ["nova", "lida", "respondida", "arquivada"];

const NEXT_STATUS: Record<Status, Status> = {
  nova: "lida",
  lida: "respondida",
  respondida: "arquivada",
  arquivada: "nova",
};

/* ── Component ──────────────────────────────────────────────────── */

export default function ContatoMensagensPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<Status | "todas">("todas");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        apiClient.get<ApiListResponse>("/api/admin/contato-mensagens?limit=100"),
        apiClient.get<Stats>("/api/admin/contato-mensagens/stats"),
      ]);

      const list = Array.isArray(listRes) ? listRes : (listRes as any)?.data ?? [];
      setMensagens(list);

      const s = (statsRes as any)?.data ?? statsRes;
      setStats(s);

      // Analytics — best effort, don't block
      try {
        const aRes = await apiClient.get<Analytics>("/api/admin/contato-mensagens/analytics?days=30");
        setAnalytics((aRes as any)?.data ?? aRes);
      } catch { /* ignore */ }
    } catch {
      setErro("Erro ao carregar mensagens de contato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (filtroStatus === "todas") return mensagens;
    return mensagens.filter((m) => m.status === filtroStatus);
  }, [mensagens, filtroStatus]);

  async function handleUpdateStatus(id: number, newStatus: Status) {
    setUpdatingId(id);
    try {
      await apiClient.patch(`/api/admin/contato-mensagens/${id}/status`, {
        status: newStatus,
      });
      setMensagens((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      // Update stats locally
      setStats((prev) => {
        if (!prev) return prev;
        const old = mensagens.find((m) => m.id === id);
        if (!old) return prev;
        return {
          ...prev,
          [old.status]: Math.max(0, prev[old.status] - 1),
          [newStatus]: prev[newStatus] + 1,
        };
      });
    } catch {
      setErro("Erro ao atualizar status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return;
    try {
      await apiClient.del(`/api/admin/contato-mensagens/${id}`);
      const deleted = mensagens.find((m) => m.id === id);
      setMensagens((prev) => prev.filter((m) => m.id !== id));
      if (deleted && stats) {
        setStats({
          ...stats,
          [deleted.status]: Math.max(0, stats[deleted.status] - 1),
          total: Math.max(0, stats.total - 1),
        });
      }
      if (expandedId === id) setExpandedId(null);
    } catch {
      setErro("Erro ao excluir mensagem.");
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Mensagens de Contato
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie as mensagens recebidas pelo formulario de atendimento
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {([
            { key: "total" as const, label: "Total", cls: "border-gray-200 bg-white text-gray-900" },
            { key: "nova" as const, label: "Novas", cls: "border-blue-200 bg-blue-50 text-blue-700" },
            { key: "lida" as const, label: "Lidas", cls: "border-amber-200 bg-amber-50 text-amber-700" },
            { key: "respondida" as const, label: "Respondidas", cls: "border-green-200 bg-green-50 text-green-700" },
            { key: "arquivada" as const, label: "Arquivadas", cls: "border-gray-200 bg-gray-100 text-gray-500" },
          ] as const).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() =>
                setFiltroStatus(s.key === "total" ? "todas" : s.key)
              }
              className={[
                "rounded-xl border p-3 text-center transition hover:shadow-sm",
                s.cls,
                filtroStatus === (s.key === "total" ? "todas" : s.key)
                  ? "ring-2 ring-primary/40 shadow-sm"
                  : "",
              ].join(" ")}
            >
              <p className="text-2xl font-bold">{stats[s.key]}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Filtrar:</span>
        <button
          type="button"
          onClick={() => setFiltroStatus("todas")}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
            filtroStatus === "todas"
              ? "border-primary bg-primary/10 text-primary"
              : "border-gray-200 text-gray-600 hover:border-gray-300",
          ].join(" ")}
        >
          Todas
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFiltroStatus(s)}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              filtroStatus === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 text-gray-600 hover:border-gray-300",
            ].join(" ")}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}

        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} mensagen{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Carregando mensagens..." />}

      {erro && !loading && (
        <ErrorState message={erro} onRetry={fetchData} />
      )}

      {!loading && !erro && filtered.length === 0 && (
        <EmptyState
          message={
            filtroStatus !== "todas"
              ? `Nenhuma mensagem com status "${STATUS_LABELS[filtroStatus]}".`
              : "Nenhuma mensagem de contato recebida ainda."
          }
          action={
            filtroStatus !== "todas"
              ? { label: "Limpar filtro", onClick: () => setFiltroStatus("todas") }
              : undefined
          }
        />
      )}

      {!loading && !erro && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const isUpdating = updatingId === msg.id;

            return (
              <div
                key={msg.id}
                className={[
                  "rounded-xl border bg-white shadow-sm transition",
                  isExpanded ? "border-primary/30 shadow-md" : "border-gray-100",
                ].join(" ")}
              >
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  className="flex w-full items-start gap-3 p-4 text-left sm:items-center"
                >
                  {/* Status badge */}
                  <span
                    className={[
                      "mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:mt-0",
                      STATUS_CLASSES[msg.status],
                    ].join(" ")}
                  >
                    {STATUS_LABELS[msg.status]}
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {msg.assunto}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {msg.nome} &middot; {msg.email}
                    </p>
                  </div>

                  {/* Date */}
                  <span className="shrink-0 text-xs text-gray-400 hidden sm:block">
                    {formatDate(msg.created_at)}
                  </span>

                  {/* Chevron */}
                  <svg
                    className={[
                      "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
                      isExpanded ? "rotate-180" : "",
                    ].join(" ")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                    {/* Meta row on mobile */}
                    <p className="mb-3 text-xs text-gray-400 sm:hidden">
                      {formatDate(msg.created_at)}
                    </p>

                    {/* Contact details */}
                    <div className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-xs font-medium text-gray-400">Nome</span>
                        <p className="text-gray-800">{msg.nome}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-400">E-mail</span>
                        <p className="text-gray-800 break-all">{msg.email}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-400">WhatsApp</span>
                        <p className="text-gray-800">{msg.telefone || "—"}</p>
                      </div>
                    </div>

                    {/* Message body */}
                    <div className="rounded-lg bg-gray-50 p-3">
                      <span className="text-xs font-medium text-gray-400">Mensagem</span>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {msg.mensagem}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {/* Quick status advance */}
                      {msg.status !== "arquivada" && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleUpdateStatus(msg.id, NEXT_STATUS[msg.status])
                          }
                          className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
                        >
                          {isUpdating
                            ? "Atualizando..."
                            : `Marcar como ${STATUS_LABELS[NEXT_STATUS[msg.status]]}`}
                        </button>
                      )}

                      {/* Status dropdown */}
                      <select
                        value={msg.status}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleUpdateStatus(msg.id, e.target.value as Status)
                        }
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>

                      {/* Reply via email */}
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.assunto)}`}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                      >
                        Responder por e-mail
                      </a>

                      {/* Reply via WhatsApp */}
                      {msg.telefone && (
                        <a
                          href={`https://wa.me/55${msg.telefone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:border-green-300"
                        >
                          WhatsApp
                        </a>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(msg.id)}
                        className="ml-auto rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Analytics section */}
      {analytics && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => setShowAnalytics((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showAnalytics ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Engajamento da Central de Ajuda (ultimos 30 dias)
          </button>

          {showAnalytics && (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Event summary */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumo de eventos</h4>
                <div className="space-y-2">
                  {(analytics.eventCounts.length > 0 ? analytics.eventCounts : []).map((e) => (
                    <div key={e.event_type} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {e.event_type === "faq_topic_view" && "Topicos abertos"}
                        {e.event_type === "faq_search" && "Buscas no FAQ"}
                        {e.event_type === "form_start" && "Formulario iniciado"}
                        {e.event_type === "whatsapp_hero_click" && "Cliques WhatsApp hero"}
                      </span>
                      <span className="font-semibold text-gray-900">{e.total}</span>
                    </div>
                  ))}
                  {analytics.eventCounts.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhum evento registrado ainda.</p>
                  )}
                </div>
              </div>

              {/* Top topics */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Topicos mais abertos</h4>
                <div className="space-y-2">
                  {analytics.topTopics.slice(0, 8).map((t, i) => (
                    <div key={t.topic} className="flex items-center gap-2 text-sm">
                      <span className="w-5 shrink-0 text-xs text-gray-400 text-right">{i + 1}.</span>
                      <span className="flex-1 truncate text-gray-600">{t.topic}</span>
                      <span className="shrink-0 font-medium text-gray-800">{t.views}x</span>
                    </div>
                  ))}
                  {analytics.topTopics.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhum topico aberto ainda.</p>
                  )}
                </div>
              </div>

              {/* Top searches */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Termos mais buscados</h4>
                <div className="space-y-2">
                  {analytics.topSearches.slice(0, 8).map((s, i) => (
                    <div key={s.term} className="flex items-center gap-2 text-sm">
                      <span className="w-5 shrink-0 text-xs text-gray-400 text-right">{i + 1}.</span>
                      <span className="flex-1 truncate text-gray-600">&ldquo;{s.term}&rdquo;</span>
                      <span className="shrink-0 font-medium text-gray-800">{s.searches}x</span>
                    </div>
                  ))}
                  {analytics.topSearches.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhuma busca registrada ainda.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
