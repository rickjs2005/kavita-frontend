// src/components/ui/SearchBar.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaCartPlus } from "react-icons/fa";
import { useCart } from "@/context/CartContext";

// use somente para mapear respostas da API (sem forçar o carrinho a ter o mesmo tipo)
import type { Product } from "@/types/product";
import type { Service } from "@/types/service";

/** Item normalizado para a UI de sugestões */
type ResultItem =
  | { type: "produto"; id: number; name: string; price: number; image?: string; images?: string[] }
  | { type: "servico"; id: number; name: string; price: number; image?: string; images?: string[] };

/** Tipo do item que o addToCart espera (inferido do próprio contexto) */
type CartItem = Parameters<ReturnType<typeof useCart>["addToCart"]>[0];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/placeholder.png";
const ORANGE = "#FF7A00";

/* ---------------- helpers ---------------- */
function toArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data?.data && Array.isArray(data.data)) return data.data as T[];
  if (data?.items && Array.isArray(data.items)) return data.items as T[];
  if (data?.results && Array.isArray(data.results)) return data.results as T[];
  if (data?.produtos && Array.isArray(data.produtos)) return data.produtos as T[];
  return [];
}

function resolveImage(raw?: unknown): string {
  if (!raw) return PLACEHOLDER;
  if (typeof raw === "object" && raw !== null) {
    const anyRaw = raw as any;
    const candidate = anyRaw.url || anyRaw.path || anyRaw.src || anyRaw.image || anyRaw.imagem;
    if (candidate) return resolveImage(candidate);
    return PLACEHOLDER;
  }
  let src = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API_URL}${src}`;
  if (src.startsWith("uploads")) return `${API_URL}/${src}`;
  return `${API_URL}/uploads/${src}`;
}

function formatPrice(v: unknown): string {
  const n = parseFloat(String(v ?? "").replace(/[^0-9,.-]/g, "").replace(",", "."));
  return isNaN(n) ? "0,00" : n.toFixed(2);
}

/* ---------------- componente ---------------- */
export default function SearchBar() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);

  // debounce ~350ms
  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      if (q.length > 1) doSearch(q);
      else setResults([]);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const doSearch = async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const produtoURLs = [
        `${API_URL}/api/public/produtos?busca=${encodeURIComponent(q)}`,
        // fallbacks (se existirem no seu backend)
        `${API_URL}/api/produtos/search?query=${encodeURIComponent(q)}`,
        `${API_URL}/api/produtos?busca=${encodeURIComponent(q)}`,
      ];
      const servicoURLs = [
        `${API_URL}/api/public/servicos?busca=${encodeURIComponent(q)}`,
        `${API_URL}/api/servicos/search?query=${encodeURIComponent(q)}`,
        `${API_URL}/api/servicos?busca=${encodeURIComponent(q)}`,
      ];

      const fetchFirstOk = async (urls: string[]) => {
        for (const url of urls) {
          try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) continue;
            const json = await res.json();
            return toArray(json);
          } catch (e: any) {
            if (e?.name === "AbortError") return [];
          }
        }
        return [];
      };

      const [produtosRaw, servicosRaw] = await Promise.all([
        fetchFirstOk(produtoURLs),
        fetchFirstOk(servicoURLs),
      ]);

      const prods: ResultItem[] = toArray<Product>(produtosRaw).map((p: any) => ({
        type: "produto",
        id: Number(p.id),
        name: p.name ?? p.nome ?? "Produto",
        price: Number(p.price ?? p.preco ?? 0),
        image: p.image,
        images: p.images,
      }));

      const servs: ResultItem[] = toArray<Service>(servicosRaw).map((s: any) => ({
        type: "servico",
        id: Number(s.id),
        name: s.nome ?? s.name ?? "Serviço",
        price: Number(s.preco ?? s.price ?? 0),
        image: s.imagem ?? s.image,
        images: s.images,
      }));

      setResults([...prods, ...servs]);
      setCursor(-1);
      setOpen(true);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const goTo = (item: ResultItem) => {
    if (item.type === "produto") router.push(`/produtos/${item.id}`);
    else router.push(`/servicos/${item.id}`);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") setCursor((v) => Math.min(v + 1, results.length - 1));
    else if (e.key === "ArrowUp") setCursor((v) => Math.max(v - 1, 0));
    else if (e.key === "Enter") {
      if (cursor >= 0 && results[cursor]) {
        goTo(results[cursor]);
      } else {
        const q = query.trim();
        if (q.length > 0) {
          setOpen(false);
          router.push(`/busca?q=${encodeURIComponent(q)}`);
        }
      }
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cursor >= 0 && results[cursor]) return goTo(results[cursor]);
    const q = query.trim();
    if (q.length > 0) {
      setOpen(false);
      router.push(`/busca?q=${encodeURIComponent(q)}`);
    }
  };

  const ORANGE_ICON = useMemo(() => ({ color: ORANGE, fontSize: 16 }), []);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <form onSubmit={onSubmit} className="flex shadow rounded overflow-hidden bg-white">
        <input
          type="text"
          placeholder="Buscar produto ou serviço..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full px-4 py-2 text-sm text-gray-700 focus:outline-none"
          aria-label="Buscar"
        />
        <button
          type="submit"
          className="px-4 py-2 border-l border-gray-200 hover:bg-gray-50 transition"
          aria-label="Pesquisar"
          title="Pesquisar"
        >
          <FaSearch style={ORANGE_ICON} />
        </button>
      </form>

      {open && (
        <ul className="absolute w-full mt-1 z-20 max-h-64 overflow-y-auto border border-gray-200 bg-white rounded-md shadow">
          {loading ? (
            <li className="px-4 py-2 text-sm text-gray-500 italic">Carregando...</li>
          ) : results.length ? (
            results.map((item, i) => {
              const first = item.image || (Array.isArray(item.images) ? item.images[0] : undefined);
              const img = resolveImage(first);

              return (
                <li
                  key={`${item.type}-${item.id}`}
                  onMouseDown={() => goTo(item)}
                  className={`flex justify-between items-center gap-3 px-4 py-3 cursor-pointer ${
                    i === cursor ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.type === "produto" ? "🛒 Produto" : "🧰 Serviço"}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">R$ {formatPrice(item.price)}</p>
                    </div>
                  </div>

                  {item.type === "produto" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // monte o item do carrinho usando o tipo que o addToCart realmente espera
                        const prod: CartItem = {
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          // se o carrinho aceitar `image`, mandamos string simples
                          image: typeof first === "string" ? first : undefined,
                          // quantity opcional — se o seu carrinho exigir, mantenha:
                          quantity: 1 as any,
                        } as CartItem;

                        addToCart(prod);
                      }}
                      className="hover:opacity-80"
                      title="Adicionar ao carrinho"
                      aria-label="Adicionar ao carrinho"
                    >
                      <FaCartPlus style={{ color: ORANGE, fontSize: 18 }} />
                    </button>
                  )}
                </li>
              );
            })
          ) : (
            <li className="px-4 py-2 text-sm text-gray-500 italic">Nenhum resultado encontrado</li>
          )}
        </ul>
      )}
    </div>
  );
}
