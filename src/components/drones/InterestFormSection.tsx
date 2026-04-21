"use client";

// src/components/drones/InterestFormSection.tsx
//
// Formulário simples de interesse alternativo ao WhatsApp "olá".
// Coleta nome / cidade-UF / telefone / modelo de interesse / mensagem
// e monta um link `wa.me` com os dados preenchidos na mensagem.
// Zero backend novo: o submit abre o WhatsApp do representante já
// com contexto (nome, cidade, modelo, mensagem) — o representante
// recebe o lead pré-qualificado.
//
// Se não houver representante cadastrado, o botão vira mailto/fallback
// para uma âncora de representantes.

import { useMemo, useState } from "react";
import type { DroneRepresentative } from "@/types/drones";

type DroneModel = {
  key: string;
  label: string;
};

type Props = {
  models: DroneModel[];
  representative?: DroneRepresentative;
  messageTemplate?: string | null;
};

function onlyDigits(s: string): string {
  return String(s || "").replace(/\D/g, "");
}

function buildWaHref(opts: {
  phone: string;
  nome: string;
  cidade: string;
  telefone: string;
  modelo: string;
  mensagem: string;
  template?: string | null;
}) {
  const phone = onlyDigits(opts.phone);
  const full = phone.startsWith("55") ? phone : `55${phone}`;

  const base =
    (opts.template || "").trim() ||
    "Olá! Tenho interesse em drones DJI Agras da Kavita.";

  const linhas = [
    base,
    "",
    opts.nome ? `Nome: ${opts.nome}` : "",
    opts.cidade ? `Cidade/UF: ${opts.cidade}` : "",
    opts.telefone ? `Telefone: ${opts.telefone}` : "",
    opts.modelo ? `Modelo de interesse: ${opts.modelo}` : "",
    opts.mensagem ? `\nMensagem: ${opts.mensagem}` : "",
  ].filter(Boolean);

  return `https://wa.me/${full}?text=${encodeURIComponent(linhas.join("\n"))}`;
}

export default function InterestFormSection({
  models,
  representative,
  messageTemplate,
}: Props) {
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [modelo, setModelo] = useState("");
  const [mensagem, setMensagem] = useState("");

  const hasRep = Boolean(representative?.whatsapp);

  const href = useMemo(() => {
    if (!hasRep) return "#representantes";
    return buildWaHref({
      phone: String(representative?.whatsapp || ""),
      nome,
      cidade,
      telefone,
      modelo,
      mensagem,
      template: messageTemplate,
    });
  }, [hasRep, representative, nome, cidade, telefone, modelo, mensagem, messageTemplate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRep) {
      const el = document.getElementById("drones-representatives");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const inputClass =
    "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60";

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-5">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
          />

          <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[1.1fr_1fr] md:items-start">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
                Quero conhecer
              </p>
              <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Receba orientação de um representante Kavita
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300">
                Preencha com seus dados básicos e o modelo de interesse. Ao
                enviar, você abre uma conversa no WhatsApp já com as
                informações preenchidas — o representante entra em contato
                para orientar sobre o drone certo para sua propriedade.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  Atendimento humano regional
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  Sem compromisso de compra
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  Resposta direto no seu WhatsApp
                </li>
              </ul>
            </div>

            <form onSubmit={onSubmit} className="grid gap-3">
              <div>
                <label htmlFor="nome" className="mb-1 block text-xs font-semibold text-slate-300">
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClass}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div>
                  <label htmlFor="cidade" className="mb-1 block text-xs font-semibold text-slate-300">
                    Cidade / UF
                  </label>
                  <input
                    id="cidade"
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className={inputClass}
                    placeholder="Ex.: Manhuaçu / MG"
                    autoComplete="address-level2"
                  />
                </div>

                <div>
                  <label htmlFor="telefone" className="mb-1 block text-xs font-semibold text-slate-300">
                    Telefone
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modelo" className="mb-1 block text-xs font-semibold text-slate-300">
                  Modelo de interesse
                </label>
                <select
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Ainda não sei — quero orientação</option>
                  {models.map((m) => (
                    <option key={m.key} value={m.label}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mensagem" className="mb-1 block text-xs font-semibold text-slate-300">
                  Mensagem (opcional)
                </label>
                <textarea
                  id="mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={3}
                  className={`${inputClass} resize-y leading-relaxed`}
                  placeholder="Conte brevemente sobre sua área, cultura ou dúvida."
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-white shadow-[0_18px_60px_-25px_rgba(16,185,129,0.9)] hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                {hasRep ? "Abrir conversa no WhatsApp" : "Ver representantes"}
              </button>

              <p className="mt-1 text-[11px] text-slate-400">
                Ao enviar, abrimos o WhatsApp do representante com suas
                informações preenchidas. Você continua a conversa por lá.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
