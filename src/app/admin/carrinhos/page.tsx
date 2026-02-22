"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import CustomButton from "@/components/buttons/CustomButton";
import { KpiCard } from "../../../components/admin/KpiCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Alinhado ao backend (adminCarts.js):
 * GET /api/admin/carrinhos -> { carrinhos: [...] } (ou eventualmente array)
 */
type AbandonedCartItem = {
  produto_id: number;
  produto: string;
  quantidade: number;
  preco_unitario: number;
};

type AbandonedCart = {
  id: number;
  carrinho_id: number;
  usuario_id: number;
  usuario_nome: string;
  usuario_email: string | null;
  usuario_telefone: string | null;
  itens: AbandonedCartItem[];
  total_estimado: number;
  criado_em: string;
  atualizado_em: string;
  recuperado: boolean;
};

type WhatsAppLinkResponse = {
  wa_link: string;
  message_text: string;
};

/* --------------------------- helpers --------------------------- */

function money(v: number) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || "");
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resumoItens(itens: AbandonedCartItem[]) {
  if (!Array.isArray(itens) || itens.length === 0) return "Nenhum item";
  if (itens.length === 1) {
    const i = itens[0];
    return `${Number(i.quantidade || 0)}x ${i.produto}`;
  }
  const totalQtd = itens.reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0);
  return `${totalQtd} itens (${itens.length} produtos)`;
}

