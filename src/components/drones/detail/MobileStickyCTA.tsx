"use client";

// CTA flutuante mobile da página /drones/[id].
// Aparece após o usuário rolar para fora do hero e fica fixado no
// bottom para deixar o "Falar com representante" sempre acessível.
// Esconde automaticamente em viewports >= sm.

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { Accent } from "./accent";

type Props = {
  accent: Accent;
  onTalkToRep: () => void;
};

export default function MobileStickyCTA({ accent, onTalkToRep }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Aparece quando passou de ~80% do hero (≈ 600px no mobile)
      setVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Posiciona ACIMA do MobileBottomNav global (h-16 = 64px) usando
  // bottom-16. O nav já cuida do env(safe-area-inset-bottom) — não
  // precisamos somar de novo aqui pra não duplicar offset.
  return (
    <div
      className={[
        "fixed inset-x-0 bottom-16 z-40 px-4 pb-3 pt-3 sm:hidden",
        "bg-gradient-to-t from-black/95 via-black/85 to-black/40",
        "transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <button
        onClick={onTalkToRep}
        className={[
          "group flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-extrabold text-white transition",
          "bg-gradient-to-r",
          accent.primaryGradient,
          accent.primaryShadow,
          "active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/40",
        ].join(" ")}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Falar com representante
      </button>
    </div>
  );
}
