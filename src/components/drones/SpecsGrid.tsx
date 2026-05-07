"use client";

// Ficha técnica premium — grid de cards de grupos técnicos.
// Cada card representa um grupo (Aeronave, Pulverização, RTK, etc) com
// itens key/value alinhados horizontalmente, tabular-nums no valor.
// Inspiração: DJI product specs / Apple tech specs / Tesla details.
//
// Fonte: specs_items_json do modelo selecionado (admin/drones →
// Modelos → editor de Especificações). Itens são strings que o
// componente normaliza em "label" e "value" (split por ":") — quando
// não tem ":", o item inteiro vira o valor com label vazia.

import { useMemo } from "react";
import {
  Activity,
  Battery,
  Cog,
  Droplet,
  Gamepad2,
  Info,
  Layers,
  MountainSnow,
  Radar,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Accent } from "@/components/drones/detail/accent";
import { splitSpec } from "@/lib/drones/modelCopy";

export type SpecsGroup = { title?: string; items?: string[] };

type Props = {
  groups: SpecsGroup[];
  accent: Accent;
};

// Heurística para escolher um ícone apropriado por título de grupo.
// Cobre os grupos da referência DJI Agras + variações comuns que
// admin pode escrever. Cai em Layers como ícone neutro.
function pickGroupIcon(title: string): LucideIcon {
  const k = String(title || "").toLowerCase();
  if (/aeronave|estrutura|peso|dimens|chassi/.test(k)) return Layers;
  if (/pulver|bicos|tanque|gota|spray/.test(k)) return Droplet;
  if (/propuls|motor|h[eé]lice|velocidad/.test(k)) return Cog;
  if (/bater|energia|carga/.test(k)) return Battery;
  if (/rtk|posicion|gps|sat[eé]l/.test(k)) return Radar;
  if (/control|navega[çc]|app|controle remoto/.test(k)) return Gamepad2;
  if (/sensor|segur|prote[çc]/.test(k)) return ShieldCheck;
  if (/desempenho|operacion|hectar|produtiv/.test(k)) return Activity;
  if (/relev|terreno|altitude/.test(k)) return MountainSnow;
  return Layers;
}

type ResolvedItem = { label: string; value: string };
type ResolvedGroup = {
  title: string;
  Icon: LucideIcon;
  items: ResolvedItem[];
};

// Padrões de "valor técnico" — números seguidos de unidade. Usado pelo
// parser para detectar onde o valor começa numa string sem separador
// ":". Cobre o que aparece em fichas de drone agrícola.
const VALUE_PATTERN =
  /(?:[≥≤<>]\s*)?(?:[±]?\d{1,3}(?:[.,]\d+)?(?:\s*[-–—~aà]\s*\d+(?:[.,]\d+)?)?(?:\s*(?:kg|g|m|mm|cm|km|s|min|h|ha\/h|ha|°|°C|°c|m\/s|L\/min|l\/min|L|mAh|wh|Wh|V|Ah|µm|um|polegadas|pol|°|x|×)\b\.?)?(?:\s*\([^)]+\))?)/i;

// Tokens que sinalizam início de UM valor numa string com vários
// pares concatenados. Ex: "Peso 26 kg (sem bateria) 33 kg (com bateria)"
// — depois do primeiro número+unidade, o próximo número inicia outro
// par. Capturamos pares (label antes / valor numérico).
const PAIR_SPLITTER =
  /([^0-9±≥≤<>]+?)\s+([±≥≤<>]?\s*\d+(?:[.,]\d+)?(?:\s*[-–—~aà]\s*\d+(?:[.,]\d+)?)?(?:\s*(?:kg|g|m|mm|cm|km|s|min|h|ha\/h|ha|°C|°c|°|m\/s|L\/min|l\/min|L|mAh|Wh|wh|V|Ah|µm|um|polegadas|pol|x|×)\b\.?)?)(?:\s*\(([^)]+)\))?/gi;

function smartSplit(s: string): ResolvedItem[] {
  // 1. Caminho ideal: já tem ":" — splitSpec resolve.
  const colonIdx = s.indexOf(":");
  if (colonIdx > 0 && colonIdx < s.length - 1) {
    const out = splitSpec(s);
    if (out.label && out.value) return [out];
  }

  // 2. Sem ":": tenta detectar pares "label valor (parêntese)" repetidos
  //    na mesma string. Se achar 2+ pares, retorna cada um como row.
  //    Ex: "Peso 26 kg (sem bateria) 33 kg (com bateria)" → 2 rows.
  const matches = Array.from(s.matchAll(PAIR_SPLITTER));
  if (matches.length >= 2) {
    let baseLabel = "";
    const out: ResolvedItem[] = [];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const labelPart = (m[1] || "").trim();
      const valuePart = (m[2] || "").trim();
      const paren = (m[3] || "").trim();

      // Primeiro hit usa o label ali. Subsequentes herdam o baseLabel
      // (palavra raiz) — porque "Peso 26 kg ... 33 kg" tem "Peso" só
      // no primeiro. O parêntese vira qualificador do label.
      let label: string;
      if (i === 0) {
        baseLabel = labelPart.replace(/^[—\-,;.\s]+/, "").replace(/[—\-,;.\s]+$/, "");
        label = paren ? `${baseLabel} (${paren})` : baseLabel;
      } else {
        // Se o pedaço entre o valor anterior e este é uma frase nova
        // (mais de 2 palavras "fortes"), use como label novo. Senão
        // herda baseLabel + parêntese.
        const cleaned = labelPart.replace(/^[—\-,;.\s]+/, "").replace(/[—\-,;.\s]+$/, "").trim();
        if (cleaned && cleaned.split(/\s+/).length >= 3) {
          label = paren ? `${cleaned} (${paren})` : cleaned;
        } else {
          label = paren ? `${baseLabel} (${paren})` : baseLabel || cleaned;
        }
      }

      label = label.replace(/\s{2,}/g, " ").trim();
      if (label || valuePart) out.push({ label, value: valuePart });
    }
    if (out.length >= 2) return out;
  }

  // 3. Última tentativa: só 1 número+unidade no final. Quebra em
  //    "tudo antes" (label) + "valor" (último match).
  const last = s.match(VALUE_PATTERN);
  if (last && last[0]) {
    const valuePos = s.lastIndexOf(last[0]);
    if (valuePos > 0) {
      const label = s.slice(0, valuePos).trim().replace(/[—\-,;.\s]+$/, "");
      const value = s.slice(valuePos).trim();
      if (label && value && label.length < 80) return [{ label, value }];
    }
  }

  // 4. Não foi possível estruturar — devolve como linha de destaque
  //    (label vazia, value = string inteira). UI renderiza single-row.
  return [{ label: "", value: s.trim() }];
}

