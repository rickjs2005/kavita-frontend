"use client";

import { useEffect, useMemo, useState } from "react";

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
  /** base do backend; opcional (usa env/localhost por padrão) */
  apiBase?: string;
};

// Se tiver um arquivo em public/placeholder.png, pode trocar por "/placeholder.png"
const PLACEHOLDER = "https://via.placeholder.com/80?text=Img";
const API_DEFAULT =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* ------------------------- Utils de normalização ------------------------- */

function toArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  if (json && Array.isArray(json.rows)) return json.rows;
  if (json && Array.isArray(json.items)) return json.items;
  if (json && Array.isArray(json.products)) return json.products;
  return [];
}

function toImageUrl(apiBase: string, raw?: string | null) {
  if (!raw) return PLACEHOLDER;
  const p = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.replace(/^\/+/, "");
  if (clean.startsWith("uploads/")) return `${apiBase}/${clean}`;
  if (clean.startsWith("public/")) return `${apiBase}/${clean}`;
  return `${apiBase}/uploads/${clean}`;
}

/* --------------------------------- Componente -------------------------------- */

export default function SearchInputProdutos({
  placeholder = "Buscar produto…",
  className = "",
  onPick,
  apiBase = API_DEFAULT,
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
         const res = await fetch(`${apiBase}/api/products?category=all&limit=1000&sort=name&order=asc`, 
          { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Falha ao listar produtos (${res.status}): ${txt}`);
        }
        const json = await res.json();
        const arr = toArray(json);

        const list: Produto[] = arr.map((p: any) => ({
          id: Number(p.id ?? p.product_id ?? 0),
          name: String(p.name ?? p.nome ?? ""),
          price: Number(p.price ?? p.preco ?? 0),
          image:
            p.image ??
            (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null),
          images: Array.isArray(p.images) ? p.images : null,
        }));

        setAll(list);
      } catch (err) {
        console.warn("[SearchInput] Erro ao carregar produtos:", err);
        setAll([]); // evita quebrar o UI
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase]);

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
    return all
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
            if (e.key === "ArrowUp")
              setCursor((v) => Math.max(v - 1, 0));
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
              const img = toImageUrl(apiBase, p.image);
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
                      ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.name}
                    </p>
                    {!!p.price && (
                      <p className="text-xs text-green-700">
                        R$ {Number(p.price).toFixed(2)}
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
