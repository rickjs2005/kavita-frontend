"use client";

// Seção de representantes — exibe lojas autorizadas Kavita com busca
// por nome/cidade/UF e card premium com avatar de iniciais, pill de
// localização e CTAs (WhatsApp primário + Instagram secundário).
//
// Usada tanto na landing /drones quanto no detalhe /drones/[id].
// Aceita `accent` opcional para tingir header, avatar e bordas com
// a cor do modelo quando usada no detalhe; na landing fica em
// emerald neutro (default).

import { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Phone,
  FileText,
  Instagram,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";

import type { DronePageSettings, DroneRepresentative } from "@/types/drones";
import type { Accent } from "./detail/accent";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { sanitizeUrl } from "@/lib/sanitizeHtml";

function digitsOnly(s: string) {
  return String(s || "").replace(/\D/g, "");
}

function buildWaLink(rep: DroneRepresentative, template?: string | null) {
  const phone = digitsOnly(rep.whatsapp);
  const msg = template || "Olá! Quero conhecer melhor os drones da Kavita.";
  const text = encodeURIComponent(`${msg}\n\nLoja: ${rep.name}`);
  const full = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${text}`;
}

function initialsOf(name: string): string {
  const clean = String(name || "").trim();
  if (!clean) return "??";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatPhone(raw: string): string {
  const d = digitsOnly(raw);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return raw;
}

type PagedResp = {
  items: DroneRepresentative[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

type Props = {
  page: DronePageSettings;
  representatives: DroneRepresentative[];
  accent?: Accent;
};

export default function RepresentativesSection({
  page,
  representatives,
  accent,
}: Props) {
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [paged, setPaged] = useState<PagedResp | null>(null);
  const [curPage, setCurPage] = useState(1);

  const list = useMemo(() => {
    if (paged?.items?.length) return paged.items;
    return representatives || [];
  }, [paged, representatives]);

  // Paleta base — usa accent do modelo se foi passado; senao emerald.
  const eyebrowColor = accent?.text ?? "text-emerald-300";
  const avatarRing = accent?.badgeBorder ?? "border-emerald-400/30";
  const avatarBg = accent?.badgeBg ?? "bg-emerald-500/15";
  const avatarText = accent?.text ?? "text-emerald-200";
  const focusRing = accent ? "focus:ring-white/30" : "focus:ring-emerald-400/40";
  const primaryGradient =
    accent?.primaryGradient ?? "from-emerald-500 via-emerald-400 to-teal-400";
  const primaryShadow =
    accent?.primaryShadow ?? "shadow-[0_18px_50px_-20px_rgba(16,185,129,0.8)]";

  async function fetchPage(p: number) {
    setMsg(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "12");
      if (busca.trim()) params.set("busca", busca.trim());
      params.set("orderBy", "sort_order");
      params.set("orderDir", "asc");

      const data = await apiClient.get<PagedResp>(
        `/api/public/drones/representantes?${params.toString()}`,
      );

      setPaged(data);
      setCurPage(Number(data?.page || p));
    } catch (err: unknown) {
      const ui = formatApiError(err, "Erro de rede ao buscar representantes.");
      setMsg(ui.message);
      setPaged(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="representantes"
      className="relative mx-auto max-w-7xl px-5 py-16 sm:py-20 scroll-mt-24"
    >
      {/* Halo accent decorativo */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-64 w-[40rem] rounded-full blur-3xl opacity-30",
          accent?.halo ?? "bg-emerald-500/12",
        ].join(" ")}
      />

      {/* Header */}
      <div className="relative max-w-2xl">
        <p
          className={[
            "font-mono text-[11px] font-semibold uppercase tracking-[0.24em]",
            eyebrowColor,
          ].join(" ")}
        >
          Rede Kavita · Representantes autorizados DJI
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Fale direto com uma loja autorizada
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Lojas físicas em Manhuaçu, Espera Feliz e Cachoeira do
          Itapemirim. Atendimento presencial e contato humano por
          WhatsApp — sem intermediário.
        </p>
      </div>

      {/* Busca premium */}
      <div className="relative mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchPage(1);
            }}
            placeholder="Buscar por nome, cidade ou UF…"
            className={[
              "w-full rounded-2xl border border-white/12 bg-[rgba(8,12,22,0.6)] pl-11 pr-4 py-3.5 text-sm text-slate-100 backdrop-blur-md outline-none transition focus:border-white/25 focus:ring-2",
              focusRing,
            ].join(" ")}
          />
        </div>
        <button
          onClick={() => fetchPage(1)}
          disabled={loading}
          className={[
            "inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-white transition disabled:opacity-60",
            "bg-gradient-to-r",
            primaryGradient,
            primaryShadow,
            "hover:brightness-[1.08] active:scale-[0.99]",
          ].join(" ")}
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {msg ? (
        <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
          {msg}
        </div>
      ) : null}

      {/* Grid de cards */}
      <div className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((rep) => {
          const waLink = buildWaLink(rep, page.cta_message_template);
          const igLink = rep.instagram_url
            ? sanitizeUrl(rep.instagram_url)
            : "";
          const hasAddress =
            rep.address_street || rep.address_neighborhood || rep.address_cep;

          return (
            <article
              key={rep.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[rgba(8,12,22,0.65)] p-6 backdrop-blur-md transition hover:-translate-y-1 hover:border-white/25 hover:bg-[rgba(10,16,28,0.78)] hover:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)]"
            >
              {/* Halo accent — aparece no hover */}
              <div
                aria-hidden
                className={[
                  "pointer-events-none absolute -top-12 -right-8 h-44 w-44 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-60",
                  accent?.halo ?? "bg-emerald-500/15",
                ].join(" ")}
              />

              {/* Selo "Autorizada DJI" em destaque */}
              <span
                className={[
                  "absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur",
                  accent?.badgeBorder ?? "border-emerald-400/30",
                  accent?.badgeBg ?? "bg-emerald-500/15",
                  accent?.badgeText ?? "text-emerald-200",
                ].join(" ")}
                title="Loja autorizada DJI Agras pela Kavita"
              >
                <Store className="h-3 w-3" aria-hidden />
                Autorizada DJI
              </span>

              {/* Avatar + nome + cidade */}
              <div className="relative flex items-start gap-4 pr-24">
                <div
                  className={[
                    "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-base font-extrabold tracking-tight",
                    avatarRing,
                    avatarBg,
                    avatarText,
                  ].join(" ")}
                  aria-hidden
                >
                  {initialsOf(rep.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold leading-tight text-white line-clamp-2">
                    {rep.name}
                  </h3>
                  {(rep.address_city || rep.address_uf) && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                      <MapPin className="h-3 w-3 text-slate-400" aria-hidden />
                      {rep.address_city || "—"}
                      {rep.address_uf ? ` / ${rep.address_uf}` : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço (se tiver) */}
              {hasAddress && (
                <p className="mt-4 text-[13px] leading-relaxed text-slate-300 line-clamp-3">
                  {rep.address_street}
                  {rep.address_number ? `, ${rep.address_number}` : ""}
                  {rep.address_neighborhood
                    ? ` — ${rep.address_neighborhood}`
                    : ""}
                  {rep.address_cep ? ` · CEP ${rep.address_cep}` : ""}
                </p>
              )}

              {/* Contatos com ícones */}
              <dl className="mt-4 grid gap-2 text-[13px]">
                <div className="flex items-center gap-2 text-slate-200">
                  <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                  <dt className="sr-only">WhatsApp</dt>
                  <dd className="truncate font-semibold tabular-nums">
                    {formatPhone(rep.whatsapp)}
                  </dd>
                </div>
                {rep.cnpj ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    <dt className="sr-only">CNPJ</dt>
                    <dd className="truncate tabular-nums">{rep.cnpj}</dd>
                  </div>
                ) : null}
              </dl>

              {rep.notes ? (
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-slate-400 line-clamp-3">
                  {rep.notes}
                </p>
              ) : null}

              {/* Empurra CTAs pro rodapé — mantém altura consistente no grid */}
              <div className="mt-auto pt-5 flex gap-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className={[
                    "group/cta inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-white transition",
                    "bg-gradient-to-r",
                    primaryGradient,
                    primaryShadow,
                    "hover:brightness-[1.08] active:scale-[0.99]",
                  ].join(" ")}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp
                </a>

                {igLink ? (
                  <a
                    href={igLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Instagram de ${rep.name}`}
                    className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-slate-200 transition hover:bg-white/10 active:scale-[0.99]"
                  >
                    <Instagram className="h-4 w-4" aria-hidden />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {/* Paginação */}
      {paged?.totalPages && paged.totalPages > 1 ? (
        <div className="mt-9 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-slate-400">
            Página <span className="font-bold text-slate-200">{curPage}</span>{" "}
            de{" "}
            <span className="font-bold text-slate-200">{paged.totalPages}</span>{" "}
            · {paged.total} representantes
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={loading || curPage <= 1}
              onClick={() => fetchPage(curPage - 1)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-extrabold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Anterior
            </button>
            <button
              disabled={loading || curPage >= paged.totalPages}
              onClick={() => fetchPage(curPage + 1)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-extrabold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {/* Estado vazio */}
      {!list.length && !loading ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Search className="h-5 w-5 text-slate-400" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-extrabold text-white">
            Nenhum representante encontrado
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Tente buscar por cidade ou estado diferente — ou deixe em branco
            para ver toda a rede.
          </p>
        </div>
      ) : null}
    </section>
  );
}
