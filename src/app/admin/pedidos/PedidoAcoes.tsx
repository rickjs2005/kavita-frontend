"use client";

import axios from "axios";
import toast from "react-hot-toast";
import CustomButton from "@/components/buttons/CustomButton";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PedidoAcoesProps = {
  pedidoId: number;
};

export default function PedidoAcoes({ pedidoId }: PedidoAcoesProps) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const [isLoading, setIsLoading] = useState(false);

  const sendEmail = async (template: string) => {
    try {
      setIsLoading(true);
      await axios.post(
        `${API_BASE}/api/admin/comunicacao/email`,
        { template, pedidoId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        }
      );
      toast.success("E-mail enviado/registrado com sucesso.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message || "Erro ao enviar e-mail de comunicação.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendWhatsapp = async (template: string) => {
    try {
      setIsLoading(true);
      await axios.post(
        `${API_BASE}/api/admin/comunicacao/whatsapp`,
        { template, pedidoId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        }
      );
      toast.success("WhatsApp enviado/registrado com sucesso.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Erro ao enviar mensagem de WhatsApp.";
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
