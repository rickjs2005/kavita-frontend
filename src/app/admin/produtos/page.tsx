"use client";

import { JSX, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CustomButton from "@/components/buttons/CustomButton";
import apiClient from "@/lib/apiClient";

import ProdutoForm from "@/components/admin/produtos/produtoform";
import ProdutoCard from "@/components/admin/produtos/produtocard";
import type { Product } from "@/components/admin/produtos/produtocard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { API_BASE } from "@/utils/absUrl";

const ProdutoFormAny = ProdutoForm as unknown as (props: any) => JSX.Element;

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [produtoEditado, setProdutoEditado] = useState<Product | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  async function carregarProdutos() {
    setLoading(true);
    setErro(null);

    try {
      const data = await apiClient.get<Product[]>("/api/admin/produtos");
      const arr = Array.isArray(data) ? data : [];

      const parsed: Product[] = arr.map((p: any) => ({
        ...p,
        price: Number(p.price),
        quantity: Number(p.quantity),
      }));

      setProdutos(parsed);
    } catch (e: any) {
      console.error("carregarProdutos:", e);
      if (e?.status === 401 || e?.status === 403) {
        setErro("Sessão expirada. Faça login novamente.");
        return;
      }
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
    if (!confirm("Tem certeza que deseja remover este produto?")) return;

    try {
      await apiClient.del(`/api/admin/produtos/${id}`);
      await carregarProdutos();
    } catch (e: any) {
      console.error("removerProduto:", e);
      if (e?.status === 401 || e?.status === 403) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }
      alert(e?.message || "Erro ao remover produto.");
    }
  }

  return (
    <div className="w-full px-3 py-5 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
        <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Produtos
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Adicione, edite ou remova produtos do catálogo.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link href="/admin/frete" className="w-full sm:w-auto">
              <CustomButton
                label="Editar frete (regiões)"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </Link>

            <Link href="/admin" className="hidden sm:block">
              <CustomButton
                label="Voltar"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </Link>
          </div>

          <Link
            href="/admin"
            className="absolute -right-1 -top-3 z-10 block sm:hidden"
          >
            <CustomButton
              label="Voltar"
              variant="secondary"
              size="small"
              isLoading={false}
            />
          </Link>
        </header>

        <section ref={formRef} aria-label="Formulário de produto">
          <ProdutoFormAny
            API_BASE={API_BASE} // ✅ ESSENCIAL: sem isso vira "undefined/api/..." e cai no Next (3000)
            produtoEditado={produtoEditado}
            onLimparEdicao={() => setProdutoEditado(null)}
            onProdutoAdicionado={carregarProdutos}
          />
        </section>

        {loading && <LoadingState message="Carregando produtos…" />}

        {!loading && erro && <ErrorState message={erro} />}

        {!loading && !erro && produtos.length === 0 && (
          <EmptyState message="Nenhum produto cadastrado." />
        )}

        {!loading && !erro && produtos.length > 0 && (
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-50">
                Lista de produtos
              </h3>
              <span className="text-sm text-gray-300">
                {produtos.length} itens
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
