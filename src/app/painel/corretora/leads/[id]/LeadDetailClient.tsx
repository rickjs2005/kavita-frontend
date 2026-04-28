"use client";

// src/app/painel/corretora/leads/[id]/LeadDetailClient.tsx
//
// Detalhe completo de um lead — cabeçalho, quick actions, proposta,
// próxima ação, notas datadas e timeline unificada. Usa o design
// language do painel (dark stone-950 + glass + amber accent).

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { useNow } from "@/hooks/useNow";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { ContratosSection } from "@/components/painel-corretora/ContratosSection";
import type {
  CorretoraLead,
  LeadStatus,
  AmostraStatus,
} from "@/types/lead";

type LeadEvent = {
  id: number;
  lead_id: number;
  corretora_id: number;
  actor_user_id: number | null;
  actor_type: string;
  actor_nome?: string | null;
  event_type: string;
  title: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

type LeadNote = {
  id: number;
  lead_id: number;
  corretora_id: number;
  author_user_id: number | null;
  author_nome?: string | null;
  body: string;
  created_at: string;
};

type LeadDetailResponse = {
  lead: CorretoraLead & {
    preco_proposto?: number | null;
    preco_fechado?: number | null;
    data_compra?: string | null;
    destino_venda?: string | null;
    next_action_text?: string | null;
    next_action_at?: string | null;
    telefone_normalizado?: string | null;
    recontact_count?: number;
    last_recontact_at?: string | null;
    // Fase 8 — campos de análise do café (já existiam em updateLeadSchema)
    umidade_pct?: number | null;
    catacao_defeitos?: string | null;
    aspecto_lote?: string | null;
    obs_sensoriais?: string | null;
    obs_comerciais?: string | null;
    mercado_indicado?: string | null;
    aptidao_oferta?: string | null;
    altitude_origem?: number | null;
    variedade_cultivar?: string | null;
  };
  notes: LeadNote[];
  events: LeadEvent[];
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Em contato",
  closed: "Fechado",
  lost: "Perdido",
};

const AMOSTRA_LABEL: Record<AmostraStatus, string> = {
  nao_entregue: "Não entregue",
  prometida: "Prometida",
  recebida: "Recebida",
  laudada: "Laudada",
};

const DESTINO_LABEL: Record<string, string> = {
  mercado_interno: "Mercado interno",
  exportacao: "Exportação",
  cooperativa: "Cooperativa",
  revenda: "Revenda",
  outro: "Outro",
};

const VOLUME_LABEL: Record<string, string> = {
  ate_50: "Até 50 sacas",
  "50_200": "50 a 200 sacas",
  "200_500": "200 a 500 sacas",
  "500_mais": "Mais de 500 sacas",
};

const TIPO_CAFE_LABEL: Record<string, string> = {
  arabica_comum: "Arábica comum",
  arabica_especial: "Arábica especial",
  natural: "Natural",
  cereja_descascado: "Cereja descascado",
  ainda_nao_sei: "Ainda não sei",
};

const CANAL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
};

const URGENCIA_LABEL: Record<string, string> = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
  sem_pressa: "Sem pressa",
};

const POSSUI_AMOSTRA_LABEL: Record<string, string> = {
  sim: "Tem amostra",
  nao: "Não tem",
  vou_colher: "Vai colher em breve",
};

// ─── Chips operacionais ─────────────────────────────────────────
// Derivados do estado do lead para dar leitura em 1s: qual é a
// situação deste lead agora? Ordem importa — primeiro a render
// vence no caso de sobreposição (ex.: "Perdido" tira tudo).

type OpChip = {
  key: string;
  label: string;
  tone: "amber" | "emerald" | "rose" | "sky" | "slate" | "indigo";
  title?: string;
};

const OP_CHIP_TONE: Record<OpChip["tone"], string> = {
  amber:
    "bg-amber-400/15 text-amber-100 ring-amber-400/35",
  emerald:
    "bg-emerald-500/15 text-emerald-100 ring-emerald-400/35",
  rose:
    "bg-rose-500/15 text-rose-100 ring-rose-400/35",
  sky: "bg-sky-500/15 text-sky-100 ring-sky-400/35",
  slate: "bg-white/[0.05] text-stone-200 ring-white/15",
  indigo:
    "bg-indigo-500/15 text-indigo-100 ring-indigo-400/35",
};

