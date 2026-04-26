"use client";

import Link from "next/link";
import {
  type RotaResumo,
  calcRotaAlertas,
  buildWaMeLink,
  timeAgoShort,
} from "@/lib/rotas/types";
import { RotaStatusBadge } from "./StatusBadge";

const ALERTA_STYLES: Record<"warn" | "danger" | "info", string> = {
  warn: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-200 ring-rose-500/40",
  info: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
};

function formatTempo(min: number | null | undefined): string | null {
  if (min == null) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, "0")}min`;
}

interface Props {
  rota: RotaResumo;
}

/**
 * Card operacional de rota usado em /admin/rotas.
 *
 * O conteudo e' denso de proposito: o admin precisa ler status + motorista
 * + contadores + alertas em ~2 segundos pra priorizar acao.
 */
export default function RotaCard({ rota: r }: Props) {
  const alertas = calcRotaAlertas(r);
  const tempo = formatTempo(r.tempo_total_minutos);
  const waLink = buildWaMeLink(r.motorista_telefone);
  const dataFmt = new Date(r.data_programada + "T00:00:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "2-digit", year: "2-digit" },
  );

  // CTA secundario: enviar/ver link aparece quando faz sentido
  const showSendLinkCTA =
    r.motorista_id && (r.status === "rascunho" || r.status === "pronta");

  return (
    <div className="rounded-xl bg-dark-800 ring-1 ring-white/10 hover:ring-primary/40 p-4 transition">
      {/* Cabecalho: id, status, data, regiao */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-white font-semibold">Rota #{r.id}</span>
        <RotaStatusBadge status={r.status} />
        <span className="text-xs text-gray-400">📅 {dataFmt}</span>
        {r.regiao_label && (
          <span className="text-[11px] text-gray-300 bg-white/5 px-2 py-0.5 rounded">
            {r.regiao_label}
          </span>
        )}
      </div>

      {/* Linha do motorista */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-300">
        <span>🧑‍✈️</span>
        {r.motorista_nome ? (
          <>
            <span className="font-medium text-gray-200">{r.motorista_nome}</span>
            {r.motorista_telefone && (
              <>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400">{r.motorista_telefone}</span>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/40 hover:bg-emerald-600/60 text-emerald-100 font-semibold"
                    title="Abrir conversa no WhatsApp"
                  >
                    WhatsApp
                  </a>
                )}
              </>
            )}
          </>
        ) : (
          <span className="text-amber-300">Sem motorista atribuido</span>
        )}
        {r.veiculo && (
          <>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400">🚗 {r.veiculo}</span>
          </>
        )}
      </div>

      {/* Contadores discriminados */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-200">
          📦 {r.total_paradas} {r.total_paradas === 1 ? "parada" : "paradas"}
        </span>
        {r.paradas_entregues > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30">
            ✓ {r.paradas_entregues} entregue{r.paradas_entregues === 1 ? "" : "s"}
          </span>
        )}
        {r.paradas_pendentes > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/30">
            ⏳ {r.paradas_pendentes} pendente{r.paradas_pendentes === 1 ? "" : "s"}
          </span>
        )}
        {r.paradas_problema > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30">
            ⚠ {r.paradas_problema} {r.paradas_problema === 1 ? "problema" : "problemas"}
          </span>
        )}
        {tempo && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
            ⏱ {tempo}
          </span>
        )}
        {(r.km_real ?? r.km_estimado) && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
            🛣 {r.km_real ? `${r.km_real} km` : `~${r.km_estimado} km`}
          </span>
        )}
        {r.status === "em_rota" && r.iniciada_em && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
            iniciou há {timeAgoShort(r.iniciada_em)}
          </span>
        )}
      </div>

      {/* Alertas operacionais */}
      {alertas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {alertas.map((a, i) => (
            <span
              key={`${a.label}-${i}`}
              className={`text-[11px] px-2 py-0.5 rounded ring-1 ${ALERTA_STYLES[a.level]}`}
            >
              {a.level === "danger" ? "🚨 " : a.level === "warn" ? "⚠ " : "ℹ "}
              {a.label}
            </span>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/rotas/${r.id}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 ring-1 ring-primary/30"
        >
          Ver detalhes →
        </Link>
        {r.status === "em_rota" && (
          <Link
            href={`/admin/rotas/${r.id}#paradas`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 ring-1 ring-emerald-500/30"
          >
            📍 Acompanhar
          </Link>
        )}
        {showSendLinkCTA && (
          <Link
            href={`/admin/rotas/${r.id}#enviar-link`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 text-gray-200 hover:bg-white/10 ring-1 ring-white/10"
          >
            📲 Enviar link
          </Link>
        )}
      </div>
    </div>
  );
}
