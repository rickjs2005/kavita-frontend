import { notFound } from "next/navigation";
import type { Service } from "@/types/service";
import ServicoContent from "./ServicoContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Server Component: fetch roda no Node.js, precisa de URL absoluta.
// @/utils/absUrl exporta API_BASE="" (vazio, funciona via rewrite do Next
// apenas no browser). Aqui usamos o mesmo padrão dos fetchers em
// src/server/data/*.ts — URL absoluta com fallback para dev local.
const SERVER_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:5000"
).replace(/\/$/, "");

// 🔍 Busca um serviço público pelo ID
async function fetchService(id: string): Promise<Service | null> {
  if (!id) return null;

  try {
    const res = await fetch(`${SERVER_API_BASE}/api/public/servicos/${id}`, {
      next: { revalidate: 60 },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.error("Erro ao buscar serviço:", await res.text());
      return null;
    }

    const raw = await res.json();
    // Unwrap envelope { ok: true, data: ... } from lib/response.js
    const data = raw?.ok === true && raw?.data !== undefined ? raw.data : raw;

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
  const { id } = await params;

  const servico = await fetchService(id);

  if (!servico) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-service-from via-service-via to-service-to text-white">
      <section className="container mx-auto px-4 pt-6 pb-10 lg:pt-8 lg:pb-16">
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
