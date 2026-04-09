"use client";

import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";

type Props = {
  phone?: string;
  url?: string;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function toWaMe(phone: string) {
  const d = onlyDigits(phone);
  return d ? `https://wa.me/${d.startsWith("55") ? d : `55${d}`}` : "";
}

export default function WhatsAppFloatingButton({ phone, url }: Props) {
  const [visible, setVisible] = useState(false);

  const href = url || (phone ? toWaMe(phone) : "");

  // Delay appearance to avoid layout shift and let page settle
  useEffect(() => {
    if (!href) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [href]);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar pelo WhatsApp"
      title="Falar pelo WhatsApp"
      className={[
        "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-[#25D366] pl-4 pr-5 py-3 text-white shadow-lg shadow-black/15",
        "transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-black/20 active:scale-95",
        "sm:bottom-6 sm:right-6",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <FaWhatsapp className="h-6 w-6 shrink-0" />
      <span className="hidden text-sm font-semibold sm:inline">
        Fale conosco
      </span>
    </a>
  );
}
