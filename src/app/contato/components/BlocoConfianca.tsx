"use client";

import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import {
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineCheckBadge,
  HiOutlineBolt,
} from "react-icons/hi2";

type Props = {
  whatsapp?: string;
  email?: string;
  whatsappUrl?: string;
};

export default function BlocoConfianca({ whatsapp, email, whatsappUrl }: Props) {
  return (
    <section className="border-t border-gray-100 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Por que confiar no atendimento Kavita
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-gray-500">
            Somos uma empresa real com equipe dedicada ao seu atendimento
          </p>
        </div>

        {/* Trust grid */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              icon: HiOutlineBolt,
              label: "Resposta rapida",
              desc: "Ate 24h uteis",
              color: "text-amber-500 bg-amber-50",
            },
            {
              icon: HiOutlineClock,
              label: "Horario comercial",
              desc: "Seg a sex, 8h-18h",
              color: "text-primary bg-primary/10",
            },
            {
              icon: HiOutlineCheckBadge,
              label: "Equipe qualificada",
              desc: "Suporte especializado",
              color: "text-blue-600 bg-blue-50",
            },
            {
              icon: HiOutlineMapPin,
              label: "Empresa real",
              desc: "Perdoes - MG",
              color: "text-purple bg-purple/10",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 p-4 text-center sm:p-5"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
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
