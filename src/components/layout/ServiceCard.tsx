"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

type AnyService = Record<string, any>;

type Props = {
  service: AnyService;
  images?: string[];
  className?: string;
  hrefBase?: string;
  whatsPhone?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/placeholder.png";

function absUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const src = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API_BASE}${src}`;
  if (src.startsWith("uploads")) return `${API_BASE}/${src}`;
  if (!src.startsWith("/")) return `${API_BASE}/uploads/${src}`;
  return `${API_BASE}${src}`;
}

function pickTitle(s: AnyService): string {
  return s.name ?? s.nome ?? s.title ?? s.titulo ?? s.service_name ?? s.servico ?? "Serviço";
}
function pickDescription(s: AnyService): string {
  return s.description ?? s.descricao ?? s.desc ?? s.resumo ?? "";
}

export default function ServiceCard({
  service,
  images: externalImages,
  className = "",
  hrefBase = "/servicos",
  whatsPhone,
}: Props) {
  const title = pickTitle(service);
  const desc = pickDescription(service);
  const id = service.id ?? service.servico_id ?? service.service_id ?? service.slug ?? "";

  const images = useMemo(() => {
    if (externalImages?.length) {
      const norm = externalImages.map(absUrl).filter(Boolean) as string[];
      return norm.length ? norm : [PLACEHOLDER];
    }
    const extras: string[] = Array.isArray(service.images) ? (service.images as string[]) : [];
    const all = [service.image, service.imagem, service.capa, ...extras].filter(Boolean) as string[];
    const uniq = Array.from(new Set(all)).map(absUrl).filter(Boolean) as string[];
    return uniq.length ? uniq : [PLACEHOLDER];
  }, [externalImages, service]);

  const cover = images[0] ?? PLACEHOLDER;
  const detailsHref = `${hrefBase}/${id}`;
  const whatsHref = whatsPhone
    ? `https://wa.me/${whatsPhone}?text=${encodeURIComponent(
        `Olá! Quero contratar o serviço: ${title} (ID ${id}).`
      )}`
    : null;

  return (
    <article
      className={`bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-3 sm:p-4 flex flex-col hover:shadow-md transition ${className}`}
    >
      <Link
        href={detailsHref}
        aria-label={`Ver detalhes de ${title}`}
        prefetch={false}
        className="relative block w-full h-40 sm:h-48 md:h-56 bg-gray-50 rounded-lg overflow-hidden"
      >
        <Image
          src={cover}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </Link>

      <div className="mt-3 flex-1 flex flex-col">
        <Link
          href={detailsHref}
          prefetch={false}
          className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 hover:underline"
          title={title}
        >
          {title}
        </Link>

        {desc && (
          <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2" title={desc}>
            {desc}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            href={detailsHref}
            prefetch={false}
            className="inline-flex items-center justify-center rounded-lg bg-[#2F7E7F] text-white px-3 py-2 text-sm font-semibold hover:bg-[#2a6f70] active:bg-[#245f60]"
          >
            Ver detalhes
          </Link>

          {whatsHref && (
            <a
              href={whatsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Contratar via WhatsApp"
            >
              Contratar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
