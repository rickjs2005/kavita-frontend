"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { useProducerAuth } from "@/context/ProducerAuthContext";
import { CIDADES_ZONA_DA_MATA } from "@/lib/regioes";
import type { Producer } from "@/types/producer";

export default function PerfilClient() {
  const { user, markLoggedIn } = useProducerAuth();
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome ?? "");
      setCidade(user.cidade ?? "");
      setTelefone(user.telefone ?? "");
    }
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await apiClient.put<Producer>("/api/produtor/profile", {
        nome: nome.trim() || null,
        cidade: cidade.trim() || null,
        telefone: telefone.trim() || null,
      });
      markLoggedIn(updated);
      toast.success("Perfil atualizado.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao salvar.").message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <main className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-16 pt-8 md:px-6 md:pt-10">
      <header className="mb-6">
        <Link
          href="/painel/produtor"
          className="text-[11px] font-semibold text-stone-500 hover:text-amber-700"
        >
          ← Meu Kavita
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
          Meu perfil
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Informe seu telefone para ver automaticamente contatos que você já
          enviou para corretoras.
        </p>
      </header>

      <form
        onSubmit={save}
        className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
        />
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
              E-mail
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-500"
            />
            <p className="mt-1 text-[11px] text-stone-500">
              E-mail da conta não pode ser alterado. Para trocar, peça
              suporte.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={150}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
              Sua cidade
            </label>
            <select
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="">Selecione</option>
              {CIDADES_ZONA_DA_MATA.map((c) => (
                <option key={c.slug} value={c.nome}>
                  {c.nome} — {c.estado}
                </option>
              ))}
              <option value="outra">Outra cidade</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
              WhatsApp / Telefone
            </label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              inputMode="tel"
              maxLength={30}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              placeholder="(33) 9 9999-9999"
            />
            <p className="mt-1 text-[11px] text-stone-500">
              Usado para vincular seus contatos enviados anteriormente.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
