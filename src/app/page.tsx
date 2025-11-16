// src/app/page.tsx
"use client";

import HeroSection from "@/components/layout/HeroSection";
import DestaquesSection from "@/components/products/DestaquesSection";
import ServicosSection from "@/components/layout/ServicosSection";
import ProdutosPorCategoria from "@/components/products/ProdutosPorCategoria";
import Footer from "@/components/layout/Footer";
import TrustBar from "@/components/layout/TrustBar";

const CATEGORIAS = [
  { title: "Medicamentos",     slug: "medicamentos" },
  { title: "Pets",             slug: "pets" },
  { title: "Fazenda",          slug: "fazenda" },
  { title: "Pragas e insetos", slug: "pragas-e-insetos" },
  { title: "Outros",           slug: "outros" },
];

export default function HomePage() {
  return (
    // layout em coluna p/ o footer grudar no fim
    <div className="flex min-h-screen flex-col">
      {/* topo */}
      <HeroSection />

      {/* faixa de destaques */}
      <section className="mx-auto w-full max-w-7xl px-4 py-6">
        <DestaquesSection />
      </section>

      {/* categorias */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-4">
        {CATEGORIAS.map(({ title, slug }) => (
          <div key={slug} className="py-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {/* opcional: link ver tudo quando você tiver a rota da categoria */}
              {/* <Link href={`/categoria/${slug}`} className="text-sm text-emerald-700 hover:underline">Ver tudo</Link> */}
            </div>

            <div className="rounded-2xl border bg-white/60 p-3">
              {/* carrossel/cards */}
              <ProdutosPorCategoria categoria={slug} limit={12} />
            </div>
          </div>
        ))}
      </section>

      {/* serviços */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Serviços</h2>
        <div className="rounded-2xl border bg-white/60 p-3">
          <ServicosSection />
        </div>
      </section>

      {/* rodapé */}
      <TrustBar />
      <Footer />
    </div>
  );
}
