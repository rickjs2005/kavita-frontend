"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type ParadaCompleta,
  type ProblemaTipo,
  parseEnderecoPedido,
  formatEnderecoOneLine,
  formatBRL,
} from "@/lib/rotas/types";
import { formatDateTime } from "@/utils/formatters";
import { absUrl } from "@/utils/absUrl";
import { ParadaStatusBadge } from "./StatusBadge";

const PROBLEMA_LABEL: Record<ProblemaTipo, string> = {
  endereco_incorreto: "Endereço incorreto",
  cliente_ausente: "Cliente ausente",
  estrada_intransitavel: "Estrada intransitável",
  pagamento_pendente_na_entrega: "Pagamento pendente",
  produto_avariado: "Produto avariado",
  outro_motivo: "Outro motivo",
};

type Props = {
  parada: ParadaCompleta;
  index: number; // posicao visual (1-based)
  draggable: boolean;
  onRemove?: () => void;
};

/**
 * Linha de parada para o detalhe da rota. Drag-drop habilitado quando
 * draggable=true (rota em rascunho/pronta). Em em_rota/finalizada/
 * cancelada, exibe o handle desabilitado.
 */
export default function SortableParadaRow({
  parada,
  index,
  draggable,
  onRemove,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: parada.id,
    disabled: !draggable,
  });

  const endereco = parseEnderecoPedido(parada.pedido_endereco);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl bg-dark-800 ring-1 ring-white/10 p-3 ${
        isDragging ? "ring-primary/60 shadow-2xl" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {/* Drag handle */}
          {draggable ? (
            <button
              type="button"
              aria-label={`Arraste para reordenar parada ${index}`}
              className="shrink-0 p-1 -ml-1 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing touch-none"
              {...listeners}
              {...attributes}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <circle cx="6" cy="5" r="1.6" />
                <circle cx="6" cy="10" r="1.6" />
                <circle cx="6" cy="15" r="1.6" />
                <circle cx="14" cy="5" r="1.6" />
                <circle cx="14" cy="10" r="1.6" />
                <circle cx="14" cy="15" r="1.6" />
              </svg>
            </button>
          ) : (
            <span className="shrink-0 p-1 -ml-1 text-gray-700" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="6" cy="5" r="1.6" />
                <circle cx="6" cy="10" r="1.6" />
                <circle cx="6" cy="15" r="1.6" />
                <circle cx="14" cy="5" r="1.6" />
                <circle cx="14" cy="10" r="1.6" />
                <circle cx="14" cy="15" r="1.6" />
              </svg>
            </span>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block text-xs px-2 py-0.5 bg-primary text-white rounded-full font-bold">
                {index}
              </span>
              <span className="text-white text-sm font-semibold">
                Pedido #{parada.pedido_id} · {parada.usuario_nome || "Sem nome"}
              </span>
              <ParadaStatusBadge status={parada.status} />
              {parada.pedido_total && (
                <span className="text-[11px] text-gray-400 font-mono">
                  {formatBRL(parada.pedido_total)}
                </span>
              )}
              {parada.pedido_forma_pagamento && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">
                  💳 {parada.pedido_forma_pagamento}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              📍 {formatEnderecoOneLine(endereco)}
            </p>
            {parada.usuario_telefone && (
              <p className="text-xs text-gray-500">📞 {parada.usuario_telefone}</p>
            )}
            {parada.pedido_observacao_entrega && (
              <p className="text-[11px] text-amber-300 italic mt-1 bg-amber-500/5 ring-1 ring-amber-500/15 rounded px-2 py-1">
                Cliente: “{parada.pedido_observacao_entrega}”
              </p>
            )}
            {parada.entregue_em && (
              <p className="text-[11px] text-emerald-400 mt-0.5">
                ✓ Entregue em {formatDateTime(parada.entregue_em)}
              </p>
            )}
            {parada.observacao_motorista && (
              <p className="text-[11px] text-gray-400 italic mt-1">
                Motorista: “{parada.observacao_motorista}”
              </p>
            )}

            {/* Ocorrência (Fase 1+5: parada.status='problema' carrega tipo
                + motivo + observacao via JOIN com pedido_ocorrencias) */}
            {parada.ocorrencia_id && (
              <div className="mt-2 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30 px-3 py-2 space-y-0.5">
                <p className="text-[11px] text-rose-200 font-semibold">
                  ⚠ Ocorrência #{parada.ocorrencia_id}
                  {parada.ocorrencia_tipo
                    ? ` · ${PROBLEMA_LABEL[parada.ocorrencia_tipo] || parada.ocorrencia_tipo}`
                    : ""}
                </p>
                {parada.ocorrencia_motivo && (
                  <p className="text-[11px] text-rose-100">{parada.ocorrencia_motivo}</p>
                )}
                {parada.ocorrencia_observacao && (
                  <p className="text-[11px] text-rose-100/80 italic">
                    “{parada.ocorrencia_observacao}”
                  </p>
                )}
              </div>
            )}

            {/* Comprovantes (Fase 5) — foto + assinatura */}
            {(parada.comprovante_foto_url || parada.assinatura_url) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {parada.comprovante_foto_url && (
                  <a
                    href={absUrl(parada.comprovante_foto_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] px-2 py-1 rounded bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    📷 Ver foto
                  </a>
                )}
                {parada.assinatura_url && (
                  <a
                    href={absUrl(parada.assinatura_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] px-2 py-1 rounded bg-emerald-500/10 ring-1 ring-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    ✍ Ver assinatura
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        {draggable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="self-start text-xs px-2 py-1 rounded border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
