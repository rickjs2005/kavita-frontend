"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

function ErroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoId = searchParams.get("pedidoId");

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Pagamento não concluído
      </h1>

      <p className="text-gray-600 mb-2">
        Houve um problema ao processar seu pagamento.
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Seu pedido foi registrado, mas o pagamento não foi confirmado. Você pode
        tentar novamente ou escolher outra forma de pagamento.
      </p>

      {pedidoId && (
        <p className="text-sm font-medium text-gray-700 mb-6">
          Pedido <span className="text-[#359293]">#{pedidoId}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {pedidoId && (
          <button
            type="button"
            onClick={() => router.push(`/pedidos/${pedidoId}`)}
            className="px-6 py-3 rounded-lg bg-[#359293] text-white font-semibold hover:bg-[#2b7778] transition-colors"
          >
            Ver meu pedido
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="px-6 py-3 rounded-lg bg-[#EC5B20] text-white font-semibold hover:bg-[#d14d18] transition-colors"
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Voltar à loja
        </button>
      </div>
    </main>
  );
}

export default function ErroPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">Carregando...</div>}>
      <ErroContent />
    </Suspense>
  );
}