export default function SpecsGrid({ groups, accent }: Props) {
  const resolvedGroups: ResolvedGroup[] = useMemo(() => {
    return groups
      .map((g) => {
        const expandedItems: ResolvedItem[] = [];
        for (const raw of g.items || []) {
          const s = String(raw || "").trim();
          if (!s) continue;
          // smartSplit pode devolver múltiplas rows quando a string
          // contém vários pares concatenados — é desejado.
          const rows = smartSplit(s);
          for (const r of rows) {
            if (r.label || r.value) expandedItems.push(r);
          }
        }
        return {
          title: (g.title || "").trim(),
          Icon: pickGroupIcon(g.title || ""),
          items: expandedItems,
        };
      })
      .filter((g) => g.title || g.items.length);
  }, [groups]);

  return (
    <section
      id="drones-specs-grid"
      className="relative scroll-mt-24 py-16 sm:py-24"
    >
      {/* Halo accent decorativo */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute right-0 top-20 h-72 w-[40rem] rounded-full blur-3xl opacity-30",
          accent.halo,
        ].join(" ")}
      />

      <div className="relative mx-auto max-w-7xl px-5">
        {/* Cabeçalho */}
        <header className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Ficha técnica
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.6rem]">
            Especificações Técnicas
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300/90 sm:text-base">
            Dados oficiais do fabricante. Desempenho, capacidade e
            tecnologia pensados para máxima eficiência no campo.
          </p>
        </header>

        {/* Grid de grupos */}
        {resolvedGroups.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {resolvedGroups.map((g, gi) => (
                <SpecsGroupCard
                  key={`${g.title}-${gi}`}
                  group={g}
                  accent={accent}
                />
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-8 flex items-start gap-2 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-[11.5px] text-slate-400">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500"
                aria-hidden
              />
              <span>
                As especificações podem sofrer alterações sem aviso prévio.
                Consulte o manual do fabricante para informações completas.
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Card de grupo técnico ─────────────────────────────────────────────

function SpecsGroupCard({
  group,
  accent,
}: {
  group: ResolvedGroup;
  accent: Accent;
}) {
  const { Icon } = group;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.65)] backdrop-blur-md transition hover:border-white/18 hover:bg-[rgba(10,16,28,0.78)]">
      {/* Halo accent on hover */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute -top-12 -right-8 h-40 w-40 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-50",
          accent.halo,
        ].join(" ")}
      />

      {/* Header */}
      <header className="relative flex items-center gap-2.5 border-b border-white/8 px-4 py-3">
        <span
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border",
            accent.badgeBorder,
            accent.badgeBg,
            accent.text,
          ].join(" ")}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white">
          {group.title || "Especificações"}
        </h3>
      </header>

      {/* Lista key/value */}
      {group.items.length > 0 ? (
        <dl className="relative divide-y divide-white/6 px-4 py-1">
          {group.items.map((it, i) => (
            <SpecsRow key={`${it.label}-${i}`} item={it} />
          ))}
        </dl>
      ) : (
        <p className="px-4 py-4 text-[12px] text-slate-500">
          Nenhum item neste grupo.
        </p>
      )}
    </article>
  );
}

// ─── Linha key/value (label esquerda, valor direita) ───────────────────

function SpecsRow({ item }: { item: ResolvedItem }) {
  // Se label vazia (item sem ":") → mostra valor full-width como
  // "row de destaque". Evita aparecer "—" no lugar da label.
  if (!item.label) {
    return (
      <div className="py-2.5">
        <span className="text-[12.5px] font-bold leading-snug text-white">
          {item.value}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-2.5">
      <dt className="text-[12px] leading-snug text-slate-400">{item.label}</dt>
      <dd
        className="text-right font-mono text-[12.5px] font-bold leading-snug tabular-nums text-white"
        title={item.value}
      >
        {item.value}
      </dd>
    </div>
  );
}

// ─── Estado vazio elegante ─────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(8,12,22,0.5)] p-8 text-center backdrop-blur-md sm:p-12">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
        <Layers className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-white sm:text-xl">
        Ficha técnica em preparação
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        Para detalhes técnicos completos deste modelo, fale com um
        representante autorizado Kavita.
      </p>
      <a
        href="#drones-representatives"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-500/20"
      >
        Falar com representante
      </a>
    </div>
  );
}
