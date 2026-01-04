"use client";

import { useEffect, useMemo, useState } from "react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { HiOutlineMapPin } from "react-icons/hi2";
import Link from "next/link";
import type { PublicShopSettings } from "@/server/data/shopSettings";

type FooterProps = {
  shop?: PublicShopSettings;
};

type FooterLinkItem = {
  label: string;
  href: string;
  highlight?: boolean;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function formatCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  if (!d) return "";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(
    8,
    12
  )}-${d.slice(12, 14)}`;
}

function toWaMe(phone: string) {
  const d = onlyDigits(phone);
  return d ? `https://wa.me/${d.startsWith("55") ? d : `55${d}`}` : "";
}

function buildAddress(
  street: string,
  neighborhood: string,
  city: string,
  state: string,
  zip: string
) {
  const line1 = [street, neighborhood]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" • ");

  const line2 = [city, state]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" - ");

  const line3 = String(zip || "").trim();

  return { line1, line2, line3 };
}

function SocialIconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="
        inline-flex h-10 w-10 items-center justify-center rounded-xl
        border border-white/10 bg-white/5 text-white
        transition hover:bg-white/10 hover:border-white/20
        focus:outline-none focus:ring-2 focus:ring-emerald-400/70
      "
    >
      {children}
    </a>
  );
}

export default function Footer({ shop }: FooterProps) {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const footer = (shop as any)?.footer || {};
  const storeName = shop?.store_name || "Kavita";

  const tagline =
    (shop as any)?.footer_tagline ||
    footer.tagline ||
    "Conectando você ao melhor da agropecuária com qualidade e tradição.";

  const links = useMemo<FooterLinkItem[]>(() => {
    const raw = (shop as any)?.footer_links ?? footer.links ?? [];

    if (Array.isArray(raw) && raw.length) {
      return raw.map((x: any) => ({
        label: String(x.label),
        href: String(x.href),
        highlight: !!x.highlight,
      }));
    }

    return [
      { label: "Home", href: "/", highlight: false },
      { label: "Serviços", href: "/servicos", highlight: false },
      { label: "Contato", href: "/contato", highlight: false },
      { label: "Trabalhe conosco", href: "/trabalhe-conosco", highlight: true },
    ];
  }, [shop, footer.links]);

  const whatsapp = (shop as any)?.contact_whatsapp || footer.contact_whatsapp || "";
  const email = (shop as any)?.contact_email || footer.contact_email || "";
  const cnpj = (shop as any)?.cnpj ? formatCnpj((shop as any).cnpj) : "";

  const instagram =
    (shop as any)?.social_instagram_url ||
    footer.social_instagram_url ||
    "https://instagram.com";

  const whatsappUrl =
    (shop as any)?.social_whatsapp_url ||
    footer.social_whatsapp_url ||
    (whatsapp ? toWaMe(whatsapp) : "");

  // Endereço (flat ou compat)
  const address_city = (shop as any)?.address_city ?? footer.address_city ?? "";
  const address_state = (shop as any)?.address_state ?? footer.address_state ?? "";
  const address_street = (shop as any)?.address_street ?? footer.address_street ?? "";
  const address_neighborhood =
    (shop as any)?.address_neighborhood ?? footer.address_neighborhood ?? "";
  const address_zip = (shop as any)?.address_zip ?? footer.address_zip ?? "";

  const hasAddress =
    !!address_city ||
    !!address_state ||
    !!address_street ||
    !!address_neighborhood ||
    !!address_zip;

  const addr = buildAddress(
    address_street,
    address_neighborhood,
    address_city,
    address_state,
    address_zip
  );

  return (
    <footer className="mt-12 bg-[#083E46] text-white">
      {/* Top container */}
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-10">
        {/* Grid responsivo: 1 col (mobile), 2 (tablet), 4 (desktop) */}
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{storeName}</h2>
              <div className="mt-2 h-[3px] w-12 rounded-full bg-emerald-400/80" />
            </div>

            <p className="text-sm leading-relaxed text-white/80">{tagline}</p>

            {/* micro info */}
            <div className="pt-2 text-xs text-white/60">
              Suporte e atendimento pelo WhatsApp e e-mail.
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Navegação
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {links.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link
                    href={l.href}
                    className={[
                      "inline-flex items-center gap-2 rounded-lg px-2 py-1 -ml-2",
                      "text-white/80 hover:text-white hover:bg-white/5",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-400/70",
                      l.highlight ? "font-semibold text-emerald-200" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-1.5 w-1.5 rounded-full",
                        l.highlight ? "bg-emerald-300" : "bg-white/25",
                      ].join(" ")}
                    />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Contato
            </h3>

            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {!!whatsapp && (
                <li className="flex items-start gap-3">
                  <span className="mt-[2px] inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <FaWhatsapp />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-white">WhatsApp</p>
                    <p className="break-words">{whatsapp}</p>
                  </div>
                </li>
              )}

              {!!email && (
                <li className="flex items-start gap-3">
                  <span className="mt-[2px] inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <MdEmail />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-white">E-mail</p>
                    <p className="break-words">{email}</p>
                  </div>
                </li>
              )}

              {cnpj && (
                <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-white/70">CNPJ:</span>{" "}
                  <span className="font-semibold text-white">{cnpj}</span>
                </li>
              )}

              {hasAddress && (
                <li className="flex items-start gap-3">
                  <span className="mt-[2px] inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <HiOutlineMapPin />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-white">Sede</p>

                    {/* Linha 1: rua • bairro */}
                    {addr.line1 && (
                      <p className="break-words leading-snug">{addr.line1}</p>
                    )}

                    {/* Linha 2: cidade - UF */}
                    {addr.line2 && (
                      <p className="break-words leading-snug text-white/75">
                        {addr.line2}
                      </p>
                    )}

                    {/* Linha 3: CEP */}
                    {addr.line3 && (
                      <p className="break-words leading-snug text-white/75">
                        {addr.line3}
                      </p>
                    )}
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Redes */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Redes sociais
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Acompanhe novidades e fale com a gente pelos canais oficiais.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <SocialIconButton href={instagram} label="Instagram">
                <FaInstagram className="text-xl" />
              </SocialIconButton>

              {!!whatsappUrl && (
                <SocialIconButton href={whatsappUrl} label="WhatsApp">
                  <FaWhatsapp className="text-xl" />
                </SocialIconButton>
              )}
            </div>

            {/* CTA secundário (mobile-friendly) */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Atendimento rápido</p>
              <p className="mt-1 text-xs text-white/70">
                Resposta mais ágil via WhatsApp em horário comercial.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-3 text-center text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>
              © {year ?? ""} {storeName} — Todos os direitos reservados.
            </p>
            <p className="text-white/60">
              Desenvolvido com foco em performance e segurança.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
