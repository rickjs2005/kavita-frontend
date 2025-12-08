"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, AdminRole } from "@/context/AdminAuthContext";
import { KpiCard } from "@/components/admin/KpiCard";
import CloseButton from "@/components/buttons/CloseButton";
import { FiUsers, FiUserCheck, FiClock } from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

type AdminRow = {
  id: number;
  nome: string;
  email: string;
  role: AdminRole | string;
  ativo: 0 | 1;
  criado_em: string;
  ultimo_login: string | null;
};

type RoleRow = {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
};

function parseAdminDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  const isoCandidate = new Date(dateStr);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate;
  }

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

  return null;
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const dt = parseAdminDate(dateStr);
  if (!dt) return dateStr || "—";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(dt);
}

function formatRelative(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const dt = parseAdminDate(dateStr);
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

export default function EquipePage() {
  const router = useRouter();
  const { hasPermission, logout } = useAdminAuth();

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [roleSlug, setRoleSlug] = useState("");

  const canManageAdmins = hasPermission("admins_manage");

  // ===========================
  //    🔐 SEGURANÇA NOVA
  // ===========================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const [adminsRes, rolesRes] = await Promise.all([
          fetch(`${API_URL}/admin/admins`, {
            credentials: "include", // ⬅️ AGORA É ASSIM
          }),
          fetch(`${API_URL}/admin/roles`, {
            credentials: "include",
          }),
        ]);

        if (adminsRes.status === 401 || rolesRes.status === 401) {
          logout();
          router.replace("/admin/login");
          return;
        }

        if (!adminsRes.ok)
          throw new Error("Erro ao carregar administradores.");
        if (!rolesRes.ok) throw new Error("Erro ao carregar papéis.");

        const adminsData: AdminRow[] = await adminsRes.json();
        const rolesData: RoleRow[] = await rolesRes.json();

        const orderedAdmins = [...adminsData].sort((a, b) => {
          const da = parseAdminDate(a.criado_em);
          const db = parseAdminDate(b.criado_em);
          return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
        });

        setAdmins(orderedAdmins);
        setRoles(rolesData);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Erro inesperado ao carregar equipe.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [logout, router]);

  // Criar admin com cookie HttpOnly
  async function handleCreateAdmin(event: FormEvent) {
    event.preventDefault();

    if (!nome || !email || !senha || !roleSlug) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/admins`, {
        method: "POST",
        credentials: "include", // 🔐 obrigatório agora
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
          role: roleSlug.toLowerCase(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        logout();
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) throw new Error(data?.message || "Erro ao criar admin.");

      const refetch = await fetch(`${API_URL}/admin/admins`, {
        credentials: "include",
      });

      if (refetch.ok) {
        const adminsData: AdminRow[] = await refetch.json();
        const ordered = [...adminsData].sort((a, b) => {
          const da = parseAdminDate(a.criado_em);
          const db = parseAdminDate(b.criado_em);
          return (db?.getTime() ?? 0) - (da?.getTime() ?? 0);
        });
        setAdmins(ordered);
      }

      setNome("");
      setEmail("");
      setSenha("");
      setRoleSlug("");
      setShowForm(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao criar administrador.");
    }
  }

  // KPIs
  const totalAdmins = admins.length;
  const ativos = admins.filter((a) => a.ativo === 1).length;

  const lastLoginStr = useMemo(() => {
    let best: { date: Date; raw: string } | null = null;
    for (const admin of admins) {
      if (!admin.ultimo_login) continue;
      const dt = parseAdminDate(admin.ultimo_login);
      if (dt && (!best || dt > best.date)) best = { date: dt, raw: admin.ultimo_login };
    }
    return best?.raw ?? null;
  }, [admins]);

  const lastLoginLabel = lastLoginStr ? formatRelative(lastLoginStr) : "—";
  const lastLoginHelper = lastLoginStr
    ? `Último acesso em ${formatDateTime(lastLoginStr)}`
    : "Nenhum administrador acessou ainda";

   return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-8">
      {/* HEADER COM X NO TOPO */}
      <header className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* X fixo no topo direito (somente mobile) */}
        <div className="absolute right-0 top-0 sm:hidden">
          <CloseButton className="text-3xl text-slate-400 hover:text-slate-100" />
        </div>

        <div className="flex-1 space-y-1 pr-10 sm:pr-0">
          <p className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300">
            Equipe · Administradores
          </p>
          <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
            Gestão da equipe administrativa
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Controle quem acessa o painel, qual papel cada um possui, o status
            da conta e o histórico de acessos da sua equipe.
          </p>
        </div>

        {/* Botão de ação à direita no desktop */}
        {canManageAdmins && (
          <div className="hidden sm:flex">
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
            >
              + Novo administrador
            </button>
          </div>
        )}
      </header>

      {/* Botão separado no mobile (linha própria, full width) */}
      {canManageAdmins && (
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            + Novo administrador
          </button>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total de administradores"
          value={totalAdmins}
          helper="contas cadastradas no painel"
          icon={<FiUsers />}
          variant="default"
        />
        <KpiCard
          label="Administradores ativos"
          value={ativos}
          helper={
            totalAdmins > 0
              ? `de ${totalAdmins} conta(s) habilitada(s)`
              : "Nenhum administrador cadastrado ainda"
          }
          icon={<FiUserCheck />}
          variant="success"
        />
        <KpiCard
          label="Último acesso"
          value={lastLoginLabel}
          helper={lastLoginHelper}
          icon={<FiClock />}
          variant="warning"
        />
      </section>

      {/* Formulário de criação */}
      {canManageAdmins && showForm && (
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-50">
            Criar novo administrador
          </h2>
          <p className="text-xs text-slate-400">
            Defina os dados de acesso do novo membro da equipe. Ele utilizará
            esse e-mail e senha na tela de login do painel.
          </p>

          <form
            onSubmit={handleCreateAdmin}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">Nome</label>
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Gerente"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">E-mail</label>
              <input
                type="email"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: gerente@kavita.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">Senha</label>
              <input
                type="password"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Defina uma senha segura"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">Papel</label>
              <select
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                value={roleSlug}
                onChange={(e) => setRoleSlug(e.target.value)}
              >
                <option value="">Selecione um papel</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.slug}>
                    {role.nome} ({role.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Criar administrador
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Lista de admins */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Administradores
          </h2>
          <span className="text-xs text-slate-500">
            {ativos} ativos · {totalAdmins} no total
          </span>
        </header>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-400">
            Carregando administradores...
          </div>
        ) : errorMsg ? (
          <div className="px-4 py-6 text-sm text-red-400">{errorMsg}</div>
        ) : admins.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">
            Nenhum administrador cadastrado ainda.
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="divide-y divide-slate-800/70 md:hidden">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-400">Administrador</p>
                      <p className="text-sm font-semibold text-slate-100">
                        {admin.nome}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {admin.email}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Criado em {formatDateTime(admin.criado_em)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-100">
                        {String(admin.role).toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          admin.ativo
                            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : "border border-red-500/40 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {admin.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400">
                        Último login
                      </span>
                      <span className="text-xs text-slate-200">
                        {admin.ultimo_login
                          ? formatRelative(admin.ultimo_login)
                          : "Nunca acessou"}
                      </span>
                      {admin.ultimo_login && (
                        <span className="text-[11px] text-slate-500">
                          {formatDateTime(admin.ultimo_login)}
                        </span>
                      )}
                    </div>

                    <div className="ml-auto flex flex-col text-right">
                      <span className="text-[11px] text-slate-400">
                        ID interno
                      </span>
                      <span className="text-sm text-slate-200">
                        #{admin.id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Administrador
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Papel
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Criado em
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">
                      Último login
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-slate-800/80 transition-colors hover:bg-slate-900/80"
                    >
                      <td className="px-4 py-3 text-slate-100">
                        <div className="flex flex-col">
                          <span className="font-medium">{admin.nome}</span>
                          <span className="text-[11px] text-slate-500">
                            {admin.email}
                          </span>
                          <span className="mt-1 text-[11px] text-slate-600">
                            ID #{admin.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-100">
                          {String(admin.role).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            admin.ativo
                              ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                              : "border border-red-500/40 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {admin.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatDateTime(admin.criado_em)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-200">
                            {admin.ultimo_login
                              ? formatRelative(admin.ultimo_login)
                              : "Nunca acessou"}
                          </span>
                          {admin.ultimo_login && (
                            <span className="text-[11px] text-slate-500">
                              {formatDateTime(admin.ultimo_login)}
                            </span>
                          )}
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
