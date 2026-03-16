"use client";

import { useEffect, useMemo, useState } from "react";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { formatCurrency } from "@/utils/formatters";

type Produto = {
  id: number;
  name: string;
  price?: number;
  image?: string | null;
  images?: string[] | null;
};

type Props = {
  placeholder?: string;
  className?: string;
  /** chamado quando o usuário escolhe um produto (clique ou Enter) */
  onPick: (produto: Produto) => void;
};

/* ------------------------- Utils de normalização ------------------------- */

function toArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  if (json && Array.isArray(json.rows)) return json.rows;
  if (json && Array.isArray(json.items)) return json.items;
  if (json && Array.isArray(json.products)) return json.products;
  return [];
}

/* --------------------------------- Componente -------------------------------- */

export default function SearchInputProdutos({
  placeholder = "Buscar produto…",
  className = "",
  onPick,
}: Props) {
  const [all, setAll] = useState<Produto[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [loading, setLoading] = useState(false);

  // Carrega os produtos uma vez (endpoint público)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const json = await apiClient.get(
          "/api/products?category=all&limit=1000&sort=name&order=asc",
        );
        const arr = toArray(json);

        const list: Produto[] = arr.map((p: any) => ({
          id: Number(p.id ?? p.product_id ?? 0),
          name: String(p.name ?? p.nome ?? ""),
          price: Number(p.price ?? p.preco ?? 0),
          image:
            p.image ??
            (Array.isArray(p.images) && p.images.length > 0
              ? p.images[0]
              : null),
          images: Array.isArray(p.images) ? p.images : null,
        }));

        setAll(list);
      } catch {
        setAll([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Debounce do termo
  const [debounced, setDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Filtro local
  const results = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    if (!term) return [];
    return all.filter((p) => p.name.toLowerCase().includes(term));
  }, [debounced, all]);

  function choose(item: Produto) {
    onPick(item);
    setOpen(false);
    setQ("");
    setCursor(-1);
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex shadow rounded overflow-hidden bg-white">
        <input
          type="text"
          value={q}
          placeholder={placeholder}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!results.length) return;
            if (e.key === "ArrowDown")
              setCursor((v) => Math.min(v + 1, results.length - 1));
            if (e.key === "ArrowUp") setCursor((v) => Math.max(v - 1, 0));
            if (e.key === "Enter" && cursor >= 0) choose(results[cursor]!);
          }}
          className="w-full px-4 py-2 text-sm text-gray-700 focus:outline-none"
        />
        <button
          type="button"
          className="px-3 border-l border-gray-200 bg-white"
          title="Pesquisar"
          aria-label="Pesquisar"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Lupa laranja */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF7A00"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>

      {open && (
        <ul className="absolute z-20 w-full mt-1 max-h-64 overflow-y-auto border border-gray-200 bg-white rounded-md shadow">
          {loading ? (
            <li className="px-4 py-2 text-sm text-gray-500 italic">
              Carregando…
            </li>
          ) : results.length ? (
            results.map((p, i) => {
              const img = absUrl(p.image);
              return (
                <li
                  key={p.id}
                  onMouseDown={() => choose(p)}
                  className={`flex items-center gap-3 px-4 py-2 cursor-pointer ${
                    i === cursor ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={img}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded"
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).src = "/placeholder.png")
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.name}
                    </p>
                    {!!p.price && (
                      <p className="text-xs text-green-700">
                        {formatCurrency(p.price)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })
          ) : debounced.trim() ? (
            <li className="px-4 py-2 text-sm text-gray-500 italic">
              Nenhum produto encontrado
            </li>
          ) : (
            <li className="px-4 py-2 text-sm text-gray-500 italic">
              Digite para buscar…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
