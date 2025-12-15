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
  onApply?: () => void;
  stickyActions?: boolean;
  applyLabel?: string;
};

function safeNumberOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function FiltersPanel({
  categories,
  categoriesLoading,
  value,
  onChange,
  onClear,
  onApply,
  stickyActions = false,
  applyLabel = "Aplicar filtros",
}: Props) {
  const selectedCount = useMemo(() => {
    let c = 0;
    if (value.q?.trim()) c++;
    if (value.categories?.length) c++;
    if (value.minPrice != null || value.maxPrice != null) c++;
    if (value.promo) c++;
    return c;
  }, [value]);

  const minStr = value.minPrice == null ? "" : String(value.minPrice);
  const maxStr = value.maxPrice == null ? "" : String(value.maxPrice);

  const hasCategories = (categories || []).length > 0;

  const selectedCategoryId = value.categories?.[0] ?? 0;

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">Filtros</h2>
          {selectedCount > 0 ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              {selectedCount} filtro{selectedCount > 1 ? "s" : ""} ativo{selectedCount > 1 ? "s" : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-500">Ajuste para refinar os resultados</p>
          )}
        </div>

        <button
          type="button"
          onClick={onClear}
          className="
            inline-flex items-center justify-center
            rounded-lg border border-zinc-200 bg-white
            px-3 py-2 text-xs font-semibold text-zinc-700
            hover:bg-zinc-50 hover:text-zinc-900
            transition
          "
        >
          Limpar
        </button>
      </div>

      <div className="my-4 h-px bg-zinc-200/70" />

      <div className="space-y-5">
        {/* Busca */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-700">Buscar</label>
          <input
            value={value.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Nome ou descrição…"
            className="
              h-11 w-full rounded-xl border border-zinc-200 bg-white
              px-3 text-sm text-zinc-900 outline-none
              focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
            "
          />
        </div>

        {/* Categoria (igual admin) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-zinc-700">Categoria</label>
            {categoriesLoading ? <span className="text-xs text-zinc-500">Carregando…</span> : null}
          </div>

          <select
            value={String(selectedCategoryId)}
            onChange={(e) => {
              const id = Number(e.target.value);
              onChange({ categories: id > 0 ? [id] : [] });
            }}
            className="
              h-11 w-full rounded-xl border border-zinc-200 bg-white
              px-3 text-sm text-zinc-900 outline-none
              focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
            "
          >
            <option value="0">Selecione...</option>

            {hasCategories
              ? categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                    {typeof cat.total_products === "number" ? ` (${cat.total_products})` : ""}
                  </option>
                ))
              : null}
          </select>

          {!categoriesLoading && !hasCategories ? (
            <p className="text-xs text-zinc-500">Nenhuma categoria encontrada.</p>
          ) : null}
        </div>

        {/* Preço */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-700">Faixa de preço</label>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-500">Mínimo</span>
              <input
                inputMode="decimal"
                value={minStr}
                onChange={(e) => onChange({ minPrice: safeNumberOrNull(e.target.value) })}
                placeholder="0"
                className="
                  h-11 w-full rounded-xl border border-zinc-200 bg-white
                  px-3 text-sm text-zinc-900 outline-none
                  focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
                "
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-500">Máximo</span>
              <input
                inputMode="decimal"
                value={maxStr}
                onChange={(e) => onChange({ maxPrice: safeNumberOrNull(e.target.value) })}
                placeholder="9999"
                className="
                  h-11 w-full rounded-xl border border-zinc-200 bg-white
                  px-3 text-sm text-zinc-900 outline-none
                  focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
                "
              />
            </div>
          </div>
        </div>

        {/* Promo */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <label className="flex cursor-pointer items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Somente promoções</p>
              <p className="text-xs text-zinc-500">Exibe apenas produtos com desconto ativo</p>
            </div>

            <input
              type="checkbox"
              checked={value.promo}
              onChange={(e) => onChange({ promo: e.target.checked })}
              className="mt-1 h-5 w-5 accent-emerald-600"
            />
          </label>
        </div>
      </div>

      {/* Ações fixas (mobile drawer) */}
      {stickyActions ? (
        <div className="sticky bottom-0 mt-5 border-t border-zinc-200 bg-white pt-4">
          <button
            type="button"
            onClick={() => onApply?.()}
            className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            {applyLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