function deriveOperationalChips(
  lead: LeadDetailResponse["lead"],
): OpChip[] {
  const chips: OpChip[] = [];
  const now = Date.now();
  const createdMs = lead.created_at
    ? new Date(lead.created_at).getTime()
    : null;
  const hoursSinceCreation =
    createdMs !== null ? (now - createdMs) / 3_600_000 : null;

  // Terminais primeiro — matam todas as preocupações operacionais.
  if (lead.status === "closed") {
    chips.push({
      key: "closed",
      label: "Fechado",
      tone: "emerald",
      title: "Lote fechado",
    });
    if (lead.preco_fechado != null) {
      chips.push({
        key: "venda",
        label: `Venda ${formatBrl(lead.preco_fechado)}/sc`,
        tone: "emerald",
      });
    }
    return chips;
  }
  if (lead.status === "lost") {
    chips.push({
      key: "lost",
      label: "Perdido",
      tone: "rose",
      title: "Lead descartado",
    });
    return chips;
  }

  // Sinal forte: proposta enviada, aguardando produtor decidir.
  if (lead.preco_proposto != null) {
    chips.push({
      key: "proposta_enviada",
      label: `Proposta ${formatBrl(lead.preco_proposto)}/sc`,
      tone: "indigo",
      title: "Proposta enviada — aguardando produtor",
    });
  }

  // Novo vs em negociação — ajuda a priorizar a mesa.
  if (lead.status === "new") {
    chips.push({ key: "new", label: "Novo", tone: "amber" });
  } else if (lead.status === "contacted") {
    chips.push({ key: "contacted", label: "Em negociação", tone: "sky" });
  }

  // Urgência por volume/score.
  if ((lead.priority_score ?? 0) >= 60) {
    chips.push({
      key: "urgente",
      label: "Urgente",
      tone: "rose",
      title: "Score de prioridade alto",
    });
  }

  // Sem resposta: criado e status continua "new" após 24h.
  if (
    lead.status === "new" &&
    hoursSinceCreation !== null &&
    hoursSinceCreation >= 24
  ) {
    chips.push({
      key: "sem_resposta",
      label: "Sem resposta há +24h",
      tone: "rose",
      title: "Ninguém tocou neste lead ainda",
    });
  }

  // Próxima ação vencida. Os terminais (closed/lost) já retornaram
  // acima, então aqui só tratamos new/contacted.
  if (
    lead.next_action_at &&
    new Date(lead.next_action_at).getTime() < now
  ) {
    chips.push({
      key: "next_vencida",
      label: "Próxima ação vencida",
      tone: "rose",
      title: "Você marcou uma ação para esta data e ela já passou",
    });
  }

  // Amostra — quando prometida/recebida/laudada dá uma pista
  // operacional rápida à corretora.
  if (
    lead.amostra_status &&
    lead.amostra_status !== "nao_entregue"
  ) {
    chips.push({
      key: `amostra_${lead.amostra_status}`,
      label: `Amostra ${(AMOSTRA_LABEL[lead.amostra_status] ?? lead.amostra_status).toLowerCase()}`,
      tone: "slate",
    });
  }

  return chips;
}

