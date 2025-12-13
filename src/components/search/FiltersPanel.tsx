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

  /**
   * Opcional: use no drawer mobile para ter um CTA "Aplicar".
   * Se não passar, o painel funciona normalmente (onChange já aplica).
   */
  onApply?: () => void;

  /**
   * Opcional: mostra/oculta a barra de ações fixa no rodapé do painel.
   * Recomendo true no mobile drawer, false no desktop.
   */
  stickyActions?: boolean;

  /**
   * Opcional: label do botão aplicar (ex.: "Ver resultados")
   */
  applyLabel?: string;
};

function toggleInArray(arr: number[], id: number) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

function safeNumberOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  // aceita “12,50” e “12.50”
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

  return (
    <div className="relative">
      {/* Header */}
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
          <div className="relative">
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
        </div>

        {/* Categorias */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-zinc-700">Categorias</label>
            {categoriesLoading ? (
              <span className="text-xs text-zinc-500">Carregando…</span>
            ) : null}
          </div>

          <div
            className="
              max-h-64 space-y-2 overflow-auto pr-1
              rounded-xl border border-zinc-200 bg-white p-3
            "
          >
            {hasCategories ? (
              (categories || []).map((cat) => {
                const checked = value.categories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className="
                      flex cursor-pointer items-center justify-between gap-3
                      rounded-lg px-2 py-2
                      hover:bg-zinc-50
                      transition
                    "
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onChange({ categories: toggleInArray(value.categories, cat.id) })}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      <span className="truncate text-sm text-zinc-800">{cat.name}</span>
                    </span>

                    {typeof cat.total_products === "number" ? (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                        {cat.total_products}
                      </span>
                    ) : null}
                  </label>
                );
              })
            ) : !categoriesLoading ? (
              <p className="text-xs text-zinc-500">Nenhuma categoria encontrada.</p>
            ) : null}
          </div>
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

          {(value.minPrice != null || value.maxPrice != null) && (
            <p className="text-[11px] text-zinc-500">
              Dica: você pode usar “12,50” ou “12.50”.
            </p>
          )}
        </div>

        {/* Promo */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">Somente promoções</p>
              <p className="mt-0.5 text-xs text-zinc-600">Exibe apenas produtos com desconto ativo</p>
            </div>

            <button
              type="button"
              onClick={() => onChange({ promo: !value.promo })}
              aria-pressed={value.promo}
              className={[
                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                value.promo ? "bg-emerald-600" : "bg-zinc-300",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
                  value.promo ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Actions (opcional) */}
      {onApply ? (
        <div
          className={[
            "mt-5 flex items-center gap-2",
            stickyActions
              ? "sticky bottom-0 -mx-4 border-t border-zinc-200 bg-white px-4 py-4"
              : "",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={onClear}
            className="
              w-full rounded-xl border border-zinc-200 bg-white
              px-4 py-3 text-sm font-semibold text-zinc-800
              hover:bg-zinc-50
            "
          >
            Limpar
          </button>

          <button
            type="button"
            onClick={onApply}
            className="
              w-full rounded-xl bg-emerald-600
              px-4 py-3 text-sm font-semibold text-white
              hover:bg-emerald-700
            "
          >
            {applyLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
