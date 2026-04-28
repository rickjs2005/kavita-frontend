"use client";

// src/app/painel/produtor/meus-dados/MeusDadosClient.tsx
//
// Painel "Meus Dados" — operacionaliza os direitos do titular no
// art. 18 da LGPD para o produtor autenticado. Tema claro (mesmo
// padrão de /painel/produtor/contratos).

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { API_BASE } from "@/utils/absUrl";
import { useMyPrivacyData } from "@/hooks/useMyPrivacyData";
import type {
  PrivacyRequestStatus,
  PrivacyRequestType,
} from "@/types/privacy";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

const STATUS_LABEL: Record<PrivacyRequestStatus, string> = {
  pending: "Pendente",
  processing: "Em análise",
  completed: "Concluído",
  rejected: "Cancelado",
  retained: "Parcialmente retido (obrigação legal)",
};
const TYPE_LABEL: Record<PrivacyRequestType, string> = {
  export: "Exportação de dados",
  delete: "Exclusão de conta",
};

export default function MeusDadosClient() {
  const { data, loading, error, refetch } = useMyPrivacyData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleExport() {
    // Endpoint devolve arquivo JSON com Content-Disposition; forçamos
    // download direto em nova aba — o navegador cuida do save dialog.
    try {
      // Primeiro pega CSRF — apiClient já faz. Para GET que baixa
      // arquivo, o window.open é mais simples e preserva cookies.
      window.open(
        `${API_BASE}/api/produtor/privacidade/exportar`,
        "_blank",
        "noopener",
      );
      toast.success("Download iniciado.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao exportar.").message);
    }
  }

  async function handleDelete() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post("/api/produtor/privacidade/solicitar-exclusao", {
        motivo: motivo.trim() || null,
      });
      toast.success(
        "Pedido de exclusão registrado. Você tem 30 dias para cancelar caso se arrependa.",
      );
      setConfirmDelete(false);
      setMotivo("");
      void refetch();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao solicitar exclusão.").message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelDelete() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post("/api/produtor/privacidade/cancelar-exclusao", {});
      toast.success("Exclusão cancelada. Sua conta continua ativa.");
      void refetch();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao cancelar.").message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-16 pt-8 md:px-6 md:pt-10">
      <nav className="mb-4 text-xs text-stone-500">
        <Link href="/painel/produtor" className="hover:text-amber-700">
          ← Voltar ao painel
        </Link>
      </nav>
      <header className="mb-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">
          Meus dados
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
          Privacidade e direitos
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Aqui você vê tudo o que o Kavita guarda sobre você, baixa uma cópia
          completa em JSON e pede a exclusão da sua conta quando quiser.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-stone-500">Carregando seus dados…</p>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Alerta de exclusão agendada */}
          {data.exclusao_agendada && (
            <section className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <h2 className="text-base font-semibold text-amber-900">
                Sua conta será removida em{" "}
                {data.exclusao_agendada.dias_restantes ?? 30} dias
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                Pedido registrado em{" "}
                {fmtDate(data.exclusao_agendada.requested_at)} · anonimização
                agendada para{" "}
                <strong>
                  {fmtDate(data.exclusao_agendada.scheduled_purge_at)}
                </strong>
                .
              </p>
              <p className="mt-2 text-xs text-amber-700">
                Você pode cancelar a qualquer momento dentro da janela.
              </p>
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={submitting}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100 disabled:opacity-50"
              >
                Cancelar exclusão
              </button>
            </section>
          )}

          {/* Dados da conta */}
          <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 p-5 md:p-6">
            <h2 className="text-base font-semibold text-stone-900">
              Dados da conta
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  E-mail
                </dt>
                <dd className="mt-0.5 text-stone-900">{data.conta.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  Nome
                </dt>
                <dd className="mt-0.5 text-stone-900">
                  {data.conta.nome ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  Cidade
                </dt>
                <dd className="mt-0.5 text-stone-900">
                  {data.conta.cidade ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  Telefone
                </dt>
                <dd className="mt-0.5 text-stone-900">
                  {data.conta.telefone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  Conta criada em
                </dt>
                <dd className="mt-0.5 text-stone-900">
                  {fmtDate(data.conta.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-stone-500">
                  Último acesso
                </dt>
                <dd className="mt-0.5 text-stone-900">
                  {fmtDate(data.conta.last_login_at)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-stone-500">
              Para editar essas informações, vá em{" "}
              <Link
                href="/painel/produtor/perfil"
                className="text-amber-700 hover:underline"
              >
                Perfil
              </Link>
              .
            </p>
          </section>

          {/* Resumo de tratamentos */}
          <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 p-5 md:p-6">
            <h2 className="text-base font-semibold text-stone-900">
              O que o Kavita trata sobre você
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              <li>
                <strong>{data.resumo_tratamentos.leads_enviados}</strong> lead
                (s) enviado(s) a corretoras
              </li>
              <li>
                <strong>{data.resumo_tratamentos.contratos_vinculados}</strong>{" "}
                contrato(s) em que você é parte{" "}
                <span className="text-stone-500">
                  ({data.resumo_tratamentos.contratos_assinados} assinados)
                </span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-stone-500">
              Uma cópia detalhada de todos esses registros está disponível no
              botão <strong>&quot;Baixar meus dados&quot;</strong> abaixo.
            </p>
          </section>

          {/* Ações de direito */}
          <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 p-5 md:p-6">
            <h2 className="text-base font-semibold text-stone-900">
              Seus direitos
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Você pode, a qualquer momento, exercer os direitos garantidos
              pelo art. 18 da LGPD.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-600/20 hover:from-amber-400 hover:to-amber-500"
              >
                Baixar meus dados (JSON)
              </button>
              {!data.exclusao_agendada && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-300 hover:bg-red-50"
                >
                  Pedir exclusão da conta
                </button>
              )}
            </div>

            <p className="mt-4 text-xs text-stone-500">
              A exportação é imediata e contém apenas seus dados. A exclusão
              tem janela de arrependimento de 30 dias. Alguns dados podem
              ficar retidos por obrigação legal (notas fiscais, auditoria) —
              detalhes em{" "}
              <a
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 hover:underline"
              >
                Política de Privacidade
              </a>
              .
            </p>
          </section>

          {/* Histórico de solicitações */}
          {data.solicitacoes_recentes.length > 0 && (
            <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 p-5 md:p-6">
              <h2 className="text-base font-semibold text-stone-900">
                Solicitações recentes
              </h2>
              <ul className="mt-4 divide-y divide-stone-100 text-sm">
                {data.solicitacoes_recentes.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <div className="font-medium text-stone-900">
                        {TYPE_LABEL[r.request_type]}
                      </div>
                      <div className="text-xs text-stone-500">
                        {fmtDate(r.requested_at)}
                        {r.status_reason && ` · ${r.status_reason}`}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        r.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "retained"
                            ? "bg-amber-100 text-amber-800"
                            : r.status === "rejected"
                              ? "bg-stone-100 text-stone-600"
                              : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="button"
          tabIndex={0}
          aria-label="Fechar diálogo"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting)
              setConfirmDelete(false);
          }}
          onKeyDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !submitting &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              setConfirmDelete(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-stone-900">
              Tem certeza que quer excluir sua conta?
            </h3>
            <div className="mt-3 space-y-2 text-sm text-stone-700">
              <p>Ao confirmar:</p>
              <ul className="list-inside list-disc space-y-1 text-stone-600">
                <li>Sua conta fica bloqueada imediatamente.</li>
                <li>Você tem 30 dias para cancelar caso se arrependa.</li>
                <li>
                  Após esse prazo, seu nome, e-mail e telefone são
                  substituídos por placeholders anônimos.
                </li>
                <li>
                  Contratos assinados e histórico de pedidos permanecem
                  arquivados por obrigação legal, sem vínculo direto ao seu
                  nome.
                </li>
              </ul>
            </div>
            <label className="mt-5 block text-xs font-semibold text-stone-600">
              Quer nos contar o motivo? (opcional)
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                placeholder="Vai nos ajudar a melhorar o serviço."
              />
            </label>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {submitting ? "Registrando…" : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
