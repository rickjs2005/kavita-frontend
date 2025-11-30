// src/app/servicos/[id]/page.tsx

import { notFound } from "next/navigation";
import type { Service } from "@/types/service";
import ServicoContent from "./ServicoContent";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PageProps = {
  params: { id: string };
};

// 🔍 Busca um serviço público pelo ID
async function fetchService(id: string): Promise<Service | null> {
  if (!id) return null;

  try {
    const res = await fetch(`${API_BASE}/api/public/servicos/${id}`, {
      // sempre dado fresquinho
      cache: "no-store",
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.error("Erro ao buscar serviço:", await res.text());
      return null;
    }

    const data = await res.json();

    // garante que images seja sempre array
    const normalizado: Service = {
      ...data,
      images: Array.isArray(data.images)
        ? data.images
        : typeof data.images === "string" && data.images
        ? [data.images]
        : [],
    };

    return normalizado;
  } catch (err) {
    console.error("Erro inesperado ao buscar serviço:", err);
    return null;
  }
}

export default async function ServicoPage({ params }: PageProps) {
  const id = params.id;
  const servico = await fetchService(id);

  if (!servico) {
    // 404 padrão do Next
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#041a24] via-[#053a3f] to-[#021117] text-white">
      <section className="container mx-auto px-4 pt-6 pb-10 lg:pt-8 lg:pb-16">
        {/* link de voltar */}
        <div className="mb-4 lg:mb-6">
          <a
            href="/servicos"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-200 hover:text-emerald-100"
          >
            <span aria-hidden>←</span>
            <span>Voltar para lista de serviços</span>
          </a>
        </div>

        <ServicoContent servico={servico} />
      </section>
    </main>
  );
}
