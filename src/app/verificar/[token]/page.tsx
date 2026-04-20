// src/app/verificar/[token]/page.tsx
//
// RSC da página pública de verificação de contrato. Busca server-side
// (sem cookies) e renderiza o "certificado" digital. É a página que
// o QR Code impresso no rodapé do PDF aponta — é a nossa prova de
// autenticidade visível ao banco / trading / parceiro.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchContratoPublico } from "@/server/data/verificarContrato";
import { CertificadoView } from "@/components/verificar/CertificadoView";
import { CertificadoNotFound } from "@/components/verificar/CertificadoNotFound";

type PageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Verificação de Contrato · Kavita",
  description:
    "Verificação de autenticidade de contrato gerado na plataforma Kavita — Mercado do Café.",
  robots: { index: false, follow: false },
};

export default async function VerificarContratoPage({ params }: PageProps) {
  const { token } = await params;
  if (!token) notFound();

  const contrato = await fetchContratoPublico(token);
  if (!contrato) {
    return <CertificadoNotFound />;
  }

  return <CertificadoView contrato={contrato} />;
}
