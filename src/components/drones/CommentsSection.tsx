"use client";

// Seção "Relatos de clientes" — formulário para enviar comentário
// com mídias + lista dos relatos aprovados.
//
// Usada tanto na landing /drones quanto no detalhe /drones/[id].
// Aceita `accent` opcional para tingir CTAs e avatar com a cor do
// modelo no detalhe; na landing cai em emerald neutro.

import { useEffect, useMemo, useState } from "react";
import {
  Quote,
  ImagePlus,
  Send,
  X,
  MessageSquare,
  Film,
  Image as ImageIcon,
  LogIn,
} from "lucide-react";

import type { DroneComment } from "@/types/drones";
import type { Accent } from "./detail/accent";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { isApiError } from "@/lib/errors";

const TEXT_MAX = 800;
const MAX_FILES = 6;

function redirectToPublicLogin() {
  if (typeof window !== "undefined") window.location.assign("/login");
}

function initialsOf(name: string): string {
  const clean = String(name || "").trim();
  if (!clean) return "??";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

type Props = {
  comments: DroneComment[];
  modelKey?: string | null;
  onCreated?: () => void;
  accent?: Accent;
};

export default function CommentsSection({
  comments,
  modelKey,
  onCreated,
  accent,
}: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Previews locais (URLs blob) pras miniaturas antes do upload.
  // Revogamos quando substitui ou desmonta, pra não vazar memória.
  const previews = useMemo(
    () =>
      files.map((f) => ({
        key: `${f.name}-${f.size}-${f.lastModified}`,
        url: URL.createObjectURL(f),
        isVideo: f.type.startsWith("video/"),
        name: f.name,
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Garante keys estáveis no React mesmo se o backend mandar id null/duplicado.
  const normalizedComments = useMemo(() => {
    return (comments ?? []).map((c, cIdx) => {
      const commentKey =
        (c as any).id ?? `${(c as any).created_at ?? "no-date"}-${cIdx}`;

      const media = ((c as any).media ?? []).map((m: any, mIdx: number) => {
        const mediaKey =
          m?.id ?? `${commentKey}-${m?.media_path ?? "no-path"}-${mIdx}`;

        return { ...m, __key: mediaKey };
      });

      return { ...c, __key: commentKey, media };
    });
  }, [comments]);

  // Paleta base — accent do modelo se passado; senao emerald default.
  const eyebrowColor = accent?.text ?? "text-emerald-300";
  const avatarRing = accent?.badgeBorder ?? "border-emerald-400/30";
  const avatarBg = accent?.badgeBg ?? "bg-emerald-500/15";
  const avatarText = accent?.text ?? "text-emerald-200";
  const focusRing = accent ? "focus:ring-white/30" : "focus:ring-emerald-400/40";
  const primaryGradient =
    accent?.primaryGradient ?? "from-emerald-500 via-emerald-400 to-teal-400";
  const primaryShadow =
    accent?.primaryShadow ?? "shadow-[0_18px_50px_-20px_rgba(16,185,129,0.8)]";
  const quoteColor = accent?.text ?? "text-emerald-300";

  function handleFilesChange(fl: FileList | null) {
    if (!fl) return;
    const arr = Array.from(fl).slice(0, MAX_FILES);
    setFiles(arr);
  }

  function removeFileAt(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    setMsg(null);

    if (!text.trim()) {
      setMsg("Digite seu relato antes de enviar.");
      return;
    }

    const fd = new FormData();
    fd.append("comment_text", text.trim());

    if (modelKey) fd.append("model_key", modelKey);

    for (let i = 0; i < Math.min(files.length, MAX_FILES); i++) {
      fd.append("media", files[i]);
    }

    setSending(true);
    try {
      await apiClient.post("/api/public/drones/comentarios", fd, {
        skipContentType: true,
      });

      setMsg("Relato enviado! Vai aparecer na lista após aprovação.");
      setText("");
      setFiles([]);
      onCreated?.();
    } catch (err: unknown) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        setMsg("Você precisa estar logado para postar relatos com mídia.");
      } else {
        const ui = formatApiError(err, "Falha ao enviar relato.");
        setMsg(ui.message);
      }
    } finally {
      setSending(false);
    }
  }

  const charCount = text.length;
  const charNearLimit = charCount > TEXT_MAX * 0.85;
  const charOver = charCount > TEXT_MAX;

  const count = normalizedComments.length;
  const needsLogin = Boolean(msg && msg.toLowerCase().includes("logado"));

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:py-18">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p
            className={[
              "font-mono text-[11px] font-semibold uppercase tracking-[0.24em]",
              eyebrowColor,
            ].join(" ")}
          >
            Prova social
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Relatos de quem opera no campo
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Depoimentos reais de produtores e prestadores de serviço que usam
            a linha DJI Agras no dia a dia da lavoura.
          </p>
        </div>

        <div
          className={[
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold backdrop-blur",
            accent?.badgeBorder ?? "border-emerald-400/25",
            accent?.badgeBg ?? "bg-emerald-500/10",
            accent?.badgeText ?? "text-emerald-200",
          ].join(" ")}
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          {count} {count === 1 ? "relato publicado" : "relatos publicados"}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* ─── Formulário ─────────────────────────────────────── */}
        <div className="rounded-3xl border border-white/10 bg-dark-850/60 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-extrabold text-white">
            Compartilhe sua experiência
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Conte como o drone se encaixa na sua operação. Fotos e vídeos
            reais ajudam outros produtores a decidir.
          </p>

          <div className="mt-5 grid gap-4">
            {/* Textarea + contador */}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, TEXT_MAX + 50))}
                placeholder="Escreva seu relato — como foi a operação, o que mudou na lavoura, o que o representante ajudou…"
                className={[
                  "min-h-[160px] w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 pr-20 text-sm text-slate-100 outline-none transition focus:ring-2",
                  focusRing,
                ].join(" ")}
              />
              <span
                className={[
                  "pointer-events-none absolute bottom-3 right-3 text-[11px] font-bold tabular-nums",
                  charOver
                    ? "text-rose-300"
                    : charNearLimit
                      ? "text-amber-300"
                      : "text-slate-500",
                ].join(" ")}
              >
                {charCount}/{TEXT_MAX}
              </span>
            </div>

            {/* Upload de mídia — estilizado */}
            <div>
              <label
                htmlFor="drones-comments-media"
                className={[
                  "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center transition hover:border-white/30 hover:bg-black/30",
                ].join(" ")}
              >
                <div
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                    avatarRing,
                    avatarBg,
                  ].join(" ")}
                >
                  <ImagePlus className={["h-5 w-5", avatarText].join(" ")} aria-hidden />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Adicionar fotos ou vídeos
                </p>
                <p className="text-[11px] text-slate-400">
                  Até {MAX_FILES} arquivos · JPG, PNG, WEBP, MP4
                </p>
                <input
                  id="drones-comments-media"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                  onChange={(e) => handleFilesChange(e.target.files)}
                  className="sr-only"
                />
              </label>

              {/* Previews com botão de remover */}
              {previews.length > 0 && (
                <div className="mt-3 grid gap-2 grid-cols-3 sm:grid-cols-4">
                  {previews.map((p, idx) => (
                    <div
                      key={p.key}
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/30 aspect-square"
                    >
                      {p.isVideo ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-800 to-dark-900">
                          <Film className="h-4 w-4 text-slate-300" aria-hidden />
                          <span className="line-clamp-1 px-2 text-[10px] text-slate-400">
                            {p.name}
                          </span>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.url}
                          alt={`preview ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFileAt(idx)}
                        aria-label={`Remover ${p.name}`}
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mensagem de erro/sucesso */}
            {msg ? (
              <div
                className={[
                  "flex items-start gap-3 rounded-2xl border p-3 text-sm",
                  needsLogin
                    ? "border-amber-400/25 bg-amber-500/10 text-amber-100"
                    : "border-white/10 bg-white/[0.04] text-slate-200",
                ].join(" ")}
              >
                <span className="flex-1">{msg}</span>
                {needsLogin ? (
                  <button
                    type="button"
                    onClick={redirectToPublicLogin}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-white hover:bg-white/15"
                  >
                    <LogIn className="h-3 w-3" aria-hidden />
                    Entrar
                  </button>
                ) : null}
              </div>
            ) : null}

            <button
              onClick={submit}
              disabled={sending || charOver}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-white transition disabled:opacity-50",
                "bg-gradient-to-r",
                primaryGradient,
                primaryShadow,
                "hover:brightness-[1.08] active:scale-[0.99]",
              ].join(" ")}
            >
              <Send className="h-4 w-4" aria-hidden />
              {sending ? "Enviando…" : "Enviar relato"}
            </button>
          </div>
        </div>

        {/* ─── Lista de relatos publicados ─────────────────────── */}
        <div className="grid gap-4">
          {normalizedComments.length ? (
            normalizedComments.map((c: any) => (
              <article
                key={c.__key}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                {/* Aspas decorativas no canto */}
                <Quote
                  className={[
                    "pointer-events-none absolute right-4 top-4 h-10 w-10 opacity-15",
                    quoteColor,
                  ].join(" ")}
                  aria-hidden
                />

                <header className="flex items-start gap-3">
                  <div
                    className={[
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-extrabold",
                      avatarRing,
                      avatarBg,
                      avatarText,
                    ].join(" ")}
                    aria-hidden
                  >
                    {initialsOf(c.display_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-white">
                      {c.display_name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(c.created_at)}
                    </p>
                  </div>
                </header>

                <p className="mt-4 text-[14px] leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {c.comment_text}
                </p>

                {c.media?.length ? (
                  <div
                    className={[
                      "mt-4 grid gap-2",
                      c.media.length === 1
                        ? "grid-cols-1"
                        : c.media.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 sm:grid-cols-3",
                    ].join(" ")}
                  >
                    {c.media.map((m: any) => {
                      const src = absUrl(m.media_path);
                      return m.media_type === "VIDEO" ? (
                        <video
                          key={m.__key}
                          className="block w-full aspect-video rounded-xl border border-white/10 bg-black/40 object-cover"
                          src={src}
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={m.__key}
                          className="block w-full aspect-video rounded-xl border border-white/10 bg-black/40 object-cover"
                          src={src}
                          alt={`Mídia do relato de ${c.display_name}`}
                          loading="lazy"
                        />
                      );
                    })}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <ImageIcon className="h-5 w-5 text-slate-400" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-extrabold text-white">
                Ainda sem relatos publicados
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Seja o primeiro a compartilhar como o drone se encaixou na
                sua operação.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
