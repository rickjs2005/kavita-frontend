"use client";

// src/app/admin/mercado-do-cafe/backfill-regional/BackfillRegionalClient.tsx
//
// ETAPA 3.4 — tela admin que lista corretoras com perfil regional
// incompleto (nenhum dos 6 campos da Fase 8 preenchidos) + botão
// "Enviar convite" que dispara e-mail editorial.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type IncompleteRow = {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  email: string | null;
  contact_name: string | null;
  created_at: string;
  missing_count: number;
};

type Response = {
  total: number;
  items: IncompleteRow[];
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

export default function BackfillRegionalClient() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Response>(
        "/api/admin/mercado-do-cafe/backfill-regional",
      );
      setData(res);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async (row: IncompleteRow) => {
    if (!row.email) {
      toast.error("Corretora sem e-mail cadastrado.");
      return;
    }
    if (
      !confirm(
        `Enviar e-mail de convite para ${row.name} (${row.email}) completar o perfil regional?`,
      )
    ) {
      return;
    }
    setSendingId(row.id);
    try {
      await apiClient.post(
        `/api/admin/mercado-do-cafe/backfill-regional/invite/${row.id}`,
      );
      toast.success(`Convite enviado para ${row.email}.`);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao enviar convite.").message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
              Curadoria Kavita
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50 md:text-3xl">
              Backfill regional
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Corretoras ativas que ainda não preencheram nenhum dos 6 campos
              regionais introduzidos na Fase 8 (endereço, volume mínimo,
              especial, retirada, exportação, cooperativas). Clique em
              &quot;Enviar convite&quot; pra disparar e-mail editorial pedindo
              que completem.
            </p>
          </div>
          <Link
            href="/admin/mercado-do-cafe"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-200"
          >
            ← Voltar
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-slate-800/50"
              />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 text-center">
            <p className="text-[14px] font-semibold text-emerald-200">
              🎉 Nenhuma corretora com perfil totalmente vazio.
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              Todas as ativas já começaram a preencher os campos regionais.
            </p>
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <p className="mb-4 text-[11px] text-slate-400">
              <strong className="font-semibold text-slate-200">
                {data.total}
              </strong>{" "}
              corretora(s) com perfil regional vazio.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[12px]">
                <thead className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <tr className="border-b border-slate-800">
                    <th className="py-2 text-left">Corretora</th>
                    <th className="py-2 text-left">Cadastro</th>
                    <th className="py-2 text-left">E-mail</th>
                    <th className="py-2 text-right">Faltam</th>
                    <th className="py-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-800/60 align-top"
                    >
                      <td className="py-2 pr-3">
                        <Link
                          href={`/admin/mercado-do-cafe/corretora/${row.id}`}
                          className="font-semibold text-slate-100 hover:text-amber-200"
                        >
                          {row.name}
                        </Link>
                        <p className="text-[10px] text-slate-500">
                          {[row.city, row.state].filter(Boolean).join(" / ") ||
                            "—"}
                          {row.contact_name && ` · ${row.contact_name}`}
                        </p>
                      </td>
                      <td className="py-2 pr-3 text-[11px] text-slate-400">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-slate-300">
                        {row.email ?? (
                          <span className="italic text-slate-500">
                            sem e-mail
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-amber-300">
                        {row.missing_count}/6
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => invite(row)}
                          disabled={!row.email || sendingId === row.id}
                          className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-100 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sendingId === row.id ? "..." : "✉ Convite"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
