"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

export type SignaturePadHandle = {
  /** Retorna PNG dataURL ou null se vazia. */
  toDataURL: () => string | null;
  /** Limpa o canvas. */
  clear: () => void;
  /** True se ja desenharam algo. */
  hasInk: () => boolean;
};

type Props = {
  className?: string;
  height?: number;
};

/**
 * Canvas signature pad. Pure React, sem lib externa.
 * - Suporta mouse + touch via Pointer Events.
 * - touchAction: none evita scroll da pagina enquanto desenha.
 * - devicePixelRatio aware pra ficar nitido em retina.
 */
const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { className = "", height = 180 },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const inked = useRef(false);
  const [, setVersion] = useState(0); // trigger rerender pra "hasInk" externo

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      if (!canvasRef.current || !inked.current) return null;
      return canvasRef.current.toDataURL("image/png");
    },
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      inked.current = false;
      setVersion((v) => v + 1);
    },
    hasInk: () => inked.current,
  }));

  // Ajusta resolução do canvas pra DPI ao montar e em resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#fff";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    inked.current = true;
  }

  function onUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setVersion((v) => v + 1);
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`block w-full rounded-xl bg-stone-800 border border-white/10 cursor-crosshair touch-none ${className}`}
      style={{ height: `${height}px` }}
      aria-label="Área para assinatura"
    />
  );
});

export default SignaturePad;
