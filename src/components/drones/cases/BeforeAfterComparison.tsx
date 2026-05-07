"use client";

// Slider comparativo "antes / depois" para cases do Kavita Drones.
// Inspiração: produto storytelling DJI / Tesla / Apple Compare.
//
// - Drag horizontal (mouse) com handle circular cinematográfico
// - Swipe touch (mobile) — pointer events cobrem ambos
// - Input range invisível (acessibilidade keyboard, leitor de tela)
// - Etiquetas ANTES / DEPOIS sempre visíveis
// - Legendas storytelling opcionais (admin define before_label/after_label)
// - Sem libs externas — só CSS clip-path + 2 next/image stacked

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { absUrl } from "@/utils/absUrl";

type Props = {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string | null;
  afterLabel?: string | null;
  alt?: string;
};

export default function BeforeAfterComparison({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
  alt = "Comparação antes e depois da operação Kavita Drones",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(50); // % visível do "antes"
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // URL helpers — aceitam path relativo (/uploads/...) ou absoluto.
  const beforeSrc = useMemo(() => absUrl(beforeUrl || ""), [beforeUrl]);
  const afterSrc = useMemo(() => absUrl(afterUrl || ""), [afterUrl]);

  // Atualiza posição em função do clientX. Funciona com mouse + touch
  // via pointer events (substitui handlers separados).
  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(0, Math.min(100, raw));
    setPosition(clamped);
  }, []);

  // Mouse/touch handlers via Pointer Events API (suporta mouse, touch
  // e stylus num único pipeline). Evita listeners separados.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(true);
      setHasInteracted(true);
      setFromClientX(e.clientX);
      // Captura ponteiro: garante que o move continua funcionando
      // mesmo se o cursor sair do container.
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [setFromClientX],
  );
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setFromClientX(e.clientX);
    },
    [isDragging, setFromClientX],
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(false);
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    },
    [],
  );

  // Auto-demo: se o usuário não interagiu nos primeiros segundos,
  // anima de 50→70→30→50 uma vez para sinalizar que o slider é
  // interativo. Só roda 1 vez. Respeita prefers-reduced-motion.
  useEffect(() => {
    if (hasInteracted) return;
    if (typeof window === "undefined") return;
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const seq = [
      { pos: 70, delay: 1500 },
      { pos: 30, delay: 800 },
      { pos: 50, delay: 800 },
    ];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let acc = 0;
    seq.forEach((step) => {
      acc += step.delay;
      timeouts.push(
        setTimeout(() => {
          if (!hasInteracted) setPosition(step.pos);
        }, acc),
      );
    });
    return () => timeouts.forEach(clearTimeout);
  }, [hasInteracted]);

  // Keyboard handler para o input range (acessibilidade).
  const handleRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPosition(Number(e.target.value));
      setHasInteracted(true);
    },
    [],
  );

  if (!beforeUrl || !afterUrl) return null;

  return (
    <figure className="relative isolate">
      <div
        ref={containerRef}
        className={[
          "relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem]",
          "border border-emerald-400/20 bg-black/40 select-none",
          "touch-none", // impede pan vertical durante drag
          isDragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Sem role/onClick aqui — o <input type="range"> abaixo é o
        // controle acessível. Pointer events só capturam drag visual.
      >
        {/* DEPOIS (camada de fundo, sempre 100% visível) */}
        <div className="absolute inset-0">
          <Image
            src={afterSrc}
            alt={`${alt} — depois`}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            quality={88}
            className="object-cover"
            priority={false}
            draggable={false}
          />
        </div>

        {/* ANTES (camada de cima, clipped pela posição) */}
        <div
          className="absolute inset-0 transition-[clip-path] duration-150 ease-out"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
            WebkitClipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
          aria-hidden
        >
          <Image
            src={beforeSrc}
            alt={`${alt} — antes`}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            quality={88}
            className="object-cover"
            draggable={false}
          />
        </div>

        {/* Etiqueta ANTES (canto superior esquerdo) */}
        <div className="pointer-events-none absolute left-4 top-4 sm:left-5 sm:top-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/55 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Antes
          </span>
        </div>

        {/* Etiqueta DEPOIS (canto superior direito) */}
        <div className="pointer-events-none absolute right-4 top-4 sm:right-5 sm:top-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-emerald-100 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Depois
          </span>
        </div>

        {/* Legendas storytelling no rodapé (opcionais) */}
        {(beforeLabel || afterLabel) && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
            {beforeLabel ? (
              <p
                className="max-w-[42%] rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-[11px] font-semibold leading-snug text-white/90 backdrop-blur"
                title={beforeLabel}
              >
                {beforeLabel}
              </p>
            ) : (
              <span />
            )}
            {afterLabel ? (
              <p
                className="max-w-[42%] rounded-xl border border-emerald-400/25 bg-emerald-950/65 px-3 py-1.5 text-right text-[11px] font-semibold leading-snug text-emerald-50 backdrop-blur"
                title={afterLabel}
              >
                {afterLabel}
              </p>
            ) : (
              <span />
            )}
          </div>
        )}

        {/* Linha divisória vertical na posição atual */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-white/85 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
          style={{ left: `calc(${position}% - 1px)` }}
          aria-hidden
        />

        {/* Handle circular */}
        <div
          className="pointer-events-none absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${position}%` }}
          aria-hidden
        >
          <div
            className={[
              "flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/85 bg-emerald-500 shadow-[0_8px_30px_rgba(0,0,0,0.45)]",
              "transition-transform",
              isDragging ? "scale-105" : "scale-100",
            ].join(" ")}
          >
            {/* Setas indicando arrastar */}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M14 6l-4 6 4 6" />
              <path d="M10 6l4 6-4 6" />
            </svg>
          </div>
        </div>

        {/* Range invisível para acessibilidade keyboard/screen reader */}
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={position}
          onChange={handleRangeChange}
          aria-label="Posição da divisão antes/depois"
          className="absolute inset-0 z-30 h-full w-full cursor-grab opacity-0"
          style={{ touchAction: "none" }}
        />
      </div>

      {/* Hint de uso — visível antes da primeira interação */}
      {!hasInteracted ? (
        <figcaption className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
          Arraste para revelar o resultado
        </figcaption>
      ) : null}
    </figure>
  );
}
