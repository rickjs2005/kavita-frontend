// src/components/home/HomeClient.tsx
"use client";

import { useEffect, useState } from "react";
import type { PublicCategory } from "@/server/data/categories";

import HeroSection from "@/components/layout/HeroSection";
import DestaquesSection from "@/components/products/DestaquesSection";
import ServicosSection from "@/components/layout/ServicosSection";
import ProdutosPorCategoria from "@/components/products/ProdutosPorCategoria";
import TrustBar from "@/components/layout/TrustBar";
import Footer from "@/components/layout/Footer";
import type { PublicShopSettings } from "@/server/data/shopSettings";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function defaultShop(): PublicShopSettings {
  return {
    store_name: "Kavita",
    logo_url: "/logo.png",
    footer_tagline: "Conectando você ao melhor da agropecuária com qualidade e tradição.",
    contact_whatsapp: "(31) 99999-9999",
    contact_email: "contato@kavita.com.br",
    social_instagram_url: "https://instagram.com/kavita",
    social_whatsapp_url: "https://wa.me/5531999999999",
    footer_partner_cta_enabled: true,
    footer_partner_cta_title: "É profissional do campo?",
    footer_partner_cta_text:
      "Veterinário, agrônomo, mecânico de máquinas, consultor ou prestador de serviços rurais. Trabalhe conosco e entre para a rede de parceiros Kavita.",
    footer_partner_cta_href: "/trabalhe-conosco",
    footer_links: [
      { label: "Home", href: "/" },
      { label: "Serviços", href: "/servicos" },
      { label: "Contato", href: "/contato" },
    ],
    // compat legado (o Footer.tsx também aceita)
    footer: {
      tagline: "Conectando você ao melhor da agropecuária com qualidade e tradição.",
      contact_whatsapp: "(31) 99999-9999",
      contact_email: "contato@kavita.com.br",
      social_instagram_url: "https://instagram.com/kavita",
      social_whatsapp_url: "https://wa.me/5531999999999",
      partner_cta: {
        enabled: true,
        title: "É profissional do campo?",
        text:
          "Veterinário, agrônomo, mecânico de máquinas, consultor ou prestador de serviços rurais. Trabalhe conosco e entre para a rede de parceiros Kavita.",
        href: "/trabalhe-conosco",
      },
      links: [
        { label: "Home", href: "/" },
        { label: "Serviços", href: "/servicos" },
        { label: "Contato", href: "/contato" },
      ],
    },
  };
}

type Props = {
  categories: PublicCategory[];
};

export default function HomeClient({ categories }: Props) {
  const [shop, setShop] = useState<PublicShopSettings>(() => defaultShop());

  // Carrega config pública real do backend
  useEffect(() => {
    let alive = true;

    async function loadPublicConfig() {
      try {
        const res = await fetch(`${API_BASE}/api/config`, {
          method: "GET",
          // evita cache “grudado” em alguns proxies
          headers: { "Cache-Control": "no-store" },
        });

        if (!res.ok) return;

        const data = (await res.json()) as Partial<PublicShopSettings>;

        if (!alive) return;

        // mescla: backend ganha, mas mantém fallback se vier vazio
        setShop((prev) => ({
          ...prev,
          ...data,
          footer: (data as any)?.footer ?? (prev as any)?.footer,
        }));
      } catch {
        // silêncio: mantém defaults
      }
    }

    loadPublicConfig();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* HERO */}
      <HeroSection />

      {/* ⛔ NÃO usar <main> aqui */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-6 sm:pt-8">
        {/* DESTAQUES */}
        <section className="mb-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <DestaquesSection />
          </div>
        </section>

        {/* CATÁLOGO */}
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

          {categories.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-700">
              Nenhuma categoria ativa encontrada.
            </div>
          )}

          {categories.length > 0 && (
            <div className="space-y-6">
              {categories.map(({ id, name, slug }) => (
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

        {/* SERVIÇOS */}
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
                Veterinários, agrônomos, mecânicos e outros prestadores.
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
      </section>

      <TrustBar />
      <Footer shop={shop} />
    </div>
  );
}
