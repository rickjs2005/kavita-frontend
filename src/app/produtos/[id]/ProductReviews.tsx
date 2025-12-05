"use client";

import { useEffect, useState } from "react";
import type { ProductReview } from "@/types/product";
import CustomButton from "@/components/buttons/CustomButton";
import { toast } from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ProductReviewsProps = {
  produtoId: number;
  ratingAvg?: number | null;
  ratingCount?: number | null;
};

export default function ProductReviews({
  produtoId,
  ratingAvg,
  ratingCount,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState("");

  // ===== CARREGAR AVALIAÇÕES =====
  useEffect(() => {
    async function carregarAvaliacoes() {
      try {
        setLoadingReviews(true);
        const res = await fetch(
          `${API_BASE}/api/public/produtos/${produtoId}/avaliacoes`
        );
        if (!res.ok) {
          console.error("Erro ao buscar avaliações:", res.status);
          return;
        }
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar avaliações:", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    if (produtoId) {
      carregarAvaliacoes();
    }
  }, [produtoId]);

  // ===== ENVIAR AVALIAÇÃO =====
  async function enviarAvaliacao() {
    if (!nota || nota < 1 || nota > 5) {
      toast.error("Selecione uma nota de 1 a 5.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/public/produtos/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produtoId,
          nota,
          comentario: comentario.trim() || null,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Erro ao enviar avaliação:", txt);
        toast.error("Erro ao enviar sua avaliação.");
        return;
      }

      toast.success("Avaliação enviada com sucesso!");
      setNota(0);
      setComentario("");

      // Recarrega lista
      const resList = await fetch(
        `${API_BASE}/api/public/produtos/${produtoId}/avaliacoes`
      );
      const data = await resList.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      toast.error("Erro ao enviar sua avaliação.");
    }
  }

  // ===== CÁLCULOS TIPO MAGALU / SHEIN =====

  // média: usa do backend se tiver, senão calcula local
  const media =
    ratingAvg && ratingAvg > 0
      ? Number(ratingAvg)
      : reviews.length
      ? reviews.reduce((acc, r) => acc + Number(r.nota || 0), 0) /
        reviews.length
      : 0;

  const totalAval = ratingCount ?? reviews.length;

  const totalComentarios = reviews.filter(
    (r) => r.comentario && r.comentario.trim() !== ""
  ).length;

  // distribuição 5★ → 1★
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Number(r.nota) === star).length;
    const percent = totalAval ? (count / totalAval) * 100 : 0;
    return { star, count, percent };
  });

  return (
    <section className="max-w-6xl mx-auto px-4 pb-10 space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 sm:p-6 space-y-6">
        {/* ===== RESUMO GERAL ===== */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center">
          {/* Esquerda: nota grande + contadores */}
          <div className="flex flex-col items-start md:items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Avaliações dos clientes
            </p>

            <div className="flex items-center gap-3">
              <span className="text-4xl font-semibold text-gray-900">
                {media ? media.toFixed(1) : "—"}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-yellow-500 text-xl">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {media >= i + 1
                        ? "★"
                        : media > i && media < i + 1
                        ? "★"
                        : "☆"}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  nota média baseada em {totalAval || 0} avaliação
                  {totalAval === 1 ? "" : "es"}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              {totalComentarios} comentário
              {totalComentarios === 1 ? "" : "s"} de cliente
            </p>
          </div>

          {/* Direita: barras 5★ → 1★ */}
          <div className="space-y-2">
            {dist.map(({ star, count, percent }) => (
              <div
                key={star}
                className="flex items-center gap-3 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-1 w-12">
                  <span>{star}</span>
                  <span className="text-yellow-500">★</span>
                </div>
                <div className="relative flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-emerald-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-10 text-right text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros visuais simples (dá pra ligar depois em estados) */}
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs sm:text-sm">
          <span className="text-gray-600 font-medium">Filtrar:</span>
          <button className="rounded-full border border-emerald-500/60 bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-medium">
            Todas as avaliações
          </button>
          <button className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 transition">
            Com comentário
          </button>
        </div>

        {/* Form + lista */}
        <div className="mt-2 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Formulário */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">
              Deixe sua avaliação:
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNota(n)}
                  className={`text-2xl transition ${
                    nota >= n ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 ring-0 transition focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
              placeholder="Conte como foi sua experiência com este produto..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
            />
            <div className="mt-2">
              <CustomButton
                label="Enviar avaliação"
                variant="secondary"
                size="small"
                isLoading={false}
                onClick={enviarAvaliacao}
              />
            </div>
          </div>

          {/* Lista de avaliações */}
          <div className="space-y-3">
            {loadingReviews ? (
              <p className="text-sm text-gray-500">Carregando avaliações...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">
                Ainda não há avaliações para este produto.
              </p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((rev, index) => (
                  <li
                    key={index}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{rev.nota >= i + 1 ? "★" : "☆"}</span>
                      ))}
                      <span className="ml-1 text-[11px] text-gray-500">
                        {new Date(rev.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {rev.comentario ? (
                      <p className="text-sm text-gray-700">
                        {rev.comentario}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Cliente avaliou sem comentário.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
