// src/components/mercado-do-cafe/CorretoraFilters.tsx
"use client";

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
    [router]
  );

  const handleCityChange = (value: string) => {
    setCity(value);
    applyFilters(value, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(city, search);
  };

  // Sync with URL on back/forward
  useEffect(() => {
    setCity(searchParams.get("city") ?? "");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={city}
        onChange={(e) => handleCityChange(e.target.value)}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Filtrar por cidade"
      >
        <option value="">Todas as cidades</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar corretora..."
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Buscar corretora"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
