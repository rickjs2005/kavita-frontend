'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import DeleteButton from '@/components/buttons/DeleteButton';
import SearchInputProdutos from '@/components/products/SearchInput';
import { getAdminToken } from '@/utils/auth';

type Destaque = {
  id: number;
  product_id: number;
  name: string;
  image: string | null;
  price: number | string;
};

const API_BASE   = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:5000';
const API_ADMIN  = `${API_BASE}/api/admin`;
const PLACEHOLDER = 'https://via.placeholder.com/400x240?text=Sem+imagem';

// normaliza caminho de imagem
function toImageUrl(raw?: string | null) {
  if (!raw) return PLACEHOLDER;
  const p = String(raw).trim().replace(/\\/g, '/');
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.replace(/^\/+/, '');
  if (clean.startsWith('uploads/')) return `${API_BASE}/${clean}`;
  if (clean.startsWith('public/'))  return `${API_BASE}/${clean}`;
  return `${API_BASE}/uploads/${clean}`;
}

// transforma qualquer formato de JSON em array
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
      if (!token) throw new Error('Token de admin ausente (faça login).');

      const res = await fetch(`${API_ADMIN}/destaques`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Erro ao listar destaques (${res.status}).`);
      }

      const json = await res.json();
      const list = toArray(json) as Destaque[];
      setDestaques(
        list.map((d) => ({ ...d, price: Number(d.price), image: toImageUrl(d.image) }))
      );
    } catch (e: any) {
      setErr(e?.message || 'Falha ao carregar destaques.');
    } finally {
      setLoading(false);
    }
  }

  async function adicionarDestaqueDireto(productId: number) {
    const token = getAdminToken();
    if (!token) return alert('Faça login de admin para adicionar destaques.');

    if (destaques.some((d) => d.product_id === productId)) {
      return alert('Este produto já está em destaques.');
    }

    const res = await fetch(`${API_ADMIN}/destaques`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: productId }),
    });

    if (res.status === 409) return alert('Este produto já está em destaques.');
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return alert(t || 'Erro ao adicionar destaque.');
    }

    await buscarDestaques();
  }

  async function removerDestaque(id: number) {
    const token = getAdminToken();
    if (!token) return alert('Faça login de admin para remover destaques.');

    const res = await fetch(`${API_ADMIN}/destaques/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return alert(t || 'Erro ao remover destaque.');
    }

    await buscarDestaques();
  }

  const temItens = useMemo(() => destaques.length > 0, [destaques]);

  return (
    <div className="px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#359293]">Gerenciar Destaques</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Busque o produto e clique na sugestão para adicioná-lo aos destaques.
          </p>
        </div>

        {/* Apenas SearchInput (sem select) */}
        <div className="w-full sm:w-96">
          <SearchInputProdutos
            className="w-full"
            placeholder="Buscar e adicionar produto..."
            onPick={(p) => adicionarDestaqueDireto(p.id)}
          />
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="mt-6 text-gray-500">Carregando…</div>
      )}
      {err && !loading && (
        <div className="mt-6 text-sm text-red-600">{err}</div>
      )}
      {!loading && !err && !temItens && (
        <div className="mt-6 text-gray-600">Nenhum destaque cadastrado ainda.</div>
      )}

      {/* Grid responsivo */}
      {temItens && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {destaques.map((d) => (
            <article
              key={d.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Imagem com ratio responsivo */}
              <div className="relative w-full aspect-[16/9] bg-gray-100">
                <Image
                  src={toImageUrl(d.image)}
                  alt={String(d.name)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  onError={(e) => ((e.currentTarget as any).src = PLACEHOLDER)}
                />
              </div>

              {/* Conteúdo */}
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 truncate">{d.name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {Number.isFinite(Number(d.price))
                    ? `R$ ${Number(d.price).toFixed(2)}`
                    : 'Preço indisponível'}
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
  );
}
