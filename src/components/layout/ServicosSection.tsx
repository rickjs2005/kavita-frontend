// src/components/layout/ServicosSection.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

  const keys = [
    "servicos",
    "items",
    "data",
    "results",
    "rows",
    "content",
    "list",
  ];

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
        const res = await fetch(url, {
          signal: ctrl.signal,
          cache: "no-store",
        });

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
          console.warn("ServicosSection:", e);
          setErrorMsg("Não foi possível carregar os serviços.");
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
    <section className="bg-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* HEADER DA SEÇÃO */}
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              Rede de serviços do campo • Kavita
            </span>
            <h2 className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
              Serviços
            </h2>
            <p className="mt-1 text-sm text-gray-600 sm:max-w-xl">
              Profissionais do agro verificados pela Kavita, prontos para
              atender produtores rurais, fazendas e empresas da sua região.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/servicos"
              className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
            >
              Ver todos os profissionais
            </Link>
            <Link
              href="/trabalhe-conosco"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              Quero prestar serviços
            </Link>
          </div>
        </header>

        {/* CONTEÚDO / CARROSSEL */}
        <div className="relative group">
          {hasOverflow && (
            <>
              {/* Gradientes laterais */}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 sm:w-10 rounded-l-2xl bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:w-10 rounded-r-2xl bg-gradient-to-l from-white to-transparent" />
            </>
          )}

          {/* Botões de navegação (desktop) */}
          {hasOverflow && (
            <>
              <button
                type="button"
                onClick={() => scroll(-320)}
                className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-full border bg-white/90 p-2 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 md:block"
                aria-label="Voltar lista de serviços"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => scroll(320)}
                className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-full border bg-white/90 p-2 shadow-sm backdrop-blur-sm transition hover:bg-gray-50 md:block"
                aria-label="Avançar lista de serviços"
              >
                ▶
              </button>
            </>
          )}

          <div
            ref={wrapRef}
            className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

            {/* LOADING */}
            {loading &&
              skeletons.map((_, i) => (
                <div
                  key={i}
                  className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="h-40 w-full animate-pulse rounded-2xl bg-gray-200" />
                  <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              ))}

            {/* ERRO */}
            {!loading && errorMsg && (
              <div className="py-6 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            {/* SEM RESULTADOS */}
            {!loading && !errorMsg && servicos.length === 0 && (
              <div className="py-6 text-sm text-gray-500">
                Nenhum serviço cadastrado ainda.
              </div>
            )}

            {/* LISTA */}
            {!loading &&
              !errorMsg &&
              servicos.length > 0 &&
              servicos.map((s) => (
                <div
                  key={s.id}
                  className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] snap-start"
                >
                  <ServiceCard
                    servico={s as any}
                    readOnly
                    href={`/servicos/${s.id}`}
                    className="h-full"
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
