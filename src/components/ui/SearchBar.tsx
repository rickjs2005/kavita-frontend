"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaCartPlus } from "react-icons/fa";
import { useCart } from "@/context/CartContext";

type ResultItem =
  | { type: "produto"; id: number; name: string; price: number; image?: string; images?: string[] }
  | { type: "servico"; id: number; name: string; price: number; image?: string; images?: string[] };

type CartItem = Parameters<ReturnType<typeof useCart>["addToCart"]>[0];

const PLACEHOLDER = "/placeholder.png";
const ORANGE = "#FF7A00";

/** Blindado: nunca gera /api/api */
function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const base = raw.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const API_BASE = getApiBase();

function safeNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data?.products && Array.isArray(data.products)) return data.products as T[];
  if (data?.data && Array.isArray(data.data)) return data.data as T[];
  if (data?.items && Array.isArray(data.items)) return data.items as T[];
  if (data?.results && Array.isArray(data.results)) return data.results as T[];
  return [];
}

function resolveImage(raw?: unknown): string {
  if (!raw) return PLACEHOLDER;

  if (typeof raw === "object" && raw !== null) {
    const anyRaw = raw as any;
    const candidate = anyRaw.url || anyRaw.path || anyRaw.src || anyRaw.image || anyRaw.imagem;
    return candidate ? resolveImage(candidate) : PLACEHOLDER;
  }

  const src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return PLACEHOLDER;

  if (/^https?:\/\//i.test(src)) return src;

  const serverBase = API_BASE.replace(/\/api$/, "");

  if (src.startsWith("/uploads")) return `${serverBase}${src}`;
  if (src.startsWith("uploads")) return `${serverBase}/${src}`;

  return `${serverBase}/uploads/${src}`;
}

function formatPrice(v: unknown): string {
  const n = parseFloat(String(v ?? "").replace(/[^0-9,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n.toFixed(2) : "0,00";
}

export default function SearchBar() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      if (q.length >= 1) doSearch(q);
      else {
        abortRef.current?.abort();
        setResults([]);
        setCursor(-1);
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ✅ mappers tipados (resolve o erro do "type: string")
  const mapProduto = (p: any): ResultItem => {
    const price =
      p.final_price != null
        ? safeNumber(p.final_price, 0)
        : p.original_price != null
          ? safeNumber(p.original_price, 0)
          : safeNumber(p.price ?? p.preco, 0);

    const images = Array.isArray(p.images) ? p.images : [];
    const image = images?.[0] ?? p.image ?? null;

    return {
      type: "produto",
      id: Number(p.id),
      name: p.name ?? p.nome ?? "Produto",
      price,
      image: image || undefined,
      images,
    };
  };

  const mapServico = (s: any): ResultItem => {
    const images = Array.isArray(s.images) ? s.images : [];
    const image = s.imagem ?? s.image ?? images?.[0] ?? null;

    return {
      type: "servico",
      id: Number(s.id),
      name: s.nome ?? s.name ?? "Serviço",
      price: safeNumber(s.preco ?? s.price, 0),
      image: image || undefined,
      images,
    };
  };

  const doSearch = async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);

    try {
      const produtosUrl = `${API_BASE}/products/search?q=${encodeURIComponent(q)}&page=1&limit=6&sort=newest`;
      const servicosUrl = `${API_BASE}/public/servicos?busca=${encodeURIComponent(q)}&page=1&limit=6&sort=id&order=desc`;

      const [prodRes, servRes] = await Promise.all([
        fetch(produtosUrl, { signal: ctrl.signal, credentials: "include" }),
        fetch(servicosUrl, { signal: ctrl.signal, credentials: "include" }),
      ]);

      const produtosJson = prodRes.ok ? await prodRes.json() : null;
      const servicosJson = servRes.ok ? await servRes.json() : null;

      const produtosRaw = toArray<any>(produtosJson);
      const servicosRaw = toArray<any>(servicosJson);

      const produtos: ResultItem[] = produtosRaw.map(mapProduto);
      const servicos: ResultItem[] = servicosRaw.map(mapServico);

      // ✅ agora TS entende que é ResultItem[]
      setResults([...produtos, ...servicos].slice(0, 12));
      setCursor(-1);
      setOpen(true);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error("Search error:", e);
      setResults([]);
      setCursor(-1);
    } finally {
      setLoading(false);
    }
  };

  const goTo = (item: ResultItem) => {
    router.push(item.type === "produto" ? `/produtos/${item.id}` : `/servicos/${item.id}`);
    setOpen(false);
    setQuery("");
    setResults([]);
    setCursor(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") setCursor((v) => Math.min(v + 1, results.length - 1));
    else if (e.key === "ArrowUp") setCursor((v) => Math.max(v - 1, 0));
    else if (e.key === "Escape") {
      setOpen(false);
      setCursor(-1);
    } else if (e.key === "Enter") {
      if (cursor >= 0 && results[cursor]) goTo(results[cursor]);
      else {
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
          autoComplete="off"
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
              const img = resolveImage(item.image || item.images?.[0]);

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
                      <p className="text-xs text-gray-500">{item.type === "produto" ? "Produto" : "Serviço"}</p>
                      <p className="text-xs text-green-600 font-semibold">R$ {formatPrice(item.price)}</p>
                    </div>
                  </div>

                  {item.type === "produto" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const prod: CartItem = {
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
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
