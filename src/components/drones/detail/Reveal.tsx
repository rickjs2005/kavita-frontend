"use client";

// Wrapper minúsculo de scroll-reveal usando IntersectionObserver.
// Aplica a classe kvt-fade-up uma única vez quando o conteúdo entra
// na viewport. Sem libs externas. Respeita prefers-reduced-motion
// (a animação CSS é neutralizada lá em globals.css).

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Quanto adiantar a entrada (px de margem inferior). Default: 80px */
  rootMargin?: string;
  /** Atraso em ms antes da animação iniciar */
  delayMs?: number;
};

export default function Reveal({
  children,
  rootMargin = "0px 0px -80px 0px",
  delayMs,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin, threshold: 0.05 },
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={revealed ? "kvt-fade-up" : "opacity-0"}
      style={
        revealed && delayMs ? { animationDelay: `${delayMs}ms` } : undefined
      }
    >
      {children}
    </div>
  );
}
