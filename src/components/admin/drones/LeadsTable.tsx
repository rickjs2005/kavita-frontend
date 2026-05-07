"use client";

// Tabela de leads do admin de drones.
// Lista leads capturados via InterestFormSection (POST /api/public/drones/leads)
// e permite o admin filtrar por status/modelo, alterar status, ver detalhes
// e excluir.

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { DroneLead, DroneLeadStatus } from "@/types/drones";

type StatusFilter = "ALL" | DroneLeadStatus;

const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "ALL", label: "Todos" },
  { id: "NOVO", label: "Novos" },
  { id: "EM_CONTATO", label: "Em contato" },
  { id: "NEGOCIACAO", label: "Negociação" },
  { id: "CONVERTIDO", label: "Convertidos" },
  { id: "PERDIDO", label: "Perdidos" },
];

const STATUS_BADGE: Record<
  DroneLeadStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  NOVO: {
    bg: "bg-sky-500/15",
    text: "text-sky-200",
    border: "border-sky-400/40",
    label: "Novo",
  },
  EM_CONTATO: {
    bg: "bg-amber-500/15",
    text: "text-amber-200",
    border: "border-amber-400/40",
    label: "Em contato",
  },
  NEGOCIACAO: {
    bg: "bg-violet-500/15",
    text: "text-violet-200",
    border: "border-violet-400/40",
    label: "Negociação",
  },
  CONVERTIDO: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-200",
    border: "border-emerald-400/40",
    label: "Convertido",
  },
  PERDIDO: {
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    border: "border-slate-400/40",
    label: "Perdido",
  },
};

const ALL_STATUSES: DroneLeadStatus[] = [
  "NOVO",
  "EM_CONTATO",
  "NEGOCIACAO",
  "CONVERTIDO",
  "PERDIDO",
];

function formatPhone(raw: string): string {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

export default function LeadsTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("NOVO");
  const [busca, setBusca] = useState("");
  const [modeloFilter, setModeloFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const [data, setData] = useState<{
    items: DroneLead[];
    total: number;
    totalPages: number;
  } | null>(null);

  const items = useMemo(() => data?.items || [], [data]);

  async function load(
    p = page,
    status: StatusFilter = statusFilter,
    q = busca,
    modelo = modeloFilter,
  ) {
    setMsg(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "20");
      if (status !== "ALL") params.set("status", status);
      if (q.trim()) params.set("busca", q.trim());
      if (modelo.trim()) params.set("modelo_interesse", modelo.trim());

      const res = await apiClient.get<{
        items?: DroneLead[];
        total?: number;
        totalPages?: number;
        page?: number;
      }>(`/api/admin/drones/leads?${params.toString()}`);

      setData({
        items: Array.isArray(res?.items) ? res.items : [],
        total: Number(res?.total || 0),
        totalPages: Number(res?.totalPages || 1),
      });
      setPage(Number(res?.page || p));
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro de rede ao carregar leads.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, statusFilter, busca, modeloFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function changeStatus(id: number, next: DroneLeadStatus) {
    setMsg(null);
    setActingId(id);
    try {
      await apiClient.put(`/api/admin/drones/leads/${id}`, { status: next });
      setMsg("Status atualizado.");
      await load(page, statusFilter, busca, modeloFilter);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro ao atualizar status.");
    } finally {
      setActingId(null);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Excluir este lead permanentemente?")) return;
    setMsg(null);
    setActingId(id);
    try {
      await apiClient.del(`/api/admin/drones/leads/${id}`);
      setMsg("Lead excluído.");
      await load(page, statusFilter, busca, modeloFilter);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro ao excluir lead.");
    } finally {
      setActingId(null);
    }
  }

  function whatsappLink(rawPhone: string, nome: string, modelo?: string | null) {
    const digits = String(rawPhone || "").replace(/\D/g, "");
    const full = digits.startsWith("55") ? digits : `55${digits}`;
    const text = encodeURIComponent(
      `Olá, ${nome}! Sou da Kavita Drones. Vi que você se interessou pelo ${
        modelo ? modelo.toUpperCase() : "DJI Agras"
      }.`,
    );
    return `https://wa.me/${full}?text=${text}`;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Leads de interesse</h2>
          <p className="mt-1 text-xs text-slate-300">
            Capturados pela landing antes do redirect para o WhatsApp.
          </p>
        </div>
        <button
          onClick={() => load(1, statusFilter, busca, modeloFilter)}
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

      {/* Filtros texto */}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load(1, statusFilter, busca, modeloFilter);
          }}
          placeholder="Buscar por nome, cidade ou telefone..."
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
        <input
          value={modeloFilter}
          onChange={(e) => setModeloFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load(1, statusFilter, busca, modeloFilter);
          }}
          placeholder="Modelo (t25p, t70p...)"
          className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
        <button
          onClick={() => load(1, statusFilter, busca, modeloFilter)}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-black hover:brightness-110"
        >
          Filtrar
        </button>
      </div>

      {msg ? <p className="mt-3 text-sm text-slate-200">{msg}</p> : null}

      {loading ? (
        <p className="mt-4 text-slate-300">Carregando...</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {items.map((lead) => {
              const badge = STATUS_BADGE[lead.status] ?? STATUS_BADGE.NOVO;
              const acting = actingId === lead.id;
              return (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-white">
                          {lead.nome}
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
                          ID #{lead.id}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                        <span className="font-mono">
                          {formatPhone(lead.telefone)}
                        </span>
                        {(lead.cidade || lead.uf) && (
                          <span>
                            {lead.cidade || "—"}
                            {lead.uf ? ` / ${lead.uf}` : ""}
                          </span>
                        )}
                        {lead.modelo_interesse && (
                          <span className="font-mono uppercase">
                            {lead.modelo_interesse}
                          </span>
                        )}
                        <span className="text-slate-500">
                          {new Date(lead.created_at).toLocaleString()}
                        </span>
                      </div>
                      {lead.mensagem ? (
                        <p className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-300">
                          {lead.mensagem}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <a
                        href={whatsappLink(
                          lead.telefone,
                          lead.nome,
                          lead.modelo_interesse,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-bold text-black hover:brightness-110"
                      >
                        Abrir WhatsApp
                      </a>
                      <select
                        value={lead.status}
                        disabled={acting}
                        onChange={(e) =>
                          changeStatus(
                            lead.id,
                            e.target.value as DroneLeadStatus,
                          )
                        }
                        className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_BADGE[s].label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => remove(lead.id)}
                        disabled={acting}
                        className="rounded-full border border-rose-400/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-200 disabled:opacity-60 hover:bg-rose-500/25"
                      >
                        {acting ? "..." : "Excluir"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {data?.totalPages && data.totalPages > 1 ? (
            <div className="mt-5 flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() =>
                  load(page - 1, statusFilter, busca, modeloFilter)
                }
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Anterior
              </button>
              <p className="text-xs text-slate-300">
                Página {page} de {data.totalPages} · {data.total} leads
              </p>
              <button
                disabled={page >= data.totalPages}
                onClick={() =>
                  load(page + 1, statusFilter, busca, modeloFilter)
                }
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          ) : null}

          {!items.length ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-sm font-bold text-white">
                Nenhum lead {statusFilter === "ALL" ? "ainda" : "neste status"}.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Quando alguém preencher o formulário de interesse, aparece aqui.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
