"use client";

import { useEffect, useState } from "react";

import HeroSection from "@/components/layout/HeroSection";
import DestaquesSection from "@/components/products/DestaquesSection";
import ServicosSection from "@/components/layout/ServicosSection";
import ProdutosPorCategoria from "@/components/products/ProdutosPorCategoria";
import TrustBar from "@/components/layout/TrustBar";
import Footer from "@/components/layout/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  is_active?: 0 | 1 | boolean;
  sort_order?: number;
  total_products?: number;
};

export default function HomePage() {
  const [categorias, setCategorias] = useState<PublicCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [errorCats, setErrorCats] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategorias() {
      try {
        setLoadingCats(true);
        setErrorCats(null);

        const res = await fetch(`${API_BASE}/api/public/categorias`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Erro ao carregar categorias (${res.status})`);
        }

        const data = (await res.json()) as PublicCategory[];
        const arr = Array.isArray(data) ? data : [];

        const onlyActive = arr.filter(
          (c) => c.is_active === undefined || c.is_active === 1 || c.is_active === true
        );

        onlyActive.sort((a, b) => {
          const sa = a.sort_order ?? 0;
          const sb = b.sort_order ?? 0;
          if (sa !== sb) return sa - sb;
          return a.name.localeCompare(b.name);
        });

        setCategorias(onlyActive);
      } catch (err: any) {
        console.error("[Home] Erro ao carregar categorias:", err);
        setErrorCats(err?.message || "Erro ao carregar categorias.");
        setCategorias([]);
      } finally {
        setLoadingCats(false);
      }
    }

    loadCategorias();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* HERO (mantém o visual que você já tinha) */}
      <HeroSection />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-10 pt-6 sm:pt-8">
        {/* DESTAQUES EM CARD BRANCO */}
        <section className="mb-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <DestaquesSection />
          </div>
        </section>

        {/* CATÁLOGO DA LOJA – CATEGORIAS DINÂMICAS */}
        <section className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[15px] font-semibold uppercase tracking-[0.25em] text-emerald-500">
                Catálogo da loja
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                Encontre o que você precisa no agro
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Produtos organizados por categoria.
              </p>
            </div>
          </header>

          {/* ESTADOS DE CARREGAMENTO / ERRO / VAZIO */}
          {loadingCats && (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 w-48 rounded-full bg-slate-200" />
                  <div className="h-44 rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loadingCats && errorCats && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorCats}
            </div>
          )}

          {!loadingCats && !errorCats && categorias.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-700">
              Nenhuma categoria ativa encontrada. Ative ou crie categorias no
              painel de <strong>Configurações &gt; Categorias</strong>.
            </div>
          )}

          {/* CARROSÉIS POR CATEGORIA (FAZENDA, MEDICAMENTOS, MODA, etc.) */}
          {!loadingCats && !errorCats && categorias.length > 0 && (
            <div className="space-y-6">
              {categorias.map(({ id, name, slug }) => (
                <div key={id} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900 sm:text-lg capitalize">
                      {name}
                    </h3>
                    <a
                      href={`/categorias/${slug}`}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-500"
                    >
                      Ver todos
                    </a>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <ProdutosPorCategoria categoria={slug} limit={12} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SERVIÇOS – BLOCO MAIS “LIGHT” TAMBÉM */}
        <section className="mt-10 space-y-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-500">
                Rede de serviços
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                Profissionais para te ajudar no campo
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Veterinários, agrônomos, mecânicos e outros prestadores
                especializados para o dia a dia da fazenda.
              </p>
            </div>
            <a
              href="/servicos"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-400 sm:mt-0"
            >
              Ver todos os serviços
            </a>
          </header>

          <div className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
            <ServicosSection />
          </div>
        </section>
      </main>

      <TrustBar />
      <Footer />
    </div>
  );
}
