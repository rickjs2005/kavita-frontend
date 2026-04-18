// src/components/mercado-do-cafe/CorretoraCard.tsx
//
// Card premium da listagem pública de corretoras. Transmite a
// sensação de "corretora verificada na mesa do mercado":
//
//   - superfície com hairline ring quente e top-highlight (mesmo
//     padrão do PanelCard do painel privado — coerência de marca)
//   - logo grande em moldura cremosa com fallback de grão de café
//   - badge "VERIFICADA" monocromática em destaque quando is_featured
//   - region chip destacada (reforça contexto geográfico de mercado)
//   - canais de contato como pill buttons com ícones SVG coerentes
//     (nada de emoji — emoji quebra a percepção premium)
//   - contador "N canais disponíveis" como micro-stat de dados
//   - título + "Ver detalhes" como Links reais (HTML válido, sem
//     <a> aninhado dentro de <a>, bug corrigido no redesign anterior)
//   - hover: lift sutil + shadow aumentada + seta do CTA desliza

import Link from "next/link";
import Image from "next/image";
import type { PublicCorretora } from "@/types/corretora";
import { absUrl } from "@/utils/absUrl";
import { getCidadeBySlug, TIPOS_CAFE } from "@/lib/regioes";

// Lookup label por value. Usado pra mostrar chips de especialidade
// sem acoplar o card ao catálogo via includes/find em cada render.
const TIPO_CAFE_LABEL: Record<string, string> = Object.fromEntries(
  TIPOS_CAFE.filter((t) => t.value !== "ainda_nao_sei").map((t) => [
    t.value,
    t.label,
  ]),
);

type Props = {
  corretora: PublicCorretora;
};

// Resolve até N nomes de cidades atendidas a partir dos slugs.
// Retorna string "Manhuaçu · Reduto · Simonésia +2" quando há excesso.
// Slug desconhecido é ignorado silenciosamente (defensivo: admin
// pode ter slug fora do catálogo canônico).
function formatCidadesAtendidas(
  slugs: string[] | null | undefined,
  max = 3,
): { preview: string; total: number } | null {
  if (!slugs || slugs.length === 0) return null;
  const nomes = slugs
    .map((s) => getCidadeBySlug(s)?.nome ?? null)
    .filter((v): v is string => Boolean(v));
  if (nomes.length === 0) return null;
  const shown = nomes.slice(0, max);
  const rest = nomes.length - shown.length;
  const preview = rest > 0 ? `${shown.join(" · ")} +${rest}` : shown.join(" · ");
  return { preview, total: nomes.length };
}

// ─── Ícones SVG inline (estilo Lucide, 14x14, stroke 1.8) ──────────────
// Emoji seria mais fácil mas destrói a percepção premium do card.
// Esses ícones são os mesmos usados no CorretoraContactChannels do
// painel, recolocados aqui de forma compacta para evitar dependência
// circular e manter o componente autocontido.

