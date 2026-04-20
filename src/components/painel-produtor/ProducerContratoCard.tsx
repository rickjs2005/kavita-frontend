// src/components/painel-produtor/ProducerContratoCard.tsx
//
// Card de contrato do painel do produtor. Tema claro (stone-50 base),
// contrastante com o painel da corretora que é dark.
//
// Status → cor:
//   draft      → cinza ("preparando com a corretora")
//   sent       → âmbar ("aguardando sua assinatura" — CTA principal)
//   signed     → verde esmeralda ("baixar PDF assinado" + certificado)
//   cancelled  → cinza suave (com motivo)
//   expired    → vermelho ("prazo vencido")

"use client";

import Image from "next/image";
import { API_BASE, absUrl } from "@/utils/absUrl";
import type { ProducerContrato } from "@/types/contrato";
import { CONTRATO_TIPO_LABEL } from "@/types/contrato";

type Props = { contrato: ProducerContrato };

const STATUS_STYLE: Record<
  ProducerContrato["status"],
  {
    label: string;
    chipBg: string;
    chipText: string;
    ring: string;
    description: string;
  }
> = {
  draft: {
    label: "Preparando",
    chipBg: "bg-stone-100",
    chipText: "text-stone-700",
    ring: "ring-stone-200",
    description: "A corretora está preparando este contrato.",
  },
  sent: {
    label: "Aguardando sua assinatura",
    chipBg: "bg-amber-100",
    chipText: "text-amber-800",
    ring: "ring-amber-300",
    description:
      "Você deve ter recebido um e-mail da ClickSign com o link de assinatura.",
  },
  signed: {
    label: "Assinado",
    chipBg: "bg-emerald-100",
    chipText: "text-emerald-800",
    ring: "ring-emerald-300",
    description: "Contrato concluído — você pode baixar a via assinada.",
  },
  cancelled: {
    label: "Cancelado",
    chipBg: "bg-stone-100",
    chipText: "text-stone-600",
    ring: "ring-stone-200",
    description: "Este contrato foi cancelado antes da conclusão.",
  },
  expired: {
    label: "Prazo expirado",
    chipBg: "bg-red-100",
    chipText: "text-red-700",
    ring: "ring-red-200",
    description: "O prazo de assinatura foi ultrapassado.",
  },
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

export function ProducerContratoCard({ contrato }: Props) {
  const style = STATUS_STYLE[contrato.status];
  const shortHash = `${contrato.hash_sha256.slice(0, 10)}…${contrato.hash_sha256.slice(-6)}`;
  const signedPdfUrl = `${API_BASE}/api/produtor/contratos/${contrato.id}/pdf?variant=signed`;
  const draftPdfUrl = `${API_BASE}/api/produtor/contratos/${contrato.id}/pdf?variant=draft`;

  return (
    <article
      className={`relative rounded-2xl bg-white shadow-sm shadow-stone-900/[0.04] ring-1 ${style.ring} p-5 md:p-6 transition-shadow hover:shadow-md`}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {contrato.corretora.logo_path ? (
            <Image
              src={absUrl(contrato.corretora.logo_path)}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-cover ring-1 ring-stone-200"
            />
          ) : (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 font-bold text-white shadow-sm"
              aria-hidden
            >
              {contrato.corretora.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {CONTRATO_TIPO_LABEL[contrato.tipo]}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-stone-900 truncate">
              {contrato.corretora.name}
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.chipBg} ${style.chipText}`}
        >
          {style.label}
        </span>
      </header>

      <p className="mt-3 text-sm text-stone-600">{style.description}</p>

      {/* Resumo do negócio */}
      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 border-t border-stone-100 pt-4">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-stone-500">
            Safra
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-stone-900">
            {contrato.resumo.safra ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-stone-500">
            Quantidade
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-stone-900">
            {contrato.resumo.quantidade_sacas != null
              ? `${contrato.resumo.quantidade_sacas} sacas`
              : "—"}
          </dd>
        </div>
        <div className="col-span-2 md:col-span-1">
          <dt className="text-[10px] uppercase tracking-wider text-stone-500">
            {contrato.status === "signed" ? "Assinado em" : "Criado em"}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-stone-900">
            {fmtDate(
              contrato.status === "signed"
                ? contrato.signed_at
                : contrato.created_at,
            )}
          </dd>
        </div>
      </dl>

      {contrato.status === "cancelled" && contrato.cancel_reason && (
        <p className="mt-3 text-xs italic text-stone-600 border-l-2 border-stone-300 pl-3">
          Motivo: {contrato.cancel_reason}
        </p>
      )}

      {/* Ações */}
      <div className="mt-5 flex flex-wrap gap-2">
        {contrato.status === "sent" && (
          <a
            href="https://mail.google.com/mail/u/0/#search/clicksign"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-600/20 hover:from-amber-400 hover:to-amber-500"
            title="A ClickSign enviou o link de assinatura por e-mail. Procure por 'ClickSign' na sua caixa de entrada."
          >
            Abrir e-mail de assinatura →
          </a>
        )}
        {contrato.status === "signed" && contrato.has_signed_pdf && (
          <a
            href={signedPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 hover:from-emerald-400 hover:to-emerald-500"
          >
            Baixar PDF assinado
          </a>
        )}
        {(contrato.status === "sent" ||
          (contrato.status === "signed" && !contrato.has_signed_pdf)) && (
          <a
            href={draftPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
          >
            Baixar rascunho
          </a>
        )}
        <a
          href={`/verificar/${contrato.qr_verification_token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-transparent px-3 py-2 text-sm font-semibold text-stone-500 hover:text-amber-700 hover:bg-stone-50"
        >
          Ver certificado →
        </a>
      </div>

      {/* Hash — discreto */}
      <div className="mt-3 pt-3 border-t border-stone-100">
        <span
          className="text-[10px] text-stone-400 font-mono"
          title={contrato.hash_sha256}
        >
          SHA-256 · {shortHash}
        </span>
      </div>
    </article>
  );
}
