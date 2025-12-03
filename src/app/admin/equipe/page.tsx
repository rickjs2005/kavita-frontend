"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminRouteGuard } from "@/hooks/useAdminRouteGuard"; // ⬅ novo

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

type AdminRow = {
  id: number;
  nome: string;
  email: string;
  role: string; // slug do papel
  ativo: number;
};

type RoleRow = {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
};

function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("adminToken") ?? "";
  } catch {
    return "";
  }
}

export default function EquipePage() {
  const router = useRouter();
  const { logout, hasPermission } = useAdminAuth();

  // 🔐 Proteção da rota — só entra quem tem admins_view OU admins_manage
  const { allowed, checking } = useAdminRouteGuard({
    permission: ["admins_view", "admins_manage"],
    redirectTo: "/admin",
  });

  // 🔐 Controle de quem pode criar/editar
  const canManageTeam = hasPermission("admins_manage");

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null);

  // 🔄 Só carrega dados quando permitido
  const fetchData = useCallback(async () => {
    if (!allowed) return;

    const token = getAdminToken();
    if (!token) {
      logout();
      router.replace("/admin/login");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [adminsRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/admin/admins`, { headers }),
        fetch(`${API_URL}/admin/roles`, { headers }),
      ]);

      if (adminsRes.status === 401 || rolesRes.status === 401) {
        logout();
        router.replace("/admin/login");
        return;
      }

      if (!adminsRes.ok || !rolesRes.ok) {
        throw new Error("Erro ao carregar administradores.");
      }

      const [adminsJson, rolesJson] = await Promise.all([
        adminsRes.json(),
        rolesRes.json(),
      ]);

      setAdmins(adminsJson);
      setRoles(rolesJson);
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível carregar a equipe administrativa.");
    } finally {
      setLoading(false);
    }
  }, [allowed, logout, router]);

  useEffect(() => {
    if (allowed) fetchData();
  }, [allowed, fetchData]);

  const totalAtivos = admins.filter((a) => a.ativo).length;

  // =========================
  // 🔐 ESTADO DE PROTEÇÃO
  // =========================

  if (checking) {
    return (
      <main className="p-6 text-slate-50">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-900" />
      </main>
    );
  }

  if (!allowed) return null; // o hook já redirecionou

  // =========================
  // A PARTIR DAQUI É SUA PÁGINA NORMAL
  // =========================

  async function handleCreateAdmin(payload: {
    nome: string;
    email: string;
    senha: string;
    papelSlug: string;
  }) {
    if (!canManageTeam) return;

    const token = getAdminToken();
    if (!token) {
      logout();
      router.replace("/admin/login");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/admin/admins`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: payload.nome,
          email: payload.email,
          senha: payload.senha,
          papel: payload.papelSlug,
        }),
      });

      if (res.status === 401) {
        logout();
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Erro ao criar administrador.");
      }

      setShowCreateForm(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditAdmin(payload: {
    id: number;
    papelSlug: string;
    ativo: boolean;
  }) {
    if (!canManageTeam) return;

    const token = getAdminToken();
    if (!token) {
      logout();
      router.replace("/admin/login");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/admin/admins/${payload.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          papel: payload.papelSlug,
          ativo: payload.ativo ? 1 : 0,
        }),
      });

      if (res.status === 401) {
        logout();
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Erro ao atualizar administrador.");
      }

      setEditingAdmin(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // UI
  // =========================

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 text-slate-50 sm:px-4 lg:py-6">
      {/* HEADER */}
      <header className="space-y-2">
        <p className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] uppercase tracking-wide text-emerald-300">
          Equipe • Administradores
        </p>

        <h1 className="mt-2 text-xl font-semibold">Gestão da equipe administrativa</h1>

        <p className="mt-1 text-sm text-slate-400">
          Controle quem acessa o painel, qual papel cada um possui e o status da conta.
        </p>

        <div className="flex gap-2 text-xs text-slate-400">
          <span>
            <span className="font-semibold text-emerald-300">{totalAtivos}</span> ativos
          </span>
          <span>•</span>
          <span>
            <span className="font-semibold">{admins.length}</span> total
          </span>
        </div>
      </header>

      {/* ERRO */}
      {errorMsg && (
        <section className="rounded-xl border border-red-500/50 bg-red-900/20 p-3 text-sm text-red-200">
          {errorMsg}
        </section>
      )}

      {/* FORM CRIAÇÃO / EDIÇÃO */}
      {canManageTeam && (showCreateForm || editingAdmin) && (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
          <AdminForm
            mode={showCreateForm ? "create" : "edit"}
            roles={roles}
            admin={editingAdmin}
            saving={saving}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingAdmin(null);
            }}
            onSubmit={async (values) => {
              if (showCreateForm) {
                await handleCreateAdmin({
                  nome: values.nome,
                  email: values.email,
                  senha: values.senha,
                  papelSlug: values.papelSlug,
                });
              } else if (editingAdmin) {
                await handleEditAdmin({
                  id: editingAdmin.id,
                  papelSlug: values.papelSlug,
                  ativo: values.ativo,
                });
              }
            }}
          />
        </section>
      )}

      {/* TABELA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-50">Administradores</h2>
          <p className="text-[11px] text-slate-400">Nome, email, papel e status</p>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-300">Carregando...</div>
        ) : admins.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">Nenhum administrador encontrado.</div>
        ) : (
          <table className="min-w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Papel</th>
                <th className="px-3 py-2">Status</th>
                {canManageTeam && <th className="px-3 py-2 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {admins.map((adm, index) => {
                const roleInfo = roles.find((r) => r.slug === adm.role);

                return (
                  <tr
                    key={adm.id}
                    className={
                      index % 2 === 0
                        ? "bg-slate-950/60"
                        : "bg-slate-900/40"
                    }
                  >
                    <td className="px-3 py-2 text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium">{adm.nome}</span>
                        <span className="text-[10px] text-slate-500">#{adm.id}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-xs">{adm.email}</td>

                    <td className="px-3 py-2 text-xs">
                      <span className="rounded-full bg-slate-800/80 px-2 py-[2px] text-[10px]">
                        {roleInfo?.nome ?? adm.role}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {adm.ativo ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] font-semibold text-emerald-300">
                          Ativo
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-700/40 px-2 py-[2px] text-[10px] font-semibold">
                          Inativo
                        </span>
                      )}
                    </td>

                    {canManageTeam && (
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => {
                            setShowCreateForm(false);
                            setEditingAdmin(adm);
                          }}
                          className="rounded-md bg-slate-800 px-3 py-1.5 text-[11px] hover:bg-slate-700"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

/* ===========================================
   FORM DO ADMIN (SEM ALTERAR SUA LÓGICA)
=========================================== */

type AdminFormValues = {
  nome: string;
  email: string;
  senha: string;
  papelSlug: string;
  ativo: boolean;
};

type AdminFormProps = {
  mode: "create" | "edit";
  roles: RoleRow[];
  admin: AdminRow | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: AdminFormValues) => Promise<void>;
};

