"use client";

import { useMemo } from "react";

type Category = { id: number; name: string; slug?: string; total_products?: number };

export type FiltersState = {
  q: string;
  categories: number[];
  minPrice: number | null;
  maxPrice: number | null;
  promo: boolean;
};

type Props = {
  categories: Category[];
  categoriesLoading?: boolean;
  value: FiltersState;
  onChange: (patch: Partial<FiltersState>) => void;
  onClear: () => void;
};

function toggleInArray(arr: number[], id: number) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export function FiltersPanel({ categories, categoriesLoading, value, onChange, onClear }: Props) {
  const minStr = value.minPrice == null ? "" : String(value.minPrice);
  const maxStr = value.maxPrice == null ? "" : String(value.maxPrice);

  const selectedCount = useMemo(() => {
    let c = 0;
    if (value.q?.trim()) c++;
    if (value.categories?.length) c++;
    if (value.minPrice != null || value.maxPrice != null) c++;
    if (value.promo) c++;
    return c;
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Filtros</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
        >
          Limpar {selectedCount ? `(${selectedCount})` : ""}
        </button>
      </div>

      {/* Busca textual (opcional) */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-700">Buscar</label>
        <input
          value={value.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Nome ou descrição…"
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500"
        />
      </div>

      {/* Categorias (multi) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-700">Categorias</label>
          {categoriesLoading ? <span className="text-xs text-zinc-500">Carregando…</span> : null}
        </div>

        <div className="max-h-60 space-y-2 overflow-auto pr-1">
          {(categories || []).map((cat) => {
            const checked = value.categories.includes(cat.id);
            return (
              <label key={cat.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange({ categories: toggleInArray(value.categories, cat.id) })}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="truncate">{cat.name}</span>
              </label>
            );
          })}
          {!categoriesLoading && (!categories || categories.length === 0) ? (
            <p className="text-xs text-zinc-500">Nenhuma categoria encontrada.</p>
          ) : null}
        </div>
      </div>

      {/* Preço */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-700">Faixa de preço</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            inputMode="numeric"
            value={minStr}
            onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : null })}
            placeholder="Mín"
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500"
          />
          <input
            inputMode="numeric"
            value={maxStr}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : null })}
            placeholder="Máx"
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Promo */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">Somente promoções</p>
          <p className="text-xs text-zinc-600">Exibe apenas produtos com desconto ativo</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ promo: !value.promo })}
          className={[
            "relative h-6 w-11 rounded-full transition-colors",
            value.promo ? "bg-emerald-600" : "bg-zinc-300",
          ].join(" ")}
          aria-pressed={value.promo}
        >
          <span
            className={[
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              value.promo ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>
    </div>
  );
}
