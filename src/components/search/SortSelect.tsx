"use client";

export type SortKey =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "sold_desc"
  | "new_desc"
  | "discount_desc";

type Props = {
  value: SortKey;
  onChange: (v: SortKey) => void;
};

export function SortSelect({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-zinc-600 md:inline">Ordenar:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500"
      >
        <option value="relevance">Relevância</option>
        <option value="price_asc">Preço: menor → maior</option>
        <option value="price_desc">Preço: maior → menor</option>
        <option value="sold_desc">Mais vendidos</option>
        <option value="new_desc">Mais recentes</option>
        <option value="discount_desc">Maior desconto</option>
      </select>
    </div>
  );
}