function AdminForm({ mode, roles, admin, saving, onCancel, onSubmit }: AdminFormProps) {
  const isEdit = mode === "edit";

  const [nome, setNome] = useState(admin?.nome ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [senha, setSenha] = useState("");
  const [papelSlug, setPapelSlug] = useState(admin?.role ?? roles[0]?.slug ?? "");
  const [ativo, setAtivo] = useState(admin ? !!admin.ativo : true);

  useEffect(() => {
    if (admin) {
      setNome(admin.nome);
      setEmail(admin.email);
      setPapelSlug(admin.role);
      setAtivo(!!admin.ativo);
    }
  }, [admin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await onSubmit({
      nome,
      email,
      senha,
      papelSlug,
      ativo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-50">
          {isEdit ? "Editar administrador" : "Novo administrador"}
        </h2>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          Fechar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-xs text-slate-300">Nome</label>
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={nome}
            required
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-300">Email</label>
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            type="email"
            required
            disabled={isEdit}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {!isEdit && (
        <div className="flex flex-col">
          <label className="text-xs text-slate-300">Senha</label>
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            type="password"
            minLength={6}
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-xs text-slate-300">Papel</label>
          <select
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            required
            value={papelSlug}
            onChange={(e) => setPapelSlug(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>

        <label className="mt-6 inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900"
          />
          Conta ativa
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar administrador"}
        </button>
      </div>
    </form>
  );
}
