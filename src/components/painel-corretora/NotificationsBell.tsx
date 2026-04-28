"use client";

// src/components/painel-corretora/NotificationsBell.tsx
//
// Bloco 4 — sino de notificações com operação quase em tempo real.
//
// Comportamento:
//   - Polling inteligente: 30s quando a aba está visível, pausado
//     quando oculta; dispara um fetch imediato ao voltar pra aba.
//   - Detecção de incremento: se unreadCount SOBE entre duas
//     consultas, acende sinal visual (pulse + badge amber forte) e
//     toca o som curto se o usuário habilitou.
//   - Som opcional (default OFF): preferência em localStorage
//     "kavita:corretora:bell:sound", toggle 🔔/🔕 no dropdown.
//   - Destaque por tipo: `lead.new` e `lead.recontato` ganham
//     pill "LEAD" em amber/rose quando `meta.high_priority` é true;
//     reforça prioridade sem depender da leitura do título.
//   - Link direto pro lead: o item de lead vai direto pra
//     /painel/corretora/leads/<id>, e o sino fecha o dropdown.
//   - Evita spam visual: mostra "novo!" por no máximo 8s após
//     detectar incremento; o pulse só acende quando há itens novos,
//     não a cada 30s de polling.

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
  meta: Record<string, unknown> | null;
  created_at: string;
  read_by_me: boolean;
};

// Polling reduzido de 60s → 30s. 30s é o sweet-spot: suficientemente
// rápido para um painel operacional de leads sentir "tempo real" na
// prática, mas ainda leve o bastante pra não stressar o backend de
// uma corretora com 5 users abertos em paralelo (5 users × 2 req/min
// = 10 req/min, desprezível).
const POLL_INTERVAL_MS = 30_000;

// Tempo que o flash "chegou novo" fica aceso antes de voltar ao normal.
const FLASH_DURATION_MS = 8_000;

const SOUND_PREF_KEY = "kavita:corretora:bell:sound";
// Som curto gerado com Web Audio API — sem asset externo pra não criar
// dependência de rede ou peso extra no bundle. Dois beeps rápidos em
// 880Hz + 1320Hz (5ª justa). Volume baixo (0.08) pra não assustar
// numa corretora que atende telefone ao lado do PC.
function playBellTone() {
  try {
    // Alguns navegadores exigem user gesture para AudioContext. Se
    // falhar, ignora silenciosamente — não é funcionalidade crítica.
    const Ctx: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const mkTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.08, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };
    mkTone(880, 0, 0.18);
    mkTone(1320, 0.16, 0.22);

    // Libera o contexto após os tons tocarem.
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    }, 600);
  } catch {
    // Audio contexts bloqueados ou ambiente sem áudio — OK, feature opcional.
  }
}

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

function readSoundPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) === "on";
  } catch {
    return false;
  }
}

