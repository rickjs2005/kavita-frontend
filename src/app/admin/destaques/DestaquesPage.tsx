"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import DeleteButton from "@/components/buttons/DeleteButton";
import SearchInputProdutos from "@/components/products/SearchInput";
import CloseButton from "@/components/buttons/CloseButton";
import { getAdminToken } from "@/utils/auth";

type Destaque = {
  id: number;
  product_id: number;
  name: string;
  image: string | null;
  price: number | string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";
const API_ADMIN = `${API_BASE}/api/admin`;
const PLACEHOLDER = "https://via.placeholder.com/400x240?text=Sem+imagem";

function toImageUrl(raw?: string | null) {
  if (!raw) return PLACEHOLDER;
  const p = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.replace(/^\/+/, "");
  if (clean.startsWith("uploads/")) return `${API_BASE}/${clean}`;
  if (clean.startsWith("public/")) return `${API_BASE}/${clean}`;
  return `${API_BASE}/uploads/${clean}`;
}

function toArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  if (json && Array.isArray(json.rows)) return json.rows;
  if (json && Array.isArray(json.products)) return json.products;
  if (json && Array.isArray(json.items)) return json.items;
  return [];
}

export default function DestaquesPage() {
  const [destaques, setDestaques] = useState<Destaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    buscarDestaques();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscarDestaques() {
    try {
      setLoading(true);
      setErr(null);

      const token = getAdminToken();
      if (!token) throw new Error("Token de admin ausente (faça login).");

      const res = await fetch(`${API_ADMIN}/destaques`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Erro ao listar destaques (${res.status}).`);
      }

      const json = await res.json();
      const list = toArray(json) as Destaque[];
      setDestaques(
        list.map((d) => ({
          ...d,
          price: Number(d.price),
          image: toImageUrl(d.image),
        }))
      );
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Falha ao carregar destaques.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function adicionarDestaqueDireto(productId: number) {
    const token = getAdminToken();
    if (!token) {
      toast.error("Faça login de admin para adicionar destaques.");
      return;
    }

    if (destaques.some((d) => d.product_id === productId)) {
      toast.error("Este produto já está em destaques.");
      return;
    }

    try {
      const res = await fetch(`${API_ADMIN}/destaques`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });

      if (res.status === 409) {
        toast.error("Este produto já está em destaques.");
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Erro ao adicionar destaque.");
      }

      toast.success("Produto adicionado aos destaques.");
      await buscarDestaques();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao adicionar destaque.");
    }
  }

  async function removerDestaque(id: number) {
    const token = getAdminToken();
    if (!token) {
      toast.error("Faça login de admin para remover destaques.");
      return;
    }

    try {
      const res = await fetch(`${API_ADMIN}/destaques/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Erro ao remover destaque.");
      }

      toast.success("Destaque removido com sucesso.");
      await buscarDestaques();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao remover destaque.");
    }
  }

  const temItens = useMemo(() => destaques.length > 0, [destaques]);

  return (
    <div className="w-full px-3 py-5 sm:px-4 lg:px-6">
      {/* container principal vira relative para posicionar o X */}
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Botão de voltar: só mobile, bem colado no topo direito */}
        <CloseButton
          className="absolute right-3 -top-2 z-10 block text-2xl sm:hidden"
        />

        {/* Header responsivo */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Gerenciar Destaques
            </h1>
            <p className="text-xs text-gray-300 sm:text-sm">
              Busque o produto e clique na sugestão para adicioná-lo aos
              destaques.
            </p>

            <div className="mt-3 w-full sm:w-80 md:w-96">
              <SearchInputProdutos
                className="w-full"
                placeholder="Buscar e adicionar produto..."
                onPick={(p) => adicionarDestaqueDireto(p.id)}
              />
            </div>
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm sm:p-5">
            Carregando…
          </div>
        )}
        {err && !loading && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 sm:p-5">
            {err}
          </div>
        )}
        {!loading && !err && !temItens && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm sm:p-5">
            Nenhum destaque cadastrado ainda.
          </div>
        )}

        {/* Grid responsiva */}
        {temItens && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {destaques.map((d) => (
              <article
                key={d.id}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative w-full bg-gray-100/80 pb-[56.25%]">
                  <Image
                    src={toImageUrl(d.image)}
                    alt={String(d.name)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    onError={(e) =>
                      ((e.currentTarget as any).src = PLACEHOLDER)
                    }
                  />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h2 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                    {d.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {Number.isFinite(Number(d.price))
                      ? `R$ ${Number(d.price).toFixed(2)}`
                      : "Preço indisponível"}
                  </p>

                  <div className="mt-3">
                    <DeleteButton
                      onConfirm={() => removerDestaque(d.id)}
                      label="Remover"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
