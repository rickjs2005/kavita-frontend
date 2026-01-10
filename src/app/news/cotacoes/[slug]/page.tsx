// src/app/news/cotacoes/[slug]/page.tsx
import Link from "next/link";
import { newsPublicApi } from "@/lib/newsPublicApi";
import { EmptyState } from "@/components/news/EmptyState";

function safeNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function formatPrice(v: any) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPct(v: number | null) {
  if (v === null) return "-";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function formatDatePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(d);
}

function getMarketEmoji(item: any): string {
  const hay = `${item?.slug ?? ""} ${item?.name ?? ""} ${item?.group_key ?? ""} ${item?.market ?? ""} ${item?.type ?? ""}`.toLowerCase();

  if (hay.includes("cafe") || hay.includes("café")) return "☕";
  if (hay.includes("milho")) return "🌽";
  if (hay.includes("soja")) return "🫘";
  if (hay.includes("boi") || hay.includes("arroba") || hay.includes("gordo")) return "🐂";
  if (hay.includes("dolar") || hay.includes("dólar") || hay.includes("usd")) return "💵";

  return "🏷";
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CotacaoDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let item: any = null;

  try {
    const res = await newsPublicApi.cotacaoBySlug((await params).slug);
    item = res.data;
  } catch {
    item = null;
  }

  if (!item) {
    return (
      <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
        <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <EmptyState
              title="Cotação não encontrada"
              subtitle="Verifique o endereço ou volte para a lista de cotações do agro."
            />
            <div className="mt-6">
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
                href="/news/cotacoes"
              >
                <span aria-hidden>←</span> Voltar para Cotações
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const emoji = getMarketEmoji(item);

  const varNum = safeNum(item.variation_day);
  const varLabel = formatPct(varNum);

  const isUp = varNum !== null && varNum > 0;
  const isDown = varNum !== null && varNum < 0;

  const variationTone = isUp
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isDown
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-zinc-200 bg-zinc-50 text-zinc-700";

  const variationEmoji = isUp ? "📈" : isDown ? "📉" : "";

  const updated = formatDatePtBR(item.last_update_at);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6 py-10">
        <nav aria-label="Navegação" className="mb-6">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
            href="/news/cotacoes"
          >
            <span aria-hidden>←</span> Voltar para Cotações
          </Link>
        </nav>

        <article className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <header className="border-b border-zinc-100 p-6 md:p-8">
            <p className="text-xs font-semibold tracking-widest text-zinc-500">KAVITA NEWS • MERCADO</p>

            {/* Exatamente 1 H1 */}
            <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
              {emoji} {item.name}
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              {item.group_key ? item.group_key : "Mercado"} • {item.type ?? "Tipo -"} • {item.slug}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${variationTone}`}>
                {variationEmoji ? <span aria-hidden>{variationEmoji}</span> : null}
                Variação do dia: {varLabel}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                <span aria-hidden>🌍</span>
                {item.source ? `Fonte: ${item.source}` : "Fonte: -"}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                <span aria-hidden>⏱</span>
                {updated ? `Atualizado: ${updated}` : "Atualização: indisponível"}
              </span>
            </div>
          </header>

          <section aria-label="Resumo do dia" className="p-6 md:p-8">
            <h2 className="text-base font-semibold text-zinc-900">Resumo do dia</h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-5">
                <p className="text-sm text-zinc-600">Preço</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                  {formatPrice(item.price)}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-600">{item.unit ?? ""}</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-5">
                <p className="text-sm text-zinc-600">Variação do dia</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                  <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 ${variationTone}`}>
                    {variationEmoji ? <span aria-hidden>{variationEmoji}</span> : null}
                    {varLabel}
                  </span>
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Movimento percentual no dia, conforme a fonte do ativo.
                </p>
              </div>
            </div>
          </section>

          <section aria-label="Dados do mercado" className="border-t border-zinc-100 p-6 md:p-8">
            <h2 className="text-base font-semibold text-zinc-900">Dados do mercado</h2>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 text-sm text-zinc-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <p>
                  <span className="text-zinc-500">Mercado:</span>{" "}
                  <span className="font-medium text-zinc-900">{item.market ? item.market : "-"}</span>
                </p>
                <p>
                  <span className="text-zinc-500">Grupo:</span>{" "}
                  <span className="font-medium text-zinc-900">{item.group_key ? item.group_key : "-"}</span>
                </p>
                <p>
                  <span className="text-zinc-500">Tipo:</span>{" "}
                  <span className="font-medium text-zinc-900">{item.type ?? "-"}</span>
                </p>
                <p>
                  <span className="text-zinc-500">Fonte:</span>{" "}
                  <span className="font-medium text-zinc-900">{item.source ? item.source : "-"}</span>
                </p>
              </div>

              <div className="mt-4 text-xs text-zinc-500">
                Os dados são exibidos conforme a atualização da fonte oficial associada ao ativo.
              </div>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
