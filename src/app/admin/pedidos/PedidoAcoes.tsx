"use client";

import toast from "react-hot-toast";
import CustomButton from "@/components/buttons/CustomButton";
import { useState } from "react";
import apiClient from "@/lib/apiClient";

type PedidoAcoesProps = {
  pedidoId: number;
};

export default function PedidoAcoes({ pedidoId }: PedidoAcoesProps) {
  const [isLoading, setIsLoading] = useState(false);

  const sendEmail = async (template: string) => {
    try {
      setIsLoading(true);
      await apiClient.post("/api/admin/comunicacao/email", { template, pedidoId });
      toast.success("E-mail enviado/registrado com sucesso.");
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Erro ao enviar e-mail de comunicação.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendWhatsapp = async (template: string) => {
    try {
      setIsLoading(true);
      await apiClient.post("/api/admin/comunicacao/whatsapp", { template, pedidoId });
      toast.success("WhatsApp enviado/registrado com sucesso.");
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Erro ao enviar mensagem de WhatsApp.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <CustomButton
        label="Enviar confirmação"
        size="small"
        variant="secondary"
        isLoading={isLoading}
        onClick={() => {
          sendWhatsapp("confirmacao_pedido");
          sendEmail("confirmacao_pedido");
        }}
      />

      <CustomButton
        label="Enviar comprovante"
        size="small"
        variant="secondary"
        isLoading={isLoading}
        onClick={() => {
          sendWhatsapp("pagamento_aprovado");
          sendEmail("pagamento_aprovado");
        }}
      />

      <CustomButton
        label="Enviar atualização de entrega"
        size="small"
        variant="secondary"
        isLoading={isLoading}
        onClick={() => {
          sendWhatsapp("pedido_enviado");
          sendEmail("pedido_enviado");
        }}
      />
    </div>
  );
}
