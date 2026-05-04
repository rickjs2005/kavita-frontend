"use client";

import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { buildWaMeLink } from "@/utils/formatters";

type Props = {
  phone?: string;
  url?: string;
};

export default function WhatsAppFloatingButton({ phone, url }: Props) {
  const [visible, setVisible] = useState(false);

  const href = url || buildWaMeLink(phone) || "";

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
      style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))" }}
      className={[
        "fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/15",
        "transition-all duration-500 hover:scale-110 hover:shadow-xl active:scale-95",
        "sm:right-6",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <FaWhatsapp className="h-6 w-6" />
    </a>
  );
}
