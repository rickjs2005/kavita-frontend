"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";

export type ComprovanteResult = {
  observacao: string | null;
  fotoFile: File | null;
  assinaturaBase64: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Callback quando motorista confirma. Receber o que tiver (todos opcionais). */
  onConfirm: (data: ComprovanteResult) => Promise<void> | void;
  busy?: boolean;
};

/**
 * Bottom sheet mobile-first pra captura de comprovante de entrega.
 * Tres campos OPCIONAIS: foto (camera), assinatura (canvas), observacao.
 *
 * Motorista pode "Pular comprovante" pra confirmar entrega sem nada.
 * Foto+assinatura fluem via POST /paradas/:id/comprovante.
 * A entrega em si e' confirmada pelo caller (POST /entregue separado).
 */
export default function ComprovanteSheet({
  open,
  onClose,
  onConfirm,
  busy = false,
}: Props) {
  const [observacao, setObservacao] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const sigRef = useRef<SignaturePadHandle>(null);

  // Reset toda vez que abrir
  useEffect(() => {
    if (open) {
      setObservacao("");
      setFotoFile(null);
      setFotoPreview(null);
      // Limpa canvas no proximo tick (ref ja existe ao montar)
      setTimeout(() => sigRef.current?.clear(), 0);
    }
  }, [open]);

  // Cleanup do object URL ao trocar foto
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  if (!open) return null;

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(f);
    setFotoPreview(f ? URL.createObjectURL(f) : null);
  }

  async function confirmar(skipComprovante: boolean) {
    const dataUrl = skipComprovante ? null : sigRef.current?.toDataURL() ?? null;
    await onConfirm({
      observacao: observacao.trim() || null,
      fotoFile: skipComprovante ? null : fotoFile,
      assinaturaBase64: dataUrl,
    });
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comprovante-title"
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
      onClick={() => !busy && onClose()}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) onClose();
      }}
      tabIndex={-1}
    >
      {/* section como container do dialog content. Click/key stopPropagation
          evita fechar ao interagir com inputs internos. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <section
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-stone-900 rounded-t-2xl sm:rounded-2xl p-4 space-y-3 max-h-[92vh] overflow-y-auto"
      >
        <h3 id="comprovante-title" className="text-base font-semibold">
          Comprovante de entrega
        </h3>
        <p className="text-[11px] text-stone-400">
          Tudo opcional — pode pular se preferir.
        </p>

        {/* Foto */}
        <div>
          <label
            htmlFor="comprovante-foto"
            className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1"
          >
            📷 Foto do recebimento
          </label>
          <input
            id="comprovante-foto"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFoto}
            disabled={busy}
            className="block w-full text-xs text-stone-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-400 file:text-stone-950 file:font-semibold"
          />
          {fotoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPreview}
              alt="Pré-visualização da foto"
              className="mt-2 max-h-40 rounded-lg border border-white/10"
            />
          )}
        </div>

        {/* Assinatura */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              ✍️ Assinatura do recebedor
            </span>
            <button
              type="button"
              onClick={() => sigRef.current?.clear()}
              disabled={busy}
              className="text-[11px] text-amber-300 underline hover:text-amber-200 disabled:opacity-50"
            >
              Limpar
            </button>
          </div>
          <SignaturePad ref={sigRef} height={140} />
        </div>

        {/* Observacao */}
        <div>
          <label
            htmlFor="comprovante-obs"
            className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1"
          >
            📝 Observação (opcional)
          </label>
          <textarea
            id="comprovante-obs"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            disabled={busy}
            rows={2}
            placeholder="Ex: deixei com vizinho, recebido pela esposa…"
            className="w-full rounded-lg bg-stone-800 border border-white/10 px-3 py-2 text-stone-100 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => confirmar(false)}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-emerald-500 text-stone-950 font-bold uppercase tracking-wider text-sm disabled:opacity-60"
          >
            {busy ? "Enviando…" : "✅ Confirmar entrega"}
          </button>
          <button
            type="button"
            onClick={() => confirmar(true)}
            disabled={busy}
            className="w-full py-2 rounded-xl border border-white/10 text-stone-300 text-xs hover:bg-white/5 disabled:opacity-60"
          >
            Pular comprovante e só confirmar
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full py-2 text-stone-500 text-xs hover:text-stone-300 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </section>
    </div>
  );
}
