// src/app/mercado-do-cafe/cidade/[slug]/page.tsx
//
// Página regional por cidade — SEO + identificação local. Mesma DNA
// visual do hub e da listagem (dark committed, atmospheric glows, glass).
//
// Objetivos:
//   - capturar busca orgânica ("corretoras de café em Manhuaçu")
//   - dar ao produtor página dedicada da sua cidade
//   - reforçar posicionamento regional (Matas de Minas)
//
// Gera rotas estáticas para as cidades do catálogo (generateStaticParams).
// Se visitante chega em slug fora do catálogo, retorna 404 via notFound().

import Link from "next/link";
import { notFound } from "next/navigation";
import { CIDADES_ZONA_DA_MATA, getCidadeBySlug } from "@/lib/regioes";
import { fetchPublicCorretoras } from "@/server/data/corretoras";
import { fetchPublicCotacoes } from "@/server/data/cotacoes";
import { CorretoraCard } from "@/components/mercado-do-cafe/CorretoraCard";
import { CityChips } from "@/components/mercado-do-cafe/CityChips";
import { MarketCotacaoPill } from "@/components/mercado-do-cafe/MarketCotacaoPill";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import type { PublicCotacao } from "@/lib/newsPublicApi";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return CIDADES_ZONA_DA_MATA.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const cidade = getCidadeBySlug(slug);
  if (!cidade) {
    return { title: "Cidade não encontrada | Kavita" };
  }
  return {
    title: `Corretoras de café em ${cidade.nome} — ${cidade.estado} | Kavita`,
    description: `Encontre corretoras de café em ${cidade.nome} (${cidade.regiao}). Cotações, canais diretos de contato e rede curada pela Kavita para produtores de café do Brasil.`,
  };
}

function pickCafe(list: PublicCotacao[]): PublicCotacao | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  return (
    list.find((c) => c.slug === "cafe-arabica") ??
    list.find((c) => c.slug === "cafe-robusta") ??
    list.find((c) => (c.name ?? c.title ?? "").toLowerCase().includes("café")) ??
    null
  );
}

