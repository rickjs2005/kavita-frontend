// src/components/mercado-do-cafe/CorretoraFilters.tsx
"use client";

// Filtros da listagem pública de corretoras em formato "command bar" —
// estilo Linear/Stripe: ícone de busca à esquerda, input flex, select
// de cidade como chip, tudo sobre um container stone-100 inset com
// hairline ring. Visual muito mais refinado que o layout anterior
// (dois inputs soltos + botão emerald).
//
// Lógica idêntica à anterior: push para URL com query params, sync
// com back/forward via searchParams. Nenhuma alteração de
// comportamento — apenas visual.

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  cities: string[];
};

// Fase 5 — filtros profundos. Chips inline abaixo do command bar.
// tipo_cafe bate com o catálogo JSON na coluna tipos_cafe;
// perfil_compra contempla "ambos" no lado servidor.
const TIPO_CAFE_CHIPS = [
  { value: "arabica_especial", label: "Arábica especial" },
  { value: "arabica_comum", label: "Arábica comum" },
  { value: "natural", label: "Natural" },
  { value: "cereja_descascado", label: "Cereja descascado" },
] as const;

const PERFIL_COMPRA_CHIPS = [
  { value: "compra", label: "Compra café" },
  { value: "venda", label: "Vende café" },
  { value: "ambos", label: "Compra e vende" },
] as const;

export function CorretoraFilters({ cities }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [tipoCafe, setTipoCafe] = useState(searchParams.get("tipo_cafe") ?? "");
  const [perfil, setPerfil] = useState(
    searchParams.get("perfil_compra") ?? "",
  );
  const [onlyFeatured, setOnlyFeatured] = useState(
    searchParams.get("featured") === "1",
  );

  const applyFilters = useCallback(
    (next: {
      city?: string;
      search?: string;
      tipo_cafe?: string;
      perfil_compra?: string;
      featured?: boolean;
    }) => {
      const params = new URLSearchParams();
      if (next.city) params.set("city", next.city);
      if (next.search?.trim()) params.set("search", next.search.trim());
      if (next.tipo_cafe) params.set("tipo_cafe", next.tipo_cafe);
      if (next.perfil_compra) params.set("perfil_compra", next.perfil_compra);
      if (next.featured) params.set("featured", "1");
      const qs = params.toString();
      router.push(`/mercado-do-cafe/corretoras${qs ? `?${qs}` : ""}`);
    },
    [router],
  );

  const currentState = {
    city,
    search,
    tipo_cafe: tipoCafe,
    perfil_compra: perfil,
    featured: onlyFeatured,
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    applyFilters({ ...currentState, city: value });
  };

  const toggleTipoCafe = (value: string) => {
    const next = tipoCafe === value ? "" : value;
    setTipoCafe(next);
    applyFilters({ ...currentState, tipo_cafe: next });
  };

  const togglePerfil = (value: string) => {
    const next = perfil === value ? "" : value;
    setPerfil(next);
    applyFilters({ ...currentState, perfil_compra: next });
  };

  const toggleFeatured = () => {
    const next = !onlyFeatured;
    setOnlyFeatured(next);
    applyFilters({ ...currentState, featured: next });
  };

  const clearAll = () => {
    setCity("");
    setSearch("");
    setTipoCafe("");
    setPerfil("");
    setOnlyFeatured(false);
    router.push(`/mercado-do-cafe/corretoras`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(currentState);
  };

  useEffect(() => {
    setCity(searchParams.get("city") ?? "");
    setSearch(searchParams.get("search") ?? "");
    setTipoCafe(searchParams.get("tipo_cafe") ?? "");
    setPerfil(searchParams.get("perfil_compra") ?? "");
    setOnlyFeatured(searchParams.get("featured") === "1");
  }, [searchParams]);

  const hasAnyFilter =
    Boolean(city) ||
    search.trim().length > 0 ||
    Boolean(tipoCafe) ||
    Boolean(perfil) ||
    onlyFeatured;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/[0.08] backdrop-blur-sm">
      {/* Top highlight amber */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />
      <div className="relative flex flex-col gap-1.5 md:flex-row md:items-center">
        {/* Search input with leading icon */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex flex-1 items-center"
          role="search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 text-stone-500"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, cidade ou contato..."
            aria-label="Buscar corretora"
            className="w-full rounded-xl bg-white/[0.05] py-2.5 pl-10 pr-4 text-sm text-stone-100 placeholder:text-stone-500 ring-1 ring-white/10 transition-colors focus:border-amber-400/60 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
        </form>

        {/* Divider — only on desktop */}
        <span
          aria-hidden
          className="hidden h-6 w-px bg-white/15 md:block"
        />

        {/* City select as chip (mantido ao lado da busca) */}
        <div className="relative flex items-center md:min-w-[200px]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3 text-stone-500"
            aria-hidden
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <select
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            aria-label="Filtrar por cidade"
            className="w-full appearance-none rounded-xl bg-white/[0.05] py-2.5 pl-9 pr-9 text-sm font-medium text-stone-100 ring-1 ring-white/10 transition-colors focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-amber-400/30 [&>option]:bg-stone-900 [&>option]:text-stone-100"
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-3 text-stone-500"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Fase 5 — chips de filtros profundos. Row abaixo da command bar.
          Cada chip toggle independente; click em chip ativo limpa. */}
      <div className="relative mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 py-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/70">
            Tipo de café
          </span>
          {TIPO_CAFE_CHIPS.map((c) => {
            const active = tipoCafe === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleTipoCafe(c.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
                    : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.08] hover:text-stone-100"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <span aria-hidden className="hidden h-5 w-px bg-white/10 sm:block" />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/70">
            Perfil
          </span>
          {PERFIL_COMPRA_CHIPS.map((c) => {
            const active = perfil === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => togglePerfil(c.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
                    : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.08] hover:text-stone-100"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <span aria-hidden className="hidden h-5 w-px bg-white/10 sm:block" />

        <button
          type="button"
          onClick={toggleFeatured}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
            onlyFeatured
              ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
              : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.08] hover:text-stone-100"
          }`}
        >
          ⭐ Só destaques
        </button>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300/70 transition-colors hover:text-amber-200"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
