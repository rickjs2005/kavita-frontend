"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import {
  type ParadaCompleta,
  type ProblemaTipo,
  type RotaCompleta,
  parseEnderecoPedido,
  formatEnderecoOneLine,
} from "@/lib/rotas/types";
import {
  executeWithOffline,
  readCachedRota,
} from "@/lib/rotas/offline";
import { ParadaStatusBadge } from "@/app/admin/rotas/_components/StatusBadge";
import OfflineBanner from "../../_components/OfflineBanner";

const PROBLEMA_OPTIONS: Array<{ value: ProblemaTipo; label: string }> = [
  { value: "cliente_ausente", label: "Cliente ausente" },
  { value: "endereco_incorreto", label: "Endereço incorreto" },
  { value: "estrada_intransitavel", label: "Estrada intransitável" },
  { value: "pagamento_pendente_na_entrega", label: "Pagamento pendente na entrega" },
  { value: "produto_avariado", label: "Produto avariado" },
  { value: "outro_motivo", label: "Outro motivo" },
];

function buildMapsUrl(parada: ParadaCompleta): string {
  if (parada.pedido_lat && parada.pedido_lng) {
    return `https://www.google.com/maps/search/?api=1&query=${parada.pedido_lat},${parada.pedido_lng}`;
  }
  const endereco = parseEnderecoPedido(parada.pedido_endereco);
  const query = formatEnderecoOneLine(endereco);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildWhatsappUrl(telefone: string | null) {
  if (!telefone) return null;
  const digits = telefone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const com55 = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${com55}`;
}

export default function ParadaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [parada, setParada] = useState<ParadaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [problemaOpen, setProblemaOpen] = useState(false);
  const [problemaTipo, setProblemaTipo] = useState<ProblemaTipo>("cliente_ausente");
  const [problemaObs, setProblemaObs] = useState("");

  // Função para encontrar a parada no cache (offline) ou na API.
  // O backend não tem endpoint /paradas/:id direto — pegamos via rota-hoje.
  async function load() {
    try {
      const rota = await apiClient.get<RotaCompleta | null>(
        "/api/motorista/rota-hoje",
      );
      if (!rota) {
        toast.error("Você não tem rota ativa hoje.");
        router.replace("/motorista/rota");
        return;
      }
      const found = rota.paradas.find((p) => p.id === id) ?? null;
      if (!found) {
        toast.error("Parada não encontrada na sua rota.");
        router.replace("/motorista/rota");
        return;
      }
      setParada(found);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/motorista/login");
        return;
      }
      // Tenta cache
      const cached = readCachedRota<RotaCompleta>();
      const found = cached?.paradas.find((p) => p.id === id) ?? null;
      if (found) {
        setParada(found);
        toast("Mostrando dados salvos. Sem conexão.");
      } else {
        toast.error(formatApiError(err, "Falha ao carregar parada.").message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function marcarEntregue() {
    if (!parada) return;
    const obs = window.prompt("Observação (opcional):", "") ?? "";
    setActing(true);
    try {
      const r = await executeWithOffline({
        endpoint: `/api/motorista/paradas/${parada.id}/entregue`,
        method: "POST",
        payload: { observacao: obs.trim() || null },
        label: `Marcar entregue parada #${parada.id}`,
      });
      if (r.enqueued) {
        toast("Sem conexão — registrado offline.");
      } else {
        toast.success("Entrega registrada.");
      }
      router.push("/motorista/rota");
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao registrar.").message);
    } finally {
      setActing(false);
    }
  }

  async function reportarProblema() {
    if (!parada) return;
    setActing(true);
    try {
      const r = await executeWithOffline({
        endpoint: `/api/motorista/paradas/${parada.id}/problema`,
        method: "POST",
        payload: {
          tipo: problemaTipo,
          observacao: problemaObs.trim() || null,
        },
        label: `Problema parada #${parada.id}`,
      });
      if (r.enqueued) {
        toast("Sem conexão — problema na fila.");
      } else {
        toast.success("Problema registrado.");
      }
      setProblemaOpen(false);
      setProblemaObs("");
      router.push("/motorista/rota");
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao reportar.").message);
    } finally {
      setActing(false);
    }
  }

  async function fixarPosicao() {
    if (!parada) return;
    if (!navigator.geolocation) {
      toast.error("GPS não disponível neste dispositivo.");
      return;
    }
    setActing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await executeWithOffline({
            endpoint: `/api/motorista/paradas/${parada.id}/posicao`,
            method: "POST",
            payload: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
            label: `Fixar GPS parada #${parada.id}`,
          });
          if (r.enqueued) {
            toast("GPS na fila — sincroniza ao voltar online.");
          } else {
            toast.success("Posição fixada.");
          }
        } catch (err) {
          toast.error(formatApiError(err, "Falha ao fixar.").message);
        } finally {
          setActing(false);
        }
      },
      (err) => {
        setActing(false);
        toast.error(`GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando…</p>
      </main>
    );
  }

  if (!parada) return null;

  const endereco = parseEnderecoPedido(parada.pedido_endereco);
  const enderecoStr = formatEnderecoOneLine(endereco);
  const mapsUrl = buildMapsUrl(parada);
  const whatsappUrl = buildWhatsappUrl(parada.usuario_telefone);
  const telUrl = parada.usuario_telefone
    ? `tel:${parada.usuario_telefone.replace(/\D/g, "")}`
    : null;
  const isClosed = parada.status === "entregue" || parada.status === "problema";

  return (
    <main className="min-h-screen pb-20">
      <OfflineBanner />

      <header className="px-4 py-4 border-b border-white/5">
        <Link href="/motorista/rota" className="text-xs text-stone-400">
          ← Voltar
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-200 flex items-center justify-center font-bold text-sm">
            {parada.ordem}
          </span>
          <h1 className="text-base font-semibold">Parada {parada.ordem}</h1>
          <ParadaStatusBadge status={parada.status} />
        </div>
      </header>

      <section className="px-4 py-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{parada.usuario_nome || "Sem nome"}</h2>
          <p className="text-sm text-stone-400 mt-1">📍 {enderecoStr}</p>
          {parada.pedido_observacao_entrega && (
            <p className="text-sm text-amber-300 mt-2 italic">
              “{parada.pedido_observacao_entrega}”
            </p>
          )}
        </div>

        {/* Botões grandes */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-200 py-4 text-center text-sm font-semibold"
          >
            🗺️ Abrir no Maps
          </a>
          <button
            onClick={fixarPosicao}
            disabled={acting}
            className="rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-200 py-4 text-sm font-semibold disabled:opacity-60"
          >
            📍 Fixar GPS aqui
          </button>
          {telUrl && (
            <a
              href={telUrl}
              className="rounded-2xl bg-stone-700/60 border border-white/10 text-stone-100 py-4 text-center text-sm font-semibold"
            >
              📞 Ligar
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-green-600/20 border border-green-500/40 text-green-200 py-4 text-center text-sm font-semibold"
            >
              💬 WhatsApp
            </a>
          )}
        </div>

        {/* Itens */}
        {parada.itens && parada.itens.length > 0 && (
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
              Itens do pedido
            </p>
            <ul className="space-y-1 text-sm">
              {parada.itens.map((it) => (
                <li key={it.produto_id} className="text-stone-200">
                  {it.quantidade}× {it.produto_nome}
                </li>
              ))}
            </ul>
          </div>
        )}

        {parada.entregue_em && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
            ✓ Entregue em {new Date(parada.entregue_em).toLocaleString("pt-BR")}
            {parada.observacao_motorista && (
              <p className="text-[11px] text-emerald-200/80 mt-1 italic">
                “{parada.observacao_motorista}”
              </p>
            )}
          </div>
        )}
        {parada.ocorrencia_id && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
            ⚠ Problema reportado · ocorrência #{parada.ocorrencia_id}
            {parada.observacao_motorista && (
              <p className="text-[11px] text-rose-200/80 mt-1 italic">
                “{parada.observacao_motorista}”
              </p>
            )}
          </div>
        )}

        {/* Ações principais */}
        {!isClosed && (
          <div className="space-y-2 pt-2">
            <button
              onClick={marcarEntregue}
              disabled={acting}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-stone-950 font-bold uppercase tracking-wider text-sm shadow-lg disabled:opacity-60"
            >
              ✅ Marcar entregue
            </button>
            <button
              onClick={() => setProblemaOpen(true)}
              disabled={acting}
              className="w-full py-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-200 font-bold uppercase tracking-wider text-sm disabled:opacity-60"
            >
              ⚠️ Reportar problema
            </button>
          </div>
        )}
      </section>

      {/* Modal problema */}
      {problemaOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
          onClick={() => setProblemaOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-stone-900 ring-1 ring-white/10 rounded-2xl p-4 space-y-3"
          >
            <h3 className="text-base font-semibold">O que aconteceu?</h3>
            <select
              value={problemaTipo}
              onChange={(e) => setProblemaTipo(e.target.value as ProblemaTipo)}
              className="w-full rounded-lg bg-stone-800 border border-white/10 px-3 py-2 text-stone-100"
            >
              {PROBLEMA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <textarea
              value={problemaObs}
              onChange={(e) => setProblemaObs(e.target.value)}
              rows={3}
              placeholder="Detalhe (opcional)…"
              className="w-full rounded-lg bg-stone-800 border border-white/10 px-3 py-2 text-stone-100 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setProblemaOpen(false)}
                disabled={acting}
                className="px-4 py-2 rounded-lg text-stone-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={reportarProblema}
                disabled={acting}
                className="px-4 py-2 rounded-lg bg-rose-500 text-stone-950 font-semibold disabled:opacity-60"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
