"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import toast from "react-hot-toast";

/* ── Types ──────────────────────────────────────────────────────── */

type FaqTopic = {
  title: string;
  description: string;
  content: string[];
  icon: string;
  priority: number;
  active: boolean;
  highlighted: boolean;
};

type TrustItem = {
  label: string;
  desc: string;
  icon: string;
  color: string;
};

type SupportConfig = {
  hero_badge: string | null;
  hero_title: string | null;
  hero_highlight: string | null;
  hero_description: string | null;
  hero_cta_primary: string | null;
  hero_cta_secondary: string | null;
  hero_sla: string | null;
  hero_schedule: string | null;
  hero_status: string | null;
  whatsapp_button_label: string | null;
  show_whatsapp_widget: boolean;
  show_chatbot: boolean;
  show_faq: boolean;
  show_form: boolean;
  show_trust: boolean;
  form_title: string | null;
  form_subtitle: string | null;
  form_success_title: string | null;
  form_success_message: string | null;
  faq_title: string | null;
  faq_subtitle: string | null;
  faq_topics: FaqTopic[] | null;
  trust_title: string | null;
  trust_subtitle: string | null;
  trust_items: TrustItem[] | null;
};

type Tab = "hero" | "canais" | "faq" | "confianca" | "geral";

const TABS: { key: Tab; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "canais", label: "Canais" },
  { key: "faq", label: "Atalhos / FAQ" },
  { key: "confianca", label: "Confianca" },
  { key: "geral", label: "Geral" },
];

/* ── Helpers ────────────────────────────────────────────────────── */

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1 block text-sm font-medium text-gray-700";
const sectionCls = "space-y-5";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-gray-200",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

/* ── Component ──────────────────────────────────────────────────── */

