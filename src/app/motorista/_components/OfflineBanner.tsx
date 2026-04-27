"use client";

// TODO(sprint-pos-go-live): Add test coverage for online/offline
// detection, pending queue rendering, and sync trigger. Critical
// component for driver workflow but currently untested.

import { useEffect, useState } from "react";
import {
  readQueue,
  replayQueue,
  registerOnlineReplayer,
  subscribeQueue,
} from "@/lib/rotas/offline";

export default function OfflineBanner() {
  const [pending, setPending] = useState<number>(0);
  const [online, setOnline] = useState<boolean>(true);
  const [replaying, setReplaying] = useState(false);

  useEffect(() => {
    registerOnlineReplayer();
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    setPending(readQueue().length);

    const refresh = () => setPending(readQueue().length);
    const unsub = subscribeQueue(refresh);

    const onOnline = () => {
      setOnline(true);
      refresh();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      unsub();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function trySync() {
    setReplaying(true);
    try {
      await replayQueue();
    } finally {
      setReplaying(false);
      setPending(readQueue().length);
    }
  }

  if (online && pending === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 px-3 py-2 text-xs text-center font-semibold ${
        online
          ? "bg-amber-500/90 text-stone-950"
          : "bg-rose-500/90 text-white"
      }`}
    >
      {!online ? (
        <span>📡 Sem conexão. Suas ações ficarão na fila.</span>
      ) : (
        <span>
          ⚠️ {pending} {pending === 1 ? "ação pendente" : "ações pendentes"}
          {" · "}
          <button
            onClick={trySync}
            disabled={replaying}
            className="underline font-bold disabled:opacity-60"
          >
            {replaying ? "sincronizando…" : "sincronizar agora"}
          </button>
        </span>
      )}
    </div>
  );
}
