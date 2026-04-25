"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import type { Motorista } from "@/lib/rotas/types";

type Props = {
  open: boolean;
  initial?: Motorista | null;
  onClose: () => void;
  onSaved: (motorista: Motorista) => void;
};

export default function MotoristaFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!initial;
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(initial?.nome ?? "");
      setTelefone(initial?.telefone ?? "");
      setEmail(initial?.email ?? "");
      setVeiculo(initial?.veiculo_padrao ?? "");
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2) {
      toast.error("Nome muito curto.");
      return;
    }
    if (telefone.replace(/\D/g, "").length < 10) {
      toast.error("Telefone inválido. Inclua DDD.");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || null,
        veiculo_padrao: veiculo.trim() || null,
      };
      let saved: Motorista;
      if (isEdit && initial) {
        saved = await apiClient.put<Motorista>(
          `/api/admin/motoristas/${initial.id}`,
          body,
        );
      } else {
        saved = await apiClient.post<Motorista>(
          "/api/admin/motoristas",
          body,
        );
      }
      toast.success(isEdit ? "Motorista atualizado." : "Motorista cadastrado.");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao salvar.").message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // role="dialog" + aria-modal + onKeyDown (Esc) + onClick (backdrop)
    // satisfaz a11y semantica. A regra jsx-a11y/no-noninteractive-element-interactions
    // ainda reclama porque considera div+role=dialog "nao-interativo" — desabilitada
    // localmente porque o conjunto de aria/handlers cobre o caso real.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="motorista-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      tabIndex={-1}
    >
      {/* onClick/onKeyDown stopPropagation: evitam que clicks/teclas no
          form fechem o modal (nao sao "user actions" semanticos). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-dark-800 p-6 ring-1 ring-white/10 shadow-2xl space-y-4"
      >
        <h2 id="motorista-modal-title" className="text-lg font-semibold text-white">
          {isEdit ? "Editar motorista" : "Novo motorista"}
        </h2>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="motorista-nome"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Nome
            </label>
            <input
              id="motorista-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="João da Silva"
            />
          </div>
          <div>
            <label
              htmlFor="motorista-telefone"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Telefone (com DDD)
            </label>
            <input
              id="motorista-telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="(33) 99999-1234"
            />
          </div>
          <div>
            <label
              htmlFor="motorista-email"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              E-mail (opcional)
            </label>
            <input
              id="motorista-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="motorista@exemplo.com"
            />
          </div>
          <div>
            <label
              htmlFor="motorista-veiculo"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1"
            >
              Veículo padrão (opcional)
            </label>
            <input
              id="motorista-veiculo"
              type="text"
              value={veiculo}
              onChange={(e) => setVeiculo(e.target.value)}
              className="w-full rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Saveiro placa ABC1D23"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition disabled:opacity-60"
          >
            {submitting ? "Salvando…" : isEdit ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
