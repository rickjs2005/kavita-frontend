"use client";

// src/components/mercado-do-cafe/CorretoraReviews.tsx
//
// Seção pública de avaliações na página da corretora. Dois blocos:
//
//   1. Agregado (total + média + stars) + botão "Deixar avaliação"
//   2. Lista de reviews aprovadas (ou empty state)
//
// O form é lazy: só monta quando o produtor clica "Deixar avaliação"
// (evita render desnecessário + Turnstile eager para quem não vai
// avaliar).

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import type {
  PublicCorretoraReview,
  PublicReviewsResponse,
  ReviewFormData,
} from "@/types/review";
import { CIDADES_ZONA_DA_MATA } from "@/lib/regioes";
import { useForm } from "react-hook-form";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
  type TurnstileHandle,
} from "@/components/painel-corretora/TurnstileWidget";

type Props = {
  corretoraSlug: string;
  corretoraName: string;
};

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

/** 5 estrelas com preenchimento configurável (valor de 0 a 5). */
function Stars({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const full = Math.floor(value);
  const empty = 5 - full;
  const sizeClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <svg
          key={`f${i}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`${sizeClass} text-amber-400`}
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <svg
          key={`e${i}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`${sizeClass} text-stone-700`}
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </span>
  );
}

export function CorretoraReviews({ corretoraSlug, corretoraName }: Props) {
  const [data, setData] = useState<PublicReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PublicReviewsResponse>(
        `/api/public/corretoras/${encodeURIComponent(corretoraSlug)}/reviews`,
      );
      setData(res);
    } catch {
      // Sem mensagem de erro explícita — reviews são opcionais na UX.
      // Se falhar, escondemos silenciosamente para não poluir a página.
      setData({ reviews: [], aggregate: { total: 0, average: null } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corretoraSlug]);

  const aggregate = data?.aggregate ?? { total: 0, average: null };
  const reviews = data?.reviews ?? [];

  const hasReviews = aggregate.average != null && aggregate.total > 0;

  return (
    <div className="space-y-6">
      {/* Header com agregado. Quando não há reviews, o empty state
          vira um card completo (não um texto solto) — com ícone
          amber, frase curta e CTA claro. */}
      {hasReviews ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/30">
              <span className="text-2xl font-semibold tabular-nums text-amber-200">
                {aggregate.average!.toFixed(1)}
              </span>
            </div>
            <div>
              <Stars value={aggregate.average!} size="md" />
              <p className="mt-1 text-xs text-stone-400">
                {aggregate.total}{" "}
                {aggregate.total === 1
                  ? "avaliação aprovada"
                  : "avaliações aprovadas"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="group inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:ring-amber-400/30"
          >
            {showForm ? "Fechar formulário" : "Deixar avaliação"}
            <span aria-hidden>{showForm ? "×" : "→"}</span>
          </button>
        </div>
      ) : (
        !showForm && (
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] backdrop-blur-sm sm:p-8">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
            />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-stone-100">
                    Ainda sem avaliações públicas
                  </p>
                  <p className="mt-1 max-w-md text-[13px] leading-relaxed text-stone-400">
                    Já negociou com esta corretora? Conte como foi — sua
                    avaliação passa pela moderação da equipe Kavita antes
                    de ser publicada, e ajuda outros produtores da região
                    a decidirem com segurança.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="group inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-950 shadow-lg shadow-amber-500/25 transition-all hover:from-amber-200 hover:to-amber-400 sm:w-auto"
              >
                Deixar avaliação
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* Quando o form está aberto no cenário vazio, ainda mostra um
          botão discreto para fechar acima do form */}
      {!hasReviews && showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08]"
          >
            Fechar formulário <span aria-hidden>×</span>
          </button>
        </div>
      )}

      {showForm && (
        <ReviewForm
          corretoraSlug={corretoraSlug}
          corretoraName={corretoraName}
          onSuccess={() => {
            setShowForm(false);
            // Recarrega agregado (não adianta — ainda pending — mas mantém
            // consistência caso endpoint mude para auto-approval no futuro).
            load();
          }}
        />
      )}

      {/* Lista de reviews aprovadas */}
      {!loading && reviews.length > 0 && (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewItem({ review }: { review: PublicCorretoraReview }) {
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
                title="Este usuário já havia enviado contato antes"
              >
                ✓ Cliente verificado
              </span>
            )}
          </div>
          {(review.cidade_autor || review.created_at) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
              {review.cidade_autor && <span>{review.cidade_autor}</span>}
              {review.cidade_autor && review.created_at && (
                <span aria-hidden>·</span>
              )}
              <span>{formatDate(review.created_at)}</span>
            </div>
          )}
        </div>
        <Stars value={review.rating} size="sm" />
      </div>
      {review.comentario && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-300">
          {review.comentario}
        </p>
      )}
    </li>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-stone-100 placeholder:text-stone-500 transition-colors focus:border-amber-400/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/25";
