"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminRole, useAdminAuth } from "@/context/AdminAuthContext";

type AdminLog = {
  id: number;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  data: string;
  admin_id: number;
  admin_nome: string;
  admin_email: string;
  admin_role: AdminRole;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

// Recupera token salvo no browser
function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("adminToken") ?? "";
  } catch {
    return "";
  }
}

// Data formatada com Intl.DateTimeFormat no fuso de São Paulo
function formatDateTime(dateStr: string) {
  const dt = new Date(dateStr);
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
  const dt = new Date(dateStr);
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
  const { hasPermission, logout } = useAdminAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [entidadeFilter, setEntidadeFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  // Controle de acesso via permission
  const canViewLogs = hasPermission("logs_view");

  useEffect(() => {
    if (!canViewLogs) return;

    let cancelado = false;

    async function loadLogs() {
      const token = getAdminToken();
      if (!token) {
        logout();
        router.replace("/admin/login");
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`${API_URL}/admin/logs?limit=20`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // se o token for inválido, volta pro login
        if (res.status === 401) {
          console.warn("[LOGS] Não autorizado, redirecionando para login");
          logout();
          router.replace("/admin/login");
          return;
        }

        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.error(
            "[LOGS] Erro ao buscar logs:",
            res.status,
            res.statusText,
            errorText
          );
          setErrorMsg(
            `Erro ao buscar logs (status ${res.status}). Veja o console para detalhes.`
          );
          return; // não joga exceção, só mostra mensagem na página
        }

        const data: AdminLog[] = await res.json();
        if (cancelado) return;

        data.sort(
          (a, b) =>
            new Date(b.data).getTime() - new Date(a.data).getTime()
        );
        setLogs(data);
      } catch (err) {
        if (cancelado) return;
        console.error("[LOGS] Erro inesperado ao buscar logs:", err);
        setErrorMsg("Não foi possível carregar os logs de auditoria.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    loadLogs();

    return () => {
      cancelado = true;
    };
  }, [canViewLogs, logout, router]);

  // Se não tem permissão, mostra tela de bloqueio
  if (!canViewLogs) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-5 sm:px-4 lg:py-6 text-slate-50">
        <header className="mb-2">
          <p className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-amber-300">
            Segurança
          </p>
          <h1 className="mt-2 text-lg font-semibold sm:text-xl">
            Acesso negado
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Você não tem permissão para visualizar os{" "}
            <span className="font-semibold">logs de auditoria</span>. Fale com
            o administrador principal da loja para solicitar acesso
            (permissão <code className="text-amber-300">logs_view</code>).
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
          <p className="text-sm text-slate-300">
            Esta área é reservada para monitorar quem fez o quê dentro do
            painel admin, garantindo rastreabilidade e segurança.
          </p>
        </section>
      </main>
    );
  }

  // Admins únicos para filtro
  const adminsOptions = useMemo(() => {
    const map = new Map<number, { id: number; nome: string; role: AdminRole }>();
    for (const log of logs) {
      if (!map.has(log.admin_id)) {
        map.set(log.admin_id, {
          id: log.admin_id,
          nome: log.admin_nome,
          role: log.admin_role,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  }, [logs]);

  // Entidades únicas para filtro
  const entidadesOptions = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      if (log.entidade) set.add(log.entidade);
    }
    return Array.from(set.values()).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [logs]);

  // Aplica filtros em memória (admin, entidade, palavra-chave)
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // filtro por admin
    if (adminFilter !== "all") {
      const id = Number(adminFilter);
      result = result.filter((log) => log.admin_id === id);
    }

    // filtro por entidade
    if (entidadeFilter !== "all") {
      result = result.filter(
        (log) => log.entidade.toLowerCase() === entidadeFilter.toLowerCase()
      );
    }

    // buscar por texto (nome, email, ação, entidade)
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter((log) => {
        return (
          log.admin_nome.toLowerCase().includes(q) ||
          log.admin_email.toLowerCase().includes(q) ||
          log.acao.toLowerCase().includes(q) ||
          log.entidade.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [logs, adminFilter, entidadeFilter, searchText]);

  // Pequenos KPIs
  const totalAdminsAtivos = adminsOptions.length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:px-4 lg:py-6 text-slate-50">
      {/* HEADER */}
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
              Segurança • Auditoria
            </p>
            <h1 className="mt-2 text-lg font-semibold sm:text-xl">
              Logs de auditoria do painel
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 sm:text-xs">
            Monitoramento em tempo quase real de{" "}
            <span className="font-semibold text-emerald-300">
              quem fez o quê
            </span>{" "}
            dentro do admin.
          </p>
        </div>
      </header>

      {/* KPI CARDS */}
      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Registros carregados"
          value={filteredLogs.length}
          helper={`de ${logs.length} eventos`}
        />
        <KpiCard
          label="Eventos registrados"
          value={logs.length}
          helper="no período carregado"
        />
        <KpiCard
          label="Admins ativos"
          value={totalAdminsAtivos}
          helper="com ações registradas"
        />
      </section>

      {/* FILTROS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            {/* Filtro Admin */}
            <div className="flex min-w-[180px] flex-col text-[11px] text-slate-300">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Admin
              </span>
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
              >
                <option value="all">Todos</option>
                {adminsOptions.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.nome} ({adm.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Entidade */}
            <div className="flex min-w-[150px] flex-col text-[11px] text-slate-300">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Entidade
              </span>
              <select
                value={entidadeFilter}
                onChange={(e) => setEntidadeFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 outline-none focus:border-emerald-500"
              >
                <option value="all">Todas</option>
                {entidadesOptions.map((ent) => (
                  <option key={ent} value={ent}>
                    {ent}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Busca por palavra-chave */}
          <div className="flex flex-1 flex-col gap-1 text-[11px] text-slate-300 md:max-w-xs">
            <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Buscar
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filtrar por admin, ação, entidade..."
              className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* TABELA */}
      <section className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/90">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-50">
            Histórico de ações
          </h2>
          <p className="text-[11px] text-slate-400">
            Mostrando{" "}
            <span className="font-semibold">{filteredLogs.length}</span>{" "}
            registros filtrados
          </p>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-300">
            Carregando registros de auditoria...
          </div>
        ) : errorMsg ? (
          <div className="p-4 text-sm text-rose-200">{errorMsg}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">
            Nenhum log encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="sticky left-0 z-10 border-b border-slate-800 bg-slate-900/90 px-3 py-2 text-left">
                    Administrador
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-left">
                    Ação
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-left">
                    Entidade
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-left">
                    ID da entidade
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-left">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const isOdd = index % 2 === 1;
                  return (
                    <tr
                      key={log.id}
                      className={
                        isOdd
                          ? "bg-slate-900/40"
                          : "bg-slate-950/60 hover:bg-slate-900/70"
                      }
                    >
                      {/* Administrador (nome + e-mail) */}
                      <td className="sticky left-0 z-0 whitespace-nowrap border-b border-slate-900/80 bg-inherit px-3 py-2 text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-50">
                            {log.admin_nome || log.admin_email}
                          </span>
                          {log.admin_email && (
                            <span className="text-[10px] text-slate-400">
                              {log.admin_email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ação */}
                      <td className="border-b border-slate-900/80 px-3 py-2 text-xs">
                        <span className="inline-flex rounded-full bg-slate-800/80 px-2 py-[2px] text-[10px] font-medium text-slate-50">
                          {log.acao}
                        </span>
                      </td>

                      {/* Entidade */}
                      <td className="border-b border-slate-900/80 px-3 py-2 text-xs capitalize">
                        {log.entidade}
                      </td>

                      {/* ID da entidade */}
                      <td className="border-b border-slate-900/80 px-3 py-2 text-xs">
                        {log.entidade_id ?? "-"}
                      </td>

                      {/* Data (relativa + formatada) */}
                      <td className="border-b border-slate-900/80 px-3 py-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-100">
                            {formatRelative(log.data)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatDateTime(log.data)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

type KpiCardProps = {
  label: string;
  value: number;
  helper?: string;
};

function KpiCard({ label, value, helper }: KpiCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{helper}</p>
      )}
    </article>
  );
}
