"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  type Motorista,
  type PedidoDisponivel,
  type RotaCompleta,
  parseEnderecoPedido,
  formatEnderecoOneLine,
} from "@/lib/rotas/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function NovaRotaPage() {
  const router = useRouter();

  const [data_programada, setData] = useState(todayIso());
  const [motoristaId, setMotoristaId] = useState<number | "">("");
  const [veiculo, setVeiculo] = useState("");
  const [regiaoLabel, setRegiaoLabel] = useState("");
  const [kmEstimado, setKmEstimado] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [selecionados, setSelecionados] = useState<number[]>([]); // ordem de seleção = ordem da rota

  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [pedidos, setPedidos] = useState<PedidoDisponivel[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Carrega motoristas ativos
  useEffect(() => {
    apiClient
      .get<Motorista[]>("/api/admin/motoristas?ativo=true")
      .then((data) => setMotoristas(data ?? []))
      .catch(() => toast.error("Falha ao carregar motoristas."));
  }, []);

  // Carrega pedidos disponíveis
  async function reloadPedidos() {
    setLoadingPedidos(true);
    try {
      const url = filtroCidade.trim()
        ? `/api/admin/rotas/disponiveis?cidade=${encodeURIComponent(filtroCidade.trim())}`
        : "/api/admin/rotas/disponiveis";
      const data = await apiClient.get<PedidoDisponivel[]>(url);
      setPedidos(data ?? []);
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao carregar pedidos.").message);
    } finally {
      setLoadingPedidos(false);
    }
  }

  useEffect(() => {
    reloadPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCidade]);

  function toggleSelecao(id: number) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Cidades existentes para o select de filtro (extraída do JSON)
  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    pedidos.forEach((p) => {
      const e = parseEnderecoPedido(p.endereco);
      if (e?.cidade) set.add(e.cidade);
    });
    return Array.from(set).sort();
  }, [pedidos]);

  async function salvar(targetStatus: "rascunho" | "pronta") {
    if (!data_programada) {
      toast.error("Informe a data programada.");
      return;
    }
    if (selecionados.length === 0 && targetStatus === "pronta") {
      toast.error("Selecione pelo menos 1 pedido para marcar a rota como pronta.");
      return;
    }
    if (targetStatus === "pronta" && !motoristaId) {
      toast.error("Atribua um motorista para marcar a rota como pronta.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Cria rota em rascunho
      const rota = await apiClient.post<RotaCompleta>("/api/admin/rotas", {
        data_programada,
        motorista_id: motoristaId === "" ? null : Number(motoristaId),
        veiculo: veiculo.trim() || null,
        regiao_label: regiaoLabel.trim() || null,
        observacoes: observacoes.trim() || null,
        km_estimado: kmEstimado === "" ? null : Number(kmEstimado),
      });

      // 2. Adiciona paradas na ORDEM DE SELEÇÃO
      for (const pedidoId of selecionados) {
        try {
          await apiClient.post(`/api/admin/rotas/${rota.id}/paradas`, {
            pedido_id: pedidoId,
          });
        } catch (err) {
          toast.error(
            formatApiError(err, `Falha ao adicionar pedido #${pedidoId}.`).message,
          );
        }
      }

      // 3. Se targetStatus = pronta, transiciona
      if (targetStatus === "pronta") {
        await apiClient.patch(`/api/admin/rotas/${rota.id}/status`, {
          status: "pronta",
        });
      }

      toast.success(
        targetStatus === "pronta" ? "Rota criada e pronta para sair." : "Rascunho salvo.",
      );
      router.push(`/admin/rotas/${rota.id}`);
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao criar rota.").message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-primary">
          Nova rota de entrega
        </h1>
        <p className="text-xs text-gray-500">
          Selecione pedidos pagos disponíveis. A ordem de seleção será a ordem das paradas.
        </p>
      </div>

      {/* Bloco 1 — Dados da rota */}
      <div className="rounded-xl bg-dark-800 ring-1 ring-white/10 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">Dados da rota</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="rota-data"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Data programada
            </label>
            <input
              id="rota-data"
              type="date"
              value={data_programada}
              onChange={(e) => setData(e.target.value)}
              required
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label
              htmlFor="rota-motorista"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Motorista
            </label>
            <select
              id="rota-motorista"
              value={motoristaId}
              onChange={(e) =>
                setMotoristaId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white"
            >
              <option value="">— atribuir depois —</option>
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} · {m.telefone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="rota-veiculo"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Veículo
            </label>
            <input
              id="rota-veiculo"
              type="text"
              value={veiculo}
              onChange={(e) => setVeiculo(e.target.value)}
              placeholder="Saveiro placa ABC1D23"
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label
              htmlFor="rota-regiao"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Região (rótulo livre)
            </label>
            <input
              id="rota-regiao"
              type="text"
              value={regiaoLabel}
              onChange={(e) => setRegiaoLabel(e.target.value)}
              placeholder="Centro + Boa Vista"
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label
              htmlFor="rota-km"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Km estimado (opcional)
            </label>
            <input
              id="rota-km"
              type="number"
              min={0}
              step={0.1}
              value={kmEstimado}
              onChange={(e) => setKmEstimado(e.target.value)}
              placeholder="80"
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="rota-obs"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Observações (opcional)
            </label>
            <textarea
              id="rota-obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* Bloco 2 — Selecionar pedidos */}
      <div className="rounded-xl bg-dark-800 ring-1 ring-white/10 p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-sm font-semibold text-white">
            Selecionar pedidos · {selecionados.length} selecionado
            {selecionados.length === 1 ? "" : "s"}
          </h2>
          <select
            value={filtroCidade}
            onChange={(e) => setFiltroCidade(e.target.value)}
            className="rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white"
          >
            <option value="">Todas as cidades</option>
            {cidadesDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loadingPedidos ? (
          <LoadingState message="Carregando pedidos disponíveis…" />
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhum pedido pago disponível no momento.
          </p>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {pedidos.map((p) => {
              const endereco = parseEnderecoPedido(p.endereco);
              const ordem = selecionados.indexOf(p.id);
              const selected = ordem !== -1;
              return (
                <label
                  key={p.id}
                  className={`flex gap-3 items-start p-3 rounded-lg border cursor-pointer transition ${
                    selected
                      ? "bg-primary/10 border-primary/50"
                      : "bg-dark-900 border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelecao(p.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-white font-semibold text-sm">
                        Pedido #{p.id}
                      </span>
                      {selected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold">
                          {ordem + 1}ª parada
                        </span>
                      )}
                      {p.tipo_endereco === "rural" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-700/30 text-amber-300">
                          rural
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.usuario_nome || "Sem nome"}
                      {p.usuario_telefone ? ` · ${p.usuario_telefone}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      📍 {formatEnderecoOneLine(endereco)}
                    </p>
                    {p.observacao_entrega && (
                      <p className="text-[11px] text-amber-400 mt-0.5 italic">
                        “{p.observacao_entrega}”
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          onClick={() => router.back()}
          disabled={submitting}
          className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition"
        >
          Cancelar
        </button>
        <button
          onClick={() => salvar("rascunho")}
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white border border-white/10"
        >
          {submitting ? "Salvando…" : "Salvar rascunho"}
        </button>
        <button
          onClick={() => salvar("pronta")}
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold"
        >
          {submitting ? "Salvando…" : "Marcar pronta"}
        </button>
      </div>
    </div>
  );
}
