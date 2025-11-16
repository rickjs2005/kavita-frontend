// src/components/admin/servicos/ServiceCard.tsx
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
    const extras: string[] = Array.isArray(servico.images) ? (servico.images as unknown as string[]) : [];
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
      className={`bg-white rounded-xl shadow-sm ring-1 ring-black/5 overflow-hidden flex flex-col ${className}`}
      aria-labelledby={`serv-${servico.id}-title`}
    >
      {/* ===== IMAGEM PRINCIPAL ===== */}
      <div className="relative">
        <img
          src={activeImg}
          alt={servico.nome || "Imagem do serviço"}
          className="w-full h-44 object-cover bg-gray-50 transition-all duration-200"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
          loading="lazy"
        />
        {images.length > 1 && (
          <span className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
            {images.length} foto(s)
          </span>
        )}
      </div>

      {/* ===== CONTEÚDO ===== */}
      <div className="p-4 flex flex-col gap-2">
        <h3
          id={`serv-${servico.id}-title`}
          className="text-base font-semibold text-gray-900 line-clamp-1"
          title={servico.nome || undefined}
        >
          {servico.nome}
        </h3>

        {servico.cargo && (
          <p className="text-sm text-gray-600 line-clamp-1">
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
            className="text-sm text-gray-600 line-clamp-2"
            title={servico.descricao || undefined}
          >
            {servico.descricao}
          </p>
        )}

        {/* ===== MINIATURAS ===== */}
        {images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`Miniatura ${i + 1}`}
                onClick={() => setActiveImg(src)} // 🖱️ ao clicar muda a imagem principal
                className={`w-12 h-12 rounded object-cover ring-2 ${
                  activeImg === src
                    ? "ring-blue-500"
                    : "ring-transparent hover:ring-gray-300"
                } cursor-pointer flex-shrink-0 transition-all`}
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)
                }
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* ===== CONTATO ===== */}
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 text-sm hover:underline mt-1"
          >
            WhatsApp: {wa}
          </a>
        )}

        {/* ===== AÇÕES ===== */}
        <div className="mt-3 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => onEditar?.(servico)}
            disabled={readOnly}
            className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={readOnly || removing}
            className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {removing ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </article>
  );
}
