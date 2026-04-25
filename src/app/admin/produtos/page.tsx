"use client";

import { JSX, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import CustomButton from "@/components/buttons/CustomButton";
import apiClient from "@/lib/apiClient";
import ProdutoCard from "@/components/admin/produtos/produtocard";
import type { Product } from "@/components/admin/produtos/produtocard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { API_BASE } from "@/utils/absUrl";

// A3 — resposta do endpoint /api/admin/produtos/estoque-baixo
type LowStockResp = {
  items: Product[];
  default_threshold: number;
  total: number;
};

const ProdutoForm = dynamic(
  () => import("@/components/admin/produtos/produtoform"),
  {
    ssr: false,
    loading: () => (
      <div className="py-4 text-center text-sm text-slate-400">
        Carregando formulário…
      </div>
    ),
  },
);

const ProdutoFormAny = ProdutoForm as unknown as (props: any) => JSX.Element;

export default function ProdutosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [produtoEditado, setProdutoEditado] = useState<Product | null>(null);
  // A3 — filtro "apenas estoque baixo" controlado por ?lowStock=1 na URL
  const lowStockOnly = searchParams.get("lowStock") === "1";
  // A3 — threshold global pra passar pros cards (badge "Estoque baixo")
  const [defaultThreshold, setDefaultThreshold] = useState<number>(5);
  const formRef = useRef<HTMLDivElement>(null);

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    setErro(null);

    try {
      let parsed: Product[] = [];
      if (lowStockOnly) {
        // A3 — usa endpoint específico que já filtra e ordena por urgência
        const resp = await apiClient.get<LowStockResp>(
          "/api/admin/produtos/estoque-baixo?limit=200",
        );
        if (resp?.default_threshold) setDefaultThreshold(resp.default_threshold);
        parsed = (resp?.items || []).map((p: any) => ({
          ...p,
          price: Number(p.price),
          quantity: Number(p.quantity),
        }));
      } else {
        const data = await apiClient.get<Product[]>("/api/admin/produtos");
        const arr = Array.isArray(data) ? data : [];
        parsed = arr.map((p: any) => ({
          ...p,
          price: Number(p.price),
          quantity: Number(p.quantity),
        }));
      }

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
  }, [lowStockOnly]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  function toggleLowStockFilter() {
    const params = new URLSearchParams(searchParams.toString());
    if (lowStockOnly) {
      params.delete("lowStock");
    } else {
      params.set("lowStock", "1");
    }
    const qs = params.toString();
    router.replace(qs ? `/admin/produtos?${qs}` : "/admin/produtos");
  }

  function handleEditarProduto(produto: Product) {
    setProdutoEditado(produto);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function toggleStatus(id: number, isActive: boolean) {
    try {
      await apiClient.patch(`/api/admin/produtos/${id}/status`, { is_active: isActive });
      await carregarProdutos();
    } catch (e: any) {
      console.error("toggleStatus:", e);
      if (e?.status === 401 || e?.status === 403) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }
      alert(e?.message || "Erro ao alterar status do produto.");
    }
  }

  async function removerProduto(id: number) {
    if (!confirm("Tem certeza que deseja remover este produto permanentemente?")) return;

    try {
      await apiClient.del(`/api/admin/produtos/${id}`);
      await carregarProdutos();
    } catch (e: any) {
      console.error("removerProduto:", e);
      if (e?.status === 401 || e?.status === 403) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }
      if (e?.status === 409) {
        const desativar = confirm(
          "Este produto não pode ser excluído porque está em carrinhos ativos.\n\nDeseja desativá-lo em vez de excluir?"
        );
        if (desativar) {
          await toggleStatus(id, false);
        }
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
            <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
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

        {!loading && !erro && (
          <section className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-50">
                {lowStockOnly ? "Produtos com estoque baixo" : "Lista de produtos"}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleLowStockFilter}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    lowStockOnly
                      ? "border-amber-400/60 bg-amber-500/15 text-amber-200 hover:bg-amber-500/20"
                      : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-amber-500/40 hover:text-amber-200"
                  }`}
                  title={
                    lowStockOnly
                      ? "Mostrar todos os produtos"
                      : `Filtrar produtos com estoque <= ${defaultThreshold} (ou ponto de reposição configurado)`
                  }
                >
                  {lowStockOnly ? "✓ Estoque baixo" : "Apenas estoque baixo"}
                </button>
                <span className="text-sm text-gray-300">
                  {produtos.length} {produtos.length === 1 ? "item" : "itens"}
                </span>
              </div>
            </div>

            {produtos.length === 0 ? (
              <EmptyState
                message={
                  lowStockOnly
                    ? "Nenhum produto com estoque baixo agora."
                    : "Nenhum produto cadastrado."
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {produtos.map((p) => (
                  <ProdutoCard
                    key={p.id}
                    produto={p}
                    className="mt-0"
                    onEditar={handleEditarProduto}
                    onRemover={removerProduto}
                    onToggleStatus={toggleStatus}
                    defaultReorderPoint={defaultThreshold}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
