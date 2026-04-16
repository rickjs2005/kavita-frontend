"use client";

// src/app/painel/corretora/equipe/EquipeClient.tsx
//
// Página de gestão da equipe da corretora (Sprint 6A). Acessível a
// owner e manager. Apenas owner pode convidar / remover / mudar role.

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { PanelCard } from "@/components/painel-corretora/PanelCard";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import {
  can,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type CorretoraRole,
  type CorretoraTeamMember,
} from "@/types/corretoraUser";

const ROLE_OPTIONS: { value: CorretoraRole; label: string }[] = [
  { value: "owner", label: "Dono(a)" },
  { value: "manager", label: "Gerente" },
  { value: "sales", label: "Comercial" },
  { value: "viewer", label: "Visualização" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function EquipeClient() {
  const { user } = useCorretoraAuth();
  const [members, setMembers] = useState<CorretoraTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const canInvite = can(user?.role, "team.invite");
  const canChangeRole = can(user?.role, "team.change_role");
  const canRemove = can(user?.role, "team.remove");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<CorretoraTeamMember[]>(
        "/api/corretora/team",
      );
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar equipe.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (memberId: number, newRole: CorretoraRole) => {
    try {
      await apiClient.patch(`/api/corretora/team/${memberId}/role`, {
        role: newRole,
      });
      toast.success("Perfil atualizado.");
      await load();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao alterar perfil.").message);
    }
  };

  const removeMember = async (memberId: number, nome: string) => {
    if (!window.confirm(`Remover ${nome} da equipe?`)) return;
    try {
      await apiClient.request(`/api/corretora/team/${memberId}`, {
        method: "DELETE",
      });
      toast.success("Usuário removido.");
      await load();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao remover.").message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          Equipe
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
              Sua equipe
            </h1>
            <p className="mt-1 text-sm text-stone-400">
              {members.length === 1
                ? "1 pessoa nesta sala."
                : `${members.length} pessoas nesta sala.`}
            </p>
          </div>
          {canInvite && (
            <button
              type="button"
              onClick={() => setShowInvite((v) => !v)}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-200 hover:to-amber-400"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              {showInvite ? "Fechar" : "+ Convidar"}
            </button>
          )}
        </div>
      </div>

      {/* Form de convite (owner only) */}
      {canInvite && showInvite && (
        <InviteForm
          onInvited={() => {
            setShowInvite(false);
            load();
          }}
        />
      )}

      {/* Lista da equipe */}
      {loading ? (
        <PanelCard density="spacious" className="text-center">
          <p className="text-xs text-stone-500">Carregando equipe...</p>
        </PanelCard>
      ) : (
        <PanelCard flush>
          <ul className="divide-y divide-white/[0.06]">
            {members.map((m) => (
              <li
                key={m.id}
                className={`px-5 py-4 md:px-6 md:py-5 ${m.is_active ? "" : "opacity-50"}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-stone-100">
                        {m.nome}
                      </p>
                      <RoleBadge role={m.role} />
                      {!m.activated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/30">
                          Convite pendente
                        </span>
                      )}
                      {!m.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold text-stone-400 ring-1 ring-white/[0.06]">
                          Removido
                        </span>
                      )}
                      {user?.id === m.id && (
                        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-300">
                          · você
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-400">
                      <span>{m.email}</span>
                      <span aria-hidden className="text-stone-600">·</span>
                      <span>
                        Último login: {formatDate(m.last_login_at)}
                      </span>
                    </div>
                  </div>

                  {m.is_active && user?.id !== m.id && (
                    <div className="flex shrink-0 items-center gap-2">
                      {canChangeRole && (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            changeRole(m.id, e.target.value as CorretoraRole)
                          }
                          className="rounded-lg border border-white/10 bg-stone-800 px-2.5 py-1.5 text-xs font-medium text-stone-100 shadow-sm focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/25 [color-scheme:dark]"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} style={{ backgroundColor: "#1c1917", color: "#f5f5f4" }}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => removeMember(m.id, m.nome)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: CorretoraRole }) {
  const colors: Record<CorretoraRole, string> = {
    owner: "bg-amber-400 text-stone-950 ring-amber-300/60",
    manager: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
    sales: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
    viewer: "bg-stone-800 text-stone-300 ring-white/[0.06]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ${colors[role]}`}
      title={ROLE_DESCRIPTIONS[role]}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function InviteForm({ onInvited }: { onInvited: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CorretoraRole>("sales");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/api/corretora/team", {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        role,
      });
      toast.success("Convite enviado por e-mail.");
      setNome("");
      setEmail("");
      setRole("sales");
      onInvited();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao convidar.").message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PanelCard density="spacious">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-stone-100">
            Convidar novo membro
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            Enviamos um e-mail com link para a pessoa definir a senha.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              minLength={3}
              maxLength={150}
              className="w-full rounded-xl border border-white/10 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/25 [color-scheme:dark]"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/25 [color-scheme:dark]"
              placeholder="email@corretora.com.br"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Perfil de acesso
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.filter((o) => o.value !== "owner").map((opt) => {
              const checked = role === opt.value;
              return (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setRole(opt.value)}
                    className="peer sr-only"
                  />
                  <div className="rounded-xl border border-white/10 bg-stone-950 p-3 transition-all hover:border-amber-400/30 peer-checked:border-amber-400/60 peer-checked:bg-amber-400/10">
                    <p className="text-sm font-semibold text-stone-100">
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-400">
                      {ROLE_DESCRIPTIONS[opt.value]}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-stone-400">
            Para promover alguém a dono(a), convide como Gerente primeiro e
            depois altere o perfil.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Enviar convite"}
          </button>
        </div>
      </form>
    </PanelCard>
  );
}
