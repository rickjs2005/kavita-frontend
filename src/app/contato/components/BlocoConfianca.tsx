"use client";

import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import {
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineCheckBadge,
  HiOutlineBolt,
} from "react-icons/hi2";
import type { SupportConfig } from "@/server/data/supportConfig";

type Metrics = {
  total_mensagens: number;
  taxa_resposta: number;
  tempo_medio: string | null;
} | null;

type Props = {
  whatsapp?: string;
  email?: string;
  whatsappUrl?: string;
  metrics?: Metrics;
  config?: SupportConfig | null;
};

const DEFAULT_TRUST = [
  { label: "Resposta rapida", desc: "Ate 24h uteis", icon: "bolt", color: "text-amber-500 bg-amber-50" },
  { label: "Horario comercial", desc: "Seg a sex, 8h-18h", icon: "clock", color: "text-primary bg-primary/10" },
  { label: "Equipe qualificada", desc: "Suporte especializado", icon: "badge", color: "text-blue-600 bg-blue-50" },
  { label: "Empresa real", desc: "Perdoes - MG", icon: "pin", color: "text-purple bg-purple/10" },
];

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  bolt: HiOutlineBolt,
  clock: HiOutlineClock,
  badge: HiOutlineCheckBadge,
  pin: HiOutlineMapPin,
};

export default function BlocoConfianca({ whatsapp, email, whatsappUrl, metrics, config }: Props) {
  const trustTitle = config?.trust_title ?? "Por que confiar no atendimento Kavita";
  const trustSubtitle = config?.trust_subtitle ?? "Somos uma empresa real com equipe dedicada ao seu atendimento";
  const trustItems = config?.trust_items && config.trust_items.length > 0
    ? config.trust_items
    : DEFAULT_TRUST;
  return (
    <section className="border-t border-gray-100 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {trustTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-gray-500">
            {trustSubtitle}
          </p>
        </div>

        {/* Real metrics — only shown when there's enough data */}
        {metrics && (
          <div className="mb-12 mx-auto max-w-3xl">
            <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.03] to-transparent p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">
                {/* Response rate */}
                <div>
                  <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                    {metrics.taxa_resposta}%
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    das mensagens respondidas
                  </p>
                </div>

                {/* Response time */}
                {metrics.tempo_medio && (
                  <div>
                    <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                      {metrics.tempo_medio}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      tempo medio de resposta
                    </p>
                  </div>
                )}

                {/* Total messages */}
                <div>
                  <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                    {metrics.total_mensagens}+
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    atendimentos realizados
                  </p>
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-gray-400">
                Dados reais calculados a partir dos nossos atendimentos
              </p>
            </div>
          </div>
        )}

        {/* Trust grid */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {trustItems.map((item, idx) => {
            const Icon = ICON_COMPONENTS[item.icon] || HiOutlineCheckBadge;
            const color = item.color || "text-primary bg-primary/10";
            // Enrich first item with real metrics if available
            const desc =
              idx === 0 && metrics?.tempo_medio
                ? `Media de ${metrics.tempo_medio}`
                : item.desc;
            return (
              <div
                key={item.label || idx}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 p-4 text-center sm:p-5"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Channels */}
        {(whatsapp || email) && (
          <div className="mx-auto max-w-2xl">
            <p className="mb-4 text-center text-sm font-medium text-gray-500">
              Canais diretos
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {whatsapp && (
                <a
                  href={whatsappUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 rounded-2xl border border-green-100 bg-green-50/50 p-4 transition hover:border-green-200 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                    <FaWhatsapp className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                    <p className="truncate text-sm text-gray-600">{whatsapp}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs font-medium text-green-600">
                    Abrir
                  </span>
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <MdEmail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">E-mail</p>
                    <p className="truncate text-sm text-gray-600">{email}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs font-medium text-blue-600">
                    Enviar
                  </span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
