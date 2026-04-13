"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { absUrl } from "@/utils/absUrl";
import { LoadingState } from "@/components/ui/LoadingState";
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

type PedidoItem = {
  id: number;
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string | null;
};

type PedidoDetalhe = {
  id: number;
  usuario_id: number;
  forma_pagamento: string;
  status_pagamento: StatusPagamento;
  status_entrega: StatusEntrega;
  data_pedido: string;
  endereco: string | Record<string, string> | null;
  cupom_codigo?: string | null;
  subtotal: number;
  desconto: number;
  shipping_price: number;
  shipping_prazo_dias?: number | null;
  total: number;
  itens: PedidoItem[];
};

// ----- Labels profissionais -----
const LABEL_PAGAMENTO: Record<StatusPagamento, string> = {
  pendente: "Pagamento pendente",
  pago: "Pagamento aprovado",
  falhou: "Pagamento recusado",
  estornado: "Pagamento estornado",
};

const LABEL_ENTREGA: Record<StatusEntrega, string> = {
  em_separacao: "Pedido recebido",
  processando: "Em preparação",
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-tight ${className}`}
    >
      {label}
    </span>
  );
}

function parseEndereco(raw: string | Record<string, string> | null) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ----- Componente principal -----
export default function PedidoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pedidoId = params?.id;

  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user?.id;

  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetryPayment = async () => {
    if (!pedido) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const data = await apiClient.post<{
        init_point?: string;
        sandbox_init_point?: string;
      }>("/api/payment/start", { pedidoId: pedido.id });
      const url =
        process.env.NODE_ENV === "production"
          ? data.init_point
          : (data.sandbox_init_point ?? data.init_point);
      if (url) {
        window.location.href = url;
      } else {
        setRetryError("Não foi possível obter o link de pagamento.");
        setRetrying(false);
      }
    } catch (err: any) {
      setRetryError(
        err?.message || "Erro ao iniciar pagamento. Tente novamente.",
      );
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (authLoading || !pedidoId || !isLoggedIn) return;

    const fetchPedido = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<PedidoDetalhe>(
          `/api/pedidos/${pedidoId}`,
        );
        setPedido(data);
      } catch (err: any) {
        const status = err?.status;
        if (status === 404) {
          setError("Pedido não encontrado.");
        } else if (status === 401 || status === 403) {
          router.push("/login");
        } else {
          setError(err?.message || "Não foi possível carregar esta compra.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [authLoading, pedidoId, isLoggedIn, router]);

  // --------- RENDER ---------

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
          Detalhe do Pedido
        </h1>
        <LoadingState message="Carregando informações do pedido..." />
      </main>
    );
  }

  if (error || !pedido) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
          Detalhe do Pedido
        </h1>
        <ErrorState
          message={error || "Não foi possível carregar esta compra."}
        />
        <button
          type="button"
          onClick={() => router.push("/pedidos")}
          className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Voltar para meus pedidos
        </button>
      </main>
    );
  }

  const endereco = parseEndereco(pedido.endereco);
  const sp = pedido.status_pagamento as StatusPagamento;
  const se = pedido.status_entrega as StatusEntrega;
  const isPrazo = pedido.forma_pagamento?.toLowerCase().includes("prazo");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Pedido #{pedido.id}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Realizado em {formatDateTime(pedido.data_pedido)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/pedidos")}
          className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:inline-flex"
        >
          Voltar para meus pedidos
        </button>
      </div>

      {/* Status + Informações do pedido */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
          {sp && LABEL_PAGAMENTO[sp] && (
            <Badge label={LABEL_PAGAMENTO[sp]} className={COR_PAGAMENTO[sp]} />
          )}
          {se && LABEL_ENTREGA[se] && (
            <Badge label={LABEL_ENTREGA[se]} className={COR_ENTREGA[se]} />
          )}
          {pedido.cupom_codigo && (
            <Badge
              label={`Cupom: ${pedido.cupom_codigo}`}
              className="border-violet-400/40 bg-violet-50 text-violet-700"
            />
          )}
        </div>

        {/* Detalhes */}
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 px-4 py-4 text-sm sm:grid-cols-3 sm:px-5">
          <div>
            <p className="text-gray-500">Forma de pagamento</p>
            <p className="mt-0.5 font-medium text-gray-900">
              {pedido.forma_pagamento}
            </p>
          </div>
          {pedido.shipping_prazo_dias != null && (
            <div>
              <p className="text-gray-500">Prazo de entrega estimado</p>
              <p className="mt-0.5 font-medium text-gray-900">
                {pedido.shipping_prazo_dias}{" "}
                {pedido.shipping_prazo_dias === 1
                  ? "dia útil"
                  : "dias úteis"}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Total do pedido</p>
            <p className="mt-0.5 text-lg font-bold text-accent">
              {formatCurrency(pedido.total)}
            </p>
          </div>
        </div>
      </section>

      {/* Alerta: pagamento recusado ou pendente (não prazo) */}
      {(sp === "falhou" || sp === "pendente") && !isPrazo && (
        <section className="mb-6">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="mb-3 text-sm text-orange-800">
              {sp === "falhou"
                ? "O pagamento deste pedido não foi aprovado. Você pode tentar novamente."
                : "Este pedido está aguardando a confirmação do pagamento."}
            </p>
            {retryError && (
              <p className="mb-2 text-sm text-red-600">{retryError}</p>
            )}
            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={retrying}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {retrying ? "Redirecionando..." : "Tentar pagamento novamente"}
            </button>
          </div>
        </section>
      )}

      {/* Alerta: pagamento a prazo pendente */}
      {isPrazo && sp === "pendente" && (
        <section className="mb-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-1 text-sm font-semibold text-blue-800">
              Pedido recebido — aguardando confirmação de pagamento
            </p>
            <p className="text-sm text-blue-700">
              Seu pedido foi registrado com pagamento a prazo. Nossa equipe
              entrará em contato para confirmar as condições e liberar o pedido.
              Nenhuma ação é necessária da sua parte agora.
            </p>
          </div>
        </section>
      )}

      {/* Endereço de entrega */}
      {endereco && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Endereço de entrega
          </h2>
          <div className="space-y-0.5 text-sm text-gray-700">
            <p>
              {endereco.rua || endereco.endereco}
              {endereco.numero ? `, ${endereco.numero}` : ""}
            </p>
            {endereco.bairro && (
              <p>
                {endereco.bairro} — {endereco.cidade}/{endereco.estado}
              </p>
            )}
            {endereco.complemento && <p>{endereco.complemento}</p>}
            {endereco.cep && <p>CEP: {endereco.cep}</p>}
          </div>
        </section>
      )}

      {/* Itens do pedido */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Itens ({pedido.itens.length})
        </h2>
        <div className="divide-y rounded-xl border border-gray-200 bg-white shadow-sm">
          {pedido.itens.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4"
            >
              {/* Imagem */}
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
                <img
                  src={item.imagem ? absUrl(item.imagem) : "/placeholder.png"}
                  alt={item.nome}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {item.nome}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {item.quantidade} x {formatCurrency(item.preco)}
                </p>
              </div>

              {/* Subtotal + ação */}
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.preco * item.quantidade)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/produtos/${item.produto_id}`);
                  }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover"
                >
                  Comprar novamente
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resumo financeiro */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-400 sm:px-5">
          Resumo do pedido
        </h2>
        <div className="space-y-2.5 px-4 py-4 text-sm sm:px-5">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-gray-600">
            <span>Subtotal dos produtos</span>
            <span>{formatCurrency(pedido.subtotal)}</span>
          </div>

          {/* Desconto */}
          {pedido.desconto > 0 && (
            <div className="flex items-center justify-between text-emerald-600">
              <span>
                Desconto
                {pedido.cupom_codigo ? ` (${pedido.cupom_codigo})` : ""}
              </span>
              <span>- {formatCurrency(pedido.desconto)}</span>
            </div>
          )}

          {/* Frete */}
          <div className="flex items-center justify-between text-gray-600">
            <span>Frete</span>
            <span>
              {pedido.shipping_price > 0
                ? formatCurrency(pedido.shipping_price)
                : "Grátis"}
            </span>
          </div>

          {/* Separador */}
          <hr className="border-gray-200" />

          {/* Total */}
          <div className="flex items-center justify-between pt-1 text-lg font-bold text-gray-900">
            <span>Total pago</span>
            <span className="text-accent">
              {formatCurrency(pedido.total)}
            </span>
          </div>
        </div>
      </section>

      {/* Botão voltar mobile */}
      <button
        type="button"
        onClick={() => router.push("/pedidos")}
        className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:hidden"
      >
        Voltar para meus pedidos
      </button>
    </main>
  );
}
