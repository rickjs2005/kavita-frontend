"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CustomButton from "@/components/buttons/CustomButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AbandonedCartItem = {
  produto_id?: number;
  produto: string;
  quantidade: number;
  preco_unitario: number;
};

type AbandonedCart = {
  id: number;
  carrinho_id: number;
  usuario_id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  itens: AbandonedCartItem[];
  total_estimado: number;
  criado_em: string;
  atualizado_em: string;
  recuperado: boolean;
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

function resumoItens(itens: AbandonedCartItem[]) {
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

function whatsappLink(telefone?: string | null, nome?: string) {
  const numero = normalizarTelefoneBr(telefone);
  if (!numero) return null;
  const texto = `Olá ${nome ?? ""}, você deixou alguns produtos no carrinho. Quer concluir sua compra?`.trim();
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export default function AdminCarrinhosAbandonadosPage() {
  const [carrinhos, setCarrinhos] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [notificandoId, setNotificandoId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;

        const resp = await axios.get<AbandonedCart[]>(
          `${API_BASE}/api/admin/carrinhos`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            withCredentials: true,
          }
        );

        // garante que itens esteja como array
        const data = (resp.data || []).map((c: any) => ({
          ...c,
          itens: Array.isArray(c.itens) ? c.itens : [],
        }));

        setCarrinhos(data);
      } catch (err) {
        console.error("Erro ao carregar carrinhos abandonados:", err);
        setErro("Não foi possível carregar os carrinhos abandonados.");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const total = carrinhos.length;
  const apenasNaoRecuperados = useMemo(
    () => carrinhos.filter((c) => !c.recuperado),
    [carrinhos]
  );

  const handleNotificar = async (id: number, tipo: "whatsapp" | "email") => {
    try {
      setNotificandoId(id);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      await axios.post(
        `${API_BASE}/api/admin/carrinhos/${id}/notificar`,
        { tipo },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        }
      );

      toast.success(
        tipo === "whatsapp"
          ? "Lembrete de WhatsApp registrado."
          : "E-mail de recuperação registrado."
      );
    } catch (err) {
      console.error("Erro ao notificar carrinho abandonado:", err);
      toast.error("Erro ao enviar lembrete. Tente novamente.");
    } finally {
      setNotificandoId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-svh w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Carrinhos abandonados
          </h1>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Carregando carrinhos...
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
            Carrinhos abandonados
          </h1>
          <p className="mt-4 text-sm text-red-500">{erro}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Botão voltar só no mobile, igual outras telas */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="mb-2 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ← Voltar
          </button>
        </div>

        {/* Cabeçalho */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Carrinhos abandonados
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Visualize carrinhos não concluídos e envie lembretes para
              recuperação.
            </p>
          </div>

          <div className="inline-flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              Total de carrinhos:
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                {total}
              </span>
            </div>
            <div>
              Não recuperados:{" "}
              <span className="font-semibold text-emerald-500">
                {apenasNaoRecuperados.length}
              </span>
            </div>
          </div>
        </header>

        {/* Lista / tabela */}
        {carrinhos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Nenhum carrinho abandonado encontrado.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Desktop */}
            <div className="hidden min-w-full divide-y divide-gray-200 text-sm text-gray-700 sm:table dark:divide-gray-800 dark:text-gray-200">
              <div className="table-header-group bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/70 dark:text-gray-400">
                <div className="table-row">
                  <div className="table-cell px-4 py-3">Cliente</div>
                  <div className="table-cell px-4 py-3">Itens</div>
                  <div className="table-cell px-4 py-3">Data do abandono</div>
                  <div className="table-cell px-4 py-3 text-right">
                    Total / Ações
                  </div>
                </div>
              </div>

              <div className="table-row-group divide-y divide-gray-200 dark:divide-gray-800">
                {carrinhos.map((carrinho) => {
                  const linkWpp = whatsappLink(
                    carrinho.telefone,
                    carrinho.nome
                  );

                  return (
                    <div
                      key={carrinho.id}
                      className="table-row hover:bg-gray-50/60 dark:hover:bg-gray-800/60"
                    >
                      {/* Cliente */}
                      <div className="table-cell px-4 py-4 align-top">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {carrinho.nome}
                        </div>
                        {carrinho.email && (
                          <div className="mt-1 text-xs">
                            <a
                              href={`mailto:${carrinho.email}?subject=${encodeURIComponent(
                                "Você esqueceu produtos no carrinho"
                              )}`}
                              className="text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                              {carrinho.email}
                            </a>
                          </div>
                        )}
                        {carrinho.telefone && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Tel: {carrinho.telefone}
                          </div>
                        )}
                        {carrinho.recuperado && (
                          <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                            Carrinho recuperado
                          </div>
                        )}
                      </div>

                      {/* Itens */}
                      <div className="table-cell px-4 py-4 align-top">
                        <div className="text-xs text-gray-700 dark:text-gray-200">
                          {resumoItens(carrinho.itens)}
                        </div>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {carrinho.itens.slice(0, 3).map((item, idx) => (
                            <li key={idx}>
                              {item.quantidade}x {item.produto}
                            </li>
                          ))}
                          {carrinho.itens.length > 3 && (
                            <li className="text-[11px] text-gray-400">
                              + {carrinho.itens.length - 3} produto(s)
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Data */}
                      <div className="table-cell px-4 py-4 align-top text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(carrinho.criado_em)}
                      </div>

                      {/* Total / Ações */}
                      <div className="table-cell px-4 py-4 align-top text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                          {money(carrinho.total_estimado)}
                        </div>

                        <div className="mt-3 flex flex-col items-end gap-2">
                          <CustomButton
                            label="Enviar lembrete WhatsApp"
                            onClick={() =>
                              handleNotificar(carrinho.id, "whatsapp")
                            }
                            variant="primary"
                            size="small"
                            isLoading={notificandoId === carrinho.id}
                            className="text-xs"
                          />

                          {linkWpp && (
                            <a
                              href={linkWpp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-600 hover:underline dark:text-emerald-300"
                            >
                              Abrir conversa no WhatsApp
                            </a>
                          )}

                          <CustomButton
                            label="Enviar e-mail de recuperação"
                            onClick={() =>
                              handleNotificar(carrinho.id, "email")
                            }
                            variant="secondary"
                            size="small"
                            isLoading={notificandoId === carrinho.id}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile – cards */}
            <div className="divide-y divide-gray-200 sm:hidden dark:divide-gray-800">
              {carrinhos.map((carrinho) => {
                const linkWpp = whatsappLink(
                  carrinho.telefone,
                  carrinho.nome
                );

                return (
                  <div
                    key={carrinho.id}
                    className="space-y-3 p-4 hover:bg-gray-50/60 dark:hover:bg-gray-900/40"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-50">
                          {carrinho.nome}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDate(carrinho.criado_em)}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-gray-900 dark:text-gray-50">
                          {money(carrinho.total_estimado)}
                        </p>
                        {carrinho.recuperado && (
                          <span className="mt-1 inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                            Recuperado
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {resumoItens(carrinho.itens)}
                    </p>

                    {(carrinho.email || carrinho.telefone) && (
                      <div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                        {carrinho.email && (
                          <a
                            href={`mailto:${carrinho.email}?subject=${encodeURIComponent(
                              "Você esqueceu produtos no carrinho"
                            )}`}
                            className="block truncate text-emerald-500 hover:underline dark:text-emerald-300"
                          >
                            {carrinho.email}
                          </a>
                        )}
                        {carrinho.telefone && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span>Tel: {carrinho.telefone}</span>
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
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-1">
                      <CustomButton
                        label="Enviar lembrete WhatsApp"
                        onClick={() =>
                          handleNotificar(carrinho.id, "whatsapp")
                        }
                        variant="primary"
                        size="small"
                        isLoading={notificandoId === carrinho.id}
                      />
                      <CustomButton
                        label="Enviar e-mail de recuperação"
                        onClick={() =>
                          handleNotificar(carrinho.id, "email")
                        }
                        variant="secondary"
                        size="small"
                        isLoading={notificandoId === carrinho.id}
                      />
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