function initials(name: string) {
  const safe = (name || "").trim();
  if (!safe) return "V";
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/* ----------------------- telefone/whatsapp ------------------------- */

function onlyDigits(v: string) {
  return String(v || "").replace(/\D+/g, "");
}

function toE164BR(phoneRaw: string | null) {
  const digits = onlyDigits(phoneRaw || "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function formatPhoneBR(phoneRaw: string | null) {
  const digits = onlyDigits(phoneRaw || "");
  if (!digits) return "";

  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  const ddd = local.slice(0, 2);
  const num = local.slice(2);

  if (!ddd || !num) return digits;

  if (num.length === 9) return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  if (num.length === 8) return `(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;

  return `(${ddd}) ${num}`;
}

function waMeLinkFromPhone(phoneRaw: string | null) {
  const e164 = toE164BR(phoneRaw);
  if (!e164) return "";
  return `https://wa.me/${encodeURIComponent(e164)}`;
}

/* ----------------------- normalização ------------------------- */

function coerceItens(raw: any): AbandonedCartItem[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((it: any) => ({
        produto_id: Number(it?.produto_id || 0),
        produto: String(it?.produto || "Produto"),
        quantidade: Number(it?.quantidade || 0),
        preco_unitario: Number(it?.preco_unitario || 0),
      }))
      .filter((x) => x.quantidade > 0);
  }

  if (typeof raw === "string") {
    try {
      return coerceItens(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeCart(c: any): AbandonedCart {
  return {
    id: Number(c?.id || 0),
    carrinho_id: Number(c?.carrinho_id || 0),
    usuario_id: Number(c?.usuario_id || 0),
    usuario_nome: String(c?.usuario_nome || "Visitante"),
    usuario_email: c?.usuario_email ? String(c.usuario_email) : null,
    usuario_telefone: c?.usuario_telefone ? String(c.usuario_telefone) : null,
    itens: coerceItens(c?.itens),
    total_estimado: Number(c?.total_estimado || 0),
    criado_em: String(c?.criado_em || ""),
    atualizado_em: String(c?.atualizado_em || c?.criado_em || ""),
    recuperado: Boolean(c?.recuperado),
  };
}

function extractCartsFromResponseData(data: any): any[] {
  if (data && typeof data === "object" && Array.isArray(data.carrinhos)) return data.carrinhos;
  if (Array.isArray(data)) return data;
  return [];
}

function itemSubtotal(i: AbandonedCartItem) {
  return Number(i.quantidade || 0) * Number(i.preco_unitario || 0);
}

/* ------------------------------ API ------------------------------ */

async function fetchAbandonedCarts(): Promise<AbandonedCart[]> {
  const resp = await axios.get(`${API_BASE}/api/admin/carrinhos`, {
    withCredentials: true,
  });

  const list = extractCartsFromResponseData(resp.data);
  return list.map(normalizeCart);
}

async function notifyCart(id: number, tipo: "whatsapp" | "email") {
  await axios.post(
    `${API_BASE}/api/admin/carrinhos/${id}/notificar`,
    { tipo },
    { withCredentials: true }
  );
}

async function getWhatsAppLink(id: number): Promise<WhatsAppLinkResponse> {
  const resp = await axios.get(`${API_BASE}/api/admin/carrinhos/${id}/whatsapp-link`, {
    withCredentials: true,
  });
  return resp.data as WhatsAppLinkResponse;
}

/* --------------------- UI helpers (sem disabled) --------------------- */

function Blockable({
  blocked,
  children,
}: {
  blocked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={blocked ? "pointer-events-none opacity-50 select-none" : ""} aria-disabled={blocked}>
      {children}
    </div>
  );
}

function ItemsTable({ itens }: { itens: AbandonedCartItem[] }) {
  if (!itens || itens.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
        Nenhum item no snapshot.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60">
      <div className="grid grid-cols-[1fr_80px_120px_120px] gap-2 border-b border-slate-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <div>Produto</div>
        <div className="text-right">Qtd</div>
        <div className="text-right">Unit.</div>
        <div className="text-right">Subtotal</div>
      </div>

      <div className="max-h-[240px] overflow-auto">
        {itens.map((i, idx) => (
          <div
            key={`${i.produto_id}-${idx}`}
            className="grid grid-cols-[1fr_80px_120px_120px] gap-2 px-3 py-2 text-xs text-slate-200"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-100">{i.produto}</div>
              {i.produto_id ? <div className="text-[11px] text-slate-500">ID: {i.produto_id}</div> : null}
            </div>
            <div className="text-right text-slate-200">{Number(i.quantidade || 0)}</div>
            <div className="text-right text-slate-200">{money(i.preco_unitario || 0)}</div>
            <div className="text-right font-semibold text-slate-50">{money(itemSubtotal(i))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */

export default function AdminCarrinhosAbandonadosPage() {
  const [carrinhos, setCarrinhos] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [notificandoId, setNotificandoId] = useState<number | null>(null);
  const [wppLoadingId, setWppLoadingId] = useState<number | null>(null);

  // ✅ novo: controla qual carrinho está expandido (mostrar TODOS os itens)
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const router = useRouter();

  const goBack = () => {
    try {
      // ✅ FIX lint: nada de ternário solto (unused-expressions)
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin");
      }
    } catch {
      router.push("/admin");
    }
  };

  const carregar = async () => {
    setLoading(true);
    setErro(null);

    try {
      const data = await fetchAbandonedCarts();
      setCarrinhos(data);
    } catch (err: any) {
      console.error("Erro ao carregar carrinhos abandonados:", err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/admin/login");
        return;
      }

      setErro("Não foi possível carregar os carrinhos abandonados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const naoRecuperados = useMemo(() => carrinhos.filter((c) => !c.recuperado), [carrinhos]);
  const recuperados = useMemo(() => carrinhos.filter((c) => c.recuperado), [carrinhos]);
  const totalNaoRecuperados = useMemo(
    () => naoRecuperados.reduce((acc, c) => acc + (c.total_estimado || 0), 0),
    [naoRecuperados]
  );

  const handleNotificar = async (id: number, tipo: "whatsapp" | "email") => {
    try {
      setNotificandoId(id);
      await notifyCart(id, tipo);

      toast.success(
        tipo === "whatsapp"
          ? "Notificação WhatsApp registrada. Agora gere o link e envie."
          : "E-mail registrado (o worker envia automaticamente)."
      );
    } catch (err: any) {
      console.error("Erro ao notificar carrinho abandonado:", err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/admin/login");
        return;
      }

      const msg = err?.response?.data?.message || "Erro ao registrar lembrete. Tente novamente.";
      toast.error(String(msg));
    } finally {
      setNotificandoId(null);
    }
  };

  const handleAbrirWhatsApp = async (id: number) => {
    try {
      setWppLoadingId(id);

      const { wa_link } = await getWhatsAppLink(id);
      if (!wa_link) {
        toast.error("Não foi possível gerar o link do WhatsApp.");
        return;
      }

      window.open(wa_link, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("Erro ao gerar link de WhatsApp:", err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/admin/login");
        return;
      }

      const msg = err?.response?.data?.message || "Erro ao gerar link do WhatsApp. Tente novamente.";
      toast.error(String(msg));
    } finally {
      setWppLoadingId(null);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <main className="min-h-svh w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="sm:hidden">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900"
            >
              ← Voltar
            </button>
          </div>

          <div>
            <h1 className="text-lg font-semibold text-slate-50 sm:text-xl">Carrinhos abandonados</h1>
            <p className="mt-1 text-sm text-slate-400">Carregando carrinhos...</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-[92px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40" />
            <div className="h-[92px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40" />
            <div className="h-[92px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40" />
            <div className="h-[92px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40" />
          </div>

          <div className="h-[380px] animate-pulse rounded-2xl border border-slate-800 bg-slate-950/40" />
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-svh w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-4">
          <div className="sm:hidden">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900"
            >
              ← Voltar
            </button>
          </div>

          <div>
            <h1 className="text-lg font-semibold text-slate-50 sm:text-xl">Carrinhos abandonados</h1>
            <p className="mt-1 text-sm text-slate-400">
              Visualize carrinhos não concluídos e envie lembretes para recuperação.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/30 p-4 text-sm text-rose-200">
            {erro}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={carregar}
              className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900"
            >
              Voltar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Back (mobile) */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900"
          >
            ← Voltar
          </button>
        </div>

        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-50 sm:text-xl">Carrinhos abandonados</h1>
            <p className="mt-1 text-sm text-slate-400">
              Visualize carrinhos não concluídos e envie lembretes para recuperação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={carregar}
              className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900"
            >
              Atualizar
            </button>

            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 shadow-sm">
              <span>Total:</span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                {carrinhos.length}
              </span>
              <span className="text-slate-500">•</span>
              <span>Não recuperados:</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                {naoRecuperados.length}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total de carrinhos"
            value={carrinhos.length}
            helper="Cadastrados como abandonados"
            variant="default"
          />
          <KpiCard
            label="Não recuperados"
            value={naoRecuperados.length}
            helper="Prioridade para contato"
            variant="warning"
          />
          <KpiCard label="Recuperados" value={recuperados.length} helper="Marcados como recuperados" variant="success" />
          <KpiCard
            label="Total estimado (não recuperados)"
            value={money(totalNaoRecuperados)}
            helper="Potencial de receita a recuperar"
            variant="danger"
          />
        </section>

        {carrinhos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-300">
            Nenhum carrinho abandonado encontrado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 shadow-sm">
            {/* Desktop/tablet */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto">
                <div className="min-w-[1040px]">
                  <div className="grid grid-cols-[340px_1fr_200px_260px] border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <div className="px-4 py-3">Cliente</div>
                    <div className="px-4 py-3">Itens</div>
                    <div className="px-4 py-3">Data do abandono</div>
                    <div className="px-4 py-3 text-right">Total / Ações</div>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {carrinhos.map((c) => {
                      const isNotificando = notificandoId === c.id;
                      const isWppLoading = wppLoadingId === c.id;

                      const blockAll = c.recuperado;
                      const blockWppOpen = c.recuperado || !c.usuario_telefone;
                      const blockEmail = c.recuperado || !c.usuario_email;

                      const phoneFormatted = formatPhoneBR(c.usuario_telefone);
                      const phoneLink = waMeLinkFromPhone(c.usuario_telefone);

                      const isExpanded = expandedId === c.id;

                      return (
                        <div key={c.id} className="bg-transparent">
                          {/* Linha principal */}
                          <div className="grid grid-cols-[340px_1fr_200px_260px] hover:bg-slate-950/60">
                            <div className="px-4 py-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-200">
                                  {initials(c.usuario_nome)}
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-50">
                                    {c.usuario_nome || "Visitante"}
                                  </div>

                                  {c.usuario_email ? (
                                    <a
                                      href={`mailto:${c.usuario_email}`}
                                      className="mt-1 block truncate text-xs text-emerald-300 hover:underline"
                                    >
                                      {c.usuario_email}
                                    </a>
                                  ) : (
                                    <div className="mt-1 text-xs text-slate-500">E-mail não cadastrado</div>
                                  )}

                                  {c.usuario_telefone ? (
                                    <div className="mt-1 text-xs text-slate-400">
                                      WhatsApp:{" "}
                                      {phoneLink ? (
                                        <a
                                          href={phoneLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-300 hover:underline"
                                          title="Abrir conversa (sem mensagem pronta)"
                                        >
                                          {phoneFormatted || c.usuario_telefone}
                                        </a>
                                      ) : (
                                        <span>{phoneFormatted || c.usuario_telefone}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-xs text-slate-500">WhatsApp não cadastrado</div>
                                  )}

                                  {c.recuperado && (
                                    <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                                      Carrinho recuperado
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="px-4 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-slate-100">{resumoItens(c.itens)}</div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    Clique em “Ver itens” para detalhes completos.
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(c.id)}
                                  className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900"
                                >
                                  {isExpanded ? "Ocultar itens" : "Ver itens"}
                                </button>
                              </div>
                            </div>

                            <div className="px-4 py-4 text-xs text-slate-400">{formatDate(c.criado_em)}</div>

                            <div className="px-4 py-4 text-right">
                              <div className="text-sm font-semibold text-slate-50">{money(c.total_estimado)}</div>

                              <div className="mt-3 flex flex-col items-end gap-2">
                                <Blockable blocked={blockAll}>
                                  <CustomButton
                                    label="Registrar WhatsApp"
                                    onClick={() => handleNotificar(c.id, "whatsapp")}
                                    variant="primary"
                                    size="small"
                                    isLoading={isNotificando}
                                  />
                                </Blockable>

                                <Blockable blocked={blockWppOpen}>
                                  <CustomButton
                                    label="Abrir WhatsApp (mensagem pronta)"
                                    onClick={() => handleAbrirWhatsApp(c.id)}
                                    variant="secondary"
                                    size="small"
                                    isLoading={isWppLoading}
                                  />
                                </Blockable>

                                <Blockable blocked={blockEmail}>
                                  <CustomButton
                                    label="Registrar e-mail"
                                    onClick={() => handleNotificar(c.id, "email")}
                                    variant="secondary"
                                    size="small"
                                    isLoading={isNotificando}
                                  />
                                </Blockable>
                              </div>
                            </div>
                          </div>

                          {/* Painel expandido com TODOS os itens */}
                          {isExpanded && (
                            <div className="border-t border-slate-800 bg-slate-950/30 px-4 py-4">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-slate-50">
                                    Itens do carrinho #{c.carrinho_id}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    Total estimado:{" "}
                                    <span className="font-semibold text-slate-200">{money(c.total_estimado)}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(c.id)}
                                    className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900"
                                  >
                                    Fechar
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3">
                                <ItemsTable itens={c.itens} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-800 sm:hidden">
              {carrinhos.map((c) => {
                const isNotificando = notificandoId === c.id;
                const isWppLoading = wppLoadingId === c.id;

                const blockAll = c.recuperado;
                const blockWppOpen = c.recuperado || !c.usuario_telefone;
                const blockEmail = c.recuperado || !c.usuario_email;

                const phoneFormatted = formatPhoneBR(c.usuario_telefone);
                const phoneLink = waMeLinkFromPhone(c.usuario_telefone);

                const isExpanded = expandedId === c.id;

                return (
                  <article key={c.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-200">
                          {initials(c.usuario_nome)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-50">{c.usuario_nome || "Visitante"}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(c.criado_em)}</p>

                          {c.usuario_telefone ? (
                            <p className="mt-1 text-[11px] text-slate-400">
                              WhatsApp:{" "}
                              {phoneLink ? (
                                <a
                                  href={phoneLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-300 hover:underline"
                                >
                                  {phoneFormatted || c.usuario_telefone}
                                </a>
                              ) : (
                                <span>{phoneFormatted || c.usuario_telefone}</span>
                              )}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] text-slate-500">WhatsApp não cadastrado</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-50">{money(c.total_estimado)}</p>
                        {c.recuperado && (
                          <span className="mt-1 inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                            Recuperado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-100">{resumoItens(c.itens)}</p>

                        <button
                          type="button"
                          onClick={() => toggleExpanded(c.id)}
                          className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] font-semibold text-slate-200 hover:bg-slate-900"
                        >
                          {isExpanded ? "Ocultar itens" : "Ver itens"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3">
                          <ItemsTable itens={c.itens} />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Blockable blocked={blockAll}>
                        <CustomButton
                          label="Registrar WhatsApp"
                          onClick={() => handleNotificar(c.id, "whatsapp")}
                          variant="primary"
                          size="large"
                          isLoading={isNotificando}
                        />
                      </Blockable>

                      <Blockable blocked={blockWppOpen}>
                        <CustomButton
                          label="Abrir WhatsApp (mensagem pronta)"
                          onClick={() => handleAbrirWhatsApp(c.id)}
                          variant="secondary"
                          size="large"
                          isLoading={isWppLoading}
                        />
                      </Blockable>

                      <Blockable blocked={blockEmail}>
                        <CustomButton
                          label="Registrar e-mail"
                          onClick={() => handleNotificar(c.id, "email")}
                          variant="secondary"
                          size="large"
                          isLoading={isNotificando}
                        />
                      </Blockable>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}