const labelClass =
  "mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80";

function ReviewForm({
  corretoraSlug,
  corretoraName,
  onSuccess,
}: {
  corretoraSlug: string;
  corretoraName: string;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  // Turnstile — bug ativo até Sprint 2: o backend já aplica
  // verifyTurnstile nesta rota, então sem token o POST retornava 403.
  // Fail-closed: sem token válido, submit fica travado.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    defaultValues: {
      nome_autor: "",
      cidade_autor: "",
      rating: 0,
      comentario: "",
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      toast.error("Escolha de 1 a 5 estrelas.");
      return;
    }

    if (TURNSTILE_ENABLED && !turnstileToken) {
      toast.error(
        turnstileError ?? "Aguarde a verificação anti-bot ser concluída.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        nome_autor: data.nome_autor.trim(),
        rating: data.rating,
      };
      if (data.cidade_autor?.trim()) payload.cidade_autor = data.cidade_autor.trim();
      if (data.comentario?.trim()) payload.comentario = data.comentario.trim();
      if (TURNSTILE_ENABLED && turnstileToken) {
        payload["cf-turnstile-response"] = turnstileToken;
      }

      await apiClient.post(
        `/api/public/corretoras/${encodeURIComponent(corretoraSlug)}/reviews`,
        payload,
      );
      toast.success(
        "Avaliação enviada! Será publicada após aprovação da equipe Kavita.",
      );
      reset();
      setSelectedRating(0);
      onSuccess();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao enviar avaliação.").message);
      // Token é single-use — reset para permitir retry imediato.
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-8"
      aria-label={`Formulário de avaliação para ${corretoraName}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />

      <div className="relative space-y-5">
        <div>
          <label className={labelClass}>Sua avaliação *</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setSelectedRating(n);
                  setValue("rating", n, { shouldDirty: true });
                }}
                className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-8 w-8 transition-colors ${n <= selectedRating ? "text-amber-400" : "text-stone-700 hover:text-amber-400/50"}`}
                  aria-hidden
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
              </button>
            ))}
            {selectedRating > 0 && (
              <span className="ml-2 text-sm font-medium text-amber-200">
                {selectedRating} de 5
              </span>
            )}
          </div>
          <input type="hidden" {...register("rating", { min: 1, max: 5 })} />
        </div>

        <div>
          <label className={labelClass} htmlFor="review-nome">
            Seu nome *
          </label>
          <input
            id="review-nome"
            {...register("nome_autor", {
              required: "Nome é obrigatório.",
              minLength: { value: 3, message: "Mínimo 3 caracteres." },
            })}
            className={inputClass}
            placeholder="Seu nome completo"
          />
          {errors.nome_autor && (
            <p className="mt-1.5 text-[11px] font-medium text-red-300">
              {errors.nome_autor.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="review-cidade">
            Sua cidade
          </label>
          <select
            id="review-cidade"
            {...register("cidade_autor")}
            className={inputClass}
            defaultValue=""
          >
            <option value="">Opcional</option>
            {CIDADES_ZONA_DA_MATA.map((c) => (
              <option key={c.slug} value={c.nome}>
                {c.nome} — {c.estado}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="review-comentario">
            Comentário
          </label>
          <textarea
            id="review-comentario"
            rows={4}
            maxLength={2000}
            {...register("comentario", {
              maxLength: { value: 2000, message: "Máximo 2000 caracteres." },
            })}
            className={inputClass}
            placeholder="Conte brevemente sua experiência com a corretora..."
          />
        </div>

        <p className="text-[11px] text-stone-500">
          Sua avaliação passará por moderação da equipe Kavita antes de ser
          publicada.
        </p>

        {TURNSTILE_ENABLED && (
          <div
            className="flex flex-col items-center gap-2"
            aria-live="polite"
          >
            <TurnstileWidget
              ref={turnstileRef}
              theme="dark"
              onToken={setTurnstileToken}
              onError={setTurnstileError}
            />
            {!turnstileToken && !turnstileError && (
              <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
                Verificação de segurança em andamento…
              </p>
            )}
            {turnstileError && (
              <p className="max-w-md text-center text-[12px] leading-relaxed text-rose-300">
                {turnstileError}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            selectedRating === 0 ||
            (TURNSTILE_ENABLED && !turnstileToken)
          }
          className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
          <span className="relative">
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </span>
        </button>
      </div>
    </form>
  );
}
