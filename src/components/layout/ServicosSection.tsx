// src/components/layout/ServicosSection.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ServiceCard from "./ServiceCard";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type Servico = {
  id: number;
  nome: string;
  descricao?: string;
  whatsapp?: string;
  imagem?: string | null;
  images?: string[];
  [k: string]: any;
};

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

        const json = await apiClient.get("/api/public/servicos", {
          signal: ctrl.signal,
        });
        const list = normalize(json).map((s: Servico) => ({
          ...s,
          images: Array.isArray(s.images) ? s.images : [],
        }));

        setServicos(list);
      } catch (err: unknown) {
        if ((err as any)?.name === "AbortError") return;
        const ui = formatApiError(err, "Não foi possível carregar os serviços.");
        setErrorMsg(ui.message);
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

          {/* Mobile: empilhados full-width.
              sm+: lado-a-lado, mesma min-width, primário verde sólido
              ('Ver todos os profissionais', a ação principal de
              consumidor) e o secundário em outline. */}
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link
              href="/servicos"
              className="inline-flex h-10 min-w-0 items-center justify-center rounded-full bg-emerald-600 px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 sm:min-w-[200px]"
            >
              Ver todos os profissionais
            </Link>
            <Link
              href="/trabalhe-conosco"
              className="inline-flex h-10 min-w-0 items-center justify-center rounded-full border border-emerald-600 px-5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 sm:min-w-[200px]"
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
              <div className="py-6 text-sm text-red-600">{errorMsg}</div>
            )}

            {/* SEM RESULTADOS — empty state profissional, compacto */}
            {!loading && !errorMsg && servicos.length === 0 && (
              <div className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-4 sm:px-5 sm:py-6">
                <div className="flex items-start gap-2.5 sm:gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-700 sm:h-10 sm:w-10 sm:text-lg"
                  >
                    🌱
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-emerald-900 sm:text-[15px]">
                      Profissionais da sua região, em breve
                    </p>
                    <p className="mt-1 text-[12px] leading-snug text-emerald-900/75 sm:text-sm sm:leading-relaxed">
                      Ainda estamos cadastrando profissionais da sua região.
                      Em breve você poderá encontrar veterinários, agrônomos,
                      mecânicos e prestadores do agro verificados pela
                      Kavita.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3">
                      <Link
                        href="/servicos"
                        className="inline-flex items-center justify-center rounded-full border border-emerald-600 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white sm:px-3.5 sm:py-1.5 sm:text-xs"
                      >
                        Ver profissionais
                      </Link>
                      <Link
                        href="/trabalhe-conosco"
                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 sm:px-3.5 sm:py-1.5 sm:text-xs"
                      >
                        Quero prestar serviços
                      </Link>
                    </div>
                  </div>
                </div>
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
