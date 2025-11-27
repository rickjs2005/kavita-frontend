"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type StatusPagamento = "pendente" | "pago" | "falhou" | "estornado";
type StatusEntrega =
  | "em_separacao"
  | "processando"
  | "enviado"
  | "entregue"
  | "cancelado";

type PedidoItem = {
  produto: string;
  quantidade: number;
  preco_unitario: number;
};

type Endereco = {
  nome?: string;
  cpf?: string;
  telefone?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  complemento?: string;
  [key: string]: any;
};

type PedidoAdmin = {
  id: number;
  usuario_id?: number; // 👈 importante pro filtro por cliente
  usuario: string;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  endereco: Endereco | null;
  forma_pagamento: string;
  status_pagamento: StatusPagamento;
  status_entrega: StatusEntrega;
  total: number;
  data_pedido: string;
  itens: PedidoItem[];
};

const LABEL_STATUS_PAGAMENTO: Record<StatusPagamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  falhou: "Falhou",
  estornado: "Estornado",
};

const LABEL_STATUS_ENTREGA: Record<StatusEntrega, string> = {
  em_separacao: "Em separação",
  processando: "Processando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const CLASSE_BADGE_PAGAMENTO: Record<StatusPagamento, string> = {
  pendente:
    "border-amber-500/40 bg-amber-500/10 text-amber-100 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  pago:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  falhou:
    "border-rose-500/40 bg-rose-500/10 text-rose-100 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200",
  estornado:
    "border-sky-500/40 bg-sky-500/10 text-sky-100 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200",
};

const CLASSE_BADGE_ENTREGA: Record<StatusEntrega, string> = {
  em_separacao:
    "border-slate-500/40 bg-slate-500/10 text-slate-100 dark:border-slate-400/30 dark:bg-slate-500/15 dark:text-slate-200",
  processando:
    "border-indigo-500/40 bg-indigo-500/10 text-indigo-100 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-200",
  enviado:
    "border-sky-500/40 bg-sky-500/10 text-sky-100 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200",
  entregue:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  cancelado:
    "border-rose-500/40 bg-rose-500/10 text-rose-100 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200",
};

