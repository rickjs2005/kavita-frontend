"use client";

// src/app/painel/produtor/PanelClient.tsx
//
// Painel do produtor: 3 blocos principais.
//   1. Header com saudação + logout + link para Mercado do Café
//   2. Favoritos (cards de corretora)
//   3. Histórico de leads enviados (por telefone_normalizado)
//
// UX leve — produtor rural. Sem sidebar, sem navegação complexa.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { useProducerAuth } from "@/context/ProducerAuthContext";
import type {
  ProducerFavorite,
  ProducerLeadHistoryItem,
} from "@/types/producer";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

function formatDate(iso: string) {
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

const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  contacted: "Em contato",
  closed: "Fechado",
  lost: "Perdido",
};

export default function PanelClient() {
  const { user, logout } = useProducerAuth();
  const [favorites, setFavorites] = useState<ProducerFavorite[]>([]);
  const [leads, setLeads] = useState<ProducerLeadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [favs, hist] = await Promise.allSettled([
        apiClient.get<ProducerFavorite[]>("/api/produtor/favorites"),
        apiClient.get<ProducerLeadHistoryItem[]>(
          "/api/produtor/leads/history",
        ),
      ]);
      if (favs.status === "fulfilled") setFavorites(favs.value);
      if (hist.status === "fulfilled") setLeads(hist.value);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar dados.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeFav = async (corretoraId: number) => {
    try {
      await apiClient.request(
        `/api/produtor/favorites/${corretoraId}`,
        { method: "DELETE" },
      );
      setFavorites((prev) => prev.filter((f) => f.corretora_id !== corretoraId));
      toast.success("Removida dos favoritos.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao remover.").message);
    }
  };

  if (!user) return null;

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-8 md:px-6 md:pt-10">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
            Meu Kavita
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
            Olá{user.nome ? `, ${user.nome.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/painel/produtor/perfil"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
          >
            Perfil
          </Link>
          <Link
            href="/mercado-do-cafe"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-amber-600/20 hover:from-amber-400 hover:to-amber-500"
          >
            Ver corretoras
          </Link>
          <button
            type="button"
            onClick={() => logout({ redirectTo: "/mercado-do-cafe" })}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-rose-700"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Favoritos */}
      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
              Favoritos
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-stone-900">
              Corretoras salvas
            </h2>
          </div>
        </div>

        {loading && favorites.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-500">
            Carregando...
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <PanelBrandMark className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-stone-700">
              Sem favoritos ainda
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Quando você favoritar corretoras, elas aparecem aqui para
              encontrar rápido depois.
            </p>
            <Link
              href="/mercado-do-cafe/corretoras"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Explorar corretoras →
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {favorites.map((f) => (
              <li
                key={f.id}
                className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-amber-400/40"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
                />
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/mercado-do-cafe/corretoras/${f.corretora_slug}`}
                    className="group min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-semibold text-stone-900 group-hover:text-amber-700">
                      {f.corretora_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {f.corretora_city} · {f.corretora_state}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFav(f.corretora_id)}
                    aria-label="Remover dos favoritos"
                    className="text-stone-300 hover:text-rose-500"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M10 3.22l-.61-.6a5.5 5.5 0 00-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 00-7.78-7.77l-.61.61z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-stone-400">
                  Favoritada em {formatDate(f.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Histórico */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
              Histórico
            </p>
            <h2 className="mt-0.5 text-base font-semibold text-stone-900">
              Seus contatos enviados
            </h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Contatos vinculados ao seu telefone aparecem aqui.
            </p>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-stone-700">
              Sem contatos ainda
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {user.telefone_normalizado
                ? "Quando você enviar mensagens para corretoras, elas aparecem aqui."
                : "Informe seu telefone no perfil para ver contatos anteriores automaticamente."}
            </p>
            {!user.telefone_normalizado && (
              <Link
                href="/painel/produtor/perfil"
                className="mt-3 inline-flex text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                Completar perfil →
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {leads.map((l) => (
              <li key={l.id} className="p-4 transition-colors hover:bg-amber-50/20">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/mercado-do-cafe/corretoras/${l.corretora_slug}`}
                        className="text-sm font-semibold text-stone-900 hover:text-amber-700"
                      >
                        {l.corretora_name}
                      </Link>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                        {STATUS_LABELS[l.status] ?? l.status}
                      </span>
                      {l.lote_disponivel === false || l.lote_disponivel === 0 ? (
                        <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                          Lote vendido
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-stone-500">
                      {l.cidade ? `${l.cidade} · ` : ""}
                      {formatDate(l.created_at)}
                      {l.corrego_localidade ? ` · ${l.corrego_localidade}` : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
