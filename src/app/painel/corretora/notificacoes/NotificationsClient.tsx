"use client";

// src/app/painel/corretora/notificacoes/NotificationsClient.tsx
//
// Lista completa de notificações da corretora logada. Consome o
// backend já existente (Sprint 6B): GET /api/corretora/notifications
// devolve as últimas 30 com read_by_me marcado para o user atual.
//
// Três ações: abrir o link da notificação, marcar uma como lida,
// marcar todas como lidas. Filtro cliente-side por estado (todas /
// não lidas) e por tipo (lead, review, system). Tipos com label
// humano e ícone — ajuda a varrer a lista sem ler cada título.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  meta: unknown;
  created_at: string;
  read_by_me: boolean;
};

type StatusFilter = "all" | "unread";
type TypeFilter = "all" | "lead" | "review" | "system";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  return formatDateTime(iso);
}

// Mapa type → categoria alta-nível usada pelo filtro e pelo ícone.
// Tipos do backend hoje: lead.new, lead.stale, lead.lote_vendido,
// review.new, review.approved, system.*. Fallback: "system".
function categorize(type: string): TypeFilter {
  if (type.startsWith("lead")) return "lead";
  if (type.startsWith("review")) return "review";
  if (type === "all") return "all";
  return "system";
}

function typeLabel(type: string): string {
  switch (type) {
    case "lead.new":
      return "Novo lead";
    case "lead.stale":
      return "Lead sem resposta";
    case "lead.lote_vendido":
      return "Lote vendido";
    case "review.new":
      return "Nova avaliação";
    case "review.approved":
      return "Avaliação publicada";
    default:
      return "Sistema";
  }
}

function TypeIcon({ category }: { category: TypeFilter }) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1";
  if (category === "lead") {
    return (
      <span
        className={`${base} bg-amber-400/10 text-amber-300 ring-amber-400/30`}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </span>
    );
  }
  if (category === "review") {
    return (
      <span
        className={`${base} bg-emerald-400/10 text-emerald-300 ring-emerald-400/30`}
        aria-hidden
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-white/[0.06] text-stone-300 ring-white/10`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    </span>
  );
}

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos tipos" },
  { value: "lead", label: "Leads" },
  { value: "review", label: "Avaliações" },
  { value: "system", label: "Sistema" },
];

export default function NotificationsClient() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Notification[]>(
        "/api/corretora/notifications",
      );
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar notificações.").message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read_by_me).length,
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (statusFilter === "unread" && n.read_by_me) return false;
      if (typeFilter !== "all" && categorize(n.type) !== typeFilter) return false;
      return true;
    });
  }, [items, statusFilter, typeFilter]);

  const markOneAsRead = async (id: number) => {
    try {
      await apiClient.post(`/api/corretora/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_by_me: true } : n)),
      );
    } catch {
      // Silencioso — toast em marcar-todas já basta como feedback;
      // clique em item que não marca lido não é crítico.
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await apiClient.post("/api/corretora/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read_by_me: true })));
      toast.success("Todas marcadas como lidas.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao marcar todas.").message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero / header editorial */}
      <header className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
          Sala Reservada · Comunicados
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
          Notificações
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-300">
          Novos leads, avaliações moderadas e avisos da curadoria. O que
          chega aqui também aparece no sino no topo do painel —
          {unreadCount > 0 ? (
            <>
              {" "}
              você tem{" "}
              <strong className="text-amber-200">
                {unreadCount} {unreadCount === 1 ? "não lida" : "não lidas"}
              </strong>
              .
            </>
          ) : (
            <> nada pendente no momento.</>
          )}
        </p>
      </header>

      {/* Barra de controles: filtros + ação em massa */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06] backdrop-blur-sm sm:p-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              statusFilter === "all"
                ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("unread")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              statusFilter === "unread"
                ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Não lidas
            {unreadCount > 0 && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-stone-950">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <span aria-hidden className="hidden h-5 w-px bg-white/10 sm:block" />

        <div className="flex flex-wrap items-center gap-1">
          {TYPE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                typeFilter === opt.value
                  ? "bg-white/[0.08] text-stone-100 ring-1 ring-white/15"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-200 hover:to-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        </div>
      </div>

      {/* Lista */}
      <section aria-label="Lista de notificações">
        {loading && items.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] p-10 text-center text-sm text-stone-400 ring-1 ring-white/[0.06]">
            Carregando notificações…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] p-10 text-center ring-1 ring-white/[0.06]">
            <p className="text-sm font-semibold text-stone-200">
              {items.length === 0
                ? "Nenhuma notificação ainda"
                : "Nenhum resultado para este filtro"}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              {items.length === 0
                ? "Assim que chegarem novos leads ou avaliações, você verá aqui."
                : "Tente ampliar o filtro ou limpar os critérios."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((n) => (
              <li key={n.id}>
                <NotificationRow
                  notification={n}
                  onMarkRead={() => markOneAsRead(n.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NotificationRow({
  notification: n,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const category = categorize(n.type);
  const unread = !n.read_by_me;

  const content = (
    <div
      className={`group relative flex items-start gap-3 rounded-xl p-4 ring-1 backdrop-blur-sm transition-colors sm:p-5 ${
        unread
          ? "bg-white/[0.06] ring-amber-400/25 hover:bg-white/[0.08]"
          : "bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]"
      }`}
    >
      {unread && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
        />
      )}

      <TypeIcon category={category} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/70">
            {typeLabel(n.type)}
          </span>
          <span
            className="text-[10px] tabular-nums text-stone-500"
            title={formatDateTime(n.created_at)}
          >
            {formatRelative(n.created_at)}
          </span>
          {unread && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-200 ring-1 ring-amber-400/30">
              Nova
            </span>
          )}
        </div>

        <h3
          className={`mt-1 text-sm leading-snug ${
            unread ? "font-semibold text-stone-50" : "font-medium text-stone-200"
          }`}
        >
          {n.title}
        </h3>

        {n.body && (
          <p className="mt-1 text-[13px] leading-relaxed text-stone-400">
            {n.body}
          </p>
        )}

        {n.link && (
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
            Abrir
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </p>
        )}
      </div>
    </div>
  );

  const onClick = () => {
    if (unread) onMarkRead();
  };

  if (n.link) {
    return (
      <Link
        href={n.link}
        onClick={onClick}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
    >
      {content}
    </button>
  );
}
