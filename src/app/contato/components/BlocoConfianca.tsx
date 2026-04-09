"use client";

import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import {
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

type Props = {
  whatsapp?: string;
  email?: string;
  whatsappUrl?: string;
};

export default function BlocoConfianca({ whatsapp, email, whatsappUrl }: Props) {
  const channels = [
    whatsapp && {
      icon: FaWhatsapp,
      label: "WhatsApp",
      value: whatsapp,
      href: whatsappUrl || undefined,
      color: "bg-green-50 text-green-600",
    },
    email && {
      icon: MdEmail,
      label: "E-mail",
      value: email,
      href: `mailto:${email}`,
      color: "bg-blue-50 text-blue-600",
    },
  ].filter(Boolean) as {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    href?: string;
    color: string;
  }[];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Outros canais de atendimento
        </h2>
        <p className="mt-2 text-gray-600">
          Escolha o canal que preferir para falar conosco
        </p>
      </div>

      {/* Channel cards */}
      {channels.length > 0 && (
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const Wrapper = ch.href ? "a" : "div";
            const linkProps = ch.href
              ? {
                  href: ch.href,
                  target: "_blank" as const,
                  rel: "noreferrer",
                }
              : {};

            return (
              <Wrapper
                key={ch.label}
                {...linkProps}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-primary/20"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ch.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {ch.label}
                  </p>
                  <p className="truncate text-sm text-gray-600">{ch.value}</p>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}

      {/* Trust indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HiOutlineClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Horario de atendimento
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Segunda a sexta, 8h as 18h
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HiOutlineShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Atendimento seguro
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Seus dados protegidos e sigilosos
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HiOutlineMapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Empresa real
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Perdoes - MG, atendendo todo o Brasil
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
