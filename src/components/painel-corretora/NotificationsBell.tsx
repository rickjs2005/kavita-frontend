"use client";

// src/components/painel-corretora/NotificationsBell.tsx
//
// Bell icon no header do painel com dropdown de notificações.
// Poll leve de unread count a cada 60s quando aba está ativa
// (document.visibilityState === 'visible').

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";

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

const POLL_INTERVAL_MS = 60_000;

function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get<{ total: number }>(
        "/api/corretora/notifications/unread-count",
      );
      setUnreadCount(res.total ?? 0);
    } catch {
      // Silencioso — se falhar, badge fica no último valor conhecido.
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Notification[]>(
        "/api/corretora/notifications",
      );
      setNotifications(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar notificações.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll leve (só quando visível) — evita chamadas em aba background.
  useEffect(() => {
    fetchUnreadCount();

    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchUnreadCount();
        }
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    start();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") fetchUnreadCount();
    });
    return () => stop();
  }, [fetchUnreadCount]);

  // Quando abre o dropdown, carrega a lista.
  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  // Fecha no click fora.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markOneAsRead = async (id: number) => {
    try {
      await apiClient.post(`/api/corretora/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_by_me: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post("/api/corretora/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_by_me: true })),
      );
      setUnreadCount(0);
      toast.success("Todas marcadas como lidas.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao marcar todas.").message);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} notificações não lidas`
            : "Notificações"
        }
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition-colors hover:border-amber-400/40 hover:text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-stone-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-50 mt-2 w-[360px] origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10"
          role="dialog"
          aria-label="Notificações"
        >
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-stone-900">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-stone-500">
                Carregando...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-stone-700">
                  Nenhuma notificação
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  Você verá aqui os leads e eventos da sua corretora.
                </p>
              </div>
            )}

            <ul className="divide-y divide-stone-100">
              {notifications.map((n) => (
                <li key={n.id}>
                  <NotificationItem
                    notification={n}
                    onMarkRead={() => markOneAsRead(n.id)}
                    onClose={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onMarkRead,
  onClose,
}: {
  notification: Notification;
  onMarkRead: () => void;
  onClose: () => void;
}) {
  const content = (
    <>
      <div className="flex items-start gap-2.5">
        {!n.read_by_me && (
          <span
            aria-label="Não lida"
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
          />
        )}
        {n.read_by_me && <span className="w-1.5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm ${n.read_by_me ? "font-medium text-stone-700" : "font-semibold text-stone-900"}`}
            >
              {n.title}
            </p>
            <span className="shrink-0 text-[10px] tabular-nums text-stone-500">
              {formatTimeAgo(n.created_at)}
            </span>
          </div>
          {n.body && (
            <p className="mt-0.5 line-clamp-2 text-[12px] text-stone-600">
              {n.body}
            </p>
          )}
        </div>
      </div>
    </>
  );

  const onClick = () => {
    if (!n.read_by_me) onMarkRead();
    onClose();
  };

  if (n.link) {
    return (
      <Link
        href={n.link}
        onClick={onClick}
        className={`block px-4 py-3 transition-colors hover:bg-amber-50/40 ${
          n.read_by_me ? "" : "bg-amber-50/20"
        }`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer px-4 py-3 transition-colors hover:bg-amber-50/40 ${
        n.read_by_me ? "" : "bg-amber-50/20"
      }`}
    >
      {content}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}
