"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import CustomButton from "@/components/buttons/CustomButton";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE = `${BACKEND_BASE}/api/admin/colaboradores`;

type ColaboradorPendente = {
  id: number;
  nome: string;
  cargo: string | null;
  whatsapp: string;
  email?: string | null;
  imagem?: string | null;
  descricao: string | null;
  especialidade_id: number;
  verificado: number | boolean;
  created_at: string;
};

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ColaboradoresPendentesPage() {
  const [items, setItems] = useState<ColaboradorPendente[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  async function carregar() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pending`, {
        headers,
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Erro ao buscar pendentes:", res.status);
        toast.error("Erro ao carregar colaboradores pendentes.");
        setItems([]);
        return;
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar colaboradores pendentes:", err);
      toast.error("Erro de conexão ao carregar colaboradores.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aprovar(id: number) {
    if (!confirm("Confirmar verificação deste profissional?")) return;

    try {
      const res = await fetch(`${API_BASE}/${id}/verify`, {
        method: "PUT",
        headers,
      });

      if (!res.ok) {
        console.error("Erro ao verificar colaborador:", res.status);
        toast.error("Erro ao verificar colaborador.");
        return;
      }

      toast.success("Colaborador aprovado e liberado com sucesso!");
      await carregar();
    } catch (err) {
      console.error("Erro ao verificar colaborador:", err);
      toast.error("Erro interno ao verificar colaborador.");
    }
  }

  async function remover(id: number) {
    if (!confirm("Deseja remover este cadastro pendente?")) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        console.error("Erro ao remover colaborador:", res.status);
        toast.error("Erro ao remover colaborador.");
        return;
      }

      toast.success("Colaborador removido com sucesso.");
      await carregar();
    } catch (err) {
      console.error("Erro ao remover colaborador:", err);
      toast.error("Erro interno ao remover colaborador.");
    }
  }

  return (
    <div className="w-full px-3 py-4 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-5xl lg:max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#359293] sm:text-2xl md:text-3xl">
              Colaboradores pendentes
            </h1>
            <p className="mt-1 max-w-xl text-xs text-gray-300 sm:text-sm">
              Cadastros enviados via <strong>Trabalhe com a Kavita</strong>.
              Aprove ou remova antes de liberar o profissional para aparecer na
              lista de serviços.
            </p>
            {!loading && (
              <p className="mt-1 text-[11px] text-gray-400 sm:text-xs">
                {items.length === 0
                  ? "Nenhum cadastro aguardando análise."
                  : `${items.length} colaborador${
                      items.length > 1 ? "es" : ""
                    } aguardando análise.`}
              </p>
            )}
          </div>

          {/* Botão responsivo: full width no mobile, compacto no desktop */}
          <div className="w-full sm:w-auto">
            <Link href="/admin/servicos">
              <CustomButton
                label="Voltar para serviços"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </Link>
          </div>
        </div>

        {/* Estados */}
        {loading ? (
          <div className="rounded-2xl bg-white/90 p-4 text-sm text-gray-700 shadow-sm sm:text-base">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white/90 p-4 text-sm text-gray-700 shadow-sm sm:text-base">
            Nenhum colaborador pendente no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {items.map((c) => {
              const phoneDigits = c.whatsapp.replace(/\D/g, "");
              const hasPhone = phoneDigits.length >= 10;
              const waLink = hasPhone
                ? `https://wa.me/55${phoneDigits}`
                : undefined;

              const avatarUrl =
                c.imagem && c.imagem.startsWith("http")
                  ? c.imagem
                  : c.imagem
                  ? `${BACKEND_BASE}${c.imagem}`
                  : null;

              return (
                <article
                  key={c.id}
                  className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div className="mb-2 flex flex-1 flex-col">
                    {/* Topo: avatar + dados básicos */}
                    <div className="mb-2 flex items-start gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-emerald-100 ring-1 ring-emerald-200">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={c.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-emerald-900">
                            {getInitials(c.nome)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-gray-900">
                          {c.nome}
                        </h2>
                        {c.cargo && (
                          <p className="text-xs text-gray-600">
                            Cargo: {c.cargo}
                          </p>
                        )}
                        {c.email && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            E-mail:{" "}
                            <a
                              href={`mailto:${c.email}`}
                              className="font-medium text-emerald-700 hover:underline"
                            >
                              {c.email}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contatos / descrição */}
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">
                        WhatsApp:{" "}
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                          >
                            {c.whatsapp}
                            <span aria-hidden>↗</span>
                          </a>
                        ) : (
                          c.whatsapp
                        )}
                      </p>

                      {c.descricao && (
                        <p className="mt-2 whitespace-pre-line text-xs text-gray-700">
                          {c.descricao}
                        </p>
                      )}

                      <p className="mt-2 text-[11px] text-gray-400">
                        Criado em:{" "}
                        {new Date(c.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => aprovar(c.id)}
                      className="flex-1 rounded-full bg-emerald-100 px-3 py-1 text-center text-xs font-semibold text-emerald-800 hover:bg-emerald-200 sm:flex-none sm:px-4"
                    >
                      Aprovar e liberar
                    </button>
                    <button
                      onClick={() => remover(c.id)}
                      className="flex-1 rounded-full bg-red-100 px-3 py-1 text-center text-xs font-semibold text-red-800 hover:bg-red-200 sm:flex-none sm:px-4"
                    >
                      Remover
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