function writeSoundPreference(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Mantém a contagem anterior em ref pra detectar incremento sem
  // re-render stale (state em setInterval fecha o valor inicial).
  const prevUnreadRef = useRef<number>(0);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega a preferência de som na montagem.
  useEffect(() => {
    setSoundOn(readSoundPreference());
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get<{ total: number }>(
        "/api/corretora/notifications/unread-count",
      );
      const next = Number(res.total ?? 0);
      setUnreadCount((current) => {
        // Detecta subida. Só acende flash se realmente cresceu — quando
        // a corretora marca como lida em outra aba, cai e não devemos
        // tocar nada.
        if (next > prevUnreadRef.current && next > current) {
          setFlash(true);
          if (flashTimeoutRef.current) {
            clearTimeout(flashTimeoutRef.current);
          }
          flashTimeoutRef.current = setTimeout(
            () => setFlash(false),
            FLASH_DURATION_MS,
          );
          if (soundOn) playBellTone();
        }
        prevUnreadRef.current = next;
        return next;
      });
    } catch {
      // Silencioso — se falhar, badge fica no último valor conhecido.
    }
  }, [soundOn]);

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
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchUnreadCount();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
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
      prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
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
      prevUnreadRef.current = 0;
      setFlash(false);
      toast.success("Todas marcadas como lidas.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao marcar todas.").message);
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    writeSoundPreference(next);
    if (next) {
      // Dá feedback imediato ao usuário — play vem de user gesture,
      // o que destrava o AudioContext em navegadores restritivos.
      playBellTone();
      toast.success("Som das notificações ativado.");
    } else {
      toast("Som das notificações desativado.", { icon: "🔕" });
    }
  };

  const hasFlash = flash && unreadCount > 0;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          // Abrir também limpa o flash visual — a corretora já viu.
          if (flash) setFlash(false);
        }}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} notificações não lidas${hasFlash ? " — novas" : ""}`
            : "Notificações"
        }
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border text-stone-600 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          hasFlash
            ? "border-amber-400/50 bg-amber-50 text-amber-800 shadow-amber-300/40"
            : "border-stone-200 bg-white hover:border-amber-400/40 hover:text-amber-800"
        }`}
      >
        <BellIcon animated={hasFlash} />
        {unreadCount > 0 && (
          <span
            className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-stone-50 ${
              hasFlash ? "bg-rose-500 animate-pulse" : "bg-amber-500"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-50 mt-2 w-[380px] origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10"
          role="dialog"
          aria-label="Notificações"
        >
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-stone-900">
              Notificações
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={
                  soundOn
                    ? "Desativar som das notificações"
                    : "Ativar som das notificações"
                }
                title={soundOn ? "Som ativado" : "Som desativado"}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] transition-colors ${
                  soundOn
                    ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300/50 hover:bg-amber-200"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                <span aria-hidden>{soundOn ? "🔔" : "🔕"}</span>
              </button>
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

          <div className="border-t border-stone-200 bg-stone-50/60 px-4 py-2.5 text-center">
            <Link
              href="/painel/corretora/notificacoes"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 transition-colors hover:text-amber-800"
            >
              Ver todas as notificações
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function classifyNotification(n: Notification): {
  chipLabel: string | null;
  chipClass: string;
  rowAccent: string;
} {
  const meta = n.meta ?? {};
  const highPriority = meta["high_priority"] === true;

  if (n.type === "lead.new") {
    if (highPriority) {
      return {
        chipLabel: "URGENTE",
        chipClass:
          "bg-rose-100 text-rose-800 ring-1 ring-rose-300/60",
        rowAccent: "border-l-2 border-rose-400 pl-[calc(1rem-2px)]",
      };
    }
    return {
      chipLabel: "LEAD",
      chipClass:
        "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60",
      rowAccent: "border-l-2 border-amber-400 pl-[calc(1rem-2px)]",
    };
  }
  if (n.type === "lead.recontato") {
    return {
      chipLabel: "RECONTATO",
      chipClass:
        "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60",
      rowAccent: "border-l-2 border-amber-400 pl-[calc(1rem-2px)]",
    };
  }
  if (n.type === "lead.lote_vendido") {
    return {
      chipLabel: "VENDA",
      chipClass:
        "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60",
      rowAccent: "border-l-2 border-emerald-400 pl-[calc(1rem-2px)]",
    };
  }
  return { chipLabel: null, chipClass: "", rowAccent: "" };
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
  const { chipLabel, chipClass, rowAccent } = classifyNotification(n);

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
            <div className="flex min-w-0 items-center gap-1.5">
              {chipLabel && (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${chipClass}`}
                >
                  {chipLabel}
                </span>
              )}
              <p
                className={`truncate text-sm ${
                  n.read_by_me
                    ? "font-medium text-stone-700"
                    : "font-semibold text-stone-900"
                }`}
              >
                {n.title}
              </p>
            </div>
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

  const baseClass = `block px-4 py-3 transition-colors hover:bg-amber-50/40 ${rowAccent}`;

  if (n.link) {
    return (
      <Link
        href={n.link}
        onClick={onClick}
        className={`${baseClass} ${n.read_by_me ? "" : "bg-amber-50/20"}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left ${baseClass} ${n.read_by_me ? "" : "bg-amber-50/20"}`}
    >
      {content}
    </button>
  );
}

function BellIcon({ animated }: { animated: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={`h-4 w-4 ${animated ? "animate-[bell-swing_1.2s_ease-in-out_infinite]" : ""}`}
      aria-hidden
      style={{
        transformOrigin: "top center",
      }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}
