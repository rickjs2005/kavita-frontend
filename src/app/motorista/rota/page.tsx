"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import {
  type RotaCompleta,
  parseEnderecoPedido,
  formatEnderecoOneLine,
} from "@/lib/rotas/types";
import {
  cacheRota,
  readCachedRota,
  executeWithOffline,
} from "@/lib/rotas/offline";
import OfflineBanner from "../_components/OfflineBanner";
import { ParadaStatusBadge, RotaStatusBadge } from "@/app/admin/rotas/_components/StatusBadge";

export default function MotoristaRotaPage() {
  const router = useRouter();
  const [rota, setRota] = useState<RotaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  /**
   * Normaliza shape da rota.
   *
   * 2 casos a tratar:
   *
   *   (a) Backend retorna response.ok(res, null, "Sem rota para hoje.")
   *       → envelope no wire vira { ok: true, message: "..." } SEM data.
   *       apiClient nao desempacota (falta campo "data") e devolve o
   *       envelope inteiro. Sem o id detectamos esse caso e retornamos
   *       null — frontend renderiza "Sem rota para hoje".
   *
   *   (b) Cache antigo do localStorage de versao anterior do app pode
   *       nao ter paradas:[]. Garantimos array sempre pra .map nao
   *       explodir.
   */
  function _normalizeRota(raw: unknown): RotaCompleta | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Partial<RotaCompleta>;
    // Sem id valido = nao e' uma rota real (provavelmente envelope sem data)
    if (typeof r.id !== "number") return null;
    return {
      ...(r as RotaCompleta),
      paradas: Array.isArray(r.paradas) ? r.paradas : [],
    };
  }

  async function load() {
    try {
      const data = await apiClient.get<RotaCompleta | null>(
        "/api/motorista/rota-hoje",
      );
      const normalized = _normalizeRota(data);
      setRota(normalized);
      if (normalized) cacheRota(normalized);
    } catch (err) {
      // Sessao invalida/ausente -> SEMPRE redirecionar pra login.
      // Cobre 401, 403 e AUTH_ERROR sem deixar quebrar a pagina inteira.
      if (
        err instanceof ApiError &&
        (err.status === 401 ||
          err.status === 403 ||
          err.code === "AUTH_ERROR" ||
          err.code === "UNAUTHORIZED")
      ) {
        router.replace("/motorista/login");
        return;
      }
      // Tenta cache local em caso de offline (normaliza tambem, cache
      // pode ter sido salvo por versao antiga do app)
      const cached = _normalizeRota(readCachedRota());
      if (cached) {
        setRota(cached);
        toast("Mostrando dados salvos. Sem conexão.");
      } else {
        toast.error(formatApiError(err, "Falha ao carregar rota.").message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciarRota() {
    if (!rota) return;
    setActing(true);
    try {
      const r = await executeWithOffline<RotaCompleta>({
        endpoint: `/api/motorista/rotas/${rota.id}/iniciar`,
        method: "POST",
        label: `Iniciar rota #${rota.id}`,
      });
      if (r.enqueued) {
        toast("Sem conexão — ação na fila.");
      } else {
        toast.success("Rota iniciada.");
      }
      load();
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao iniciar.").message);
    } finally {
      setActing(false);
    }
  }

  async function finalizarRota() {
    if (!rota) return;
    if (!window.confirm("Finalizar rota? Confira se todas as paradas estão tratadas.")) return;
    const kmInput = window.prompt("Quilômetros rodados (opcional):", "");
    const km_real = kmInput && !Number.isNaN(Number(kmInput)) ? Number(kmInput) : null;

    setActing(true);
    try {
      const r = await executeWithOffline<RotaCompleta>({
        endpoint: `/api/motorista/rotas/${rota.id}/finalizar`,
        method: "POST",
        payload: { km_real },
        label: `Finalizar rota #${rota.id}`,
      });
      if (r.enqueued) {
        toast("Sem conexão — finalização na fila.");
      } else {
        toast.success("Rota finalizada.");
      }
      load();
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao finalizar.").message);
    } finally {
      setActing(false);
    }
  }

  return (
    <main className="min-h-screen pb-20">
      <OfflineBanner />

      <header className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Kavita · Entregas
          </p>
          {rota && <RotaStatusBadge status={rota.status} />}
        </div>
        <button
          onClick={async () => {
            try {
              await apiClient.post("/api/public/motorista/logout", {});
            } catch {
              // ignora
            }
            router.replace("/motorista/login");
          }}
          className="text-[11px] text-stone-400 hover:text-stone-200"
        >
          Sair
        </button>
      </header>

      {loading ? (
        <p className="px-4 py-8 text-stone-400 text-sm text-center">
          Carregando…
        </p>
      ) : !rota ? (
        <div className="px-4 py-12 text-center">
          <h1 className="text-xl font-semibold">Sem rota para hoje</h1>
          <p className="mt-2 text-sm text-stone-400">
            Quando o admin atribuir uma rota a você, ela aparece aqui.
          </p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          <section>
            <h1 className="text-lg font-semibold">
              Rota de {rota.data_programada}
            </h1>
            <p className="text-sm text-stone-400">
              {rota.regiao_label || "—"}
              {rota.veiculo ? ` · ${rota.veiculo}` : ""}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              {rota.total_entregues}/{rota.total_paradas} entregas
            </p>
          </section>

          {rota.status === "pronta" && (
            <button
              onClick={iniciarRota}
              disabled={acting}
              className="w-full py-4 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 font-bold uppercase tracking-wider text-sm shadow-lg shadow-amber-500/20"
            >
              ▶ Iniciar rota
            </button>
          )}

          {rota.status === "em_rota" && rota.total_entregues >= rota.total_paradas && (
            <button
              onClick={finalizarRota}
              disabled={acting}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-stone-950 font-bold uppercase tracking-wider text-sm shadow-lg"
            >
              ✓ Finalizar rota
            </button>
          )}

          {rota.status === "em_rota" && rota.total_entregues < rota.total_paradas && (
            <button
              onClick={finalizarRota}
              disabled={acting}
              className="w-full py-3 rounded-2xl border border-emerald-500/40 text-emerald-300 text-sm"
            >
              Finalizar rota mesmo com pendências
            </button>
          )}

          {rota.status === "finalizada" && (
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 px-4 py-3 text-sm text-blue-300">
              Rota finalizada{rota.tempo_total_minutos != null
                ? ` em ${Math.floor(rota.tempo_total_minutos / 60)}h${String(
                    rota.tempo_total_minutos % 60,
                  ).padStart(2, "0")}`
                : ""}
              {rota.km_real ? ` · ${rota.km_real} km` : ""}
            </div>
          )}

          <section className="space-y-2">
            {(() => {
              const paradas = Array.isArray(rota.paradas) ? rota.paradas : [];
              if (paradas.length === 0) {
                return (
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-center text-sm text-stone-400">
                    Esta rota ainda não tem paradas.
                  </div>
                );
              }
              return paradas.map((p) => {
                const endereco = parseEnderecoPedido(p.pedido_endereco);
                return (
                  <Link
                    key={p.id}
                    href={`/motorista/parada/${p.id}`}
                    className="block rounded-2xl bg-white/[0.04] border border-white/10 p-3 hover:bg-white/[0.08] transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-400/20 text-amber-200 flex items-center justify-center font-bold text-sm">
                        {p.ordem}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-stone-50 font-semibold text-sm truncate">
                            {p.usuario_nome || "Sem nome"}
                          </span>
                          <ParadaStatusBadge status={p.status} />
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5 truncate">
                          {formatEnderecoOneLine(endereco)}
                        </p>
                        {p.pedido_observacao_entrega && (
                          <p className="text-[11px] text-amber-300 italic mt-0.5 truncate">
                            “{p.pedido_observacao_entrega}”
                          </p>
                        )}
                      </div>
                      <div className="text-stone-500 text-2xl shrink-0">›</div>
                    </div>
                  </Link>
                );
              });
            })()}
          </section>
        </div>
      )}
    </main>
  );
}
