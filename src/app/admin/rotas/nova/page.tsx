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
  hoursAgo,
} from "@/lib/rotas/types";
import PedidoCard from "../_components/PedidoCard";
import RouteSummary, {
  type RouteValidationIssue,
} from "../_components/RouteSummary";

function todayIso() {
  // YYYY-MM-DD em LOCAL TIME (BRT no Brasil), nao UTC.
  // Antes era new Date().toISOString().slice(0, 10) — depois das 21h
  // BRT, isso retornava o dia seguinte em UTC e o admin criava rota
  // com data errada (off-by-one). Resultado: motorista NAO via a rota
  // hoje porque backend filtra por CURDATE() (BRT do servidor).
  return new Date().toLocaleDateString("en-CA");
}

export default function NovaRotaPage() {
  const router = useRouter();

  const [data_programada, setData] = useState(todayIso());
  const [motoristaId, setMotoristaId] = useState<number | "">("");
  const [veiculo, setVeiculo] = useState("");
  const [regiaoLabel, setRegiaoLabel] = useState("");
  const [kmEstimado, setKmEstimado] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");

  // Filtros do picker (Fase 3 UX)
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroAte, setFiltroAte] = useState(""); // data ate (yyyy-mm-dd)
  const [filtroBusca, setFiltroBusca] = useState(""); // client-side: id, nome, ponto referencia
  const [filtroPagamento, setFiltroPagamento] = useState(""); // client-side
  const [antigosPrimeiro, setAntigosPrimeiro] = useState(false); // ordenacao client-side

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

  // Carrega pedidos disponíveis (filtros server-side: cidade, bairro, ate)
  async function reloadPedidos() {
    setLoadingPedidos(true);
    try {
      const params = new URLSearchParams();
      if (filtroCidade.trim()) params.set("cidade", filtroCidade.trim());
      if (filtroBairro.trim()) params.set("bairro", filtroBairro.trim());
      if (filtroAte) params.set("ate", filtroAte);
      const qs = params.toString();
      const url = qs ? `/api/admin/rotas/disponiveis?${qs}` : "/api/admin/rotas/disponiveis";
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
  }, [filtroCidade, filtroBairro, filtroAte]);

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

  // Bairros existentes (do filtro server-side ou client-side fallback)
  const bairrosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    pedidos.forEach((p) => {
      const e = parseEnderecoPedido(p.endereco);
      if (e?.bairro) set.add(e.bairro);
    });
    return Array.from(set).sort();
  }, [pedidos]);

  // Formas de pagamento disponiveis (extraidas da resposta atual)
  const formasPagamento = useMemo(() => {
    const set = new Set<string>();
    pedidos.forEach((p) => {
      if (p.forma_pagamento) set.add(p.forma_pagamento);
    });
    return Array.from(set).sort();
  }, [pedidos]);

  // Filtragem client-side: busca livre + pagamento + ordenacao por idade.
  const pedidosVisiveis = useMemo(() => {
    let list = pedidos;
    if (filtroBusca.trim()) {
      const q = filtroBusca.trim().toLowerCase();
      list = list.filter((p) => {
        if (String(p.id).includes(q)) return true;
        if ((p.usuario_nome ?? "").toLowerCase().includes(q)) return true;
        if ((p.usuario_telefone ?? "").includes(q)) return true;
        const e = parseEnderecoPedido(p.endereco);
        if (e?.ponto_referencia?.toLowerCase().includes(q)) return true;
        if (e?.bairro?.toLowerCase().includes(q)) return true;
        if (e?.cidade?.toLowerCase().includes(q)) return true;
        return false;
      });
    }
    if (filtroPagamento) {
      list = list.filter((p) => p.forma_pagamento === filtroPagamento);
    }
    if (antigosPrimeiro) {
      // Comparacao por timestamp; mais antigo primeiro.
      list = [...list].sort((a, b) => {
        const ta = new Date(a.data_pedido).getTime() || 0;
        const tb = new Date(b.data_pedido).getTime() || 0;
        return ta - tb;
      });
    }
    return list;
  }, [pedidos, filtroBusca, filtroPagamento, antigosPrimeiro]);

  /**
   * Sugestao de agrupamento: reordena `selecionados` agrupando pedidos
   * pelo bairro (fallback cidade). Pedidos sem bairro/cidade vao pro
   * fim. Dentro de cada bucket, ordem original e' preservada.
   *
   * Pura local — admin pode rejeitar com "Limpar selecao" se nao gostar.
   */
  function sugerirAgrupamento() {
    if (selecionados.length < 2) {
      toast("Selecione pelo menos 2 pedidos para agrupar.");
      return;
    }
    const indexById: Record<number, PedidoDisponivel | undefined> = {};
    pedidos.forEach((p) => {
      indexById[p.id] = p;
    });
    const buckets = new Map<string, number[]>();
    const semBucket: number[] = [];
    selecionados.forEach((id) => {
      const p = indexById[id];
      if (!p) {
        semBucket.push(id);
        return;
      }
      const e = parseEnderecoPedido(p.endereco);
      const chave = e?.bairro?.trim() || e?.cidade?.trim() || "";
      if (!chave) {
        semBucket.push(id);
        return;
      }
      const norm = chave.toLowerCase();
      if (!buckets.has(norm)) buckets.set(norm, []);
      buckets.get(norm)!.push(id);
    });
    const ordenadas = Array.from(buckets.keys()).sort();
    const novaOrdem: number[] = [];
    ordenadas.forEach((k) => {
      novaOrdem.push(...(buckets.get(k) ?? []));
    });
    novaOrdem.push(...semBucket);
    setSelecionados(novaOrdem);
    toast.success(
      `Agrupado em ${ordenadas.length} ${ordenadas.length === 1 ? "região" : "regiões"}.`,
    );
  }

  /**
   * Fase 4 — agrupamento por proximidade real (greedy nearest-neighbor /
   * TSP guloso). So' funciona quando TODOS os selecionados tem lat/lng;
   * caso contrario, botao desabilitado e usuario usa o agrupamento por
   * bairro como fallback.
   *
   * Algoritmo:
   *   1. Comeca pelo pedido mais ao norte-oeste (menor lat+lng) como semente
   *   2. A cada passo, adiciona o pedido nao-visitado mais proximo (haversine)
   *   3. Termina quando todos visitados
   * Resultado: sequencia que aproxima a melhor rota visualmente.
   * NAO e' otimo, mas e' simples e bom o suficiente pra zona da mata.
   */
  const todosSelecionadosTemGeo = (() => {
    if (selecionados.length < 2) return false;
    const indexById: Record<number, PedidoDisponivel | undefined> = {};
    pedidos.forEach((p) => {
      indexById[p.id] = p;
    });
    return selecionados.every((id) => {
      const p = indexById[id];
      return Boolean(
        p?.endereco_latitude && p?.endereco_longitude,
      );
    });
  })();

  function sugerirPorProximidade() {
    if (!todosSelecionadosTemGeo) {
      toast.error("Todos os selecionados precisam ter lat/lng para usar essa opção.");
      return;
    }
    type Pt = { id: number; lat: number; lng: number };
    const indexById: Record<number, PedidoDisponivel | undefined> = {};
    pedidos.forEach((p) => {
      indexById[p.id] = p;
    });
    const pontos: Pt[] = selecionados.map((id) => {
      const p = indexById[id]!;
      return {
        id,
        lat: Number(p.endereco_latitude),
        lng: Number(p.endereco_longitude),
      };
    });

    // Haversine simplificado (suficiente pra distancia relativa).
    function dist(a: Pt, b: Pt) {
      const dLat = a.lat - b.lat;
      const dLng = a.lng - b.lng;
      // Aproximacao plana — ok pra sub-100km.
      return Math.sqrt(dLat * dLat + dLng * dLng);
    }

    // Semente: ponto mais ao norte-oeste (maior lat, menor lng)
    let seed = pontos[0];
    for (const p of pontos) {
      if (p.lat > seed.lat || (p.lat === seed.lat && p.lng < seed.lng)) {
        seed = p;
      }
    }

    const visitados = new Set<number>([seed.id]);
    const ordem: number[] = [seed.id];
    let atual = seed;
    while (visitados.size < pontos.length) {
      let proximo: Pt | null = null;
      let melhorDist = Infinity;
      for (const p of pontos) {
        if (visitados.has(p.id)) continue;
        const d = dist(atual, p);
        if (d < melhorDist) {
          melhorDist = d;
          proximo = p;
        }
      }
      if (!proximo) break;
      visitados.add(proximo.id);
      ordem.push(proximo.id);
      atual = proximo;
    }

    setSelecionados(ordem);
    toast.success(
      `Reordenado por proximidade (${ordem.length} paradas).`,
    );
  }

  /**
   * Resumo + validacoes calculadas. Ficam fora do salvar() pra alimentar
   * o painel lateral em tempo real e mostrar quais issues bloqueiam o
   * "marcar pronta" antes do click.
   */
  const summary = useMemo(() => {
    const indexById: Record<number, PedidoDisponivel | undefined> = {};
    pedidos.forEach((p) => {
      indexById[p.id] = p;
    });
    const pedidosSelecionados = selecionados
      .map((id) => indexById[id])
      .filter((p): p is PedidoDisponivel => Boolean(p));

    const motorista =
      motoristaId === ""
        ? null
        : motoristas.find((m) => m.id === Number(motoristaId)) || null;

    const issues: RouteValidationIssue[] = [];

    // BLOQUEIOS — sem isso nao deixamos marcar como pronta
    if (!data_programada) {
      issues.push({ level: "block", label: "Defina a data programada." });
    }
    if (!motorista) {
      issues.push({ level: "block", label: "Atribua um motorista." });
    }
    if (pedidosSelecionados.length === 0) {
      issues.push({ level: "block", label: "Selecione pelo menos 1 pedido." });
    }

    // Telefone do motorista e' essencial pro magic-link no WhatsApp.
    // Sem isso, motorista nao consegue logar e operar a rota.
    if (motorista && !motorista.telefone) {
      issues.push({
        level: "block",
        label: "Motorista sem telefone — impossivel enviar magic-link.",
      });
    }

    // Pedidos sem endereco utilizavel — motorista nao tem para onde ir
    const semEndereco = pedidosSelecionados.filter((p) => {
      const e = parseEnderecoPedido(p.endereco);
      return !e?.rua && !e?.bairro && !e?.cidade;
    });
    if (semEndereco.length > 0) {
      issues.push({
        level: "block",
        label: `${semEndereco.length} pedido(s) sem endereco valido (#${semEndereco
          .map((p) => p.id)
          .join(", #")}).`,
      });
    }

    // AVISOS — nao bloqueiam mas sinalizam
    if (!veiculo.trim()) {
      issues.push({
        level: "warn",
        label: "Veiculo nao informado — confirme antes de sair.",
      });
    }
    if (!regiaoLabel.trim()) {
      issues.push({
        level: "warn",
        label: "Regiao nao definida — facilita acompanhamento.",
      });
    }
    const antigos = pedidosSelecionados.filter((p) => {
      const h = hoursAgo(p.data_pedido);
      return h !== null && h > 48;
    });
    if (antigos.length > 0) {
      issues.push({
        level: "warn",
        label: `${antigos.length} pedido(s) com mais de 48h — priorize na ordem.`,
      });
    }

    return {
      pedidosSelecionados,
      motorista,
      data: data_programada,
      veiculo,
      regiaoLabel,
      kmEstimado,
      issues,
    };
  }, [
    selecionados,
    pedidos,
    motoristaId,
    motoristas,
    data_programada,
    veiculo,
    regiaoLabel,
    kmEstimado,
  ]);

  const blocksDoSummary = summary.issues.filter((i) => i.level === "block");
  const podeMarcarPronta = blocksDoSummary.length === 0;

  async function salvar(targetStatus: "rascunho" | "pronta") {
    // Rascunho ainda exige data programada (precondicao do INSERT).
    if (!data_programada) {
      toast.error("Informe a data programada.");
      return;
    }
    // Pra marcar como pronta, todos os bloqueios do summary precisam estar
    // resolvidos. Mostramos um toast por issue pra clareza.
    if (targetStatus === "pronta" && blocksDoSummary.length > 0) {
      blocksDoSummary.forEach((b) => toast.error(b.label));
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

      {/* Layout: form + picker à esquerda, resumo lateral à direita (em desktop) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6 min-w-0">

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
            {filtroBusca || filtroCidade || filtroBairro || filtroAte ? (
              <span className="text-[11px] text-gray-500 ml-2">
                ({pedidosVisiveis.length} de {pedidos.length} visíveis)
              </span>
            ) : null}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={sugerirAgrupamento}
              disabled={selecionados.length < 2}
              className="text-xs px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Agrupa selecionados por bairro / cidade (sempre disponivel)"
            >
              🧭 Por bairro
            </button>
            <button
              type="button"
              onClick={sugerirPorProximidade}
              disabled={!todosSelecionadosTemGeo}
              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                todosSelecionadosTemGeo
                  ? "Reordena por proximidade GPS real (greedy nearest-neighbor)"
                  : "Disponivel quando todos os selecionados tem lat/lng — capturado pelo motorista nas entregas"
              }
            >
              🛰️ Por proximidade
            </button>
            <button
              type="button"
              onClick={() => setSelecionados([])}
              disabled={selecionados.length === 0}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-40"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {/* Filtros expandidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <div>
            <label
              htmlFor="filtro-cidade"
              className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Cidade
            </label>
            <select
              id="filtro-cidade"
              value={filtroCidade}
              onChange={(e) => {
                setFiltroCidade(e.target.value);
                setFiltroBairro(""); // reset bairro pra evitar inconsistencia
              }}
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white"
            >
              <option value="">Todas</option>
              {cidadesDisponiveis.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filtro-bairro"
              className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Bairro
            </label>
            <select
              id="filtro-bairro"
              value={filtroBairro}
              onChange={(e) => setFiltroBairro(e.target.value)}
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white"
            >
              <option value="">Todos</option>
              {bairrosDisponiveis.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filtro-ate"
              className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Pedidos até
            </label>
            <input
              id="filtro-ate"
              type="date"
              value={filtroAte}
              onChange={(e) => setFiltroAte(e.target.value)}
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label
              htmlFor="filtro-pagamento"
              className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Pagamento
            </label>
            <select
              id="filtro-pagamento"
              value={filtroPagamento}
              onChange={(e) => setFiltroPagamento(e.target.value)}
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white"
            >
              <option value="">Todos</option>
              {formasPagamento.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filtro-busca"
              className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Buscar
            </label>
            <input
              id="filtro-busca"
              type="text"
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              placeholder="ID, cliente, telefone…"
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Toggle de ordenacao por idade */}
        <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={antigosPrimeiro}
            onChange={(e) => setAntigosPrimeiro(e.target.checked)}
            className="accent-primary"
          />
          <span>
            Pedidos antigos primeiro{" "}
            <span className="text-gray-500">
              (prioriza quem está há mais tempo no pool)
            </span>
          </span>
        </label>

        {loadingPedidos ? (
          <LoadingState message="Carregando pedidos disponíveis…" />
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhum pedido pago disponível no momento.
          </p>
        ) : pedidosVisiveis.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhum pedido bate com os filtros atuais.
          </p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {pedidosVisiveis.map((p) => (
              <PedidoCard
                key={p.id}
                pedido={p}
                ordem={selecionados.indexOf(p.id)}
                onToggle={() => toggleSelecao(p.id)}
              />
            ))}
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
          disabled={submitting || !podeMarcarPronta}
          title={
            !podeMarcarPronta
              ? "Resolva os bloqueios indicados no resumo lateral."
              : undefined
          }
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Salvando…" : "Marcar pronta"}
        </button>
      </div>

        </div>{/* fim coluna principal */}

        {/* Aside lateral — em mobile vai pra cima dos botoes via order, em desktop fica fixo */}
        <aside className="lg:row-span-1 order-first lg:order-none">
          <RouteSummary summary={summary} />
        </aside>
      </div>
    </div>
  );
}
