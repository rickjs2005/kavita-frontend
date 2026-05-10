// src/app/news/sair/page.tsx
//
// Pagina publica de descadastro (opt-out) do canal WhatsApp do Kavita News.
// Lê ?token=... da URL, chama POST /api/news/whatsapp-unsubscribe e mostra
// o resultado.
//
// Estados cobertos:
//   - sem token na URL              -> error
//   - loading inicial               -> loading
//   - opt-out confirmado            -> success
//   - ja estava unsubscribed        -> info
//   - token nao encontrado (404)    -> error
//   - falha generica                -> error
//
// Importante: opt-out e sempre permitido, mesmo se ja estiver unsubscribed,
// pra atender a LGPD (direito de saida claro e a qualquer momento).

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { newsPublicApi } from "@/lib/newsPublicApi";
import { isApiError } from "@/lib/errors";
import {
  WhatsappStatusPanel,
  type WhatsappStatusPanelProps,
} from "@/components/news/WhatsappStatusPanel";

type ViewState = WhatsappStatusPanelProps;

const INITIAL_LOADING: ViewState = {
  kind: "loading",
  badge: "Processando",
  title: "Removendo seu cadastro do canal...",
  description: "Estamos confirmando seu pedido de saída.",
};

function SairInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [view, setView] = useState<ViewState>(INITIAL_LOADING);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setView({
          kind: "error",
          badge: "Link inválido",
          title: "Link de descadastro incompleto",
          description:
            "O endereço aberto não tem o código necessário. Use o link exato que veio na mensagem do canal.",
          primaryAction: { label: "Voltar para Kavita News", href: "/news" },
        });
        return;
      }

      try {
        const res = await newsPublicApi.whatsappUnsubscribe(token);
        if (cancelled) return;

        if (res.alreadyUnsubscribed) {
          setView({
            kind: "info",
            badge: "Já desinscrito",
            title: "Você já tinha saído do canal",
            description:
              "Esse número já não está na lista. Não vai receber mais alertas pelo Kavita News no WhatsApp.",
            primaryAction: { label: "Voltar para Kavita News", href: "/news" },
          });
        } else {
          setView({
            kind: "success",
            badge: "Saída confirmada",
            title: "Pronto — você saiu do canal",
            description:
              "Não vamos enviar mais alertas para esse número. Se quiser voltar no futuro, basta cadastrar novamente pelo /news.",
            details: [
              "Sua saída é definitiva: por LGPD, reativação só acontece com novo cadastro.",
              "Continuamos disponíveis pelo site — cotações, clima e matérias seguem abertos no Kavita News.",
            ],
            primaryAction: { label: "Voltar para Kavita News", href: "/news" },
          });
        }
      } catch (err) {
        if (cancelled) return;

        if (isApiError(err) && err.status === 404) {
          setView({
            kind: "error",
            badge: "Link inválido",
            title: "Não encontramos esse cadastro",
            description:
              "O link pode ter expirado ou nunca ter sido gerado. Se você não está conseguindo sair, fale com a gente.",
            primaryAction: { label: "Voltar para Kavita News", href: "/news" },
          });
          return;
        }

        setView({
          kind: "error",
          badge: "Falhou",
          title: "Não foi possível processar agora",
          description:
            "Algo deu errado no caminho. Tente novamente em instantes ou nos avise pelo /contato.",
          primaryAction: { label: "Voltar para Kavita News", href: "/news" },
        });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return <WhatsappStatusPanel {...view} />;
}

export default function SairPage() {
  return (
    <Suspense fallback={<WhatsappStatusPanel {...INITIAL_LOADING} />}>
      <SairInner />
    </Suspense>
  );
}
