"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Perfil = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string | null;
  ponto_referencia?: string | null;
};

export default function MeusDadosPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [original, setOriginal] = useState<Perfil | null>(null);

  const ui = {
    wrap: "pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 lg:px-10",
    container: "mx-auto w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl",
    card: "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden",
    header: "border-b border-gray-100 p-5 sm:p-6 lg:p-7",
    title: "text-base sm:text-lg md:text-xl font-semibold tracking-tight",
    subtitle: "mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed",
    form: "p-5 sm:p-6 lg:p-8",
    grid: "grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2",
    field: "flex flex-col gap-1.5",
    label: "text-sm text-gray-700",
    input:
      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 sm:py-3 text-sm " +
      "outline-none transition min-h-[44px] " +
      "focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20 placeholder:text-gray-400",
    inputDisabled:
      "w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 sm:py-3 text-sm " +
      "text-gray-600 cursor-not-allowed min-h-[44px]",
    footer: "mt-6 sm:mt-8 flex justify-end",
    btn:
      "inline-flex items-center justify-center rounded-lg bg-[#359293] px-5 sm:px-6 py-3 " +
      "text-white text-sm sm:text-base shadow-sm transition hover:bg-[#2b7778] " +
      "disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto",
    skeletonTitle: "h-7 sm:h-8 w-44 sm:w-48 rounded bg-gray-200 mb-6",
    skeletonCard: "h-64 rounded-2xl bg-gray-200",
  };

  // carregar perfil
  useEffect(() => {
    let alive = true;

    if (!user?.id) {
      setLoading(false);
      toast.error("Faça login para ver seus dados.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          credentials: "include",
          headers: { "x-user-id": String(user.id) },
        });
        if (!res.ok) throw new Error("Não foi possível carregar seus dados.");
        const data = (await res.json()) as Perfil;
        if (alive) {
          setPerfil(data);
          setOriginal(data);
        }
      } catch (e: any) {
        toast.error(e.message || "Falha ao carregar.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  // helpers
  const set =
    (k: keyof Perfil) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      perfil && setPerfil({ ...perfil, [k]: e.target.value });

  const diff = useMemo(() => {
    if (!perfil || !original) return {};
    const out: Partial<Perfil> = {};
    (
      [
        "nome",
        "telefone",
        "cpf",
        "endereco",
        "cidade",
        "estado",
        "cep",
        "pais",
        "ponto_referencia",
      ] as (keyof Perfil)[]
    ).forEach((k) => {
      const cur = (perfil as any)[k] ?? null;
      const old = (original as any)[k] ?? null;
      if (cur !== old) (out as any)[k] = cur ?? "";
    });
    return out;
  }, [perfil, original]);

  const hasChanges = useMemo(() => Object.keys(diff).length > 0, [diff]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil || !user?.id) return;

    if (!perfil.nome || perfil.nome.trim().length < 2) {
      toast("Informe um nome válido (mín. 2 caracteres).", { icon: "✍️" });
      return;
    }
    if (!hasChanges) {
      toast("Nada para atualizar.", { icon: "ℹ️" });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(user.id),
        },
        body: JSON.stringify(diff),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.mensagem || "Não foi possível salvar.");
      }
      const updated = (await res.json()) as Perfil;
      setPerfil(updated);
      setOriginal(updated);
      toast.success("Seus dados foram salvos com sucesso! ✅");
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  // UI
  if (loading) {
    return (
      <div className={ui.wrap}>
        <div className={`${ui.container} animate-pulse`}>
          <div className={ui.skeletonTitle} />
          <div className={ui.skeletonCard} />
        </div>
      </div>
    );
  }
  if (!perfil) return null;

  return (
    <div className={ui.wrap}>
      <div className={ui.container}>
        <div className={ui.card}>
          {/* header */}
          <div className={ui.header}>
            <h1 className={ui.title}>Meus dados</h1>
            <p className={ui.subtitle}>
              Gerencie suas informações pessoais de contato. Seus endereços de
              entrega ficam em “Meus endereços”.
            </p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className={ui.form}>
            <div className={ui.grid}>
              <Field label="Nome">
                <input
                  className={ui.input}
                  value={perfil.nome || ""}
                  onChange={set("nome")}
                  autoComplete="name"
                />
              </Field>

              <Field label="WhatsApp (opcional)">
                <input
                  className={ui.input}
                  value={perfil.telefone || ""}
                  onChange={set("telefone")}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(DD) 99999-9999"
                />
              </Field>

              <Field label="Email" full>
                <input
                  className={ui.inputDisabled}
                  value={perfil.email || ""}
                  disabled
                />
              </Field>

              {/* CPF (opcional para contas antigas, mas salvo e validado no back) */}
              <Field label="CPF" full>
                <input
                  className={ui.input}
                  value={perfil.cpf || ""}
                  onChange={set("cpf")}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="111.111.111-11"
                />
              </Field>
            </div>

            {/* CTA ÚNICO */}
            <div className={ui.footer}>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className={ui.btn}
              >
                {saving
                  ? "Salvando..."
                  : hasChanges
                  ? "Salvar alterações"
                  : "Nada para salvar"}
              </button>
            </div>

            {/* Bloco de endereço separado */}
            <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Endereços de entrega
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Cadastre e gerencie múltiplos endereços para usar no
                  checkout.
                </p>
              </div>
              <Link
                href="/meus-dados/enderecos"
                className="inline-flex items-center justify-center rounded-lg border border-[#359293] px-4 py-2.5 text-sm font-semibold text-[#359293] hover:bg-[#359293]/5"
              >
                Gerenciar endereços
              </Link>
            </div>
          </form>
        </div>

        <div className="h-8 sm:h-10" />
      </div>
    </div>
  );
}

// Subcomponente de campo (rótulo + input)
function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={
        full
          ? "md:col-span-2 flex flex-col gap-1.5"
          : "flex flex-col gap-1.5"
      }
    >
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </div>
  );
}
