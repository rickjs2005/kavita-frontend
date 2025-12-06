import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import Gallery from "@/components/ui/Gallery";
import ProductBuyBox from "@/components/products/ProductBuyBox";
import CustomButton from "@/components/buttons/CustomButton";
import { toast } from "react-hot-toast";

interface Props {
  produto: Product;
}

interface ProductReview {
  nota: number;
  comentario: string | null;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Normaliza qualquer caminho vindo do backend para uma URL válida do <Image> */
function absUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/uploads")) return `${API_BASE}${s}`;
  if (s.startsWith("uploads")) return `${API_BASE}/${s}`;
  if (!s.startsWith("/")) return `${API_BASE}/uploads/${s}`;
  return `${API_BASE}${s}`;
}

// MESMO TIPO DE PROMOÇÃO QUE USAMOS NA PAGE SERVER
type ProductPromotion = {
  id: number;
  product_id: number;
  title?: string;
  price?: number | string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  start_at?: string | null;
  end_at?: string | null;
  ends_at?: string | null;
  is_active?: number | boolean;
};

export default function ProdutoContent({ produto }: Props) {
  // ===== IMAGENS =====
  const extras = Array.isArray(produto.images)
    ? (produto.images as unknown as string[])
    : [];
  const images = Array.from(
    new Set(
      [produto.image, ...extras]
        .filter(Boolean)
        .map((img) => absUrl(img as string | null))
        .filter(Boolean) as string[]
    )
  );

  const estoque = Number(
    (produto as any).estoque ?? (produto as any).quantity ?? 0
  );
  const disponivel = estoque > 0;

  // ===== PROMOÇÃO / DESCONTO =====
  const [promocao, setPromocao] = useState<ProductPromotion | null>(null);

  useEffect(() => {
    async function carregarPromocao() {
      try {
        if (!produto?.id) return;

        // espera-se rota GET /api/public/promocoes/:productId
        const res = await fetch(
          `${API_BASE}/api/public/promocoes/${produto.id}`
        );

        if (!res.ok) {
          // se não tiver promo para esse produto, só ignora
          return;
        }

        const data = await res.json();
        const promo = Array.isArray(data)
          ? ((data[0] as ProductPromotion) ?? null)
          : (data as ProductPromotion);

        setPromocao(promo);
      } catch (err) {
        console.error("Erro ao carregar promoção do produto:", err);
      }
    }

    carregarPromocao();
  }, [produto?.id]);

  // ===== LÓGICA DE PREÇO / DESCONTO (mesma da page.tsx) =====
  const precoBase = Number(produto.price ?? 0);

  const originalFromPromo =
    promocao?.original_price ?? promocao?.price ?? null;
  const finalFromPromo =
    promocao?.final_price ??
    promocao?.promo_price ??
    promocao?.price ??
    null;

  const originalPrice =
    originalFromPromo != null ? Number(originalFromPromo) : precoBase || 0;

  let finalPrice =
    finalFromPromo != null ? Number(finalFromPromo) : originalPrice;

  let discountPercent: number | null = null;

  if (promocao) {
    const explicitDiscount =
      promocao.discount_percent != null
        ? Number(promocao.discount_percent)
        : NaN;

    if (
      !finalFromPromo &&
      !Number.isNaN(explicitDiscount) &&
      explicitDiscount > 0 &&
      originalPrice > 0
    ) {
      finalPrice = originalPrice * (1 - explicitDiscount / 100);
    }

    if (originalPrice > 0 && finalPrice < originalPrice) {
      discountPercent =
        ((originalPrice - finalPrice) / originalPrice) * 100;
    } else if (!Number.isNaN(explicitDiscount) && explicitDiscount > 0) {
      discountPercent = explicitDiscount;
    }
  }

  const priceBRL = finalPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const originalPriceBRL = originalPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const promoEndsAt =
    (promocao?.ends_at as string | null) ??
    (promocao?.end_at as string | null) ??
    null;

  // Esse é o produto que vai para o carrinho já com o preço final
  const produtoComPrecoFinal: Product = {
    ...produto,
    price: finalPrice,
  };

  // ===== AVALIAÇÕES (igual antes) =====
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    async function carregarAvaliacoes() {
      try {
        setLoadingReviews(true);
        const res = await fetch(
          `${API_BASE}/api/public/produtos/${produto.id}/avaliacoes`
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

    if (produto?.id) {
      carregarAvaliacoes();
    }
  }, [produto?.id]);

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
          produto_id: produto.id,
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

      const resList = await fetch(
        `${API_BASE}/api/public/produtos/${produto.id}/avaliacoes`
      );
      const data = await resList.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      toast.error("Erro ao enviar sua avaliação.");
    }
  }

  const ratingAvgBackend: number | undefined = (produto as any)?.rating_avg;
  const ratingCountBackend: number | undefined = (produto as any)?.rating_count;

  const media =
    ratingAvgBackend && ratingAvgBackend > 0
      ? Number(ratingAvgBackend)
      : reviews.length
      ? reviews.reduce((acc, r) => acc + Number(r.nota || 0), 0) /
        reviews.length
      : 0;

  const totalAval = ratingCountBackend ?? reviews.length;

  const totalComentarios = reviews.filter(
    (r) => r.comentario && r.comentario.trim() !== ""
  ).length;

  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Number(r.nota) === star).length;
    const percent = totalAval ? (count / totalAval) * 100 : 0;
    return { star, count, percent };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-10">
      {/* ===== BLOCO PRINCIPAL: GALERIA + INFO + COMPRA ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Galeria (lado esquerdo) */}
        <div className="md:sticky md:top-24 h-fit">
          <Gallery images={images} alt={produto.name} />
        </div>

        {/* Conteúdo + caixa de compra (lado direito) */}
        <div className="flex flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              {produto.name}
            </h1>

            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  disponivel
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-red-50 text-red-700 ring-1 ring-red-200"
                }`}
              >
                {disponivel ? "Em estoque" : "Esgotado"}
              </span>
              <span className="text-xs text-gray-500">ID #{produto.id}</span>

              {discountPercent && discountPercent > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  -{discountPercent.toFixed(0)}% OFF
                </span>
              )}
            </div>

            {/* Resumo de avaliação (estrelinhas + média) */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-yellow-500 text-lg">
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
              <div className="text-sm text-gray-700">
                {media ? (
                  <>
                    <span className="font-semibold">
                      {media.toFixed(1)} / 5
                    </span>{" "}
                    <span className="text-gray-400">
                      ({totalAval || 0} avaliação
                      {totalAval === 1 ? "" : "es"})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">
                    Ainda não avaliado pelos clientes
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* PREÇO + DESCONTO (mesma lógica da page.tsx) */}
          <div className="space-y-1">
            {discountPercent &&
              discountPercent > 0 &&
              originalPrice > finalPrice && (
                <div className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="text-sm text-gray-400 line-through">
                    {originalPriceBRL}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    economia de {discountPercent.toFixed(0)}%
                  </span>
                </div>
              )}

            <p className="text-3xl font-extrabold text-emerald-600">
              {priceBRL}
            </p>

            {promoEndsAt && (
              <p className="text-xs text-amber-700">
                Promoção válida até{" "}
                {new Date(promoEndsAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
                , ou enquanto durarem os estoques.
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="prose max-w-none text-gray-700">
            <p>{produto.description || "Sem descrição disponível."}</p>
          </div>

          {/* Caixa de compra usando PREÇO FINAL */}
          <ProductBuyBox product={produtoComPrecoFinal} stock={estoque} />
        </div>
      </div>

      {/* ===== BLOCO DE AVALIAÇÕES DOS CLIENTES ===== */}
      <section className="rounded-2xl border border-gray-200 bg-white/90 p-4 sm:p-6 space-y-6">
        {/* Resumo tipo Magalu/Shein */}
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

        {/* Filtros visuais simples */}
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
      </section>
    </div>
  );
}
