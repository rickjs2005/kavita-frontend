"use client";

import React, { useMemo, useState } from "react";
import { Service } from "@/types/service";

type Props = {
  servico?: Service | null;
  onEditar?: (p: Service) => void;
  onRemover?: (id: number) => Promise<void> | void;
  confirmText?: string;
  readOnly?: boolean;
  className?: string;
};

const PLACEHOLDER = "/placeholder.png";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** 🔗 Gera URL absoluta para imagem (caso backend envie caminho relativo) */
function absUrl(p?: string | null) {
  if (!p) return null;
  const v = String(p).trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `${API_BASE}${v.startsWith("/") ? v : `/${v}`}`;
}

export default function ServiceCard({
  servico,
  onEditar,
  onRemover,
  confirmText = "Tem certeza que deseja remover este serviço?",
  readOnly = false,
  className = "",
}: Props) {
  if (!servico) return null;

  const [removing, setRemoving] = useState(false);

  // ✅ Cria lista de imagens (capa + extras) sem duplicadas
  const images = useMemo(() => {
    const extras: string[] = Array.isArray(servico.images)
      ? (servico.images as unknown as string[])
      : [];
    const all = [servico.imagem, ...extras].filter(Boolean) as string[];
    const unique = Array.from(new Set(all));
    return unique.map(absUrl).filter(Boolean) as string[];
  }, [servico.imagem, servico.images]);

  // 👁️ Estado para imagem principal exibida
  const [activeImg, setActiveImg] = useState<string>(
    images[0] || PLACEHOLDER
  );

  const wa = (servico.whatsapp || "").replace(/\D/g, "");

  async function handleRemove() {
    if (!onRemover || readOnly) return;
    if (!servico) return;
    if (!window.confirm(confirmText)) return;
    try {
      setRemoving(true);
      await onRemover(servico.id);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}
      aria-labelledby={`serv-${servico.id}-title`}
    >
      {/* ===== IMAGEM PRINCIPAL com ratio fixo ===== */}
      <div className="relative w-full bg-gray-50 pb-[60%]">
        <img
          src={activeImg}
          alt={servico.nome || "Imagem do serviço"}
          className="absolute inset-0 h-full w-full object-cover transition-all duration-200"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)
          }
          loading="lazy"
        />
        {images.length > 1 && (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {images.length} foto(s)
          </span>
        )}
      </div>

      {/* ===== CONTEÚDO ===== */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          id={`serv-${servico.id}-title`}
          className="line-clamp-1 text-base font-semibold text-gray-900"
          title={servico.nome || undefined}
        >
          {servico.nome}
        </h3>

        {servico.cargo && (
          <p className="line-clamp-1 text-sm text-gray-600">
            Cargo: {servico.cargo}
          </p>
        )}

        {servico.especialidade_nome && (
          <p className="text-sm text-gray-500">
            Especialidade: {servico.especialidade_nome}
          </p>
        )}

        {servico.descricao && (
          <p
            className="line-clamp-3 text-sm text-gray-600"
            title={servico.descricao || undefined}
          >
            {servico.descricao}
          </p>
        )}

        {/* ===== MINIATURAS ===== */}
        {images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActiveImg(src)}
                className={`flex-shrink-0 overflow-hidden rounded-lg ring-2 transition-all ${
                  activeImg === src
                    ? "ring-[#2F7E7F]"
                    : "ring-transparent hover:ring-gray-300"
                }`}
              >
                <img
                  src={src}
                  alt={`Miniatura ${i + 1}`}
                  className="h-12 w-12 object-cover"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)
                  }
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {/* ===== CONTATO ===== */}
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-[#2F7E7F] hover:underline"
          >
            <span>📱</span>
            <span>WhatsApp: {wa}</span>
          </a>
        )}

        {/* ===== AÇÕES ===== */}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEditar?.(servico)}
            disabled={readOnly}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-800 transition hover:bg-gray-200 disabled:opacity-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={readOnly || removing}
            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {removing ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </article>
  );
}
