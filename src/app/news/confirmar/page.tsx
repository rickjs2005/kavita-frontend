// src/app/news/confirmar/page.tsx
//
// Pagina publica de confirmacao do opt-in no canal WhatsApp do Kavita News.
// Lê ?token=... da URL, chama POST /api/news/whatsapp-confirm e mostra o
// resultado.
//
// Estados cobertos:
//   - sem token na URL              -> error
//   - loading inicial               -> loading
//   - confirmacao bem sucedida      -> success
//   - ja estava active (idempotente) -> info
//   - token nao encontrado (404)    -> error
//   - subscriber em opt-out (409)   -> warning (orienta recadastrar)
//   - falha generica                -> error

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
  badge: "Confirmando",
  title: "Validando seu cadastro...",
  description:
    "Estamos verificando seu link de confirmação. Não feche esta página.",
};

function ConfirmarInner() {
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
          title: "Link de confirmação incompleto",
          description:
            "O endereço aberto não tem o código de confirmação. Tente novamente pelo botão que recebeu na confirmação do cadastro.",
          primaryAction: { label: "Voltar para Kavita News", href: "/news" },
        });
        return;
      }

      try {
        const res = await newsPublicApi.whatsappConfirm(token);
        if (cancelled) return;

        if (res.alreadyActive) {
          setView({
            kind: "info",
            badge: "Já confirmado",
            title: "Você já estava no canal",
            description:
              "Esse cadastro já tinha sido confirmado anteriormente. Tudo certo — assim que o canal abrir oficialmente, os alertas começam a chegar.",
            primaryAction: { label: "Voltar para Kavita News", href: "/news" },
          });
        } else {
          setView({
            kind: "success",
            badge: "Confirmado",
            title: "Inscrição confirmada — você está no canal",
            description:
              "Recebemos sua confirmação pelo WhatsApp. A primeira leva de alertas chega assim que o canal abrir oficialmente.",
            details: [
              "Cotações em movimento, alertas climáticos e oportunidades direto no seu WhatsApp.",
              "Sem ruído: você só recebe o que importa para sua operação.",
              "Pode sair quando quiser pelo link que vai junto em toda mensagem.",
            ],
            primaryAction: { label: "Explorar o Kavita News", href: "/news" },
          });
        }
      } catch (err) {
        if (cancelled) return;

        if (isApiError(err)) {
          if (err.status === 404) {
            setView({
              kind: "error",
              badge: "Link inválido",
              title: "Não encontramos esse cadastro",
              description:
                "O link pode ter expirado ou nunca ter sido gerado. Cadastre seu número novamente para gerar um novo código.",
              primaryAction: {
                label: "Cadastrar novamente",
                href: "/news",
              },
            });
            return;
          }
          if (err.status === 409) {
            setView({
              kind: "warning",
              badge: "Cadastro encerrado",
              title: "Esse número saiu do canal anteriormente",
              description:
                "Você pediu para sair antes — para voltar, faça o cadastro novamente pelo card de inscrição. Por LGPD, o opt-in não pode ser reativado por link.",
              primaryAction: {
                label: "Cadastrar novamente",
                href: "/news",
              },
            });
            return;
          }
        }

        setView({
          kind: "error",
          badge: "Falhou",
          title: "Não foi possível confirmar agora",
          description:
            "Algo deu errado no caminho. Tente abrir o link de novo ou cadastre seu número novamente pelo /news.",
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

export default function ConfirmarPage() {
  // useSearchParams exige Suspense em client components dentro do App Router.
  return (
    <Suspense fallback={<WhatsappStatusPanel {...INITIAL_LOADING} />}>
      <ConfirmarInner />
    </Suspense>
  );
}
