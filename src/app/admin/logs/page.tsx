"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { KpiCard } from "@/components/admin/KpiCard";
import CloseButton from "@/components/buttons/CloseButton";
import { FiDatabase, FiUsers, FiClock } from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

type AdminLog = {
  id: number;
  admin_nome: string;
  admin_email: string;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  ip?: string | null;
  user_agent?: string | null;
  criado_em: string; // string vinda do backend
};

/**
 * Converte a string de data do backend em Date.
 * Suporta:
 *  - ISO: 2025-12-03T18:44:10.000Z, 2025-12-03 18:44:10
 *  - BR: 03/12/2025 18:44[:10]
 */
function parseLogDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  // 1) Tenta como ISO direto
  const isoCandidate = new Date(dateStr);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate;
  }

  // 2) Tenta formato BR dd/mm/yyyy HH:MM[:SS]
  const match = dateStr.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (match) {
    const [, dd, mm, yyyy, hh = "00", min = "00", ss = "00"] = match;
    const dt = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss)
    );
    if (!Number.isNaN(dt.getTime())) {
      return dt;
    }
  }

  // 3) Se nada funcionar, retorna null
  return null;
}

function formatDateTime(dateStr: string) {
  const dt = parseLogDate(dateStr);
  if (!dt) return dateStr || "—"; // fallback: mostra valor bruto se não conseguir formatar

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(dt);
}

function formatRelative(dateStr: string) {
  const dt = parseLogDate(dateStr);
  if (!dt) return dateStr || "—";

  const diffMs = Date.now() - dt.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffH < 24) return `${diffH} h atrás`;
  if (diffD === 1) return "ontem";
  if (diffD < 30) return `${diffD} dias atrás`;
  return formatDateTime(dateStr);
}

export default function AdminLogsPage() {
  const router = useRouter();
  const { hasPermission, logout } = useAdminAuth();

  const canViewLogs = hasPermission("logs_view");

  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");

  // Carregar logs
  useEffect(() => {
    if (!canViewLogs) {
      setLoading(false);
      return;
    }

    const loadLogs = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch(`${API_URL}/admin/logs`, {
          // 🔐 usa apenas o cookie HttpOnly; nada de Authorization nem localStorage
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          logout();
          router.replace("/admin/login");
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "Erro ao carregar logs.");
        }

        const data: AdminLog[] = await res.json();

        // Ordenar por data (mais recentes primeiro)
        const ordered = [...data].sort((a, b) => {
          const da = parseLogDate(a.criado_em);
          const db = parseLogDate(b.criado_em);
          const ta = da ? da.getTime() : 0;
          const tb = db ? db.getTime() : 0;
          return tb - ta;
        });

        setLogs(ordered);
      } catch (err: any) {
        console.error("Erro ao carregar logs:", err);
        setErrorMsg(err.message || "Erro inesperado ao carregar logs.");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [canViewLogs, logout, router]);

  const uniqueEntities = useMemo(
    () => Array.from(new Set(logs.map((l) => l.entidade))).sort(),
    [logs]
  );

  const uniqueAdmins = useMemo(
    () => Array.from(new Set(logs.map((l) => l.admin_email))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (entityFilter !== "all") {
      result = result.filter((l) => l.entidade === entityFilter);
    }

    if (adminFilter !== "all") {
      result = result.filter((l) => l.admin_email === adminFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((l) => {
        return (
          l.admin_nome.toLowerCase().includes(term) ||
          l.admin_email.toLowerCase().includes(term) ||
          l.acao.toLowerCase().includes(term) ||
          l.entidade.toLowerCase().includes(term) ||
          String(l.entidade_id ?? "").includes(term)
        );
      });
    }

    return result;
  }, [logs, entityFilter, adminFilter, searchTerm]);

  const totalLogs = logs.length;
  const totalFiltrados = filteredLogs.length;
  const totalAdmins = uniqueAdmins.length;
  const lastEvent =
    logs.length > 0 ? formatRelative(logs[0].criado_em) : "—";

  // 🔒 Tela de acesso negado
  if (!canViewLogs) {
    return (
      <main className="px-4 sm:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/40 px-3 py-1 mb-4">
            <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-rose-300">
              Segurança
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-2">
            Acesso negado aos logs administrativos
          </h1>
          <p className="text-sm text-slate-400 mb-4">
            Seu usuário não possui a permissão{" "}
            <span className="font-mono text-rose-300">logs_view</span>. Apenas
            perfis autorizados podem visualizar o histórico de ações
            administrativas do painel.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="inline-flex items-center rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 border border-slate-700/80 transition-colors"
            >
              Voltar para o dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 🔎 Tela normal de logs
  return (
    <main className="px-4 sm:px-8 py-6 space-y-6">
      {/* Header + botão fechar mobile */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-emerald-400 mb-1">
            Segurança · Logs
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">
            Histórico de ações administrativas
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Veja quem fez o quê dentro do painel, em quais módulos e em qual
            horário. Acompanhe de perto a atividade da sua equipe.
          </p>
        </div>

        {/* Só mobile */}
        <div className="sm:hidden">
          <CloseButton className="text-slate-400 hover:text-slate-100 text-3xl" />
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Registros carregados"
          value={totalFiltrados}
          helper={`de ${totalLogs} evento(s) encontrado(s)`}
          icon={<FiDatabase />}
          variant="success"
        />
        <KpiCard
          label="Perfis envolvidos"
          value={totalAdmins}
          helper="administradores diferentes nos registros"
          icon={<FiUsers />}
          variant="default"
        />
        <KpiCard
          label="Último evento"
          value={lastEvent}
          helper={
            logs.length > 0
              ? `Registrado em ${formatDateTime(logs[0].criado_em)}`
              : "Ainda sem eventos registrados"
          }
          icon={<FiClock />}
          variant="warning"
        />
      </section>

      {/* Filtros */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Buscar</label>
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="Nome, e-mail, ação, entidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Entidade</label>
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              {uniqueEntities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Administrador</label>
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {uniqueAdmins.map((adm) => (
                <option key={adm} value={adm}>
                  {adm}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Lista de logs */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            Eventos recentes
          </h2>
          <span className="text-xs text-slate-500">
            {totalFiltrados} registro(s) exibido(s)
          </span>
        </header>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-400">
            Carregando logs...
          </div>
        ) : errorMsg ? (
          <div className="px-4 py-6 text-sm text-red-400">{errorMsg}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">
            Nenhum log encontrado com os filtros atuais.
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-slate-800/70">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-4 py-3 flex flex-col gap-2 hover:bg-slate-900/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-400">Administrador</p>
                      <p className="text-sm font-semibold text-slate-100">
                        {log.admin_nome}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {log.admin_email}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-100">
                      {log.entidade}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">
                        Ação
                      </span>
                      <span className="text-sm text-slate-200">
                        {log.acao}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">
                        ID entidade
                      </span>
                      <span className="text-sm text-slate-200">
                        {log.entidade_id ?? "-"}
                      </span>
                    </div>

                    <div className="flex flex-col text-right ml-auto">
                      <span className="text-[11px] text-slate-400">
                        Data
                      </span>
                      <span className="text-xs text-slate-100">
                        {formatRelative(log.criado_em)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(log.criado_em)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Administrador
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Ação
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Entidade
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      ID entidade
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-800/80 hover:bg-slate-900/80 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-100">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.admin_nome}</span>
                          <span className="text-[11px] text-slate-500">
                            {log.admin_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{log.acao}</td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-100">
                          {log.entidade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.entidade_id ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-200">
                            {formatRelative(log.criado_em)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(log.criado_em)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
