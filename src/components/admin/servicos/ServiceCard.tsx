"use client";

import React, { useEffect, useMemo, useState } from "react";
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

/** 📱 Formata telefone BR para exibição */
function formatWhatsApp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    // (DD) 9 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits || raw;
}

export default function ServiceCard({
  servico,
  onEditar,
  onRemover,
  confirmText = "Tem certeza que deseja remover este serviço?",
  readOnly = false,
  className = "",
}: Props) {
  // ✅ Hooks SEMPRE no topo (não pode ter return antes)
  const [removing, setRemoving] = useState(false);

  // ✅ Cria lista de imagens (capa + extras) sem duplicadas
  const images = useMemo(() => {
    if (!servico) return [];

    const extras: string[] = Array.isArray(servico.images)
      ? (servico.images as unknown as string[])
      : [];

    const all = [servico.imagem, ...extras].filter(Boolean) as string[];
    const unique = Array.from(new Set(all));
    return unique.map(absUrl).filter(Boolean) as string[];
  }, [servico?.imagem, servico?.images]);

  // 👁️ Estado para imagem principal exibida
  const [activeImg, setActiveImg] = useState<string>(PLACEHOLDER);

  // ✅ Mantém a imagem ativa sincronizada quando mudar o serviço/imagens
  useEffect(() => {
    setActiveImg(images[0] || PLACEHOLDER);
  }, [images]);

  // ✅ Só agora pode retornar (depois dos hooks)
  if (!servico) return null;

  const waDigits = (servico.whatsapp || "").replace(/\D/g, "");
  const waLabel = formatWhatsApp(servico.whatsapp || "");

  async function handleRemove() {
    if (!onRemover || readOnly || !servico) return;
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
      className={`flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg ${className}`}
      aria-labelledby={`serv-${servico.id}-title`}
    >
      {/* ===== TOPO COM IMAGEM + SELOS ===== */}
      <div className="relative w-full bg-gray-100 pb-[55%]">
        <img
          src={activeImg}
          alt={servico.nome || "Imagem do serviço"}
          className="absolute inset-0 h-full w-full object-cover transition-all duration-300"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
          loading="lazy"
        />

        {/* Gradiente no rodapé para dar leitura se tiver texto em cima no futuro */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Selo de verificado */}
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
          <span>✓</span>
          <span>Profissional verificado</span>
        </div>

        {/* Contador de fotos */}
        {images.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {images.length} foto(s)
          </span>
        )}
      </div>

      {/* ===== CONTEÚDO ===== */}
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        {/* Nome + tag de especialidade */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            id={`serv-${servico.id}-title`}
            className="line-clamp-1 text-base font-semibold text-gray-900 sm:text-lg"
            title={servico.nome || undefined}
          >
            {servico.nome}
          </h3>

          {servico.especialidade_nome && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
              {servico.especialidade_nome}
            </span>
          )}
        </div>

        {/* Cargo */}
        {servico.cargo && (
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-800">Cargo: </span>
            <span className="line-clamp-1">{servico.cargo}</span>
          </p>
        )}

        {/* Descrição */}
        {servico.descricao && (
          <p
            className="mt-1 line-clamp-3 text-sm leading-relaxed text-gray-600"
            title={servico.descricao || undefined}
          >
            {servico.descricao}
          </p>
        )}

        {/* ===== MINIATURAS ===== */}
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActiveImg(src)}
                className={`flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  activeImg === src ? "border-[#2F7E7F] shadow-sm" : "border-transparent hover:border-gray-300"
                }`}
              >
                <img
                  src={src}
                  alt={`Miniatura ${i + 1}`}
                  className="h-12 w-12 object-cover sm:h-14 sm:w-14"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {/* ===== CONTATO ===== */}
        {waDigits && (
          <a
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#2F7E7F]/5 px-3 py-1.5 text-xs font-medium text-[#2F7E7F] ring-1 ring-[#2F7E7F]/20 transition hover:bg-[#2F7E7F]/10"
          >
            <span className="text-base">📱</span>
            <span>WhatsApp: {waLabel}</span>
          </a>
        )}

        {/* ===== AÇÕES ===== */}
        {!readOnly && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onEditar?.(servico)}
              disabled={readOnly}
              className="rounded-full bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-900 transition hover:bg-gray-200 disabled:opacity-50"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={readOnly || removing}
              className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              {removing ? "Removendo..." : "Remover"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}