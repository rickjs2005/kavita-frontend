"use client";

import { JSX, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CustomButton from "@/components/buttons/CustomButton";

import ProdutoForm from "@/components/admin/produtos/produtoform";
import ProdutoCard from "@/components/admin/produtos/produtocard";
import type { Product } from "@/components/admin/produtos/produtocard";

// ProdutoForm pode não exportar props tipadas — seguimos o cast temporário
const ProdutoFormAny = ProdutoForm as unknown as (props: any) => JSX.Element;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [produtoEditado, setProdutoEditado] = useState<Product | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  async function carregarProdutos() {
    setLoading(true);
    setErro(null);

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_BASE}/api/admin/produtos`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`Falha ao carregar (${res.status}). ${txt || ""}`);
      }

      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      const parsed: Product[] = arr.map((p: any) => ({
        ...p,
        price: Number(p.price),
        quantity: Number(p.quantity),
      }));

      setProdutos(parsed);
    } catch (e: any) {
      console.error("carregarProdutos:", e);
      setErro(e?.message || "Erro ao carregar produtos.");
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  function handleEditarProduto(produto: Product) {
    setProdutoEditado(produto);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function removerProduto(id: number) {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("Faça login no admin.");
      return;
    }
    if (!confirm("Tem certeza que deseja remover este produto?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/produtos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status !== 204) {
        const txt = await safeText(res);
        throw new Error(`Falha ao remover (${res.status}). ${txt || ""}`);
      }

      await carregarProdutos(); // recarrega para refletir remoção/imagens
    } catch (e: any) {
      console.error("removerProduto:", e);
      alert(e?.message || "Erro ao remover produto.");
    }
  }

  // util: lê body de erro com segurança
  async function safeText(res: Response) {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        return j?.message || JSON.stringify(j);
      }
      return await res.text();
    } catch {
      return "";
    }
  }

  return (
    <div className="w-full">
      {/* Header com botão Voltar */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Produtos
          </h1>
          <p className="text-gray-600 mt-1">
            Adicione, edite ou remova produtos do catálogo.
          </p>
        </div>

        <Link href="/admin" className="shrink-0">
          <CustomButton label="Voltar" variant="secondary" size="small" isLoading={false} />
        </Link>
      </div>

      {/* Form em card responsivo */}
      <section
        ref={formRef}
        className="bg-white rounded-2xl shadow p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          {produtoEditado ? "Editar Produto" : "Adicionar Produto"}
        </h2>

        <ProdutoFormAny
          produtoEditado={produtoEditado}
          onLimparEdicao={() => setProdutoEditado(null)}
          onProdutoAdicionado={carregarProdutos}
        />
      </section>

      {/* Lista / Estados */}
      {loading && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 text-gray-600">
          Carregando produtos…
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-2xl border border-red-300 bg-red-50 text-red-700 p-4 sm:p-5">
          {erro}
        </div>
      )}

      {!loading && !erro && produtos.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 text-gray-600">
          Nenhum produto cadastrado.
        </div>
      )}

      {!loading && !erro && produtos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lista de produtos</h3>
            <span className="text-sm text-gray-500">{produtos.length} itens</span>
          </div>

          {/* Grid responsiva: 1col (mobile) → 2col (md) → 3col (xl) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {produtos.map((p) => (
              <ProdutoCard
                key={p.id}
                produto={p}
                className="mt-0"
                onEditar={handleEditarProduto}
                onRemover={removerProduto}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
