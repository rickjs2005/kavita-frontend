"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

function SucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoId = searchParams.get("pedidoId");
  const { clearCart } = useCart();

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
      if (owns) clearCart?.();
    } catch {
      // sessionStorage indisponível — limpa por segurança para não travar o fluxo
      clearCart?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Pedido registrado!
      </h1>

      <p className="text-gray-600 mb-2">
        Seu pedido foi criado com sucesso. O pagamento está sendo processado.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        A confirmação do pagamento depende do processador. Você receberá uma
        notificação assim que o status for atualizado.
      </p>

      {pedidoId && (
        <p className="text-sm font-medium text-gray-700 mb-6">
          Pedido <span className="text-[#359293]">#{pedidoId}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => router.push(pedidoId ? `/pedidos/${pedidoId}` : "/pedidos")}
          className="px-6 py-3 rounded-lg bg-[#359293] text-white font-semibold hover:bg-[#2b7778] transition-colors"
        >
          Ver meu pedido
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Continuar comprando
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