const iconProps = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons = {
  whatsapp: (
    <svg {...iconProps}>
      <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 001 0V9a.5.5 0 00-1 0v1a5 5 0 005 5h1a.5.5 0 000-1h-1a.5.5 0 000 1" />
    </svg>
  ),
  phone: (
    <svg {...iconProps}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  email: (
    <svg {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  website: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  ),
  instagram: (
    <svg {...iconProps}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  facebook: (
    <svg {...iconProps}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
};

type ChannelKey = keyof typeof icons;

function buildChannels(c: PublicCorretora): { key: ChannelKey; label: string; href: string }[] {
  const list: { key: ChannelKey; label: string; href: string }[] = [];

  if (c.whatsapp) {
    const num = c.whatsapp.replace(/\D/g, "");
    list.push({ key: "whatsapp", label: "WhatsApp", href: `https://wa.me/55${num}` });
  }
  if (c.phone) {
    const num = c.phone.replace(/\D/g, "");
    list.push({ key: "phone", label: "Telefone", href: `tel:+55${num}` });
  }
  if (c.email) {
    list.push({ key: "email", label: "E-mail", href: `mailto:${c.email}` });
  }
  if (c.website) {
    const url = c.website.startsWith("http") ? c.website : `https://${c.website}`;
    list.push({ key: "website", label: "Site", href: url });
  }
  if (c.instagram) {
    const user = c.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
    const href = c.instagram.startsWith("http")
      ? c.instagram
      : `https://instagram.com/${user}`;
    list.push({ key: "instagram", label: "Instagram", href });
  }
  if (c.facebook) {
    const href = c.facebook.startsWith("http") ? c.facebook : `https://facebook.com/${c.facebook}`;
    list.push({ key: "facebook", label: "Facebook", href });
  }

  return list;
}

export function CorretoraCard({ corretora }: Props) {
  const isFeatured =
    corretora.is_featured === true || corretora.is_featured === 1;

  const detailHref = `/mercado-do-cafe/corretoras/${corretora.slug}`;
  const channels = buildChannels(corretora);

  // Signals de confiança (Sprint 1 — vitrine rica). Calculados antes
  // do render para decidir se a faixa "stats" vale a pena. Se todos
  // forem null, não renderizamos a faixa — evita espaço visual vazio
  // para registros antigos sem esses campos preenchidos.
  const reviewsCount = Number(corretora.reviews_count ?? 0);
  const reviewsAvg =
    corretora.reviews_avg != null ? Number(corretora.reviews_avg) : null;
  const hasReviews = reviewsCount > 0 && reviewsAvg != null;
  const anosAtuacao =
    typeof corretora.anos_atuacao === "number" && corretora.anos_atuacao > 0
      ? corretora.anos_atuacao
      : null;
  const horario = corretora.horario_atendimento?.trim() || null;
  const cidadesAtendidas = formatCidadesAtendidas(
    corretora.cidades_atendidas,
    3,
  );
  const hasStats = hasReviews || anosAtuacao != null || horario != null;

  // Fase 5 — chips de especialidade. Máximo 3; surplus resumido como "+N".
  const tiposCafeChips =
    corretora.tipos_cafe?.filter((t) => TIPO_CAFE_LABEL[t]) ?? [];
  const tiposShown = tiposCafeChips.slice(0, 3);
  const tiposRest = tiposCafeChips.length - tiposShown.length;
  // Perfil comercial: mostramos o chip apenas se a corretora declarou
  // (registros antigos ficam sem).
  const perfilCompraLabel =
    corretora.perfil_compra === "compra"
      ? "Compra café"
      : corretora.perfil_compra === "venda"
        ? "Vende café"
        : corretora.perfil_compra === "ambos"
          ? "Compra e vende"
          : null;

  return (
    <article
      className="
        group relative overflow-hidden rounded-2xl bg-white/[0.04]
        ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm
        transition-all duration-300
        hover:-translate-y-0.5 hover:bg-white/[0.06] hover:ring-amber-400/30
        focus-within:ring-2 focus-within:ring-amber-400/40
      "
      aria-labelledby={`corretora-${corretora.id}-name`}
    >
      {/* Top highlight — amber catching-light effect */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
      />

      {/* Warm accent strip on featured — amber left border glow */}
      {isFeatured && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
        />
      )}

      <div className="relative p-5 md:p-6">
        {/* ── HEADER: Logo + name + badges ──────────────────────────── */}
        <div className="flex items-start gap-4">
          {/* Logo frame em dark glass */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 ring-1 ring-white/10">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
            />
            {corretora.logo_path ? (
              <Image
                src={absUrl(corretora.logo_path)}
                alt={`Logo ${corretora.name}`}
                width={64}
                height={64}
                className="relative h-full w-full object-cover"
              />
            ) : (
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="relative h-8 w-8 text-amber-200/60"
                aria-hidden
              >
                <g transform="rotate(-18 16 16)">
                  <ellipse cx="16" cy="16" rx="8" ry="11" fill="currentColor" />
                  <path
                    d="M 11 7 Q 16 16 21 25"
                    stroke="white"
                    strokeOpacity={0.4}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            )}
          </div>

          {/* Name + badges + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3
                id={`corretora-${corretora.id}-name`}
                className="truncate text-base font-semibold text-stone-50 md:text-lg"
              >
                <Link
                  href={detailHref}
                  className="outline-none transition-colors hover:text-amber-300 focus-visible:text-amber-300 focus-visible:underline"
                >
                  {corretora.name}
                </Link>
              </h3>
              {/* Fase 5 — Verificada por Kavita é status intrínseco de toda
                  corretora aprovada. Aparece em TODAS as cards públicas. */}
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300 ring-1 ring-emerald-400/30"
                title="Cadastro e identidade validados pela curadoria Kavita"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
                </svg>
                Verificada por Kavita
              </span>
              {/* Destaque regional é separado — reservado para planos Pro/Max */}
              {isFeatured && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-200 ring-1 ring-amber-400/30">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M12 2l2.39 7.36H22l-6.2 4.5 2.38 7.36L12 16.72l-6.18 4.5 2.38-7.36L2 9.36h7.61L12 2z" />
                  </svg>
                  Destaque regional
                </span>
              )}
            </div>

            {/* Meta: cidade + região */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-300">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-300/70"
                  aria-hidden
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {corretora.city}, {corretora.state}
              </span>
              {corretora.region && (
                <>
                  <span aria-hidden className="text-stone-600">·</span>
                  <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-300 ring-1 ring-white/10">
                    {corretora.region}
                  </span>
                </>
              )}
            </div>

            {/* Contact person subtle */}
            <p className="mt-1 text-[11px] text-stone-500">
              Responsável:{" "}
              <span className="text-stone-300">{corretora.contact_name}</span>
            </p>
          </div>
        </div>

        {/* ── DESCRIPTION ───────────────────────────────────────────── */}
        {corretora.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-stone-300">
            {corretora.description}
          </p>
        )}

        {/* ── STATS DE CONFIANÇA ──────────────────────────────────────
            Faixa editorial com sinais que o produtor usa pra decidir
            antes de abrir o detalhe: rating, tempo de atuação, horário.
            Renderizada apenas quando algum dos sinais existe. */}
        {hasStats && (
          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            {hasReviews && (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Avaliação</dt>
                <dd className="inline-flex items-center gap-1">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 text-amber-400"
                    aria-hidden
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                  <span className="font-semibold tabular-nums text-amber-200">
                    {reviewsAvg!.toFixed(1)}
                  </span>
                  <span className="text-stone-400">
                    ({reviewsCount}{" "}
                    {reviewsCount === 1 ? "avaliação" : "avaliações"})
                  </span>
                </dd>
              </div>
            )}

            {anosAtuacao != null && (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Anos de atuação</dt>
                <dd className="inline-flex items-center gap-1 text-stone-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 text-amber-300/80"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <span className="font-semibold text-stone-200 tabular-nums">
                    {anosAtuacao}
                  </span>
                  <span className="text-stone-400">
                    {anosAtuacao === 1 ? "ano no mercado" : "anos no mercado"}
                  </span>
                </dd>
              </div>
            )}

            {horario && (
              <div className="inline-flex min-w-0 items-center gap-1.5">
                <dt className="sr-only">Horário de atendimento</dt>
                <dd className="inline-flex min-w-0 items-center gap-1 text-stone-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 shrink-0 text-amber-300/80"
                    aria-hidden
                  >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 11h18" />
                  </svg>
                  <span className="truncate text-stone-200">{horario}</span>
                </dd>
              </div>
            )}
          </dl>
        )}

        {/* ── CIDADES ATENDIDAS ───────────────────────────────────────
            Diferencial regional: em marketplace B2B de café da Zona da
            Mata, saber de onde a corretora compra é sinal concreto de
            alcance. Renderiza só se há slugs válidos no catálogo. */}
        {cidadesAtendidas && (
          <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed">
            <span
              aria-hidden
              className="mt-0.5 text-amber-300/70"
              title="Cidades atendidas"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18M4 21V7l8-4v18M20 21V11l-8-4" />
                <path d="M9 9h0M9 13h0M9 17h0M15 13h0M15 17h0" />
              </svg>
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300/70">
                Atende{" "}
                {cidadesAtendidas.total === 1
                  ? "1 cidade"
                  : `${cidadesAtendidas.total} cidades`}
              </span>
              <p className="truncate text-stone-300">
                {cidadesAtendidas.preview}
              </p>
            </div>
          </div>
        )}

        {/* ── ESPECIALIDADES (Fase 5) ─────────────────────────────────
            Chips de tipos de café que a corretora trabalha + perfil
            comercial (compra / vende / ambos). Sinaliza ao produtor
            se faz match antes dele abrir a ficha. */}
        {(tiposShown.length > 0 || perfilCompraLabel) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {perfilCompraLabel && (
              <span className="inline-flex items-center rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-200 ring-1 ring-white/10">
                {perfilCompraLabel}
              </span>
            )}
            {tiposShown.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-amber-400/[0.08] px-2 py-0.5 text-[10px] font-semibold text-amber-100 ring-1 ring-amber-400/20"
              >
                {TIPO_CAFE_LABEL[t]}
              </span>
            ))}
            {tiposRest > 0 && (
              <span className="inline-flex items-center rounded-full bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-stone-400 ring-1 ring-white/[0.08]">
                +{tiposRest}
              </span>
            )}
          </div>
        )}

        {/* ── CHANNELS ROW ──────────────────────────────────────────── */}
        {channels.length > 0 && (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                Canais disponíveis
              </p>
              <span className="text-[10px] font-semibold text-stone-500 tabular-nums">
                {channels.length} {channels.length === 1 ? "canal" : "canais"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {channels.map((ch) => (
                <a
                  key={ch.key}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={ch.label}
                  aria-label={`${ch.label} de ${corretora.name}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-stone-300 ring-1 ring-white/10 transition-all hover:bg-amber-400 hover:text-stone-950 hover:ring-amber-300/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950"
                >
                  {icons[ch.key]}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER: CTA (Fase 5 — mais direto/acionável) ──────────────
            Botão primário "Vender meu café" com visual de destaque —
            é a ação que o produtor quer tomar. Link secundário "Ver
            ficha" fica discreto ao lado. */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <Link
            href={detailHref}
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 transition-colors hover:text-amber-200"
          >
            Ver ficha
          </Link>
          <Link
            href={`${detailHref}#fale-corretora`}
            aria-label={`Enviar lote para ${corretora.name}`}
            className="
              group/cta inline-flex items-center gap-1.5 rounded-lg
              bg-gradient-to-br from-amber-300 to-amber-500 px-3.5 py-2
              text-[11px] font-bold uppercase tracking-[0.12em] text-stone-950
              shadow-lg shadow-amber-500/20 transition-all
              hover:from-amber-200 hover:to-amber-400
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950
            "
          >
            Vender meu café
            <span
              className="transition-transform duration-300 group-hover/cta:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
