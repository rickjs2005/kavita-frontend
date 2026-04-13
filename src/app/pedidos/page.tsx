"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import apiClient from "@/lib/apiClient";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

// ----- Tipos -----
type StatusPagamento = "pendente" | "pago" | "falhou" | "estornado";
type StatusEntrega =
  | "em_separacao"
  | "processando"
  | "enviado"
  | "entregue"
  | "cancelado";

type PedidoResumo = {
  id: number;
  usuario_id: number;
  forma_pagamento: string;
  status: string;
  status_pagamento: StatusPagamento;
  status_entrega: StatusEntrega;
  data_pedido: string;
  total: number;
  shipping_price: number;
  cupom_codigo?: string | null;
  qtd_itens: number;
};

// ----- Labels e badges -----
const LABEL_PAGAMENTO: Record<StatusPagamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  falhou: "Falhou",
  estornado: "Estornado",
};

const LABEL_ENTREGA: Record<StatusEntrega, string> = {
  em_separacao: "Em separação",
  processando: "Processando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const COR_PAGAMENTO: Record<StatusPagamento, string> = {
  pendente: "border-amber-400/40 bg-amber-50 text-amber-700",
  pago: "border-emerald-400/40 bg-emerald-50 text-emerald-700",
  falhou: "border-rose-400/40 bg-rose-50 text-rose-700",
  estornado: "border-sky-400/40 bg-sky-50 text-sky-700",
};

const COR_ENTREGA: Record<StatusEntrega, string> = {
  em_separacao: "border-slate-400/40 bg-slate-50 text-slate-600",
  processando: "border-indigo-400/40 bg-indigo-50 text-indigo-700",
  enviado: "border-sky-400/40 bg-sky-50 text-sky-700",
  entregue: "border-emerald-400/40 bg-emerald-50 text-emerald-700",
  cancelado: "border-rose-400/40 bg-rose-50 text-rose-700",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

// ----- Componente principal -----
export default function PedidosClientePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const isLoggedIn = !!user?.id;

  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (authLoading || !isLoggedIn) return;

    const fetchPedidos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<PedidoResumo[]>("/api/pedidos");
        setPedidos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const status = err?.status;
        if (status === 401 || status === 403) {
          router.push("/login");
        } else {
          setError(err?.message || "Não foi possível carregar seus pedidos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [authLoading, isLoggedIn, router]);

  // --------- RENDER ---------

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Meus Pedidos
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe suas compras e status de entrega
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:inline-flex"
        >
          Voltar
        </button>
      </div>

      {/* Loading */}
      {loading && <LoadingState message="Carregando seus pedidos..." />}

      {/* Erro */}
      {!loading && error && <ErrorState message={error} />}

      {/* Vazio */}
      {!loading && !error && pedidos.length === 0 && (
        <EmptyState
          message="Você ainda não fez nenhuma compra."
          action={{ label: "Ver produtos", onClick: () => router.push("/") }}
        />
      )}

      {/* Lista de pedidos */}
      {!loading && !error && pedidos.length > 0 && (
        <div className="space-y-4">
          {pedidos.map((p) => {
            const sp = p.status_pagamento as StatusPagamento;
            const se = p.status_entrega as StatusEntrega;

            return (
              <Link
                key={p.id}
                href={`/pedidos/${p.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md sm:p-5"
              >
                {/* Linha 1: ID + Data + Total */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 sm:text-lg">
                      Pedido #{p.id}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {formatDateTime(p.data_pedido)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 sm:text-xl">
                    {formatCurrency(p.total)}
                  </p>
                </div>

                {/* Linha 2: Badges + Info */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {sp && LABEL_PAGAMENTO[sp] && (
                    <Badge
                      label={LABEL_PAGAMENTO[sp]}
                      className={COR_PAGAMENTO[sp]}
                    />
                  )}
                  {se && LABEL_ENTREGA[se] && (
                    <Badge
                      label={LABEL_ENTREGA[se]}
                      className={COR_ENTREGA[se]}
                    />
                  )}
                  {p.cupom_codigo && (
                    <Badge
                      label={`Cupom: ${p.cupom_codigo}`}
                      className="border-violet-400/40 bg-violet-50 text-violet-700"
                    />
                  )}
                </div>

                {/* Linha 3: Detalhes */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span>{p.forma_pagamento}</span>
                  <span className="hidden sm:inline">·</span>
                  <span>
                    {p.qtd_itens} {p.qtd_itens === 1 ? "item" : "itens"}
                  </span>
                  {p.shipping_price > 0 && (
                    <>
                      <span className="hidden sm:inline">·</span>
                      <span>Frete: {formatCurrency(p.shipping_price)}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Botão mobile */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:hidden"
      >
        Voltar para a página inicial
      </button>
    </main>
  );
}
