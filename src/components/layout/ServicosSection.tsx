// src/components/layout/ServicosSection.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ServiceCard from "./ServiceCard";

type Servico = {
  id: number;
  nome: string;
  descricao?: string;
  whatsapp?: string;
  imagem?: string | null;
  images?: string[];
  [k: string]: any;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function normalize(payload: any): Servico[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Servico[];
  const keys = ["servicos", "items", "data", "results", "rows", "content", "list"];
  for (const k of keys) {
    if (Array.isArray(payload?.[k])) return payload[k] as Servico[];
    if (Array.isArray(payload?.data?.[k])) return payload.data[k] as Servico[];
  }
  return [];
}

export default function ServicosSection() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setServicos([]);

        const url = `${API}/api/public/servicos`;
        const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
        const text = await res.text();
        if (!res.ok) throw new Error(text || res.statusText);

        const json = text ? JSON.parse(text) : [];
        const list = normalize(json).map((s) => ({
          ...s,
          images: Array.isArray(s.images) ? s.images : [],
        }));

        setServicos(list);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setErrorMsg("Não foi possível carregar os serviços.");
          console.warn("ServicosSection:", e);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth + 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [servicos.length]);

  const skeletons = useMemo(() => new Array(3).fill(0), []);

  const scroll = (dx: number) => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {hasOverflow && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 sm:w-10 bg-gradient-to-r from-white/80 to-transparent rounded-l-2xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:w-10 bg-gradient-to-l from-white/80 to-transparent rounded-r-2xl" />
        </>
      )}

      {hasOverflow && (
        <>
          <button
            onClick={() => scroll(-320)}
            className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full border bg-white/90 backdrop-blur-sm p-2 shadow-sm hover:bg-gray-50"
            aria-label="Voltar"
          >
            ◀
          </button>
          <button
            onClick={() => scroll(320)}
            className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full border bg-white/90 backdrop-blur-sm p-2 shadow-sm hover:bg-gray-50"
            aria-label="Avançar"
          >
            ▶
          </button>
        </>
      )}

      <div
        ref={wrapRef}
        className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-2 sm:px-3 lg:px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        {loading &&
          skeletons.map((_, i) => (
            <div
              key={i}
              className="min-w-[230px] max-w-[230px] sm:min-w-[270px] sm:max-w-[270px] rounded-xl border bg-white p-3 shadow-sm"
            >
              <div className="h-40 w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          ))}

        {!loading && errorMsg && (
          <div className="py-6 text-sm text-red-600">{errorMsg}</div>
        )}

        {!loading && !errorMsg && servicos.length === 0 && (
          <div className="py-6 text-sm text-gray-500">Nenhum serviço cadastrado.</div>
        )}

        {!loading &&
          !errorMsg &&
          servicos.map((s) => (
            <div key={s.id} className="min-w-[230px] max-w-[230px] sm:min-w-[270px] sm:max-w-[270px]">
              <ServiceCard service={s as any} />
            </div>
          ))}
      </div>
    </div>
  );
}
