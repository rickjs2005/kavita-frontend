"use client";

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Motorista, MagicLinkResult } from "@/lib/rotas/types";
import { formatDateTime } from "@/utils/formatters";
import MotoristaFormModal from "./_components/MotoristaFormModal";

export default function AdminMotoristasPage() {
  const [list, setList] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Motorista | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Magic link gerado por motorista (estado local)
  const [linkByMotorista, setLinkByMotorista] = useState<
    Record<number, MagicLinkResult | null>
  >({});

  async function reload() {
    setLoading(true);
    try {
      const data = await apiClient.get<Motorista[]>("/api/admin/motoristas");
      setList(data ?? []);
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao carregar motoristas.").message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    let r = list;
    if (!showInactive) r = r.filter((m) => m.ativo === 1);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (m) =>
          m.nome.toLowerCase().includes(q) ||
          m.telefone.includes(q.replace(/\D/g, "")) ||
          (m.email ?? "").toLowerCase().includes(q),
      );
    }
    return r;
  }, [list, search, showInactive]);

  async function toggleAtivo(m: Motorista) {
    try {
      const updated = await apiClient.patch<Motorista>(
        `/api/admin/motoristas/${m.id}/ativo`,
        { ativo: m.ativo === 1 ? false : true },
      );
      setList((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
      toast.success(updated.ativo === 1 ? "Motorista ativado." : "Motorista desativado.");
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao alternar status.").message);
    }
  }

  async function gerarLink(m: Motorista) {
    try {
      const result = await apiClient.post<MagicLinkResult>(
        `/api/admin/motoristas/${m.id}/enviar-link`,
        {},
      );
      setLinkByMotorista((prev) => ({ ...prev, [m.id]: result }));
      const wppStatus = result.whatsapp?.status;
      if (wppStatus === "manual_pending" && result.whatsapp.url) {
        toast.success("Link gerado — abra o WhatsApp ou copie manualmente.");
      } else if (wppStatus === "sent") {
        toast.success("Link enviado ao motorista por WhatsApp.");
      } else {
        toast.success("Link gerado — copie manualmente.");
      }
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao gerar link.").message);
    }
  }

  async function copyLink(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState message="Carregando motoristas…" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-primary">
            Motoristas
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {filtered.length} de {list.length} cadastrados
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm"
        >
          + Novo motorista
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg bg-dark-900 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inativos
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Nenhum motorista encontrado." />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const link = linkByMotorista[m.id];
            return (
              <div
                key={m.id}
                className={`rounded-xl bg-dark-800 ring-1 ring-white/10 p-4 ${
                  m.ativo === 0 ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold truncate">
                        {m.nome}
                      </h3>
                      {m.ativo === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 uppercase tracking-wide">
                          inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      📞 {m.telefone}
                      {m.email ? ` · ✉️ ${m.email}` : ""}
                    </p>
                    {m.veiculo_padrao && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        🚗 {m.veiculo_padrao}
                      </p>
                    )}
                    {m.ultimo_login_em && (
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Último acesso: {formatDateTime(m.ultimo_login_em)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setModalOpen(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleAtivo(m)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
                    >
                      {m.ativo === 1 ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => gerarLink(m)}
                      disabled={m.ativo === 0}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                    >
                      📲 Enviar link WhatsApp
                    </button>
                  </div>
                </div>

                {link?.link && (
                  <div className="mt-3 rounded-lg bg-dark-900 border border-white/10 p-3 space-y-2">
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">
                      Link gerado · expira em 15 minutos
                    </div>
                    <div className="text-xs text-gray-300 font-mono break-all">
                      {link.link}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyLink(link.link!)}
                        className="text-xs px-3 py-1 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
                      >
                        📋 Copiar link
                      </button>
                      {link.whatsapp.url && (
                        <a
                          href={link.whatsapp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white"
                        >
                          Abrir no WhatsApp
                        </a>
                      )}
                    </div>
                    {link.whatsapp.erro && (
                      <p className="text-[11px] text-amber-400">
                        WhatsApp: {link.whatsapp.erro}. Use o link manual.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <MotoristaFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => reload()}
      />
    </div>
  );
}
