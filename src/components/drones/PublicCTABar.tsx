"use client";

// CTA bar premium — "Fale com um representante autorizado"
// Conforme referência DJI showroom: faixa abaixo das seções com 3
// botões em linha — WhatsApp (verde sólido), telefone do
// representante e link "Encontre uma loja".

import { MapPin, MessageCircle, Phone } from "lucide-react";
import type { DroneRepresentative } from "@/types/drones";

type Props = {
  representative?: DroneRepresentative | null;
  messageTemplate?: string | null;
  modelLabel?: string;
};

function formatPhone(raw: string): string {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

function buildWaLink(
  rep: DroneRepresentative,
  modelLabel: string | undefined,
  template: string | null | undefined,
) {
  const phone = String(rep.whatsapp || "").replace(/\D/g, "");
  const baseMsg =
    template ||
    "Olá! Quero conhecer melhor os drones DJI Agras da Kavita.";
  const lines = [baseMsg];
  if (modelLabel) lines.push(`\nModelo de interesse: ${modelLabel}`);
  lines.push(`Loja: ${rep.name}`);
  const text = encodeURIComponent(lines.join("\n"));
  const full = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${text}`;
}

export default function PublicCTABar({
  representative,
  messageTemplate,
  modelLabel,
}: Props) {
  const hasRep = Boolean(representative?.whatsapp);
  const waHref = hasRep
    ? buildWaLink(representative as DroneRepresentative, modelLabel, messageTemplate)
    : "#drones-representatives";
  const phoneRaw = representative?.whatsapp || "";
  const phoneFmt = phoneRaw ? formatPhone(phoneRaw) : "";
  const phoneHref = phoneRaw
    ? `tel:+${phoneRaw.replace(/\D/g, "").startsWith("55") ? phoneRaw.replace(/\D/g, "") : `55${phoneRaw.replace(/\D/g, "")}`}`
    : "#drones-representatives";

  return (
    <section className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[rgba(8,12,22,0.85)] p-5 backdrop-blur-md sm:p-7 lg:p-8">
          {/* Halos decorativos */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-cyan-500/12 blur-3xl"
          />

          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            {/* Coluna texto */}
            <div className="flex items-center gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 sm:inline-flex">
                <KavitaMark className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold tracking-tight text-white sm:text-lg lg:text-xl">
                  Fale com um representante autorizado
                </h2>
                <p className="mt-0.5 text-[12.5px] text-slate-400">
                  Atendimento especializado na sua região.
                </p>
              </div>
            </div>

            {/* Coluna botões */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href={waHref}
                target={hasRep ? "_blank" : undefined}
                rel={hasRep ? "noreferrer" : undefined}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 text-sm font-extrabold text-black shadow-[0_18px_45px_-22px_rgba(37,211,102,0.7)] transition hover:brightness-110 active:scale-[0.99]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
              {phoneFmt ? (
                <a
                  href={phoneHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 text-sm font-extrabold text-slate-100 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  <span className="font-mono tabular-nums">{phoneFmt}</span>
                </a>
              ) : null}
              <a
                href="#drones-representatives"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 text-sm font-extrabold text-slate-100 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                <MapPin className="h-4 w-4" aria-hidden />
                Encontre uma loja
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KavitaMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 4v16M5 12l7-8M5 12l7 8" />
    </svg>
  );
}
