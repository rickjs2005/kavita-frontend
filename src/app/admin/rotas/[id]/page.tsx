"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  type RotaCompleta,
  type RotaStatus,
  type MagicLinkResult,
  parseEnderecoPedido,
  formatEnderecoOneLine,
} from "@/lib/rotas/types";
import { RotaStatusBadge, ParadaStatusBadge } from "../_components/StatusBadge";

const NEXT_TRANSITIONS: Record<RotaStatus, Array<{ status: RotaStatus; label: string; danger?: boolean }>> = {
  rascunho: [
    { status: "pronta", label: "Marcar como pronta" },
    { status: "cancelada", label: "Cancelar", danger: true },
  ],
  pronta: [
    { status: "em_rota", label: "Iniciar rota (em rota)" },
    { status: "rascunho", label: "Voltar para rascunho" },
    { status: "cancelada", label: "Cancelar", danger: true },
  ],
  em_rota: [
    { status: "finalizada", label: "Finalizar rota" },
    { status: "pronta", label: "Pausar (volta para pronta)" },
    { status: "cancelada", label: "Cancelar", danger: true },
  ],
  finalizada: [],
  cancelada: [],
};

export default function RotaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [rota, setRota] = useState<RotaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [linkResult, setLinkResult] = useState<MagicLinkResult | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiClient.get<RotaCompleta>(`/api/admin/rotas/${id}`);
      setRota(data);
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao carregar rota.").message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function alterarStatus(novo: RotaStatus) {
    if (!rota) return;
    if (
      novo === "cancelada" &&
      !window.confirm("Cancelar a rota? Os pedidos voltam ao pool de disponíveis.")
    )
      return;
    setActing(true);
    try {
      await apiClient.patch(`/api/admin/rotas/${rota.id}/status`, {
        status: novo,
      });
      toast.success(`Rota → ${novo}`);
      load();
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao mudar status.").message);
    } finally {
      setActing(false);
    }
  }

  async function removerParada(pedidoId: number) {
    if (!rota) return;
    if (!window.confirm(`Remover pedido #${pedidoId} desta rota?`)) return;
    try {
      await apiClient.del(`/api/admin/rotas/${rota.id}/paradas/${pedidoId}`);
      toast.success("Pedido removido da rota.");
      load();
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao remover.").message);
    }
  }

  async function deletarRota() {
    if (!rota) return;
    if (!window.confirm("Deletar a rota em rascunho permanentemente?")) return;
    try {
      await apiClient.del(`/api/admin/rotas/${rota.id}`);
      toast.success("Rota deletada.");
      router.push("/admin/rotas");
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao deletar.").message);
    }
  }

  async function enviarLink() {
    if (!rota?.motorista_id) {
      toast.error("Atribua um motorista primeiro.");
      return;
    }
    try {
      const result = await apiClient.post<MagicLinkResult>(
        `/api/admin/motoristas/${rota.motorista_id}/enviar-link`,
        {},
      );
      setLinkResult(result);
      if (result.whatsapp.status === "manual_pending") {
        toast.success("Link gerado — abra no WhatsApp ou copie.");
      } else if (result.whatsapp.status === "sent") {
        toast.success("Link enviado por WhatsApp.");
      } else {
        toast.success("Link gerado.");
      }
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao gerar link.").message);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState message="Carregando rota…" />
      </div>
    );
  }

  if (!rota) {
    return (
      <div className="p-6 text-gray-300">Rota não encontrada.</div>
    );
  }

  const isReadOnly =
    rota.status === "em_rota" ||
    rota.status === "finalizada" ||
    rota.status === "cancelada";
  const transitions = NEXT_TRANSITIONS[rota.status] ?? [];

  return (
    <div className="p-6 space-y-4">
      <Link
        href="/admin/rotas"
        className="text-xs text-gray-400 hover:text-white"
      >
        ← Voltar para lista
      </Link>

      {/* Header */}
      <div className="rounded-xl bg-dark-800 ring-1 ring-white/10 p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Rota #{rota.id}
          </h1>
          <RotaStatusBadge status={rota.status} />
          <span className="text-xs text-gray-400">📅 {rota.data_programada}</span>
        </div>
        <div className="text-sm text-gray-300">
          {rota.regiao_label || "Sem região"}
          {rota.veiculo ? ` · 🚗 ${rota.veiculo}` : ""}
        </div>
        <div className="text-sm text-gray-300">
          🧑‍✈️{" "}
          {rota.motorista_nome ? (
            <>
              {rota.motorista_nome}
              {rota.motorista_telefone ? ` · ${rota.motorista_telefone}` : ""}
            </>
          ) : (
            <span className="text-gray-500">Sem motorista atribuído</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {rota.total_entregues}/{rota.total_paradas} entregas
          {rota.tempo_total_minutos != null
            ? ` · ⏱ ${Math.floor(rota.tempo_total_minutos / 60)}h${String(
                rota.tempo_total_minutos % 60,
              ).padStart(2, "0")}min`
            : ""}
          {rota.km_real
            ? ` · 🛣 ${rota.km_real} km`
            : rota.km_estimado
              ? ` · 🛣 ~${rota.km_estimado} km`
              : ""}
        </div>
        {rota.observacoes && (
          <p className="text-xs text-gray-400 italic mt-1">
            “{rota.observacoes}”
          </p>
        )}

        {isReadOnly && rota.status === "em_rota" && (
          <p className="text-[11px] text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/30 rounded px-2 py-1 inline-block">
            Edição bloqueada — rota em andamento. Pause antes de alterar.
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <button
            key={t.status}
            disabled={acting}
            onClick={() => alterarStatus(t.status)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold ${
              t.danger
                ? "bg-rose-700 hover:bg-rose-600 text-white"
                : t.status === "em_rota" || t.status === "finalizada"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-primary hover:bg-primary-hover text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
        {rota.motorista_id && rota.status !== "cancelada" && rota.status !== "finalizada" && (
          <button
            onClick={enviarLink}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white"
          >
            📲 Enviar link WhatsApp
          </button>
        )}
        {rota.status === "rascunho" && (
          <button
            onClick={deletarRota}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
          >
            Deletar rascunho
          </button>
        )}
      </div>

      {/* Magic-link gerado */}
      {linkResult?.link && (
        <div className="rounded-xl bg-dark-900 ring-1 ring-white/10 p-3 space-y-2">
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">
            Link gerado · expira em 15 minutos
          </div>
          <div className="text-xs text-gray-300 font-mono break-all">
            {linkResult.link}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copy(linkResult.link!)}
              className="text-xs px-3 py-1 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
            >
              📋 Copiar link
            </button>
            {linkResult.whatsapp.url && (
              <a
                href={linkResult.whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white"
              >
                Abrir no WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {/* Lista de paradas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">
          Paradas ({rota.paradas.length})
        </h2>
        {rota.paradas.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nenhuma parada nesta rota.</p>
        ) : (
          <div className="space-y-2">
            {rota.paradas.map((p) => {
              const endereco = parseEnderecoPedido(p.pedido_endereco);
              return (
                <div
                  key={p.id}
                  className="rounded-xl bg-dark-800 ring-1 ring-white/10 p-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block text-xs px-2 py-0.5 bg-primary text-white rounded-full font-bold">
                          {p.ordem}
                        </span>
                        <span className="text-white text-sm font-semibold">
                          Pedido #{p.pedido_id} · {p.usuario_nome || "Sem nome"}
                        </span>
                        <ParadaStatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        📍 {formatEnderecoOneLine(endereco)}
                      </p>
                      {p.usuario_telefone && (
                        <p className="text-xs text-gray-500">📞 {p.usuario_telefone}</p>
                      )}
                      {p.entregue_em && (
                        <p className="text-[11px] text-emerald-400 mt-0.5">
                          ✓ Entregue em {new Date(p.entregue_em).toLocaleString("pt-BR")}
                        </p>
                      )}
                      {p.observacao_motorista && (
                        <p className="text-[11px] text-gray-400 italic mt-1">
                          Motorista: “{p.observacao_motorista}”
                        </p>
                      )}
                      {p.ocorrencia_id && (
                        <p className="text-[11px] text-rose-400 mt-1">
                          ⚠ Ocorrência aberta #{p.ocorrencia_id}
                        </p>
                      )}
                    </div>
                    {!isReadOnly && rota.status !== "em_rota" && (
                      <button
                        onClick={() => removerParada(p.pedido_id)}
                        className="self-start text-xs px-2 py-1 rounded border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
