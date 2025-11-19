"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PedidoResumo = {
  id: number;
  status: string;
  forma_pagamento: string;
  data_pedido: string;
  total?: number;
};

type Item = {
  id: number; // id do registro em pedidos_produtos (continua igual)
  produto_id?: number; // opcional, caso você passe depois pelo backend
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string | null;
};

type PedidoDetalhe = PedidoResumo & {
  itens?: Item[];
  endereco?: string | null;
};

// utils
function formatDiaMes(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

function getNumericId(raw: unknown): number | null {
  const val = (raw as any)?.id ?? (raw as any)?.userId ?? raw;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (val != null) {
    const only = String(val).replace(/[^\d]/g, "");
    const num = Number(only);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  return null;
}

function StatusPill({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const base = "px-2 py-0.5 rounded-full text-xs font-semibold";

  if (s.includes("entreg") || s.includes("aprov") || s.includes("pago")) {
    return (
      <span className={`${base} bg-green-100 text-green-700`}>Entregue</span>
    );
  }
  if (s.includes("cancel")) {
    return (
      <span className={`${base} bg-red-100 text-red-700`}>Cancelado</span>
    );
  }
  if (s.includes("enviado")) {
    return (
      <span className={`${base} bg-blue-100 text-blue-700`}>Enviado</span>
    );
  }
  return (
    <span className={`${base} bg-amber-100 text-amber-700`}>
      {status || "Processando"}
    </span>
  );
}

export default function PedidosPage() {
  const { user } = useAuth();
  const userId = getNumericId(user);
  const token = user?.token ?? null;

  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [detalhes, setDetalhes] = useState<Record<number, PedidoDetalhe>>({});
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // LISTA DE PEDIDOS
  useEffect(() => {
    // cancela requisição anterior, se existir
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // se o usuário não estiver logado ou não tiver token válido
    if (!userId || !token) {
      setLoading(false);
      setPedidos([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pedidos`, {
          signal: ac.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 204 || res.status === 404) {
          setPedidos([]);
          return;
        }

        if (!res.ok) {
          throw new Error(String(res.status));
        }

        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError("Não foi possível carregar suas compras.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [userId, token]);

  // PREFETCH DOS DETALHES (silencioso)
  useEffect(() => {
    if (!pedidos.length || !token) return;

    let cancelled = false;

    (async () => {
      for (const p of pedidos) {
        if (cancelled || detalhes[p.id]) continue;

        try {
          const res = await fetch(`${API_BASE}/api/pedidos/${p.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) continue;

          const data: PedidoDetalhe = await res.json();
          if (!cancelled) {
            setDetalhes((prev) => ({ ...prev, [p.id]: data }));
          }
        } catch {
          // erro silencioso no prefetch
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pedidos, detalhes, token]);

  const grupos = useMemo(() => {
    const map = new Map<string, PedidoResumo[]>();
    pedidos.forEach((p) => {
      const key = formatDiaMes(p.data_pedido);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries());
  }, [pedidos]);

  // =========================
  // ESTADOS DE INTERFACE
  // =========================

  // não logado
  if (!userId || !token) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">
          Minhas Compras
        </h1>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 text-center shadow-sm">
          <p className="text-sm sm:text-base text-gray-600">
            Faça login para visualizar suas compras.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-flex justify-center px-5 py-3 rounded-lg bg-[#359293] text-white font-medium hover:bg-[#2b7778] transition-colors w-full sm:w-auto"
          >
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">
        Minhas Compras
      </h1>

      {/* Skeleton enquanto carrega */}
      {loading && (
        <ul className="space-y-3 sm:space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="animate-pulse rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:px-5 sm:py-5 shadow-sm"
            >
              <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-72 bg-gray-200 rounded" />
            </li>
          ))}
        </ul>
      )}

      {/* Erro */}
      {!loading && error && <p className="text-red-600">{error}</p>}

      {/* Sem pedidos */}
      {!loading && !error && pedidos.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 text-center shadow-sm">
          <p className="mb-3 font-semibold text-gray-700">
            Você ainda não possui compras.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg
                       bg-[#359293] text-white font-medium hover:bg-[#2b7778]
                       transition-colors w-full sm:w-auto"
          >
            Começar a comprar
          </Link>
        </div>
      )}

      {/* Lista de pedidos */}
      {!loading && !error && pedidos.length > 0 && (
        <div className="space-y-8 sm:space-y-10">
          {grupos.map(([diaMes, lista]) => (
            <section key={diaMes}>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                {diaMes}
              </p>
              <div className="space-y-3 sm:space-y-4">
                {lista.map((p) => {
                  const det = detalhes[p.id];
                  const first = det?.itens?.[0];

                  return (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm
                                 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                    >
                      {/* thumb */}
                      <div className="w-full h-36 sm:w-16 sm:h-16 rounded-lg bg-gray-100 overflow-hidden">
                        <img
                          alt={first?.nome || `Pedido #${p.id}`}
                          src={first?.imagem || "/placeholder.png"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder.png";
                          }}
                        />
                      </div>

                      {/* infos */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill status={p.status} />
                          <span className="text-xs text-gray-600">
                            {new Date(p.data_pedido).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>

                        <p className="mt-1 font-semibold text-sm sm:text-base truncate">
                          {first?.nome || `Pedido #${p.id}`}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {p.status?.toLowerCase().includes("entreg")
                            ? "Chegou — Correios entregou seu pacote."
                            : p.status?.toLowerCase().includes("enviado")
                            ? "Enviado — Seu pedido está a caminho."
                            : "Processando — Estamos preparando sua compra."}
                        </p>
                      </div>

                      {/* ações */}
                      <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
                        {/* 🔹 Ver compra → /pedidos/[id] (plural) */}
                        <Link
                          href={`/pedidos/${p.id}`}
                          className="px-5 py-3 rounded-lg bg-[#359293] text-white font-medium hover:bg-[#2b7778] transition-colors text-center w-full sm:w-auto"
                        >
                          Ver compra
                        </Link>

                        {/* 🔹 Comprar novamente → produto do primeiro item */}
                        <button
                          className="px-5 py-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                          onClick={() => {
                            const productId =
                              first?.produto_id ?? first?.id ?? null;
                            if (productId) {
                              window.location.href = `/produto/${productId}`;
                            } else {
                              window.location.href = "/";
                            }
                          }}
                        >
                          Comprar novamente
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