export default async function CidadePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const cidade = getCidadeBySlug(slug);
  if (!cidade) notFound();

  // Busca corretoras da cidade + cotacao do cafe. `city` no filtro
  // compara por nome (backend faz match case-insensitive).
  //
  // Tolerancia a backend offline: o page e SSG via generateStaticParams,
  // entao roda no build CI. Se o backend nao estiver disponivel naquele
  // momento (ECONNREFUSED, timeout, 5xx), caimos no shape vazio padrao
  // — a UI ja tem estado amigavel "Ainda sem corretoras ativas em X"
  // logo abaixo. ISR (revalidate=120s definido em src/server/data/*)
  // atualiza automaticamente quando o backend voltar.
  const EMPTY_CORRETORAS = {
    items: [],
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  };
  const [corretorasResult, cotacoes] = await Promise.all([
    fetchPublicCorretoras({ city: cidade.nome, limit: 50 }).catch(
      () => EMPTY_CORRETORAS,
    ),
    fetchPublicCotacoes().catch(() => [] as PublicCotacao[]),
  ]);

  const corretoras = corretorasResult.items ?? [];
  const coffeeCotacao = pickCafe(cotacoes);
  const totalCorretoras = corretorasResult.total ?? corretoras.length;

  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      {/* Atmospheric glows — mesma DNA do módulo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[700px] h-[600px] w-[700px] rounded-full bg-amber-700/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[1300px] h-[700px] w-[800px] rounded-full bg-orange-700/[0.07] blur-3xl"
      />

      {/* Market strip regionalizado */}
      <div className="relative border-b border-white/[0.08] bg-stone-950/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 md:px-6">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </span>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-300">
            <Link
              href="/mercado-do-cafe"
              className="transition-colors hover:text-amber-200"
            >
              Mercado do Café
            </Link>
            <span className="mx-2 text-stone-600">·</span>
            <span className="text-stone-400">{cidade.regiao}</span>
            <span className="mx-2 text-stone-600">·</span>
            <span className="text-amber-200">{cidade.nome}</span>
          </p>
          <span
            aria-hidden
            className="ml-auto hidden h-3 w-px bg-white/20 md:inline-block"
          />
          <MarketCotacaoPill cotacao={coffeeCotacao} variant="strip" />
        </div>
      </div>

      {/* Hero regional */}
      <section className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 md:px-6 md:pb-14 md:pt-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="min-w-0 flex-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center text-amber-200">
                  <PanelBrandMark className="h-full w-full" />
                </div>
                <div className="h-6 w-px bg-white/15" aria-hidden />
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                  {cidade.regiao} · {cidade.estado}
                </p>
              </div>

              <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-4xl lg:text-5xl">
                Corretoras de café em{" "}
                <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                  {cidade.nome}
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base">
                {cidade.descricao ??
                  `Corretoras verificadas que atuam em ${cidade.nome} e região. Encontre quem compra ou vende café na sua cidade e negocie com clareza.`}
              </p>

              {/* Breadcrumb mini */}
              <nav
                aria-label="Breadcrumb"
                className="mt-6 flex items-center gap-2 text-[11px] text-stone-500"
              >
                <Link
                  href="/mercado-do-cafe"
                  className="transition-colors hover:text-amber-200"
                >
                  Mercado do Café
                </Link>
                <span aria-hidden>/</span>
                <span className="text-stone-400">{cidade.regiao}</span>
                <span aria-hidden>/</span>
                <span className="text-amber-200">{cidade.nome}</span>
              </nav>
            </div>

            {/* Stats da cidade */}
            <aside className="relative shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:min-w-[360px]">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
              />
              <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                <div className="p-4 md:p-5">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                    Corretoras
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-stone-50 md:text-3xl">
                    {totalCorretoras}
                  </p>
                  <p className="mt-0.5 text-[10px] text-stone-500">
                    atuando em {cidade.nome}
                  </p>
                </div>
                <MarketCotacaoPill cotacao={coffeeCotacao} variant="stat" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Lista de corretoras da cidade */}
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
        <div className="mb-6">
          <CityChips active={cidade.slug} tone="dark" />
        </div>

        {corretoras.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {corretoras.map((c) => (
              <CorretoraCard key={c.id} corretora={c} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-10 text-center ring-1 ring-white/[0.08] backdrop-blur-sm">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
            />
            <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-amber-200/60 ring-1 ring-white/10">
              <PanelBrandMark className="h-7 w-7" />
            </div>
            <p className="relative text-sm font-semibold text-stone-100">
              Ainda sem corretoras ativas em {cidade.nome}
            </p>
            <p className="relative mx-auto mt-1 max-w-md text-xs leading-relaxed text-stone-400">
              Estamos construindo a rede Kavita em regiões produtoras. Veja corretoras próximas que também atendem a região.
            </p>
            <Link
              href="/mercado-do-cafe/corretoras"
              className="relative mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:ring-amber-400/30"
            >
              Ver todas as corretoras →
            </Link>
          </div>
        )}

        {/* Contexto regional */}
        <section className="mt-16 grid gap-6 md:grid-cols-2 md:mt-20">
          <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] backdrop-blur-sm md:p-7">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
              Sobre a região
            </p>
            <h2 className="mt-2 text-lg font-semibold text-stone-50 md:text-xl">
              {cidade.nome} no café {cidade.regiao ? `da ${cidade.regiao}` : "do Brasil"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">
              {cidade.descricao ??
                `${cidade.nome}${cidade.regiao ? ` integra a região ${cidade.regiao}` : " é um município produtor de café"}, uma das praças cafeeiras importantes na produção do Brasil. Corretoras locais fazem a ponte entre produtores e compradores nacionais e internacionais.`}
            </p>
            {cidade.regiao === "Zona da Mata" && (
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                A Denominação de Origem{" "}
                <span className="font-semibold text-amber-200">Matas de Minas</span>{" "}
                reconhece a qualidade única dos cafés produzidos nesta região,
                com características sensoriais específicas e tradição cafeeira
                centenária.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] backdrop-blur-sm md:p-7">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
              Como funciona
            </p>
            <h2 className="mt-2 text-lg font-semibold text-stone-50 md:text-xl">
              Encontre uma corretora na sua cidade
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-stone-300">
              <li className="flex gap-3">
                <span className="font-mono text-[10px] font-bold text-amber-300">
                  01
                </span>
                <span>
                  Escolha uma corretora verificada que atua em {cidade.nome}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[10px] font-bold text-amber-300">
                  02
                </span>
                <span>
                  Fale direto no WhatsApp ou envie uma solicitação com detalhes
                  do seu café
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[10px] font-bold text-amber-300">
                  03
                </span>
                <span>
                  Receba resposta da corretora e negocie com transparência
                </span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
