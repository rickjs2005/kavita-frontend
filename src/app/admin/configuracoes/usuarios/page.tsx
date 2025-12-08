"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminRouteGuard } from "@/hooks/useAdminRouteGuard";
import CloseButton from "@/components/buttons/CloseButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

// Gera um slug bonitinho a partir do nome do papel
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Permission = {
  id: number;
  chave: string;
  grupo: string;
  descricao: string | null;
};

type Role = {
  id: number;
  name: string;
  description?: string | null;
  slug?: string;
  permissions: string[]; // lista de chaves (ex: ["products_manage", "logs_view"])
};

export default function AdminUserPermissionsConfigPage() {
  const router = useRouter();
  const { logout, hasPermission } = useAdminAuth();

  // 🔐 Proteção de rota — exige as duas permissões
  const { allowed, checking } = useAdminRouteGuard({
    permission: ["roles_manage", "permissions_manage"],
    redirectTo: "/admin",
  });

  // ainda usamos essa checagem só para controlar a UI de "Criar permissão"
  const canManagePermissions = hasPermission("permissions_manage");

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // novo papel
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  // nova permissão
  const [newPermKey, setNewPermKey] = useState("");
  const [newPermGroup, setNewPermGroup] = useState("");
  const [newPermDescription, setNewPermDescription] = useState("");
  const [creatingPerm, setCreatingPerm] = useState(false);

  // 🔍 filtros da matriz
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 🔄 Carrega dados só depois que o hook liberar o acesso
  useEffect(() => {
    if (checking || !allowed) return;

    async function loadData() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const [rolesRes, permsRes] = await Promise.all([
          fetch(`${API_URL}/admin/roles`, {
            credentials: "include", // 🔐 cookie HttpOnly
          }),
          fetch(`${API_URL}/admin/permissions`, {
            credentials: "include",
          }),
        ]);

        // sessão expirada ou sem permissão
        if (
          rolesRes.status === 401 ||
          rolesRes.status === 403 ||
          permsRes.status === 401 ||
          permsRes.status === 403
        ) {
          toast.error("Sessão expirada. Faça login novamente.");
          logout();
          router.replace("/admin/login");
          return;
        }

        if (!rolesRes.ok) {
          const data = await rolesRes.json().catch(() => null);
          throw new Error(data?.message || "Erro ao buscar papéis");
        }
        if (!permsRes.ok) {
          const data = await permsRes.json().catch(() => null);
          throw new Error(data?.message || "Erro ao buscar permissões");
        }

        const rolesData = await rolesRes.json();
        const permsData: Permission[] = await permsRes.json();

        const mappedRoles: Role[] = Array.isArray(rolesData)
          ? rolesData.map((r: any) => ({
              id: r.id,
              name: r.name ?? r.nome ?? "",
              description: r.description ?? r.descricao ?? "",
              slug: r.slug,
              permissions: Array.isArray(r.permissions)
                ? r.permissions
                    .map((p: any) => {
                      if (typeof p === "string") return p;
                      if (p.key) return p.key;
                      if (p.chave) return p.chave;
                      return "";
                    })
                    .filter(Boolean)
                : [],
            }))
          : [];

        setRoles(mappedRoles);
        setPermissions(permsData);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(
          err?.message ||
            "Não foi possível carregar papéis e permissões no momento."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [allowed, checking, logout, router]);

  // grupos únicos para o select do filtro
  const permissionGroups = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((p) => {
      if (p.grupo) set.add(p.grupo);
    });
    return Array.from(set).sort();
  }, [permissions]);

  // aplica filtros (grupo + busca)
  const filteredPermissions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return permissions.filter((p) => {
      const matchGroup =
        filterGroup === "all" ? true : p.grupo === filterGroup;

      if (!matchGroup) return false;

      if (!term) return true;

      const inKey = p.chave.toLowerCase().includes(term);
      const inDesc = (p.descricao ?? "").toLowerCase().includes(term);

      return inKey || inDesc;
    });
  }, [permissions, filterGroup, searchTerm]);

  // Enquanto o hook está checando, exibimos um skeleton simples
  if (checking) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 text-slate-50 sm:px-8">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
              Configurações • Usuários & Permissões
            </p>
            <div className="mt-2 h-5 w-48 animate-pulse rounded bg-slate-800" />
          </div>
          {/* Close no mobile */}
          <div className="sm:hidden">
            <CloseButton className="text-slate-400 hover:text-slate-100 text-3xl" />
          </div>
        </header>
        <section className="mt-4 h-40 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/80" />
      </main>
    );
  }

  // Se não foi permitido, o hook já redirecionou para /admin
  if (!allowed) {
    return null;
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) return;

    const nome = newRoleName.trim();
    const descricao = newRoleDescription.trim();
    const slug = slugify(nome);

    setCreatingRole(true);
    try {
      const res = await fetch(`${API_URL}/admin/roles`, {
        method: "POST",
        credentials: "include", // 🔐 cookie HttpOnly
        headers: {
          "Content-Type": "application/json",
        },
        // Mandamos com ambos os nomes para ficar compatível com qualquer backend:
        body: JSON.stringify({
          name: nome,
          nome,
          slug,
          description: descricao || undefined,
          descricao: descricao || undefined,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.");
        logout();
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao criar papel");
      }

      const created = await res.json();
      const newRole: Role = {
        id: created.id,
        name: created.name ?? created.nome ?? nome,
        description:
          created.description ?? created.descricao ?? (descricao || ""),
        slug: created.slug ?? slug,
        permissions: Array.isArray(created.permissions)
          ? created.permissions
              .map((p: any) => {
                if (typeof p === "string") return p;
                if (p.key) return p.key;
                if (p.chave) return p.chave;
                return "";
              })
              .filter(Boolean)
          : [],
      };

      setRoles((prev) => [...prev, newRole]);
      setNewRoleName("");
      setNewRoleDescription("");
      toast.success("Papel criado com sucesso.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao criar papel.");
    } finally {
      setCreatingRole(false);
    }
  }

  async function handleCreatePermission() {
    if (!newPermKey.trim() || !newPermGroup.trim()) return;

    const chave = newPermKey.trim().toLowerCase();
    const grupo = newPermGroup.trim();
    const descricao = newPermDescription.trim();

    setCreatingPerm(true);
    try {
      const res = await fetch(`${API_URL}/admin/permissions`, {
        method: "POST",
        credentials: "include", // 🔐 cookie HttpOnly
        headers: {
          "Content-Type": "application/json",
        },
        // compatível com o backend: { chave, grupo, descricao }
        body: JSON.stringify({
          chave,
          grupo,
          descricao: descricao || undefined,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.");
        logout();
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erro ao criar permissão");
      }

      const created: Permission = await res.json();
      setPermissions((prev) => [...prev, created]);
      setNewPermKey("");
      setNewPermGroup("");
      setNewPermDescription("");
      toast.success("Permissão criada com sucesso.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao criar permissão.");
    } finally {
      setCreatingPerm(false);
    }
  }

  async function handleToggleRolePermission(
    roleId: number,
    permKey: string,
    checked: boolean
  ) {
    const previousRoles = roles;
    const updatedRoles = roles.map((role) => {
      if (role.id !== roleId) return role;
      const alreadyHas = role.permissions.includes(permKey);
      let newPermissions = role.permissions;

      if (checked && !alreadyHas) {
        newPermissions = [...role.permissions, permKey];
      } else if (!checked && alreadyHas) {
        newPermissions = role.permissions.filter((p) => p !== permKey);
      }

      return { ...role, permissions: newPermissions };
    });

    setRoles(updatedRoles);

    try {
      const roleToUpdate = updatedRoles.find((r) => r.id === roleId);
      if (!roleToUpdate) return;

      const res = await fetch(`${API_URL}/admin/roles/${roleId}`, {
        method: "PUT",
        credentials: "include", // 🔐 cookie HttpOnly
        headers: {
          "Content-Type": "application/json",
        },
        // aqui assumimos que o backend aceita uma lista de chaves
        body: JSON.stringify({
          permissions: roleToUpdate.permissions,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.");
        logout();
        router.replace("/admin/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message || "Erro ao atualizar permissões do papel"
        );
      }

      toast.success("Permissões do papel atualizadas.");
    } catch (err: any) {
      console.error(err);
      setRoles(previousRoles);
      toast.error(err?.message || "Erro ao atualizar permissões.");
    }
  }

 return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 text-slate-50 sm:px-8">
      {/* Header estilo logs/equipe + Close mobile */}
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
            Configurações • Usuários & Permissões
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Papéis e permissões
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Defina os papéis administrativos (master, gerente, suporte,
            leitura, etc.) e quais permissões cada um deles possui dentro do
            painel.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Só no mobile: botão de fechar, igual logs/equipe */}
          <div className="sm:hidden">
            <CloseButton className="text-slate-400 hover:text-slate-100 text-3xl" />
          </div>
        </div>
      </header>

      {loading ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200">
          Carregando papéis e permissões...
        </section>
      ) : errorMsg ? (
        <section className="rounded-2xl border border-rose-900/60 bg-rose-950/40 p-4 text-sm text-rose-100">
          {errorMsg}
        </section>
      ) : (
        <>
          {/* Seção de criação de papel e permissão */}
          <section className="grid gap-4 lg:grid-cols-2">
            {/* Novo papel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Criar novo papel</h2>
                <span className="text-[11px] text-slate-400">
                  Ex: master, gerente_marketing, suporte_financeiro
                </span>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Nome do papel
                  </label>
                  <input
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
                    placeholder="Ex: master, gerente_marketing"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  {newRoleName.trim() && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Slug gerado:{" "}
                      <span className="font-mono">
                        {slugify(newRoleName.trim())}
                      </span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Descrição (opcional)
                  </label>
                  <textarea
                    className="min-h-[60px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    placeholder="Ex: Acesso total a todos os módulos do painel."
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={creatingRole || !newRoleName.trim()}
                    onClick={handleCreateRole}
                    className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {creatingRole ? "Salvando..." : "Criar papel"}
                  </button>
                </div>
              </div>
            </div>

            {/* Nova permissão */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Criar nova permissão</h2>
                <span className="text-[11px] text-slate-400">
                  Disponível apenas para quem tem permissions_manage
                </span>
              </div>

              {!canManagePermissions ? (
                <p className="text-xs text-slate-500">
                  Seu usuário não possui a permissão{" "}
                  <span className="font-semibold">permissions_manage</span>.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Chave da permissão (key)
                    </label>
                    <input
                      className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
                      placeholder="Ex: products_manage, orders_view"
                      value={newPermKey}
                      onChange={(e) => setNewPermKey(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Grupo
                    </label>
                    <input
                      className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
                      placeholder="Ex: produtos, pedidos, relatorios, marketing..."
                      value={newPermGroup}
                      onChange={(e) => setNewPermGroup(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Descrição (opcional)
                    </label>
                    <textarea
                      className="min-h-[60px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      placeholder="Explique onde essa permissão será usada dentro do painel."
                      value={newPermDescription}
                      onChange={(e) => setNewPermDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={
                        creatingPerm ||
                        !newPermKey.trim() ||
                        !newPermGroup.trim()
                      }
                      onClick={handleCreatePermission}
                      className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {creatingPerm ? "Salvando..." : "Criar permissão"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Matriz de papéis x permissões */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90">
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    Matriz de papéis x permissões
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Marque quais permissões cada papel administrativo possui.
                    Essa é a base do controle de acesso do seu painel.
                  </p>
                </div>
                <div className="text-[11px] text-slate-400">
                  {roles.length} papel(is) • {permissions.length} permissão(ões)
                </div>
              </div>

              {/* Filtros (grupo + busca) */}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <select
                    className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                  >
                    <option value="all">Todos os grupos</option>
                    {permissionGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-1 gap-2 sm:justify-end">
                  <input
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 sm:max-w-xs"
                    placeholder="Buscar permissão por chave ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {roles.length === 0 || permissions.length === 0 ? (
              <div className="p-4 text-sm text-slate-300">
                Cadastre ao menos um papel e uma permissão para começar a
                configurar a matriz.
              </div>
            ) : filteredPermissions.length === 0 ? (
              <div className="p-4 text-sm text-slate-300">
                Nenhuma permissão encontrada com os filtros atuais.
              </div>
            ) : (
              <>
                {/* Mobile: cards por permissão, com papéis em grid */}
                <div className="md:hidden divide-y divide-slate-900/80">
                  {filteredPermissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="px-4 py-3 hover:bg-slate-950/80 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-50">
                          {perm.chave}
                        </span>
                        <span className="text-[11px] text-emerald-300">
                          Grupo: {perm.grupo}
                        </span>
                        {perm.descricao && (
                          <span className="text-[11px] text-slate-400">
                            {perm.descricao}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {roles.map((role) => {
                          const checked = role.permissions.includes(
                            perm.chave
                          );
                          return (
                            <label
                              key={role.id}
                              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2 text-[11px]"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-emerald-500"
                                checked={checked}
                                onChange={(e) =>
                                  handleToggleRolePermission(
                                    role.id,
                                    perm.chave,
                                    e.target.checked
                                  )
                                }
                              />
                              <span className="text-slate-100">
                                {role.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: tabela matriz completa */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="border-b border-slate-800 px-3 py-2 text-left">
                          Permissão
                        </th>
                        {roles.map((role) => (
                          <th
                            key={role.id}
                            className="border-b border-slate-800 px-3 py-2 text-center"
                          >
                            {role.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPermissions.map((perm, index) => (
                        <tr
                          key={perm.id}
                          className={
                            index % 2 === 0
                              ? "bg-slate-950/60"
                              : "bg-slate-900/40"
                          }
                        >
                          <td className="border-b border-slate-900/80 px-3 py-2 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-slate-50">
                                {perm.chave}
                              </span>
                              <span className="text-[11px] text-emerald-300">
                                Grupo: {perm.grupo}
                              </span>
                              {perm.descricao && (
                                <span className="text-[11px] text-slate-500">
                                  {perm.descricao}
                                </span>
                              )}
                            </div>
                          </td>
                          {roles.map((role) => {
                            const checked = role.permissions.includes(
                              perm.chave
                            );
                            return (
                              <td
                                key={role.id}
                                className="border-b border-slate-900/80 px-3 py-2 text-center align-middle"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-emerald-500"
                                  checked={checked}
                                  onChange={(e) =>
                                    handleToggleRolePermission(
                                      role.id,
                                      perm.chave,
                                      e.target.checked
                                    )
                                  }
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}