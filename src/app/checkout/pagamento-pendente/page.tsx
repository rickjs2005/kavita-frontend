"use client";

// Fase 1+2 go-live — R8: rota dedicada para o caso "pedido criado, mas
// payment/start falhou ou ficou em estado indeterminado".
//
// Vem em substituição ao redirect histórico /checkout/sucesso?pagamento=pendente,
// que confundia clientes ("sucesso" + "pendente" na mesma tela). Aqui o
// estado é nominalmente honesto: pedido existe, pagamento ainda não foi
// iniciado, e o cliente decide se tenta de novo ou abandona.
//
// Casos de chegada:
//   /checkout/pagamento-pendente?pedidoId=X
//     → caso geral (falha rede, MP indisponível, init_point inválido).
//   /checkout/pagamento-pendente?pedidoId=X&motivo=rate_limit
//     → 429 do backend (rate-limit absoluto B5). Mostra mensagem específica
//       de "muitas tentativas, aguarde". Botão de retry continua disponível
//       mas com cooldown sugerido.
//   /checkout/pagamento-pendente?pedidoId=X&motivo=erro
//     → 500/erro genérico. Mostra erro amigável + retry.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { apiClient } from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import { PaymentResponseSchema } from "@/lib/schemas/api";
import { sanitizeUrl, isMercadoPagoUrl } from "@/lib/sanitizeHtml";

type Motivo = "rate_limit" | "erro" | null;

const RATE_LIMIT_RETRY_SECONDS = 60;

function MensagemPorMotivo({ motivo }: { motivo: Motivo }) {
  if (motivo === "rate_limit") {
    return (
      <>
        <p className="text-gray-700 mb-2">
          Detectamos muitas tentativas em pouco tempo a partir desta conexão.
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Aguarde alguns minutos antes de tentar pagar novamente. Seu pedido
          continua válido e o estoque já foi reservado.
        </p>
      </>
    );
  }
  if (motivo === "erro") {
    return (
      <>
        <p className="text-gray-700 mb-2">
          Tivemos um problema temporário ao iniciar o pagamento.
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Seu pedido foi criado, mas o link de pagamento ainda não foi gerado.
          Tente novamente em alguns instantes.
        </p>
      </>
    );
  }
  return (
    <>
      <p className="text-gray-700 mb-2">
        Seu pedido foi criado, mas o pagamento ainda não foi iniciado.
      </p>
      <p className="text-gray-500 text-sm mb-4">
        Tente novamente para abrir o link do Mercado Pago, ou acesse seus
        pedidos mais tarde.
      </p>
    </>
  );
}

function PagamentoPendenteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoIdRaw = searchParams.get("pedidoId");
  const pedidoId = pedidoIdRaw && /^\d+$/.test(pedidoIdRaw) ? Number(pedidoIdRaw) : null;
  const motivoParam = searchParams.get("motivo");
  const motivo: Motivo =
    motivoParam === "rate_limit" || motivoParam === "erro" ? motivoParam : null;

  const { clearCart } = useCart();

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(motivo === "rate_limit" ? RATE_LIMIT_RETRY_SECONDS : 0);

  // Limpa o carrinho apenas quando o pedidoId da URL corresponde ao último
  // pedido criado nesta sessão. Mesmo padrão das outras páginas de checkout.
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

  // Cooldown visual quando entrou por rate_limit. Decrementa por segundo
  // até zerar — desabilita o botão durante a contagem.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRetryPayment = useCallback(async () => {
    if (!pedidoId || retrying || cooldown > 0) return;
    setRetrying(true);
    setRetryError(null);

    try {
      const raw = await apiClient.post<unknown>(ENDPOINTS.PAYMENT.START, {
        pedidoId,
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

      setRetryError(
        "Não foi possível obter o link de pagamento. Aguarde alguns instantes e tente novamente.",
      );
    } catch (err: unknown) {
      // Trata 429 com mensagem dedicada + reativa o cooldown visual.
      if (isApiError(err) && err.status === 429) {
        setCooldown(RATE_LIMIT_RETRY_SECONDS);
        setRetryError(
          "Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente novamente.",
        );
      } else if (isApiError(err) && err.status === 401) {
        // Sessão expirou enquanto estava nesta página — manda pra login
        // levando o pedido como state para retomar.
        router.push(`/login?from=${encodeURIComponent(`/checkout/pagamento-pendente?pedidoId=${pedidoId}`)}`);
        return;
      } else {
        const msg = isApiError(err) && err.message ? err.message : "Erro ao iniciar pagamento. Tente novamente em alguns instantes.";
        setRetryError(msg);
      }
    } finally {
      setRetrying(false);
    }
  }, [pedidoId, retrying, cooldown, router]);

  const tituloHeader =
    motivo === "rate_limit"
      ? "Aguarde alguns minutos"
      : "Pedido criado — pagamento não iniciado";

  const corCirculo =
    motivo === "rate_limit" ? "bg-amber-100" : "bg-yellow-100";
  const corIcone =
    motivo === "rate_limit" ? "text-amber-600" : "text-yellow-600";

  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">
        <div className={`w-16 h-16 rounded-full ${corCirculo} flex items-center justify-center`}>
          <svg
            className={`w-8 h-8 ${corIcone}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">{tituloHeader}</h1>

      <MensagemPorMotivo motivo={motivo} />

      {pedidoId !== null && (
        <p className="text-sm font-medium text-gray-700 mb-6">
          Pedido <span className="text-primary">#{pedidoId}</span>
        </p>
      )}

      {retryError && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {retryError}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {pedidoId !== null && (
          <button
            type="button"
            disabled={retrying || cooldown > 0}
            onClick={handleRetryPayment}
            className="px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {retrying
              ? "Iniciando pagamento..."
              : cooldown > 0
                ? `Aguarde ${cooldown}s para tentar novamente`
                : "Tentar pagar novamente"}
          </button>
        )}
        <Link
          href={pedidoId !== null ? `/pedidos/${pedidoId}` : "/pedidos"}
          className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
        >
          Ver meus pedidos
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Voltar para a loja
        </Link>
      </div>
    </main>
  );
}

export default function PagamentoPendentePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">
          Carregando...
        </div>
      }
    >
      <PagamentoPendenteContent />
    </Suspense>
  );
}
