"use client";

import { useEffect, useMemo, useState } from "react";
import { absUrl } from "@/utils/absUrl";
import type { Service } from "@/types/service";
import { toast } from "react-hot-toast";

const PLACEHOLDER = "/placeholder.png";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function parseMaybeJson(x: unknown): any {
  if (typeof x !== "string") return x;
  try {
    return JSON.parse(x);
  } catch {
    return x;
  }
}

function coerceImages(imagem?: unknown, images?: unknown): string[] {
  const capa = imagem ? [String(imagem)] : [];

  let extras: string[] = [];
  const parsed = parseMaybeJson(images);

  if (Array.isArray(parsed)) {
    extras = parsed.filter(Boolean).map(String);
  } else if (typeof parsed === "string") {
    extras = parsed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const all = [...capa, ...extras]
    .map((s) => absUrl(s))
    .filter(Boolean) as string[];

  return Array.from(new Set(all));
}

const onlyDigits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

export default function ServicoContent({ servico }: { servico: Service }) {
  const titulo = servico.nome || "Serviço";

  const imagens = useMemo(() => {
    const arr = coerceImages(servico.imagem as any, servico.images as any);
    return arr.length ? arr : [PLACEHOLDER];
  }, [servico.imagem, servico.images]);

  const [idx, setIdx] = useState(0);
  const atual = imagens[Math.min(idx, imagens.length - 1)];

  const whatsappHref = useMemo(() => {
    const phone = onlyDigits(servico.whatsapp);
    if (!phone) return undefined;

    const text = `Olá! Encontrei seu serviço na Kavita e gostaria de saber mais.\nServiço: ${titulo}\nCódigo: ${servico.id}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [servico.whatsapp, servico.id, titulo]);

  const ratingAvg = (servico as any).rating_avg as number | null | undefined;
  const ratingCount = (servico as any).rating_count as number | null | undefined;

  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState("");
  const [sendingRating, setSendingRating] = useState(false);

  const [nomeContato, setNomeContato] = useState("");
  const [whatsContato, setWhatsContato] = useState("");
  const [descPedido, setDescPedido] = useState("");
  const [sendingLead, setSendingLead] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/public/servicos/${servico.id}/view`, {
      method: "POST",
    }).catch(() => {});
  }, [servico.id]);

  const handleWhatsAppClick = () => {
    if (!whatsappHref) return;
    fetch(`${API}/api/public/servicos/${servico.id}/whatsapp-click`, {
      method: "POST",
    }).catch(() => {});
    window.open(whatsappHref, "_blank");
  };

  async function enviarAvaliacao() {
    if (!nota || nota < 1 || nota > 5) {
      toast.error("Selecione uma nota válida entre 1 e 5.");
      return;
    }

    setSendingRating(true);
    try {
      await fetch(`${API}/api/public/servicos/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaborador_id: servico.id,
          nota,
          comentario,
        }),
      });
      toast.success("Obrigado pela avaliação!");
      setComentario("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar avaliação, tente novamente.");
    } finally {
      setSendingRating(false);
    }
  }

  async function enviarSolicitacao() {
    if (!nomeContato || !whatsContato || !descPedido) {
      toast.error("Preencha nome, WhatsApp e descrição.");
      return;
    }
    setSendingLead(true);
    try {
      await fetch(`${API}/api/public/servicos/solicitacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaborador_id: servico.id,
          nome_contato: nomeContato,
          whatsapp: whatsContato,
          descricao: descPedido,
          origem: "pagina_servico",
        }),
      });
      toast.success("Pedido enviado! O profissional irá entrar em contato.");
      setNomeContato("");
      setWhatsContato("");
      setDescPedido("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar pedido, tente novamente.");
    } finally {
      setSendingLead(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      {/* CARD BRANCO PEGANDO TUDO (texto bem forte) */}
      <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
          {/* Coluna esquerda: imagens */}
          <div className="flex w-full flex-col items-center gap-4">
            <div className="w-full overflow-hidden rounded-2xl bg-gray-50 shadow-md">
              <img
                key={atual}
                src={atual}
                alt={titulo}
                className="h-auto max-h-[320px] w-full object-cover sm:max-h-[380px] lg:max-h-[420px]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                }}
              />
            </div>

            {imagens.length > 1 && (
              <div className="flex w-full justify-center gap-3 overflow-x-auto">
                {imagens.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    onClick={() => setIdx(i)}
                    aria-label={`Ver imagem ${i + 1}`}
                    className={`overflow-hidden rounded-xl border-2 transition ${
                      i === idx
                        ? "border-emerald-600"
                        : "border-transparent hover:border-emerald-200"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`thumb-${i + 1}`}
                      className="h-20 w-20 object-cover sm:h-22 sm:w-22"
                      width={88}
                      height={88}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          PLACEHOLDER;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna direita: texto, botões, forms */}
          <div className="flex h-full flex-col">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {titulo}
                </h1>

                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  ✓ Profissional verificado
                </span>
              </div>

              {/* nota média */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {typeof ratingAvg === "number" && (ratingCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    ⭐ {ratingAvg.toFixed(1)}{" "}
                    <span className="text-[11px] font-normal text-amber-800/80">
                      ({ratingCount} avaliação
                      {ratingCount && ratingCount > 1 ? "s" : ""})
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-600">
                    Ainda sem avaliações
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm text-slate-700">
                {servico.especialidade_nome && (
                  <p>
                    <span className="font-semibold text-slate-900">
                      Especialidade:
                    </span>{" "}
                    {servico.especialidade_nome}
                  </p>
                )}
                {servico.cargo && (
                  <p>
                    <span className="font-semibold text-slate-900">
                      Cargo:
                    </span>{" "}
                    {servico.cargo}
                  </p>
                )}
                {servico.whatsapp && (
                  <p>
                    <span className="font-semibold text-slate-900">
                      WhatsApp:
                    </span>{" "}
                    {servico.whatsapp}
                  </p>
                )}
              </div>

              <p className="text-sm leading-relaxed text-slate-800 sm:text-base">
                {servico.descricao?.trim() || "Sem descrição disponível."}
              </p>
            </div>

            {/* ações + formulários */}
            <div className="mt-6 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                {whatsappHref ? (
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#2F7E7F] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#277273] sm:w-auto"
                  >
                    Falar no WhatsApp
                  </button>
                ) : (
                  <a
                    href={`/contatos?servico=${encodeURIComponent(
                      titulo
                    )}&id=${servico.id}`}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#2F7E7F] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#277273] sm:w-auto"
                  >
                    Solicitar orçamento
                  </a>
                )}
              </div>

              {/* avaliação */}
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Avalie este profissional
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-700">Nota:</span>
                  <select
                    value={nota}
                    onChange={(e) => setNota(Number(e.target.value))}
                    className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-800"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} estrela{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Deixe seu comentário (opcional)…"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={enviarAvaliacao}
                  disabled={sendingRating}
                  className="rounded-full bg-[#2F7E7F] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#277273] disabled:opacity-60"
                >
                  {sendingRating ? "Enviando..." : "Enviar avaliação"}
                </button>
              </div>

              {/* formulário de lead */}
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                  Pedir orçamento rápido
                </h2>
                <p className="text-xs text-slate-700">
                  Seus dados serão enviados diretamente para este profissional.
                </p>

                <input
                  className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="Seu nome"
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                />
                <input
                  className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  placeholder="Seu WhatsApp"
                  value={whatsContato}
                  onChange={(e) => setWhatsContato(e.target.value)}
                />
                <textarea
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
                  rows={3}
                  placeholder="Descreva o serviço que você precisa…"
                  value={descPedido}
                  onChange={(e) => setDescPedido(e.target.value)}
                />
                <button
                  type="button"
                  onClick={enviarSolicitacao}
                  disabled={sendingLead}
                  className="mt-1 w-full rounded-full bg-[#2F7E7F] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#277273] disabled:opacity-60"
                >
                  {sendingLead ? "Enviando..." : "Enviar pedido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