function OperationalChipsRow({
  chips,
}: {
  chips: OpChip[];
}) {
  if (chips.length === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="list"
      aria-label="Estado operacional do lead"
    >
      {chips.map((c) => (
        <span
          key={c.key}
          role="listitem"
          title={c.title}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${OP_CHIP_TONE[c.tone]}`}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ─── Próxima ação em destaque ──────────────────────────────────
// Banner fixo no topo do detalhe: resposta direta à pergunta
// "o que fazer agora?". Mostra a próxima ação marcada, vencida
// ou não; senão, orienta a marcar uma.

function NextActionHighlight({
  lead,
  onJumpTab,
}: {
  lead: LeadDetailResponse["lead"];
  onJumpTab: () => void;
}) {
  const now = useNow();
  const terminal = lead.status === "closed" || lead.status === "lost";
  if (terminal) return null;

  const hasAction = Boolean(lead.next_action_at || lead.next_action_text);
  const when = lead.next_action_at
    ? new Date(lead.next_action_at)
    : null;
  const overdue = when ? when.getTime() < now : false;

  const tone = overdue
    ? {
        ring: "ring-rose-400/40",
        bg: "bg-rose-500/[0.08]",
        kicker: "text-rose-200",
        cta: "bg-rose-500/20 text-rose-100 ring-rose-400/40 hover:bg-rose-500/30",
        label: "Próxima ação vencida",
      }
    : hasAction
      ? {
          ring: "ring-amber-400/35",
          bg: "bg-amber-400/[0.06]",
          kicker: "text-amber-200",
          cta: "bg-amber-500/20 text-amber-100 ring-amber-400/40 hover:bg-amber-500/30",
          label: "O que fazer em seguida",
        }
      : {
          ring: "ring-white/10",
          bg: "bg-white/[0.03]",
          kicker: "text-stone-300",
          cta: "bg-white/[0.05] text-stone-200 ring-white/15 hover:bg-white/[0.08]",
          label: "Próxima ação não marcada",
        };

  return (
    <section
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ring-1 ${tone.ring} ${tone.bg}`}
      aria-label="Próxima ação"
    >
      <div className="min-w-0 flex-1">
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${tone.kicker}`}
        >
          {tone.label}
        </p>
        {hasAction ? (
          <p className="mt-1 text-[14px] text-stone-100">
            <span className="font-semibold">
              {lead.next_action_text?.trim() || "Ação agendada"}
            </span>
            {when && (
              <span className="ml-2 text-[12px] text-stone-400">
                · {formatDate(when.toISOString())}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-1 text-[13px] text-stone-400">
            Defina o próximo passo para este lead não esfriar (ex: “ligar às
            17h”, “buscar amostra na sexta”).
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onJumpTab}
        className={`inline-flex h-9 items-center rounded-lg px-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 transition-colors ${tone.cta}`}
      >
        {hasAction ? "Editar" : "Definir ação"}
      </button>
    </section>
  );
}

const EVENT_TONE: Record<
  string,
  { ring: string; dot: string; label: string }
> = {
  lead_created: {
    ring: "ring-amber-400/40",
    dot: "bg-amber-400",
    label: "Lead recebido",
  },
  status_changed: {
    ring: "ring-white/15",
    dot: "bg-stone-400",
    label: "Status",
  },
  note_added: {
    ring: "ring-white/15",
    dot: "bg-sky-400",
    label: "Nota",
  },
  proposal_sent: {
    ring: "ring-amber-400/40",
    dot: "bg-amber-400",
    label: "Proposta",
  },
  proposal_updated: {
    ring: "ring-amber-400/30",
    dot: "bg-amber-400/80",
    label: "Proposta",
  },
  deal_won: {
    ring: "ring-emerald-400/40",
    dot: "bg-emerald-400",
    label: "Fechado",
  },
  deal_lost: {
    ring: "ring-rose-400/40",
    dot: "bg-rose-400",
    label: "Perdido",
  },
  next_action_set: {
    ring: "ring-white/15",
    dot: "bg-indigo-400",
    label: "Próx. ação",
  },
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatDateTime(iso) || iso;
}

function formatBrl(v: number | null | undefined) {
  if (v == null) return "—";
  return formatCurrency(v);
}

function toIsoDatetimeLocal(value: string) {
  // <input type="datetime-local"> devolve "YYYY-MM-DDTHH:mm" sem TZ —
  // convertemos assumindo horário local e devolvemos ISO com offset.
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function LeadDetailClient({ leadId }: { leadId: number }) {
  const [detail, setDetail] = useState<LeadDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<LeadDetailResponse>(
        `/api/corretora/leads/${leadId}`,
      );
      setDetail(res);
    } catch (err) {
      setError(formatApiError(err, "Erro ao carregar lead.").message);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-xl border border-white/[0.04] bg-stone-900/50" />
        <div className="h-40 animate-pulse rounded-xl border border-white/[0.04] bg-stone-900/50" />
        <div className="h-64 animate-pulse rounded-xl border border-white/[0.04] bg-stone-900/50" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-3">
        <Link
          href="/painel/corretora/leads"
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300 hover:text-amber-200"
        >
          ← Voltar aos leads
        </Link>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          {error ?? "Lead não encontrado."}
        </div>
      </div>
    );
  }

  return (
    <LeadDetailBody detail={detail} onChanged={load} />
  );
}

// ─── Body (separado pra manter render clean mesmo com hooks extras) ──

type LeadTab =
  | "contato"
  | "cafe"
  | "proposta"
  | "acao"
  | "timeline";

const TABS: Array<{
  id: LeadTab;
  label: string;
  short: string;
  icon: React.ReactNode;
}> = [
  {
    id: "contato",
    label: "Contato",
    short: "Contato",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    id: "cafe",
    label: "Café / Análise",
    short: "Café",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <path d="M17 8h1a4 4 0 010 8h-1" />
        <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
        <path d="M7 1v3M11 1v3M15 1v3" />
      </svg>
    ),
  },
  {
    id: "proposta",
    label: "Proposta",
    short: "Proposta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9a3 3 0 00-3-2c-1.7 0-3 1-3 2.3 0 1.3 1 2 3 2.2 2 .3 3 1 3 2.3 0 1.2-1.3 2.2-3 2.2a3 3 0 01-3-2" />
        <path d="M12 6v2M12 16v2" />
      </svg>
    ),
  },
  {
    id: "acao",
    label: "Próxima ação",
    short: "Ação",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    id: "timeline",
    label: "Timeline",
    short: "Timeline",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    ),
  },
];

function LeadTabsNav({
  active,
  onChange,
  badges,
}: {
  active: LeadTab;
  onChange: (t: LeadTab) => void;
  badges: Partial<Record<LeadTab, string>>;
}) {
  return (
    <nav
      aria-label="Seções do lead"
      className="relative -mx-1 overflow-x-auto"
    >
      <ul className="flex min-w-full items-center gap-1 px-1" role="tablist">
        {TABS.map((t) => {
          const isActive = active === t.id;
          const badge = badges[t.id];
          return (
            <li key={t.id} className="shrink-0">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${t.id}`}
                id={`tab-btn-${t.id}`}
                onClick={() => onChange(t.id)}
                className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12px] font-semibold transition-colors ${
                  isActive
                    ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/35"
                    : "text-stone-400 hover:bg-white/[0.04] hover:text-stone-100"
                }`}
              >
                <span aria-hidden>{t.icon}</span>
                <span>
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.short}</span>
                </span>
                {badge && (
                  <span
                    className={`ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                      isActive
                        ? "bg-amber-400/25 text-amber-100"
                        : "bg-white/[0.06] text-stone-300"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LeadDetailBody({
  detail,
  onChanged,
}: {
  detail: LeadDetailResponse;
  onChanged: () => void;
}) {
  const { lead, notes, events } = detail;
  const [tab, setTab] = useState<LeadTab>("contato");
  const now = useNow();

  // WhatsApp prefill contextual — economia de tempo pra corretora
  const waHref = useMemo(() => {
    const phone = (lead.telefone_normalizado ?? lead.telefone).replace(
      /\D/g,
      "",
    );
    const prefix = phone.startsWith("55") ? phone : `55${phone}`;
    const greeting =
      `Olá ${lead.nome.split(" ")[0]}, aqui é da corretora. ` +
      `Recebi seu contato pelo Kavita` +
      (lead.cidade ? ` em ${lead.cidade}` : "") +
      ". Podemos conversar sobre seu café?";
    return `https://wa.me/${prefix}?text=${encodeURIComponent(greeting)}`;
  }, [lead]);

  const opChips = useMemo(() => deriveOperationalChips(lead), [lead]);

  // Badges por aba pra dar sinal rápido do que mudou/precisa atenção.
  const badges: Partial<Record<LeadTab, string>> = useMemo(() => {
    const b: Partial<Record<LeadTab, string>> = {};
    if (notes.length > 0) b.contato = String(notes.length);
    // Badge de análise: sinaliza se tem dado preenchido.
    const hasAnalysis =
      lead.bebida_classificacao ||
      lead.pontuacao_sca != null ||
      lead.umidade_pct != null ||
      lead.catacao_defeitos ||
      lead.mercado_indicado;
    if (hasAnalysis) b.cafe = "✓";
    if (lead.preco_proposto != null || lead.preco_fechado != null) {
      b.proposta = "✓";
    }
    if (lead.next_action_at || lead.next_action_text) {
      const overdue =
        lead.next_action_at &&
        new Date(lead.next_action_at).getTime() < now &&
        lead.status !== "closed" &&
        lead.status !== "lost";
      b.acao = overdue ? "!" : "✓";
    }
    if (events.length > 0) b.timeline = String(events.length);
    return b;
  }, [lead, notes.length, events.length, now]);

  return (
    <div className="space-y-4">
      <Link
        href="/painel/corretora/leads"
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300 hover:text-amber-200"
      >
        ← Voltar aos leads
      </Link>

      {/* ─── Cabeçalho ───────────────────────────────────────── */}
      <LeadHeader lead={lead} waHref={waHref} onChanged={onChanged} />

      {/* ─── Chips operacionais — estado real em 1s ─── */}
      <OperationalChipsRow chips={opChips} />

      {/* ─── Próxima ação em destaque no topo ──────────── */}
      <NextActionHighlight
        lead={lead}
        onJumpTab={() => setTab("acao")}
      />

      {/* ─── Abas ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-stone-900/40 p-1.5">
        <LeadTabsNav active={tab} onChange={setTab} badges={badges} />
      </div>

      {/* ─── Painel da aba ativa ───────────────────────── */}
      <div
        role="tabpanel"
        id={`tab-panel-${tab}`}
        aria-labelledby={`tab-btn-${tab}`}
        className="space-y-4"
      >
        {tab === "contato" && (
          <>
            <LeadDataBlock lead={lead} />
            <NotesBlock
              leadId={lead.id}
              notes={notes}
              onChanged={onChanged}
            />
          </>
        )}
        {tab === "cafe" && (
          <AnalysisBlock lead={lead} onChanged={onChanged} alwaysOpen />
        )}
        {tab === "proposta" && (
          <>
            <ProposalBlock lead={lead} onChanged={onChanged} />
            <ContratosSection leadId={lead.id} leadStatus={lead.status} />
          </>
        )}
        {tab === "acao" && (
          <NextActionBlock lead={lead} onChanged={onChanged} />
        )}
        {tab === "timeline" && <TimelineBlock events={events} />}
      </div>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────

function LeadHeader({
  lead,
  waHref,
  onChanged,
}: {
  lead: LeadDetailResponse["lead"];
  waHref: string;
  onChanged: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const changeStatus = async (newStatus: LeadStatus) => {
    if (newStatus === lead.status) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/api/corretora/leads/${lead.id}`, {
        status: newStatus,
      });
      toast.success(`Status → ${STATUS_LABEL[newStatus]}`);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao mudar status.").message);
    } finally {
      setUpdating(false);
    }
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(lead.telefone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const score = lead.priority_score ?? 0;
  const scoreTone =
    score >= 60
      ? { ring: "ring-rose-400/40", text: "text-rose-200", label: "urgente" }
      : score >= 40
        ? {
            ring: "ring-amber-400/40",
            text: "text-amber-200",
            label: "alta prioridade",
          }
        : {
            ring: "ring-white/10",
            text: "text-stone-300",
            label: "normal",
          };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5 shadow-xl shadow-black/40">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-stone-50 md:text-2xl">
              {lead.nome}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ${scoreTone.ring} ${scoreTone.text}`}
              title={`Score ${score}`}
            >
              {scoreTone.label} · {score}
            </span>
            {lead.recontact_count != null && lead.recontact_count > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200 ring-1 ring-amber-400/30"
                title="Produtor tentou contato novamente"
              >
                {lead.recontact_count}× recontato
              </span>
            )}
            {lead.previous_contacts_count != null &&
              lead.previous_contacts_count > 0 && (
                <span
                  className="inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-300 ring-1 ring-white/10"
                  title="Leads anteriores do mesmo telefone"
                >
                  {lead.previous_contacts_count} lead(s) anteriores
                </span>
              )}
          </div>
          <p className="mt-1 text-[13px] text-stone-400">
            {lead.cidade ?? "Sem cidade informada"}
            {lead.corrego_localidade ? ` · ${lead.corrego_localidade}` : ""} ·
            recebido em {formatDate(lead.created_at)}
          </p>
          <p className="mt-2 font-mono text-[12px] font-semibold text-stone-200">
            {lead.telefone}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-200 ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-500/25"
          >
            WhatsApp →
          </a>
          <button
            type="button"
            onClick={copyPhone}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-200 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08]"
          >
            {copied ? "copiado" : "copiar telefone"}
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Status
        </span>
        {(["new", "contacted", "closed", "lost"] as LeadStatus[]).map((s) => {
          const active = lead.status === s;
          const activeClass =
            s === "closed"
              ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
              : s === "lost"
                ? "bg-rose-500/15 text-rose-200 ring-rose-400/30"
                : "bg-amber-400/15 text-amber-200 ring-amber-400/30";
          return (
            <button
              key={s}
              type="button"
              onClick={() => changeStatus(s)}
              disabled={updating}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all disabled:opacity-50 ${
                active
                  ? `${activeClass} ring-1`
                  : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.06] hover:text-stone-200"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dados do lote ──────────────────────────────────────────────

function LeadDataBlock({ lead }: { lead: LeadDetailResponse["lead"] }) {
  const items: Array<{ label: string; value: string | null | undefined }> = [
    { label: "E-mail", value: lead.email ?? null },
    { label: "Cidade", value: lead.cidade ?? null },
    { label: "Córrego/localidade", value: lead.corrego_localidade ?? null },
    {
      label: "Safra",
      value:
        lead.safra_tipo === "atual"
          ? "Atual"
          : lead.safra_tipo === "remanescente"
            ? "Estoque/remanescente"
            : null,
    },
    {
      label: "Tipo de café",
      value: lead.tipo_cafe ? (TIPO_CAFE_LABEL[lead.tipo_cafe] ?? lead.tipo_cafe) : null,
    },
    {
      label: "Volume estimado",
      value: lead.volume_range
        ? (VOLUME_LABEL[lead.volume_range] ?? lead.volume_range)
        : null,
    },
    {
      label: "Canal preferido",
      value: lead.canal_preferido
        ? (CANAL_LABEL[lead.canal_preferido] ?? lead.canal_preferido)
        : null,
    },
    {
      label: "Amostra",
      value: lead.amostra_status
        ? (AMOSTRA_LABEL[lead.amostra_status] ?? lead.amostra_status)
        : null,
    },
  ];

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
        Dados do lote
      </h2>
      <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-0.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              {it.label}
            </dt>
            <dd className="text-[14px] text-stone-100">{it.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      {lead.mensagem && (
        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Mensagem do produtor
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-stone-200">
            {lead.mensagem}
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Análise do café (Fase 8) ───────────────────────────────────

const BEBIDA_CLASSIFICACAO_OPTS = [
  { value: "especial", label: "Especial" },
  { value: "dura", label: "Dura" },
  { value: "riado", label: "Riado" },
  { value: "rio", label: "Rio" },
  { value: "escolha", label: "Escolha" },
] as const;

const AMOSTRA_OPTS = [
  { value: "nao_entregue", label: "Não entregue" },
  { value: "prometida", label: "Prometida" },
  { value: "recebida", label: "Recebida" },
  { value: "laudada", label: "Laudada" },
] as const;

const MERCADO_OPTS = [
  { value: "exportacao", label: "Exportação" },
  { value: "mercado_interno", label: "Mercado interno" },
  { value: "cafeteria", label: "Cafeteria/specialty" },
  { value: "commodity", label: "Commodity" },
  { value: "indefinido", label: "Indefinido" },
] as const;

const APTIDAO_OPTS = [
  { value: "sim", label: "Compra" },
  { value: "parcial", label: "Compra parcial" },
  { value: "nao", label: "Não compra" },
] as const;

function AnalysisBlock({
  lead,
  onChanged,
  alwaysOpen = false,
}: {
  lead: LeadDetailResponse["lead"];
  onChanged: () => void;
  alwaysOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(
    alwaysOpen ||
      Boolean(
        lead.amostra_status && lead.amostra_status !== "nao_entregue",
      ) ||
      Boolean(lead.bebida_classificacao) ||
      Boolean(lead.pontuacao_sca),
  );
  const [saving, setSaving] = useState(false);

  // Campos em estado local (controlled). String pra inputs numéricos
  // para evitar "NaN" quando user limpa.
  const [amostra, setAmostra] = useState(lead.amostra_status ?? "");
  const [bebida, setBebida] = useState(lead.bebida_classificacao ?? "");
  const [sca, setSca] = useState(
    lead.pontuacao_sca != null ? String(lead.pontuacao_sca) : "",
  );
  const [peneira, setPeneira] = useState(lead.peneira ?? "");
  const [umidade, setUmidade] = useState(
    lead.umidade_pct != null ? String(lead.umidade_pct) : "",
  );
  const [defeitos, setDefeitos] = useState(lead.catacao_defeitos ?? "");
  const [aspecto, setAspecto] = useState(lead.aspecto_lote ?? "");
  const [variedade, setVariedade] = useState(lead.variedade_cultivar ?? "");
  const [altitude, setAltitude] = useState(
    lead.altitude_origem != null ? String(lead.altitude_origem) : "",
  );
  const [mercado, setMercado] = useState(lead.mercado_indicado ?? "");
  const [aptidao, setAptidao] = useState(lead.aptidao_oferta ?? "");
  const [obsSensoriais, setObsSensoriais] = useState(lead.obs_sensoriais ?? "");
  const [obsComerciais, setObsComerciais] = useState(lead.obs_comerciais ?? "");

  const save = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    const toNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
    if (amostra) payload.amostra_status = amostra;
    if (bebida) payload.bebida_classificacao = bebida;
    else if (lead.bebida_classificacao) payload.bebida_classificacao = null;
    payload.pontuacao_sca = toNum(sca);
    payload.peneira = peneira.trim() || null;
    payload.umidade_pct = toNum(umidade);
    payload.catacao_defeitos = defeitos.trim() || null;
    payload.aspecto_lote = aspecto.trim() || null;
    payload.variedade_cultivar = variedade.trim() || null;
    const alt = toNum(altitude);
    payload.altitude_origem = alt == null ? null : Math.round(alt);
    payload.mercado_indicado = mercado || null;
    payload.aptidao_oferta = aptidao || null;
    payload.obs_sensoriais = obsSensoriais.trim() || null;
    payload.obs_comerciais = obsComerciais.trim() || null;
    try {
      await apiClient.patch(`/api/corretora/leads/${lead.id}`, payload);
      toast.success("Análise salva.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao salvar análise.").message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      {alwaysOpen ? (
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
            Análise do café
          </h2>
          <p className="mt-1 text-[11px] text-stone-400">
            Bebida, peneira, umidade, defeitos e observações da amostra.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              Análise do café
            </h2>
            <p className="mt-1 text-[11px] text-stone-400">
              Bebida, peneira, umidade, defeitos e observações da amostra.
            </p>
          </div>
          <span
            aria-hidden
            className={`mt-1 text-amber-300/80 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Amostra status */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Status da amostra
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AMOSTRA_OPTS.map((o) => {
                const active = amostra === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setAmostra(active ? "" : o.value)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      active
                        ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
                        : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.08] hover:text-stone-100"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bebida */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Bebida (laudo)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BEBIDA_CLASSIFICACAO_OPTS.map((o) => {
                const active = bebida === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setBebida(active ? "" : o.value)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      active
                        ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
                        : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.08] hover:text-stone-100"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Métricas numéricas + texto curto */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnalysisField
              label="Pontuação SCA"
              value={sca}
              onChange={setSca}
              type="number"
              placeholder="0 a 100"
              step="0.25"
            />
            <AnalysisField
              label="Peneira"
              value={peneira}
              onChange={setPeneira}
              placeholder="Ex: 16 acima"
            />
            <AnalysisField
              label="Umidade (%)"
              value={umidade}
              onChange={setUmidade}
              type="number"
              placeholder="0 a 30"
              step="0.1"
            />
            <AnalysisField
              label="Altitude origem (m)"
              value={altitude}
              onChange={setAltitude}
              type="number"
              placeholder="Ex: 900"
            />
            <AnalysisField
              label="Variedade / cultivar"
              value={variedade}
              onChange={setVariedade}
              placeholder="Ex: Catuaí Amarelo"
            />
            <AnalysisField
              label="Aspecto do lote"
              value={aspecto}
              onChange={setAspecto}
              placeholder="Ex: Bom, uniforme"
            />
          </div>

          <AnalysisField
            label="Defeitos / catação"
            value={defeitos}
            onChange={setDefeitos}
            placeholder="Ex: 8 brocados, 3 pretos"
          />

          {/* Mercado + aptidão em chips */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Mercado indicado
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MERCADO_OPTS.map((o) => {
                  const active = mercado === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setMercado(active ? "" : o.value)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        active
                          ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
                          : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.08] hover:text-stone-100"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Aptidão de compra
              </label>
              <div className="flex flex-wrap gap-1.5">
                {APTIDAO_OPTS.map((o) => {
                  const active = aptidao === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setAptidao(active ? "" : o.value)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        active
                          ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
                          : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.08] hover:text-stone-100"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Observações sensoriais
              </label>
              <textarea
                value={obsSensoriais}
                onChange={(e) => setObsSensoriais(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-[13px] text-stone-100 placeholder:text-stone-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                placeholder="Ex: doce, corpo médio, acidez cítrica"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Observações comerciais
              </label>
              <textarea
                value={obsComerciais}
                onChange={(e) => setObsComerciais(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-[13px] text-stone-100 placeholder:text-stone-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                placeholder="Ex: pediu retirada em 10 dias; prefere Pix"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-9 items-center rounded-lg bg-amber-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 ring-1 ring-amber-400/40 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar análise"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AnalysisField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        {label}
      </label>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] text-stone-100 placeholder:text-stone-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
      />
    </div>
  );
}

// ─── Proposta ───────────────────────────────────────────────────

function ProposalBlock({
  lead,
  onChanged,
}: {
  lead: LeadDetailResponse["lead"];
  onChanged: () => void;
}) {
  const [precoProposto, setPrecoProposto] = useState<string>(
    lead.preco_proposto != null ? String(lead.preco_proposto) : "",
  );
  const [precoFechado, setPrecoFechado] = useState<string>(
    lead.preco_fechado != null ? String(lead.preco_fechado) : "",
  );
  const [dataCompra, setDataCompra] = useState<string>(
    lead.data_compra ?? "",
  );
  const [destino, setDestino] = useState<string>(lead.destino_venda ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    const parseMoney = (v: string) => {
      if (!v.trim()) return null;
      const n = Number(v.replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };
    payload.preco_proposto = parseMoney(precoProposto);
    payload.preco_fechado = parseMoney(precoFechado);
    payload.data_compra = dataCompra || null;
    payload.destino_venda = destino || null;
    try {
      await apiClient.patch(
        `/api/corretora/leads/${lead.id}/proposal`,
        payload,
      );
      toast.success("Proposta atualizada.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao salvar proposta.").message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
        Proposta e compra
      </h2>
      <p className="mt-1 text-[11px] text-stone-400">
        Registre o preço negociado. Atual: proposto{" "}
        <span className="font-semibold text-stone-200">
          {formatBrl(lead.preco_proposto)}
        </span>
        {" · "}fechado{" "}
        <span className="font-semibold text-stone-200">
          {formatBrl(lead.preco_fechado)}
        </span>
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MoneyField
          label="Preço proposto por saca"
          value={precoProposto}
          onChange={setPrecoProposto}
        />
        <MoneyField
          label="Preço fechado por saca"
          value={precoFechado}
          onChange={setPrecoFechado}
        />
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Data da compra
          </label>
          <input
            type="date"
            value={dataCompra}
            onChange={(e) => setDataCompra(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] text-stone-100 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Destino
          </label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-stone-950/80 px-3 text-[13px] text-amber-100 outline-none transition hover:border-amber-400/30 focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 [color-scheme:dark]"
          >
            <option value="">Selecione…</option>
            {Object.entries(DESTINO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-9 items-center rounded-lg bg-amber-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 ring-1 ring-amber-400/40 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar proposta"}
        </button>
      </div>
    </section>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        {label}
      </label>
      <div className="flex h-9 items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] focus-within:border-amber-400/50 focus-within:ring-1 focus-within:ring-amber-400/30">
        <span className="px-3 text-[12px] font-semibold text-stone-500">
          R$
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full flex-1 bg-transparent pr-3 text-[13px] text-stone-100 focus:outline-none"
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

// ─── Próxima ação ───────────────────────────────────────────────

function NextActionBlock({
  lead,
  onChanged,
}: {
  lead: LeadDetailResponse["lead"];
  onChanged: () => void;
}) {
  const [text, setText] = useState(lead.next_action_text ?? "");
  // datetime-local input trabalha com "YYYY-MM-DDTHH:mm"; convertemos
  // do ISO salvo pra esse formato na inicialização.
  const [when, setWhen] = useState(() => {
    if (!lead.next_action_at) return "";
    const d = new Date(lead.next_action_at);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [saving, setSaving] = useState(false);

  const overdue =
    lead.next_action_at &&
    new Date(lead.next_action_at).getTime() < Date.now();

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.patch(
        `/api/corretora/leads/${lead.id}/next-action`,
        {
          next_action_text: text.trim() || null,
          next_action_at: when ? toIsoDatetimeLocal(when) : null,
        },
      );
      toast.success("Próxima ação atualizada.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao salvar.").message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
          Próxima ação
        </h2>
        {overdue && (
          <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200 ring-1 ring-rose-400/30">
            vencida
          </span>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: buscar amostra na sexta-feira"
          maxLength={255}
          className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] text-stone-100 placeholder:text-stone-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
        />
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] text-stone-100 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 [color-scheme:dark]"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setText("");
            setWhen("");
          }}
          disabled={saving}
          className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold text-stone-300 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-9 items-center rounded-lg bg-amber-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 ring-1 ring-amber-400/40 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </section>
  );
}

// ─── Notas ──────────────────────────────────────────────────────

function NotesBlock({
  leadId,
  notes,
  onChanged,
}: {
  leadId: number;
  notes: LeadNote[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const addNote = async () => {
    if (!draft.trim()) return;
    setAdding(true);
    try {
      await apiClient.post(`/api/corretora/leads/${leadId}/notes`, {
        body: draft.trim(),
      });
      toast.success("Nota adicionada.");
      setDraft("");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao adicionar nota.").message);
    } finally {
      setAdding(false);
    }
  };

  const removeNote = async (noteId: number) => {
    if (!confirm("Remover esta nota?")) return;
    try {
      await apiClient.del(
        `/api/corretora/leads/${leadId}/notes/${noteId}`,
      );
      toast.success("Nota removida.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao remover nota.").message);
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
        Notas internas
      </h2>
      <div className="mt-3 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Adicionar nota (ex: produtor pediu pra ligar depois das 17h)…"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-[13px] text-stone-100 placeholder:text-stone-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addNote}
            disabled={adding || !draft.trim()}
            className="inline-flex h-9 items-center rounded-lg bg-amber-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 ring-1 ring-amber-400/40 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
          >
            {adding ? "Salvando…" : "Adicionar nota"}
          </button>
        </div>
      </div>

      {notes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {n.author_nome ?? "Autor removido"} ·{" "}
                    {formatDate(n.created_at)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] text-stone-100">
                    {n.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeNote(n.id)}
                  className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 hover:text-rose-300"
                >
                  remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Timeline ───────────────────────────────────────────────────

function TimelineBlock({ events }: { events: LeadEvent[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
        Timeline
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-[12px] text-stone-500">
          Nenhum evento registrado.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {events.map((ev) => {
            const tone = EVENT_TONE[ev.event_type] ?? EVENT_TONE.status_changed;
            return (
              <li key={ev.id} className="relative pl-5">
                <span
                  aria-hidden
                  className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${tone.dot} ring-2 ${tone.ring}`}
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {tone.label} · {formatDate(ev.created_at)}
                    {ev.actor_nome ? ` · ${ev.actor_nome}` : ""}
                  </p>
                  <p className="mt-0.5 text-[13px] text-stone-100">
                    {ev.title ?? ev.event_type}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// ─── Rótulos auxiliares (mantidos pra future use; suprimimos warn)
void POSSUI_AMOSTRA_LABEL;
void URGENCIA_LABEL;