function money(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resumoEndereco(endereco: Endereco | null) {
  if (!endereco) return "—";
  const partes = [
    endereco.rua && `${endereco.rua}, ${endereco.numero ?? ""}`.trim(),
    endereco.bairro,
    endereco.cidade && `${endereco.cidade} - ${endereco.estado ?? ""}`.trim(),
    endereco.cep && `CEP: ${endereco.cep}`,
  ].filter(Boolean);
  return partes.join(" · ") || "—";
}

function resumoItens(itens: PedidoItem[]) {
  if (!itens || itens.length === 0) return "Nenhum item";
  if (itens.length === 1) {
    const i = itens[0];
    return `${i.quantidade}x ${i.produto}`;
  }
  const totalQtd = itens.reduce((acc, i) => acc + i.quantidade, 0);
  return `${totalQtd} itens (${itens.length} produtos)`;
}

function normalizarTelefoneBr(telefone?: string | null): string | null {
  if (!telefone) return null;
  const digits = telefone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function whatsappLink(
  telefone?: string | null,
  nome?: string,
  pedidoId?: number
): string | null {
  const numero = normalizarTelefoneBr(telefone);
  if (!numero) return null;

  const texto = `Olá ${nome ?? ""}, sobre o seu pedido #${
    pedidoId ?? ""
  }...`.trim();
  const encoded = encodeURIComponent(texto);

  return `https://wa.me/${numero}?text=${encoded}`;
}

function copiarDadosCliente(pedido: PedidoAdmin) {
  const linhas = [
    `Nome: ${pedido.usuario}`,
    `Email: ${pedido.email ?? "-"}`,
    `Telefone: ${pedido.telefone ?? "-"}`,
    `CPF: ${pedido.cpf ?? "-"}`,
  ];

  const texto = linhas.join("\n");

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        alert("Dados do cliente copiados para a área de transferência.");
      })
      .catch(() => {
        alert("Não foi possível copiar os dados.");
      });
  } else {
    alert(texto);
  }
}

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const clienteIdParam = searchParams.get("clienteId");
  const clienteId = clienteIdParam ? Number(clienteIdParam) : null;

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;

        const resp = await axios.get<PedidoAdmin[]>(
          `${API_BASE}/api/admin/pedidos`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          }
        );

        setPedidos(resp.data);
      } catch (err) {
        console.error("Erro ao carregar pedidos admin:", err);
        setErro("Não foi possível carregar os pedidos.");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    if (!clienteId) return pedidos;
    return pedidos.filter((p) => p.usuario_id === clienteId);
  }, [pedidos, clienteId]);

  const clienteSelecionado = useMemo(() => {
    if (!clienteId) return null;
    return pedidos.find((p) => p.usuario_id === clienteId) || null;
  }, [pedidos, clienteId]);

  const atualizarStatusEntrega = async (
    id: number,
    novoStatus: StatusEntrega
  ) => {
    try {
      setAtualizandoId(id);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      await axios.put(
        `${API_BASE}/api/admin/pedidos/${id}/entrega`,
        { status_entrega: novoStatus },
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        }
      );

      setPedidos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status_entrega: novoStatus } : p
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar status de entrega:", err);
      alert("Erro ao atualizar entrega. Tente novamente.");
    } finally {
      setAtualizandoId(null);
    }
  };

  const atualizarStatusPagamento = async (
    id: number,
    novoStatus: StatusPagamento
  ) => {
    try {
      setAtualizandoId(id);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      await axios.put(
        `${API_BASE}/api/admin/pedidos/${id}/pagamento`,
        { status_pagamento: novoStatus },
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        }
      );

      setPedidos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status_pagamento: novoStatus } : p
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar status de pagamento:", err);
      alert("Erro ao atualizar pagamento. Tente novamente.");
    } finally {
      setAtualizandoId(null);
    }
  };

  // 🔔 Envio de comunicação (e-mail + WhatsApp) baseado em template
  const enviarComunicacao = async (
    id: number,
    template: "confirmacao_pedido" | "pagamento_aprovado" | "pedido_enviado"
  ) => {
    try {
      setAtualizandoId(id);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      };

      // e-mail
      try {
        await axios.post(
          `${API_BASE}/api/admin/comunicacao/email`,
          { template, pedidoId: id },
          config
        );
      } catch (err) {
        console.error("Erro ao enviar e-mail de comunicação:", err);
        alert("Erro ao enviar e-mail de comunicação.");
      }

      // WhatsApp
      try {
        await axios.post(
          `${API_BASE}/api/admin/comunicacao/whatsapp`,
          { template, pedidoId: id },
          config
        );
      } catch (err) {
        console.error("Erro ao enviar WhatsApp de comunicação:", err);
        alert("Erro ao enviar mensagem de WhatsApp.");
      }
    } finally {
      setAtualizandoId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-svh w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Pedidos
          </h1>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Carregando pedidos...
          </p>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-svh w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Pedidos
          </h1>
          <p className="mt-4 text-sm text-red-500">{erro}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* botão voltar só no mobile */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-2 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ← Voltar
          </button>
        </div>

        {/* Cabeçalho */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Pedidos
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Acompanhe pagamentos e status de entrega dos pedidos.
            </p>

            {clienteSelecionado && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                <span>
                  Filtrando por cliente{" "}
                  <strong>
                    #{String(clienteSelecionado.usuario_id).padStart(4, "0")}{" "}
                    - {clienteSelecionado.usuario}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/admin/pedidos")}
                  className="ml-2 rounded-full bg-emerald-600/80 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
                >
                  Limpar filtro
                </button>
              </div>
            )}
          </div>

          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            Total de pedidos:
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-100">
              {pedidosFiltrados.length}
            </span>
          </div>
        </header>

        {/* Lista / tabela */}
        {pedidosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Desktop */}
            <div className="hidden min-w-full divide-y divide-gray-200 text-sm text-gray-700 sm:table dark:divide-gray-800 dark:text-gray-200">
              <div className="table-header-group bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/70 dark:text-gray-400">
                <div className="table-row">
                  <div className="table-cell px-4 py-3">Pedido</div>
                  <div className="table-cell px-4 py-3">Cliente</div>
                  <div className="table-cell px-4 py-3">Itens</div>
                  <div className="table-cell px-4 py-3">Pagamento</div>
                  <div className="table-cell px-4 py-3">Entrega</div>
                  <div className="table-cell px-4 py-3 text-right">
                    Total / Data
                  </div>
                </div>
              </div>

              <div className="table-row-group divide-y divide-gray-200 dark:divide-gray-800">
                {pedidosFiltrados.map((pedido) => {
                  const telefoneContato =
                    pedido.telefone || pedido.endereco?.telefone;
                  const linkWpp = whatsappLink(
                    telefoneContato,
                    pedido.usuario,
                    pedido.id
                  );

                  return (
                    <div
                      key={pedido.id}
                      className="table-row hover:bg-gray-50/60 dark:hover:bg-gray-800/60"
                    >
                      {/* Pedido / endereço */}
                      <div className="table-cell px-4 py-4 align-top">
                        <div className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                          #{pedido.id.toString().padStart(4, "0")}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {resumoEndereco(pedido.endereco)}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-400">
                          Pagamento: {pedido.forma_pagamento || "—"}
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="table-cell px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {pedido.usuario}
                        </div>

                        {/* Email */}
                        {pedido.email && (
                          <div className="mt-1 text-xs">
                            <a
                              href={`mailto:${pedido.email}?subject=${encodeURIComponent(
                                `Pedido #${pedido.id}`
                              )}`}
                              className="text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              {pedido.email}
                            </a>
                          </div>
                        )}

                        {/* CPF */}
                        {pedido.cpf && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            CPF: {pedido.cpf}
                          </div>
                        )}

                        {/* Telefone + WhatsApp + Copiar dados */}
                        {(telefoneContato || linkWpp) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {telefoneContato && (
                              <span className="text-[11px]">
                                Tel: {telefoneContato}
                              </span>
                            )}

                            {linkWpp && (
                              <a
                                href={linkWpp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full border border-emerald-500/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                              >
                                WhatsApp
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => copiarDadosCliente(pedido)}
                              className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800/70"
                            >
                              Copiar dados
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Itens */}
                      <div className="table-cell px-4 py-4 align-top">
                        <div className="text-xs text-gray-700 dark:text-gray-200">
                          {resumoItens(pedido.itens)}
                        </div>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {pedido.itens.slice(0, 3).map((item, idx) => (
                            <li key={idx}>
                              {item.quantidade}x {item.produto}
                            </li>
                          ))}
                          {pedido.itens.length > 3 && (
                            <li className="text-[11px] text-gray-400">
                              + {pedido.itens.length - 3} produto(s)
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Pagamento + botões manuais */}
                      <div className="table-cell px-4 py-4 align-top">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${CLASSE_BADGE_PAGAMENTO[pedido.status_pagamento]}`}
                        >
                          Pagamento:{" "}
                          {LABEL_STATUS_PAGAMENTO[pedido.status_pagamento]}
                        </span>

                        {(pedido.status_pagamento === "pendente" ||
                          pedido.status_pagamento === "falhou") && (
                          <button
                            type="button"
                            onClick={() =>
                              atualizarStatusPagamento(pedido.id, "pago")
                            }
                            disabled={atualizandoId === pedido.id}
                            className="mt-2 inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {atualizandoId === pedido.id
                              ? "Atualizando..."
                              : "Marcar como pago manualmente"}
                          </button>
                        )}

                        {/* Comunicação manual */}
                        <div className="mt-3 flex flex-col gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              enviarComunicacao(
                                pedido.id,
                                "confirmacao_pedido"
                              )
                            }
                            disabled={atualizandoId === pedido.id}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            Enviar confirmação
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              enviarComunicacao(
                                pedido.id,
                                "pagamento_aprovado"
                              )
                            }
                            disabled={atualizandoId === pedido.id}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            Enviar comprovante
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              enviarComunicacao(pedido.id, "pedido_enviado")
                            }
                            disabled={atualizandoId === pedido.id}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            Enviar atualização de entrega
                          </button>
                        </div>
                      </div>

                      {/* Entrega (select) */}
                      <div className="table-cell px-4 py-4 align-top">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${CLASSE_BADGE_ENTREGA[pedido.status_entrega]}`}
                        >
                          {LABEL_STATUS_ENTREGA[pedido.status_entrega]}
                        </span>

                        <div className="mt-2">
                          <select
                            value={pedido.status_entrega}
                            disabled={atualizandoId === pedido.id}
                            onChange={(e) =>
                              atualizarStatusEntrega(
                                pedido.id,
                                e.target.value as StatusEntrega
                              )
                            }
                            className="block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="em_separacao">Em separação</option>
                            <option value="processando">Processando</option>
                            <option value="enviado">Enviado</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                      </div>

                      {/* Total / data */}
                      <div className="table-cell px-4 py-4 align-top text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                          {money(pedido.total)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(pedido.data_pedido)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile (cards) */}
            <div className="divide-y divide-gray-200 sm:hidden dark:divide-gray-800">
              {pedidosFiltrados.map((pedido) => {
                const telefoneContato =
                  pedido.telefone || pedido.endereco?.telefone;
                const linkWpp = whatsappLink(
                  telefoneContato,
                  pedido.usuario,
                  pedido.id
                );

                return (
                  <div
                    key={pedido.id}
                    className="space-y-3 p-4 hover:bg-gray-50/60 dark:hover:bg-gray-900/40"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                          Pedido #{pedido.id.toString().padStart(4, "0")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {pedido.usuario}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-gray-900 dark:text-gray-50">
                          {money(pedido.total)}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDate(pedido.data_pedido)}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {resumoEndereco(pedido.endereco)}
                    </p>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {resumoItens(pedido.itens)}
                    </p>

                    {/* Contato mobile */}
                    {(pedido.email || telefoneContato || pedido.cpf) && (
                      <div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                        {pedido.email && (
                          <a
                            href={`mailto:${pedido.email}?subject=${encodeURIComponent(
                              `Pedido #${pedido.id}`
                            )}`}
                            className="block truncate text-emerald-500 hover:underline dark:text-emerald-300"
                          >
                            {pedido.email}
                          </a>
                        )}

                        {pedido.cpf && <div>CPF: {pedido.cpf}</div>}

                        {telefoneContato && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span>Tel: {telefoneContato}</span>
                            {linkWpp && (
                              <a
                                href={linkWpp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full border border-emerald-500/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                              >
                                WhatsApp
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => copiarDadosCliente(pedido)}
                              className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800/70"
                            >
                              Copiar dados
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${CLASSE_BADGE_PAGAMENTO[pedido.status_pagamento]}`}
                      >
                        {LABEL_STATUS_PAGAMENTO[pedido.status_pagamento]}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${CLASSE_BADGE_ENTREGA[pedido.status_entrega]}`}
                      >
                        {LABEL_STATUS_ENTREGA[pedido.status_entrega]}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {(pedido.status_pagamento === "pendente" ||
                        pedido.status_pagamento === "falhou") && (
                        <button
                          type="button"
                          onClick={() =>
                            atualizarStatusPagamento(pedido.id, "pago")
                          }
                          disabled={atualizandoId === pedido.id}
                          className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {atualizandoId === pedido.id
                            ? "Atualizando..."
                            : "Marcar como pago manualmente"}
                        </button>
                      )}

                      <select
                        value={pedido.status_entrega}
                        disabled={atualizandoId === pedido.id}
                        onChange={(e) =>
                          atualizarStatusEntrega(
                            pedido.id,
                            e.target.value as StatusEntrega
                          )
                        }
                        className="block w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-xs text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                      >
                        <option value="em_separacao">Em separação</option>
                        <option value="processando">Processando</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                      </select>

                      {/* Comunicação manual (mobile) */}
                      <div className="flex flex-col gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            enviarComunicacao(pedido.id, "confirmacao_pedido")
                          }
                          disabled={atualizandoId === pedido.id}
                          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Enviar confirmação
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            enviarComunicacao(pedido.id, "pagamento_aprovado")
                          }
                          disabled={atualizandoId === pedido.id}
                          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Enviar comprovante
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            enviarComunicacao(pedido.id, "pedido_enviado")
                          }
                          disabled={atualizandoId === pedido.id}
                          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Enviar atualização de entrega
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
