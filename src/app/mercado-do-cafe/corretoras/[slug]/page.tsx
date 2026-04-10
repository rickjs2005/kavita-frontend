// src/app/mercado-do-cafe/corretoras/[slug]/page.tsx
// Página individual da corretora — RSC
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchPublicCorretoraBySlug } from "@/server/data/corretoras";
import { absUrl } from "@/utils/absUrl";
import { CorretoraContactChannels } from "@/components/mercado-do-cafe/CorretoraContactChannels";
import { MercadoCafeCTA } from "@/components/mercado-do-cafe/MercadoCafeCTA";
import { LeadContactForm } from "@/components/mercado-do-cafe/LeadContactForm";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const corretora = await fetchPublicCorretoraBySlug(slug);
  if (!corretora) return { title: "Corretora não encontrada | Kavita" };
  return {
    title: `${corretora.name} — Corretora de Café | Kavita`,
    description: corretora.description || `${corretora.name} — corretora de café em ${corretora.city}, ${corretora.state}.`,
  };
}

export default async function CorretoraDetailPage({ params }: Props) {
  const { slug } = await params;
  const corretora = await fetchPublicCorretoraBySlug(slug);

  if (!corretora) notFound();

  const isFeatured = corretora.is_featured === true || corretora.is_featured === 1;

  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-8 md:py-10 space-y-8">
        {/* Back link */}
        <Link
          href="/mercado-do-cafe/corretoras"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          <span aria-hidden>←</span> Voltar para corretoras
        </Link>

        {/* Header */}
        <header className="flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 overflow-hidden">
            {corretora.logo_path ? (
              <Image
                src={absUrl(corretora.logo_path)}
                alt={`Logo ${corretora.name}`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-4xl" aria-hidden>☕</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
                {corretora.name}
              </h1>
              {isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  ⭐ Destaque
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              📍 {corretora.city}, {corretora.state}
              {corretora.region ? ` — ${corretora.region}` : ""}
            </p>

            <p className="mt-0.5 text-xs text-zinc-400">
              Responsável: {corretora.contact_name}
            </p>
          </div>
        </header>

        {/* Description */}
        {corretora.description && (
          <section aria-label="Sobre a corretora">
            <h2 className="text-base font-semibold text-zinc-900 mb-2">Sobre</h2>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {corretora.description}
              </p>
            </div>
          </section>
        )}

        {/* Contact channels + Lead form (duas colunas no desktop) */}
        <section
          aria-label="Fale com a corretora"
          className="grid gap-6 md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">
              Canais diretos
            </h2>
            <CorretoraContactChannels corretora={corretora} variant="full" />
          </div>
          <div className="md:col-span-3">
            <LeadContactForm
              corretoraSlug={corretora.slug}
              corretoraName={corretora.name}
            />
          </div>
        </section>

        {/* CTA Cotações */}
        <MercadoCafeCTA
          title="Acompanhe os preços antes de negociar"
          description="Veja as cotações do café atualizadas e negocie com mais informação."
          href="/news/cotacoes"
          buttonLabel="Ver Cotações"
        />
      </div>
    </main>
  );
}