export default function AtendimentoConfigPage() {
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("hero");
  const baselineRef = useRef<SupportConfig | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await apiClient.get<SupportConfig>("/api/admin/support-config");
      const data = (res as any)?.data ?? res;
      const parsed = {
        ...data,
        show_whatsapp_widget: !!data.show_whatsapp_widget,
        show_chatbot: !!data.show_chatbot,
        show_faq: !!data.show_faq,
        show_form: !!data.show_form,
        show_trust: !!data.show_trust,
        faq_topics: Array.isArray(data.faq_topics) ? data.faq_topics : null,
        trust_items: Array.isArray(data.trust_items) ? data.trust_items : null,
      } as SupportConfig;
      setConfig(parsed);
      baselineRef.current = JSON.parse(JSON.stringify(parsed));
    } catch {
      setErro("Erro ao carregar configuracoes de atendimento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  function update(partial: Partial<SupportConfig>) {
    setConfig((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      // Send only changed fields
      const changed: Record<string, unknown> = {};
      const base = baselineRef.current;
      if (base) {
        for (const key of Object.keys(config) as (keyof SupportConfig)[]) {
          if (JSON.stringify(config[key]) !== JSON.stringify(base[key])) {
            changed[key] = config[key];
          }
        }
      } else {
        Object.assign(changed, config);
      }

      if (!Object.keys(changed).length) {
        toast.success("Nenhuma alteracao para salvar.");
        setSaving(false);
        return;
      }

      await apiClient.put("/api/admin/support-config", changed);
      baselineRef.current = JSON.parse(JSON.stringify(config));
      toast.success("Configuracoes salvas!");
    } catch {
      toast.error("Erro ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Carregando configuracoes..." />;
  if (erro) return <ErrorState message={erro} onRetry={fetchConfig} />;
  if (!config) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-teal-light sm:text-2xl">
            Central de Atendimento
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure o conteudo exibido na pagina de atendimento
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alteracoes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: HERO ─────────────────────────────────────────── */}
      {tab === "hero" && (
        <div className={sectionCls}>
          <div>
            <label className={labelCls}>Badge superior</label>
            <input className={inputCls} value={config.hero_badge ?? ""} onChange={(e) => update({ hero_badge: e.target.value || null })} placeholder="Central de Ajuda Kavita" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Titulo principal</label>
              <input className={inputCls} value={config.hero_title ?? ""} onChange={(e) => update({ hero_title: e.target.value || null })} placeholder="Precisa de ajuda?" />
            </div>
            <div>
              <label className={labelCls}>Texto em destaque (cor)</label>
              <input className={inputCls} value={config.hero_highlight ?? ""} onChange={(e) => update({ hero_highlight: e.target.value || null })} placeholder="Estamos com voce." />
            </div>
          </div>
          <div>
            <label className={labelCls}>Descricao</label>
            <textarea className={inputCls} rows={3} value={config.hero_description ?? ""} onChange={(e) => update({ hero_description: e.target.value || null })} placeholder="Tire duvidas sobre pedidos, entregas..." />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>CTA primario (WhatsApp)</label>
              <input className={inputCls} value={config.hero_cta_primary ?? ""} onChange={(e) => update({ hero_cta_primary: e.target.value || null })} placeholder="Falar pelo WhatsApp" />
            </div>
            <div>
              <label className={labelCls}>CTA secundario</label>
              <input className={inputCls} value={config.hero_cta_secondary ?? ""} onChange={(e) => update({ hero_cta_secondary: e.target.value || null })} placeholder="Enviar mensagem" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>SLA de resposta</label>
              <input className={inputCls} value={config.hero_sla ?? ""} onChange={(e) => update({ hero_sla: e.target.value || null })} placeholder="Resposta em ate 24h" />
            </div>
            <div>
              <label className={labelCls}>Horario de atendimento</label>
              <input className={inputCls} value={config.hero_schedule ?? ""} onChange={(e) => update({ hero_schedule: e.target.value || null })} placeholder="Seg a sex, 8h as 18h" />
            </div>
            <div>
              <label className={labelCls}>Status de atendimento</label>
              <input className={inputCls} value={config.hero_status ?? ""} onChange={(e) => update({ hero_status: e.target.value || null })} placeholder="Atendimento ativo agora" />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CANAIS ───────────────────────────────────────── */}
      {tab === "canais" && (
        <div className={sectionCls}>
          <p className="text-sm text-gray-500">
            O WhatsApp e e-mail sao configurados em Configuracoes &gt; Contato. Aqui voce controla visibilidade e textos dos botoes.
          </p>
          <div>
            <label className={labelCls}>Texto do botao WhatsApp</label>
            <input className={inputCls} value={config.whatsapp_button_label ?? ""} onChange={(e) => update({ whatsapp_button_label: e.target.value || null })} placeholder="Falar pelo WhatsApp" />
          </div>
          <div className="space-y-3">
            <Toggle label="Exibir widget flutuante do WhatsApp" checked={config.show_whatsapp_widget} onChange={(v) => update({ show_whatsapp_widget: v })} />
            <Toggle label="Exibir assistente virtual (chatbot)" checked={config.show_chatbot} onChange={(v) => update({ show_chatbot: v })} />
          </div>
        </div>
      )}

      {/* ── TAB: FAQ ──────────────────────────────────────────── */}
      {tab === "faq" && (
        <div className={sectionCls}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Titulo da secao</label>
              <input className={inputCls} value={config.faq_title ?? ""} onChange={(e) => update({ faq_title: e.target.value || null })} placeholder="Duvidas frequentes" />
            </div>
            <div>
              <label className={labelCls}>Subtitulo</label>
              <input className={inputCls} value={config.faq_subtitle ?? ""} onChange={(e) => update({ faq_subtitle: e.target.value || null })} placeholder="Encontre respostas rapidas..." />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>Topicos</label>
              <button
                type="button"
                onClick={() => {
                  const topics = config.faq_topics ?? [];
                  update({
                    faq_topics: [
                      ...topics,
                      { title: "", description: "", content: [], icon: "", priority: topics.length, active: true, highlighted: false },
                    ],
                  });
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300"
              >
                + Adicionar topico
              </button>
            </div>

            <div className="space-y-3">
              {(config.faq_topics ?? []).map((topic, idx) => (
                <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-2 shrink-0 text-xs text-gray-400 w-5 text-right">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        className={inputCls}
                        value={topic.title}
                        onChange={(e) => {
                          const topics = [...(config.faq_topics ?? [])];
                          topics[idx] = { ...topics[idx], title: e.target.value };
                          update({ faq_topics: topics });
                        }}
                        placeholder="Titulo do topico"
                      />
                      <input
                        className={inputCls}
                        value={topic.description}
                        onChange={(e) => {
                          const topics = [...(config.faq_topics ?? [])];
                          topics[idx] = { ...topics[idx], description: e.target.value };
                          update({ faq_topics: topics });
                        }}
                        placeholder="Descricao curta"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const topics = (config.faq_topics ?? []).filter((_, i) => i !== idx);
                        update({ faq_topics: topics });
                      }}
                      className="mt-2 shrink-0 text-xs text-red-400 hover:text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="ml-8">
                    <textarea
                      className={inputCls}
                      rows={3}
                      value={(topic.content ?? []).join("\n")}
                      onChange={(e) => {
                        const topics = [...(config.faq_topics ?? [])];
                        topics[idx] = {
                          ...topics[idx],
                          content: e.target.value.split("\n"),
                        };
                        update({ faq_topics: topics });
                      }}
                      placeholder="Conteudo (uma linha por paragrafo)"
                    />
                    <div className="mt-2 flex flex-wrap gap-3">
                      <Toggle
                        label="Ativo"
                        checked={topic.active}
                        onChange={(v) => {
                          const topics = [...(config.faq_topics ?? [])];
                          topics[idx] = { ...topics[idx], active: v };
                          update({ faq_topics: topics });
                        }}
                      />
                      <Toggle
                        label="Destacado"
                        checked={topic.highlighted}
                        onChange={(v) => {
                          const topics = [...(config.faq_topics ?? [])];
                          topics[idx] = { ...topics[idx], highlighted: v };
                          update({ faq_topics: topics });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CONFIANCA ────────────────────────────────────── */}
      {tab === "confianca" && (
        <div className={sectionCls}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Titulo da secao</label>
              <input className={inputCls} value={config.trust_title ?? ""} onChange={(e) => update({ trust_title: e.target.value || null })} placeholder="Por que confiar no atendimento Kavita" />
            </div>
            <div>
              <label className={labelCls}>Subtitulo</label>
              <input className={inputCls} value={config.trust_subtitle ?? ""} onChange={(e) => update({ trust_subtitle: e.target.value || null })} placeholder="Somos uma empresa real..." />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls}>Itens de confianca</label>
              <button
                type="button"
                onClick={() => {
                  const items = config.trust_items ?? [];
                  update({
                    trust_items: [...items, { label: "", desc: "", icon: "", color: "" }],
                  });
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-300"
              >
                + Adicionar item
              </button>
            </div>

            <div className="space-y-3">
              {(config.trust_items ?? []).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <span className="mt-2 shrink-0 text-xs text-gray-400 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      className={inputCls}
                      value={item.label}
                      onChange={(e) => {
                        const items = [...(config.trust_items ?? [])];
                        items[idx] = { ...items[idx], label: e.target.value };
                        update({ trust_items: items });
                      }}
                      placeholder="Titulo (ex: Resposta rapida)"
                    />
                    <input
                      className={inputCls}
                      value={item.desc}
                      onChange={(e) => {
                        const items = [...(config.trust_items ?? [])];
                        items[idx] = { ...items[idx], desc: e.target.value };
                        update({ trust_items: items });
                      }}
                      placeholder="Descricao (ex: Ate 24h uteis)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const items = (config.trust_items ?? []).filter((_, i) => i !== idx);
                      update({ trust_items: items });
                    }}
                    className="mt-2 shrink-0 text-xs text-red-400 hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GERAL ────────────────────────────────────────── */}
      {tab === "geral" && (
        <div className={sectionCls}>
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
            Visibilidade de secoes
          </p>
          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <Toggle label="Exibir secao de FAQ / atalhos de ajuda" checked={config.show_faq} onChange={(v) => update({ show_faq: v })} />
            <Toggle label="Exibir formulario de contato" checked={config.show_form} onChange={(v) => update({ show_form: v })} />
            <Toggle label="Exibir bloco de confianca" checked={config.show_trust} onChange={(v) => update({ show_trust: v })} />
          </div>

          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide pt-2">
            Formulario
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Titulo do formulario</label>
              <input className={inputCls} value={config.form_title ?? ""} onChange={(e) => update({ form_title: e.target.value || null })} placeholder="Fale com a equipe Kavita" />
            </div>
            <div>
              <label className={labelCls}>Subtitulo</label>
              <input className={inputCls} value={config.form_subtitle ?? ""} onChange={(e) => update({ form_subtitle: e.target.value || null })} placeholder="Descreva sua duvida..." />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Titulo de sucesso</label>
              <input className={inputCls} value={config.form_success_title ?? ""} onChange={(e) => update({ form_success_title: e.target.value || null })} placeholder="Mensagem recebida!" />
            </div>
            <div>
              <label className={labelCls}>Mensagem de sucesso</label>
              <textarea className={inputCls} rows={2} value={config.form_success_message ?? ""} onChange={(e) => update({ form_success_message: e.target.value || null })} placeholder="Nossa equipe ja foi notificada..." />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
