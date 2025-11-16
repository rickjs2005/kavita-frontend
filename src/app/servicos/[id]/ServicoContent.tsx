"use client";

import { useMemo, useState } from "react";
import absUrl from "@/data/absUrl";
import type { Service } from "@/types/service";

const PLACEHOLDER = "/placeholder.png";

/* ---------- helpers de parsing ---------- */
function parseMaybeJson(x: unknown): any {
  if (typeof x !== "string") return x;
  try {
    return JSON.parse(x);
  } catch {
    return x;
  }
}

function coerceImages(imagem?: unknown, images?: unknown): string[] {
  // capa única
  const cap = imagem ? [String(imagem)] : [];

  // images pode ser:
  // - array de strings
  // - string JSON '["a","b"]'
  // - string com vírgulas 'a,b,c'
  let extras: string[] = [];
  const parsed = parseMaybeJson(images);

  if (Array.isArray(parsed)) {
    extras = parsed.filter(Boolean).map(String);
  } else if (typeof parsed === "string") {
    // tenta split por vírgulas
    extras = parsed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const all = [...cap, ...extras]
    .map((s) => absUrl(s))
    .filter(Boolean) as string[];

  // remove duplicados e retorna
  return Array.from(new Set(all));
}

const onlyDigits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

export default function ServicoContent({ servico }: { servico: Service }) {
  const titulo = servico.nome || "Serviço";

  const imagens = useMemo(
    () => {
      const arr = coerceImages(servico.imagem as any, servico.images as any);
      return arr.length ? arr : [PLACEHOLDER];
    },
    [servico.imagem, servico.images]
  );

  const [idx, setIdx] = useState(0);
  const atual = imagens[Math.min(idx, imagens.length - 1)];

  const whatsappHref = useMemo(() => {
    const phone = onlyDigits(servico.whatsapp);
    if (!phone) return undefined;
    const text = `Olá! Tenho interesse no serviço: ${titulo} (ID ${servico.id}).`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [servico.whatsapp, servico.id, titulo]);

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      {/* Imagem principal + thumbs */}
      <div className="w-full flex flex-col items-center gap-4">
        {/* Usamos <img> para fallback 100% garantido via onError */}
        <img
          key={atual}
          src={atual}
          alt={titulo}
          className="rounded shadow object-contain max-h-[420px] w-full bg-gray-50"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
          }}
        />

        {imagens.length > 1 && (
          <div className="flex gap-3 overflow-x-auto justify-center w-full">
            {imagens.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => setIdx(i)}
                aria-label={`Ver imagem ${i + 1}`}
                className={`rounded border-2 overflow-hidden transition ${
                  i === idx ? "border-gray-900" : "border-transparent hover:border-gray-300"
                }`}
              >
                <img
                  src={src}
                  alt={`thumb-${i + 1}`}
                  className="rounded object-cover w-22 h-22"
                  width={88}
                  height={88}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Texto */}
      <div className="flex flex-col justify-between h-full">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-800">{titulo}</h1>

          <div className="text-sm text-gray-600 space-y-1">
            {servico.especialidade_nome && (
              <p>
                Especialidade: <b>{servico.especialidade_nome}</b>
              </p>
            )}
            {servico.cargo && (
              <p>
                Cargo: <b>{servico.cargo}</b>
              </p>
            )}
            {servico.whatsapp && (
              <p>
                WhatsApp: <b>{servico.whatsapp}</b>
              </p>
            )}
          </div>

          <p className="text-gray-700">
            {servico.descricao?.trim() || "Sem descrição disponível."}
          </p>
        </div>

        <div className="mt-6">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              className="inline-flex items-center justify-center px-5 py-3 rounded bg-[#2F7E7F] text-white hover:bg-[#277273] transition"
            >
              Falar no WhatsApp
            </a>
          ) : (
            <a
              href={`/contatos?servico=${encodeURIComponent(titulo)}&id=${servico.id}`}
              className="inline-flex items-center justify-center px-5 py-3 rounded bg-[#2F7E7F] text-white hover:bg-[#277273] transition"
            >
              Solicitar orçamento
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
