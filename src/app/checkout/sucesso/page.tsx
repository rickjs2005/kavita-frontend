"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/services/api/endpoints";
import { PaymentResponseSchema } from "@/lib/schemas/api";
import { sanitizeUrl, isMercadoPagoUrl } from "@/lib/sanitizeHtml";

function SucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoId = searchParams.get("pedidoId");
  const pagamentoPendente = searchParams.get("pagamento") === "pendente";
  const { clearCart } = useCart();

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Limpa o carrinho apenas quando o pedidoId da URL corresponde ao último
  // pedido criado nesta sessão. Previne limpeza indevida via URL manipulada.
  useEffect(() => {
    if (!pedidoId) return;
    try {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("lastOrder_"));
      const owns = keys.some((k) => {
        const parsed = JSON.parse(sessionStorage.getItem(k) || "{}");
        return String(parsed?.id) === String(pedidoId);
      });
      if (owns) clearCart?.({ silent: true });
    } catch {
      clearCart?.({ silent: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetryPayment = useCallback(async () => {
    if (!pedidoId || retrying) return;
    setRetrying(true);
    setRetryError(null);

    try {
      const raw = await apiClient.post<unknown>(ENDPOINTS.PAYMENT.START, {
        pedidoId: Number(pedidoId),
      });

      const parsed = PaymentResponseSchema.safeParse(raw);
      const rawUrl = parsed.success
        ? (parsed.data.init_point ?? parsed.data.sandbox_init_point ?? null)
        : null;

      const sanitized = rawUrl ? sanitizeUrl(rawUrl) : null;
      const safeUrl = sanitized && isMercadoPagoUrl(sanitized) ? sanitized : null;

      if (safeUrl) {
        window.location.href = safeUrl;
        return;
      }

      setRetryError("Não foi possível obter o link de pagamento. Tente novamente em alguns instantes.");
    } catch {
      setRetryError("Erro ao iniciar pagamento. Tente novamente em alguns instantes.");
    } finally {
      setRetrying(false);
    }
  }, [pedidoId, retrying]);

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${pagamentoPendente ? "bg-yellow-100" : "bg-green-100"}`}>
          {pagamentoPendente ? (
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        {pagamentoPendente
          ? "Pedido criado — pagamento pendente"
          : "Seu pedido foi realizado com sucesso!"}
      </h1>

      <p className="text-gray-600 mb-2">
        {pagamentoPendente
          ? "Seu pedido foi registrado, mas não foi possível iniciar o pagamento automaticamente."
          : "Seu pedido foi criado e o pagamento está sendo processado."}
      </p>
      <p className="text-gray-500 text-sm mb-8">
        {pagamentoPendente
          ? "Clique abaixo para tentar o pagamento novamente, ou acesse seus pedidos para acompanhar."
          : "A confirmação do pagamento depende do processador. Você receberá uma notificação assim que o status for atualizado."}
      </p>

      {pedidoId && (
        <p className="text-sm font-medium text-gray-700 mb-6">
          Pedido <span className="text-primary">#{pedidoId}</span>
        </p>
      )}

      {retryError && (
        <p className="text-sm text-red-600 mb-4">{retryError}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {pagamentoPendente && pedidoId && (
          <button
            type="button"
            disabled={retrying}
            onClick={handleRetryPayment}
            className="px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {retrying ? "Iniciando pagamento..." : "Tentar pagamento"}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push(pedidoId ? `/pedidos/${pedidoId}` : "/pedidos")}
          className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
        >
          Ver meu pedido
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Voltar para loja
        </button>
      </div>
    </main>
  );
}

export default function SucessoPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">Carregando...</div>}>
      <SucessoContent />
    </Suspense>
  );
}
