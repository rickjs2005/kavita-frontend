"use client";

// src/app/painel/corretora/reviews/ReviewsClient.tsx
//
// Página interna onde a corretora vê suas próprias reviews aprovadas
// e escreve resposta pública em qualquer uma delas. Resposta é opcional,
// editável e removível. Só aprovadas aparecem (pending/rejected são
// problema do admin, não do tenant).

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import type { PanelCorretoraReview } from "@/types/review";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 ${i < value ? "text-amber-400" : "text-stone-700"}`}
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </span>
  );
}

export default function ReviewsClient() {
  const [items, setItems] = useState<PanelCorretoraReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<PanelCorretoraReview[]>(
        "/api/corretora/reviews",
      );
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar avaliações.").message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
          Sala Reservada · Avaliações
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
          O que os produtores dizem
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-300">
          Suas avaliações aprovadas aparecem aqui. Você pode responder
          publicamente cada uma — a resposta fica junto da avaliação na
          sua página do Mercado do Café.
        </p>
      </header>

      {loading && items.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] p-10 text-center text-sm text-stone-400 ring-1 ring-white/[0.06]">
          Carregando avaliações…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] p-10 text-center ring-1 ring-white/[0.06]">
          <p className="text-sm font-semibold text-stone-200">
            Nenhuma avaliação aprovada ainda
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Quando um produtor avaliar seu atendimento e a Kavita aprovar,
            a avaliação aparece aqui para você responder.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((review) => (
            <ReviewRow key={review.id} review={review} onChanged={load} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewRow({
  review,
  onChanged,
}: {
  review: PanelCorretoraReview;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [replyDraft, setReplyDraft] = useState(review.corretora_reply ?? "");
  const [saving, setSaving] = useState(false);

  const hasReply = Boolean(review.corretora_reply?.trim());

  async function save(reply: string | null) {
    setSaving(true);
    try {
      await apiClient.patch(
        `/api/corretora/reviews/${review.id}/reply`,
        { reply },
      );
      toast.success(reply ? "Resposta publicada." : "Resposta removida.");
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.error(
        formatApiError(err, "Erro ao salvar resposta.").message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="relative overflow-hidden rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/[0.08] backdrop-blur-sm md:p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-stone-100">
              {review.nome_autor}
            </p>
            {review.verified_lead && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30"
                title="Este produtor enviou contato antes de avaliar"
              >
                ✓ Cliente verificado
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
            {review.cidade_autor && <span>{review.cidade_autor}</span>}
            {review.cidade_autor && <span aria-hidden>·</span>}
            <span>{formatDate(review.created_at)}</span>
          </div>
        </div>
        <Stars value={review.rating} />
      </div>

      {review.comentario && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-300">
          {review.comentario}
        </p>
      )}

      {/* Bloco de resposta: estado ou editor. Tom amber para indicar
          voz oficial da corretora, alinhado à exibição pública. */}
      <div className="mt-4 border-l-2 border-amber-400/40 bg-amber-400/[0.04] py-3 pl-4 pr-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/90">
            Sua resposta pública
            {review.replied_at && (
              <span className="ml-2 font-normal text-stone-500">
                · publicada em {formatDate(review.replied_at)}
              </span>
            )}
          </p>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setReplyDraft(review.corretora_reply ?? "");
                setEditing(true);
              }}
              className="text-[11px] font-semibold text-amber-300 hover:text-amber-200"
            >
              {hasReply ? "Editar" : "Escrever resposta"}
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Resposta pública ao produtor — seja cordial e objetivo."
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/25"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-stone-500">
                {replyDraft.length}/1000
              </span>
              <div className="flex items-center gap-2">
                {hasReply && (
                  <button
                    type="button"
                    onClick={() => save(null)}
                    disabled={saving}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
                  >
                    Remover resposta
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setReplyDraft(review.corretora_reply ?? "");
                  }}
                  disabled={saving}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-stone-200 transition-colors hover:bg-white/[0.08] disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => save(replyDraft.trim() || null)}
                  disabled={saving || replyDraft.trim().length === 0}
                  className="rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 px-3 py-1.5 text-[11px] font-bold text-stone-950 shadow transition-colors hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Publicando…" : "Publicar resposta"}
                </button>
              </div>
            </div>
          </div>
        ) : hasReply ? (
          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-stone-200">
            {review.corretora_reply}
          </p>
        ) : (
          <p className="mt-1.5 text-[12px] italic text-stone-500">
            Ainda sem resposta pública. Uma palavra da corretora ajuda
            a transmitir cuidado com o produtor.
          </p>
        )}
      </div>
    </li>
  );
}
