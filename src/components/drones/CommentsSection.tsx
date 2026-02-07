"use client";

import { useState } from "react";
import type { DroneComment } from "@/types/drones";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isAuthError(res: Response) {
  return res.status === 401 || res.status === 403;
}

/**
 * Ajuste aqui caso a rota de login pública seja diferente no seu projeto.
 * (ex: "/auth/login" ou "/entrar")
 */
function redirectToPublicLogin() {
  if (typeof window !== "undefined") window.location.assign("/login");
}

async function readSafe(res: Response) {
  const txt = await res.text();
  const data = safeJson(txt);
  return { txt, data };
}

type Props = {
  comments: DroneComment[];
  modelKey?: string | null;
  onCreated?: () => void;
};

export default function CommentsSection({ comments, modelKey, onCreated }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);

    if (!text.trim()) {
      setMsg("Digite seu comentário.");
      return;
    }

    const fd = new FormData();
    fd.append("comment_text", text.trim());

    // ✅ alinhamento com backend novo: amarra comentário ao modelo selecionado
    if (modelKey) fd.append("model_key", modelKey);

    if (files) {
      const max = Math.min(files.length, 6);
      for (let i = 0; i < max; i++) fd.append("media", files[i]);
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/public/drones/comentarios`, {
        method: "POST",
        body: fd,
        credentials: "include", // precisa estar logado
      });

      if (isAuthError(res)) {
        setMsg("Você precisa estar logado para postar comentários e anexar mídias.");
        return;
      }

      const { data } = await readSafe(res);
      if (!res.ok) {
        setMsg(data?.message || "Falha ao enviar comentário.");
        return;
      }

      setMsg("Comentário enviado com sucesso!");
      setText("");
      setFiles(null);

      // ✅ recarrega comentários/galeria no pai (sem refresh manual)
      onCreated?.();
    } catch {
      setMsg("Erro de rede ao enviar comentário.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">Relatos de clientes</h2>
      <p className="mt-2 text-sm text-slate-300">
        Para postar relatos com fotos/vídeos, é necessário estar logado.
        {modelKey ? (
          <span className="ml-2 text-xs text-slate-400">
            Modelo: <span className="text-slate-200 font-semibold">{modelKey}</span>
          </span>
        ) : null}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-extrabold text-white">Enviar relato</h3>

          <div className="mt-4 grid gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva seu relato..."
              className="min-h-[140px] w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-400/40"
            />

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold text-slate-200">
                Adicionar fotos/vídeos (até 6 arquivos)
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Formatos: JPG/PNG/WEBP e MP4.</p>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4"
                onChange={(e) => setFiles(e.target.files)}
                className="mt-3 text-sm text-slate-200"
              />
              {files?.length ? (
                <p className="mt-2 text-xs text-slate-300">
                  Selecionados: {files.length} arquivo(s)
                </p>
              ) : null}
            </div>

            {msg ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                {msg}{" "}
                {msg.includes("logado") ? (
                  <button
                    type="button"
                    onClick={redirectToPublicLogin}
                    className="ml-2 underline text-emerald-300 hover:text-emerald-200"
                  >
                    Fazer login
                  </button>
                ) : null}
              </div>
            ) : null}

            <button
              onClick={submit}
              disabled={sending}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:brightness-110 transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>

        {/* Publicados */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-extrabold text-white">Publicados</h3>

          <div className="mt-4 grid gap-4">
            {comments.length ? (
              comments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white truncate">{c.display_name}</p>
                    <p className="text-xs text-slate-400 shrink-0">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-slate-200 leading-relaxed">{c.comment_text}</p>

                  {c.media?.length ? (
                    <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3">
                      {c.media.map((m) => {
                        const src = `${API_BASE}${m.media_path}`;
                        return m.media_type === "VIDEO" ? (
                          <video
                            key={m.id}
                            className="w-full rounded-xl aspect-video object-cover bg-black/40 border border-white/10"
                            src={src}
                            controls
                            playsInline
                          />
                        ) : (
                          <img
                            key={m.id}
                            className="w-full rounded-xl aspect-video object-cover bg-black/40 border border-white/10"
                            src={src}
                            alt="mídia do comentário"
                            loading="lazy"
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Ainda não há comentários publicados.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
