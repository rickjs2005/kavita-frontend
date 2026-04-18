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
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  } catch {
    return iso;
  }
}

function formatBrl(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
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

function LeadDetailBody({
  detail,
  onChanged,
}: {
  detail: LeadDetailResponse;
  onChanged: () => void;
}) {
  const { lead, notes, events } = detail;

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

      {/* ─── Grid 2col: esquerda dados+proposta, direita timeline ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <LeadDataBlock lead={lead} />
          <ProposalBlock lead={lead} onChanged={onChanged} />
          <NextActionBlock lead={lead} onChanged={onChanged} />
          <NotesBlock leadId={lead.id} notes={notes} onChanged={onChanged} />
        </div>
        <div className="lg:col-span-1">
          <TimelineBlock events={events} />
        </div>
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
            className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] text-stone-100 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 [color-scheme:dark]"
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
