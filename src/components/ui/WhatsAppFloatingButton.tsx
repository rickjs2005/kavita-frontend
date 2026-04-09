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
        "fixed bottom-[5.25rem] right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/15",
        "transition-all duration-500 hover:scale-110 hover:shadow-xl active:scale-95",
        "sm:bottom-[5.5rem] sm:right-6",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <FaWhatsapp className="h-6 w-6" />
    </a>
  );
}
