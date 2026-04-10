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

export function CorretoraFilters({ cities }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const applyFilters = useCallback(
    (newCity: string, newSearch: string) => {
      const params = new URLSearchParams();
      if (newCity) params.set("city", newCity);
      if (newSearch.trim()) params.set("search", newSearch.trim());
      const qs = params.toString();
      router.push(`/mercado-do-cafe/corretoras${qs ? `?${qs}` : ""}`);
    },
    [router],
  );

  const handleCityChange = (value: string) => {
    setCity(value);
    applyFilters(value, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(city, search);
  };

  useEffect(() => {
    setCity(searchParams.get("city") ?? "");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

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

        {/* City select as chip */}
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
    </div>
  );
}
