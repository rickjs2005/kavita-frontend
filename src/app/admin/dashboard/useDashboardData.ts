"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { AdminRole } from "@/context/AdminAuthContext";
import type {
  AdminLog,
  AdminResumo,
  AlertItem,
  ModulesStatus,
  TopCliente,
  TopProduto,
  TopServico,
  VendaPoint,
} from "./dashboardTypes";
import { formatShortDate } from "./dashboardUtils";

type Props = {
  /** Called whenever any API endpoint returns 401/403. */
  handleUnauthorized: () => void;
  role: AdminRole | null;
};

export function useDashboardData({ handleUnauthorized, role }: Props) {
  const canViewLogs = role === "master" || role === "gerente";

  // ---------------------------------------------------------------------------
  // Resumo + sales chart
  // ---------------------------------------------------------------------------
  const [resumo, setResumo] = useState<AdminResumo | null>(null);
  const [vendas, setVendas] = useState<VendaPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stableHandleUnauthorized = useCallback(
    handleUnauthorized,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [resumoJson, vendasJson] = await Promise.all([
          apiClient.get<AdminResumo>("/api/admin/stats/resumo"),
          apiClient.get<{ rangeDays: number; points: VendaPoint[] }>(
            "/api/admin/stats/vendas?range=7",
          ),
        ]);
        if (cancelled) return;
        setResumo(resumoJson ?? null);
        setVendas(Array.isArray(vendasJson.points) ? vendasJson.points : []);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.status === 401 || err?.status === 403) {
          stableHandleUnauthorized();
          return;
        }
        console.error("Erro ao carregar dashboard:", err);
        const msg =
          err?.message || "Não foi possível carregar o painel. Tente novamente.";
        setErrorMsg(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [stableHandleUnauthorized]);

  const chartData = useMemo(
    () => vendas.map((p) => ({ date: formatShortDate(p.date), total: p.total })),
    [vendas],
  );

  // ---------------------------------------------------------------------------
  // Audit logs
  // ---------------------------------------------------------------------------
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    if (!canViewLogs) return;

    let cancelled = false;

    async function load() {
      setLogsLoading(true);
      setLogsError(null);
      try {
        const data = await apiClient.get<any[]>("/api/admin/logs?limit=20");
        if (cancelled) return;
        setLogs(
          data.map((log) => ({
            id: log.id,
            admin_nome: log.admin_nome,
            acao: log.acao,
            detalhes: log.detalhes ?? null,
            criado_em: log.criado_em,
          })),
        );
      } catch (err: any) {
        if (cancelled) return;
        if (err?.status === 401 || err?.status === 403) {
          stableHandleUnauthorized();
          return;
        }
        console.warn("Erro ao carregar logs de auditoria:", err);
        setLogsError(
          "Não foi possível carregar a atividade recente. Tente novamente mais tarde.",
        );
      } finally {
        if (!cancelled) setLogsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [canViewLogs, stableHandleUnauthorized]);

  // ---------------------------------------------------------------------------
  // Top rankings (clients / products / services)
  // ---------------------------------------------------------------------------
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [topServicos, setTopServicos] = useState<TopServico[]>([]);
  const [topsLoading, setTopsLoading] = useState(false);
  const [topsError, setTopsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setTopsLoading(true);
      setTopsError(null);
      try {
        const [resCli, resProd, resServ] = await Promise.allSettled([
          apiClient.get<{ rows: any[] }>("/api/admin/relatorios/clientes-top"),
          apiClient.get<any[]>("/api/admin/stats/produtos-mais-vendidos?limit=5"),
          apiClient.get<{ rows: any[] }>("/api/admin/relatorios/servicos-ranking"),
        ]);
        if (cancelled) return;

        for (const result of [resCli, resProd, resServ]) {
          if (
            result.status === "rejected" &&
            (result.reason?.status === 401 || result.reason?.status === 403)
          ) {
            stableHandleUnauthorized();
            return;
          }
        }

        let anyOk = false;

        if (resCli.status === "fulfilled") {
          const rows = Array.isArray(resCli.value?.rows) ? resCli.value.rows : [];
          setTopClientes(
            rows.slice(0, 5).map((c) => ({
              id: c.id,
              nome: c.nome,
              total_pedidos: Number(c.pedidos || 0),
              total_gasto: Number(c.total_gasto || 0),
            })),
          );
          anyOk = true;
        }

        if (resProd.status === "fulfilled") {
          const data = Array.isArray(resProd.value) ? resProd.value : [];
          setTopProdutos(
            data.map((p) => ({
              id: p.id,
              nome: p.name,
              total_vendido: Number(p.quantidadeVendida || 0),
              receita_total: Number(p.totalVendido || 0),
            })),
          );
          anyOk = true;
        }

        if (resServ.status === "fulfilled") {
          const rows = Array.isArray(resServ.value?.rows) ? resServ.value.rows : [];
          setTopServicos(
            rows.slice(0, 5).map((s) => ({
              id: s.id,
              titulo: s.nome,
              total_contratos: Number(s.total_servicos || 0),
              receita_total: 0,
              nota_media: typeof s.rating_avg === "number" ? s.rating_avg : null,
            })),
          );
          anyOk = true;
        }

        if (!anyOk) {
          setTopsError(
            "Não foi possível carregar os rankings. Verifique se as rotas de relatórios estão ativas.",
          );
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("Erro ao carregar tops:", err);
        setTopsError("Erro ao carregar rankings de clientes/produtos/serviços.");
      } finally {
        if (!cancelled) setTopsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [stableHandleUnauthorized]);

  // ---------------------------------------------------------------------------
  // Store alerts + modules status (loaded in parallel)
  // ---------------------------------------------------------------------------
  const [alertas, setAlertas] = useState<AlertItem[]>([]);
  const [alertasLoading, setAlertasLoading] = useState(false);
  const [alertasError, setAlertasError] = useState<string | null>(null);
  const [modulesStatus, setModulesStatus] = useState<ModulesStatus | null>(null);
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setAlertasLoading(true);
      setModulesLoading(true);
      setAlertasError(null);
      try {
        const [alertasData, modulesData] = await Promise.allSettled([
          apiClient.get<AlertItem[]>("/api/admin/stats/alertas"),
          apiClient.get<ModulesStatus>("/api/admin/stats/modulos-status"),
        ]);
        if (cancelled) return;

        // Handle alerts
        if (alertasData.status === "fulfilled") {
          setAlertas(Array.isArray(alertasData.value) ? alertasData.value : []);
        } else {
          const err = alertasData.reason;
          if (err?.status === 401 || err?.status === 403) {
            stableHandleUnauthorized();
            return;
          }
          if (err?.status !== 404) {
            console.warn("Erro ao carregar alertas:", err);
            setAlertasError("Não foi possível carregar os alertas da loja.");
          }
        }

        // Handle modules status
        if (modulesData.status === "fulfilled") {
          setModulesStatus(modulesData.value ?? null);
        } else {
          const err = modulesData.reason;
          if (err?.status === 401 || err?.status === 403) {
            stableHandleUnauthorized();
            return;
          }
          // Silent fail — modules status is non-critical
        }
      } finally {
        if (!cancelled) {
          setAlertasLoading(false);
          setModulesLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [stableHandleUnauthorized]);

  return {
    // resumo + chart
    resumo,
    loading,
    errorMsg,
    chartData,
    // logs
    logs,
    logsLoading,
    logsError,
    canViewLogs,
    // tops
    topClientes,
    topProdutos,
    topServicos,
    topsLoading,
    topsError,
    // alerts
    alertas,
    alertasLoading,
    alertasError,
    // modules status
    modulesStatus,
    modulesLoading,
  };
}
