"use client";

// Botões de comunicação com o cliente do pedido. Após B1 da auditoria
// (2026-04-24), WhatsApp passou a ser canal principal — quando o admin
// clica num evento o sistema:
//   1. Solicita preview do link wa.me ao backend (gera mensagem +
//      link sem enviar)
//   2. Abre o wa.me em nova aba para o admin enviar pelo próprio
//      WhatsApp Web/Mobile
//   3. Em paralelo, dispara o e-mail transacional (canal complementar)
//
// O backend já loga o envio em comunicacoes_enviadas com status
// "manual_pending" para o WhatsApp. O componente desabilita os botões
// que já têm log para evitar reenvio (visualmente mostra "já enviado").

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CustomButton from "@/components/buttons/CustomButton";
import apiClient from "@/lib/apiClient";

type PedidoAcoesProps = {
  pedidoId: number;
};

// Eventos do ciclo de vida (ordem cronológica do pedido)
const EVENTOS = [
  { template: "confirmacao_pedido", label: "Pedido recebido" },
  { template: "pagamento_aprovado", label: "Pagamento aprovado" },
  { template: "pedido_em_separacao", label: "Em separação" },
  { template: "pedido_enviado", label: "Saiu para entrega" },
  { template: "pedido_entregue", label: "Entregue" },
  { template: "pedido_cancelado", label: "Cancelado" },
] as const;

type LogRow = {
  id: number;
  canal: "email" | "whatsapp";
  tipo_template: string;
  status_envio: "sucesso" | "erro" | "manual_pending";
  criado_em: string;
};

type PreviewResp = {
  url: string | null;
  mensagem: string;
  telefone: string | null;
  jaEnviado: boolean;
  provider: "manual" | "api";
};

export default function PedidoAcoes({ pedidoId }: PedidoAcoesProps) {
  const [busyTpl, setBusyTpl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  async function loadLogs() {
    try {
      const data = await apiClient.get<LogRow[]>(
        `/api/admin/comunicacao/logs/${pedidoId}`,
      );
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      // não bloqueia UI — silencioso
    }
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  // Indica se já existe envio (sucesso ou link gerado) para um template+canal.
  function jaEnviado(template: string, canal: "whatsapp" | "email") {
    return logs.some(
      (l) =>
        l.tipo_template === template &&
        l.canal === canal &&
        (l.status_envio === "sucesso" || l.status_envio === "manual_pending"),
    );
  }

  async function disparar(template: string) {
    setBusyTpl(template);
    try {
      // Pede o link wa.me + mensagem renderizada (não envia ainda)
      const preview = await apiClient.get<PreviewResp>(
        `/api/admin/comunicacao/whatsapp/preview?pedidoId=${pedidoId}&template=${template}`,
      );

      if (preview.url) {
        // Modo manual: dispara o backend (loga manual_pending) + abre app
        await apiClient.post("/api/admin/comunicacao/whatsapp", {
          template,
          pedidoId,
        });
        // Abre wa.me numa nova aba pra admin enviar a mensagem.
        if (typeof window !== "undefined") {
          window.open(preview.url, "_blank", "noopener,noreferrer");
        }
        toast.success(
          "WhatsApp pronto pra enviar — confira o app na nova aba.",
        );
      } else {
        toast.error("Cliente sem WhatsApp cadastrado para este pedido.");
      }

      // Em paralelo, manda e-mail (canal complementar)
      try {
        await apiClient.post("/api/admin/comunicacao/email", {
          template,
          pedidoId,
        });
      } catch {
        // e-mail é complementar — falha não interrompe
      }

      await loadLogs();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || "Erro ao preparar comunicação.");
    } finally {
      setBusyTpl(null);
    }
  }

  return (
    <div className="mt-2">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Avisar cliente
      </p>
      <div className="flex flex-wrap gap-2">
        {EVENTOS.map(({ template, label }) => {
          const sentWa = jaEnviado(template, "whatsapp");
          const isBusy = busyTpl === template;
          return (
            <span
              key={template}
              title={
                sentWa
                  ? "Já enviado — clique para reenviar"
                  : `Preparar mensagem de "${label}" no WhatsApp + e-mail`
              }
            >
              <CustomButton
                label={sentWa ? `${label} ✓` : label}
                size="small"
                variant={sentWa ? "primary" : "secondary"}
                isLoading={isBusy}
                onClick={() => disparar(template)}
              />
            </span>
          );
        })}
      </div>
      {logs.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          {logs.length} comunicação(ões) já registrada(s) para este pedido.
        </p>
      )}
    </div>
  );
}
