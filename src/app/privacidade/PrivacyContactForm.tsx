"use client";

// src/app/privacidade/PrivacyContactForm.tsx
//
// Formulário do canal do DPO para quem NÃO tem conta autenticada.
// Quem tem conta deve usar /painel/produtor/meus-dados (self-service
// imediato). Este form vai para mensagens_contato com assunto
// "privacidade:<tipo>" e entra no SLA de 10 dias úteis.

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type Tipo =
  | "acesso"
  | "correcao"
  | "exclusao"
  | "portabilidade"
  | "duvida"
  | "incidente"
  | "outro";

const TIPO_LABELS: Record<Tipo, string> = {
  acesso: "Acesso aos meus dados",
  correcao: "Correção de dado incorreto",
  exclusao: "Exclusão de conta / dados",
  portabilidade: "Portabilidade (receber em formato estruturado)",
  duvida: "Dúvida sobre tratamento",
  incidente: "Relato de incidente de segurança",
  outro: "Outro assunto de privacidade",
};

export function PrivacyContactForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<Tipo>("duvida");
  const [mensagem, setMensagem] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post("/api/public/privacidade/contato", {
        nome,
        email,
        telefone: telefone || null,
        tipo,
        mensagem,
      });
      toast.success("Pedido registrado. Entraremos em contato em breve.");
      setDone(true);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao enviar.").message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-900">
        <h3 className="text-base font-semibold">Pedido recebido</h3>
        <p className="mt-1 text-sm">
          Nossa equipe de privacidade responderá no prazo legal (máximo de
          15 dias a partir da solicitação). Se for urgente, escreva também
          diretamente para{" "}
          <code className="text-xs">
            {process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? "privacidade@kavita.com.br"}
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
            Nome*
          </span>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={2}
            maxLength={150}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
            E-mail*
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={255}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
          Telefone (opcional)
        </span>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          maxLength={30}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
          Sobre o que é o pedido*
        </span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as Tipo)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
        >
          {(Object.keys(TIPO_LABELS) as Tipo[]).map((t) => (
            <option key={t} value={t}>
              {TIPO_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
          Mensagem*
        </span>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          placeholder="Conte-nos o que você precisa — quanto mais contexto, mais rápida nossa resposta."
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          Para pedidos autenticados e instantâneos, use o{" "}
          <a
            href="/painel/produtor/meus-dados"
            className="text-amber-700 hover:underline"
          >
            painel
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-600/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Enviar pedido"}
        </button>
      </div>
    </form>
  );
}
