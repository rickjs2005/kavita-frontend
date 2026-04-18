"use client";

// src/app/painel/corretora/perfil/seguranca/SegurancaClient.tsx
//
// ETAPA 2.4 — página de segurança do usuário logado:
//   1. Estado do 2FA (habilitado / pendente / desativado)
//   2. Setup: QR code + confirmar código + mostrar backup codes 1x
//   3. Desativar 2FA (exige senha atual)
//   4. Regenerar backup codes
//   5. Informações da última sessão + "Sair de todos os dispositivos"

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type TwoFaStatus = {
  enabled: boolean;
  enabled_at: string | null;
  has_pending_setup: boolean;
  unused_backup_codes: number;
  last_login_ip: string | null;
  last_login_at: string | null;
};

function formatDate(iso: string | null) {
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

export default function SegurancaClient() {
  const [status, setStatus] = useState<TwoFaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<TwoFaStatus>("/api/corretora/2fa");
      setStatus(res);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar segurança.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
          Segurança da conta
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
          Autenticação em dois fatores
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Exigido para planos pagos — protege sua conta mesmo que a senha
          vaze. Leva 2 minutos pra configurar.
        </p>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl border border-white/[0.06] bg-stone-900/50" />
      ) : !status ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          Não foi possível carregar o status de segurança.
        </div>
      ) : (
        <>
          {status.enabled ? (
            <EnabledBlock status={status} onChanged={load} />
          ) : (
            <SetupBlock hasPendingSetup={status.has_pending_setup} onDone={load} />
          )}

          <SessionBlock status={status} onDone={load} />
        </>
      )}

      <div className="text-center">
        <Link
          href="/painel/corretora/perfil"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/70 hover:text-amber-200"
        >
          ← Voltar ao perfil
        </Link>
      </div>
    </div>
  );
}

// ─── Bloco quando 2FA JÁ está ativo ──────────────────────────────────

function EnabledBlock({
  status,
  onChanged,
}: {
  status: TwoFaStatus;
  onChanged: () => void;
}) {
  const [senha, setSenha] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);

  const doDisable = async () => {
    if (!senha) return;
    setDisabling(true);
    try {
      await apiClient.post("/api/corretora/2fa/disable", { senha });
      toast.success("2FA desativado.");
      setSenha("");
      setShowDisable(false);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao desativar.").message);
    } finally {
      setDisabling(false);
    }
  };

  const regenerate = async () => {
    if (!confirm("Regenerar todos os códigos de backup? Os anteriores ficam inválidos.")) return;
    setRegenerating(true);
    try {
      const res = await apiClient.post<{
        backup_codes: string[];
      }>("/api/corretora/2fa/backup-codes/regenerate");
      setFreshCodes(res.backup_codes);
      toast.success("Códigos regenerados.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao regenerar.").message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <section className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.05] p-5">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            2FA ativo
          </p>
          <p className="mt-1 text-[15px] font-semibold text-stone-50">
            Sua conta pede código do aplicativo no login.
          </p>
          <p className="mt-1 text-[12px] text-stone-400">
            Ativado em {formatDate(status.enabled_at)} ·{" "}
            {status.unused_backup_codes} código(s) de backup disponível(is)
          </p>
        </div>
      </div>

      {freshCodes && (
        <BackupCodesReveal codes={freshCodes} onClose={() => setFreshCodes(null)} />
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={regenerate}
          disabled={regenerating}
          className="inline-flex h-9 items-center rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
        >
          {regenerating ? "..." : "Gerar novos códigos de backup"}
        </button>
        {!showDisable ? (
          <button
            type="button"
            onClick={() => setShowDisable(true)}
            className="inline-flex h-9 items-center rounded-lg border border-rose-400/30 bg-rose-500/5 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-200 transition-colors hover:bg-rose-500/10"
          >
            Desativar 2FA
          </button>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha atual para confirmar"
              className="h-9 flex-1 rounded-lg border border-rose-400/30 bg-stone-900 px-3 text-[13px] text-stone-100 placeholder:text-stone-500 focus:border-rose-400/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={doDisable}
              disabled={disabling || !senha}
              className="inline-flex h-9 items-center rounded-lg bg-rose-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-100 ring-1 ring-rose-400/40 transition-colors hover:bg-rose-500/30 disabled:opacity-50"
            >
              {disabling ? "..." : "Confirmar desativação"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDisable(false);
                setSenha("");
              }}
              className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-stone-400 hover:text-stone-100"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Bloco quando 2FA ainda NÃO está ativo (setup) ───────────────────

function SetupBlock({
  hasPendingSetup,
  onDone,
}: {
  hasPendingSetup: boolean;
  onDone: () => void;
}) {
  const [step, setStep] = useState<"intro" | "qr" | "backup">("intro");
  const [qrData, setQrData] = useState<{ qr_data_url: string; secret: string } | null>(
    null,
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await apiClient.post<{
        qr_data_url: string;
        secret: string;
      }>("/api/corretora/2fa/setup");
      setQrData(res);
      setStep("qr");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao iniciar 2FA.").message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (code.length !== 6) {
      toast.error("Digite os 6 dígitos do aplicativo.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiClient.post<{
        backup_codes: string[];
      }>("/api/corretora/2fa/confirm", { code });
      setBackupCodes(res.backup_codes);
      setStep("backup");
      toast.success("2FA ativado!");
    } catch (err) {
      toast.error(formatApiError(err, "Código inválido.").message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
        2FA desativado
      </p>
      <p className="mt-1 text-[15px] font-semibold text-stone-50">
        Ative em 3 passos. Leva 2 minutos.
      </p>
      <p className="mt-1 text-[12px] text-stone-400">
        Use Google Authenticator, Authy ou 1Password.
        {hasPendingSetup &&
          " Você iniciou um setup anterior que não foi concluído — ao clicar 'Iniciar', um novo segredo substitui o antigo."}
      </p>

      {step === "intro" && (
        <button
          type="button"
          onClick={startSetup}
          disabled={busy}
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
        >
          {busy ? "..." : "Iniciar configuração"}
        </button>
      )}

      {step === "qr" && qrData && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-start">
            <Image
              src={qrData.qr_data_url}
              alt="QR code do 2FA"
              width={180}
              height={180}
              unoptimized
              className="rounded-lg bg-white p-2"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
                Passo 1 · Escaneie o QR
              </p>
              <p className="mt-1 text-[13px] text-stone-300">
                Abra o app autenticador no celular e escaneie. Se não puder
                escanear, digite o segredo manualmente:
              </p>
              <code className="mt-2 block break-all rounded-md border border-white/10 bg-stone-950 p-2 font-mono text-[11px] text-amber-200">
                {qrData.secret}
              </code>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
              Passo 2 · Confirme com o código que o app mostra
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                className="h-11 w-40 rounded-lg border border-white/10 bg-stone-950 px-4 text-center font-mono text-lg tracking-[0.4em] text-stone-100 placeholder:text-stone-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
              />
              <button
                type="button"
                onClick={confirm}
                disabled={busy || code.length !== 6}
                className="inline-flex h-11 items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 disabled:opacity-50"
              >
                {busy ? "..." : "Ativar 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "backup" && backupCodes && (
        <BackupCodesReveal
          codes={backupCodes}
          onClose={() => {
            setBackupCodes(null);
            onDone();
          }}
        />
      )}
    </section>
  );
}

// ─── Códigos de backup (aparecem 1x) ─────────────────────────────────

function BackupCodesReveal({
  codes,
  onClose,
}: {
  codes: string[];
  onClose: () => void;
}) {
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/[0.05] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
        Códigos de backup · guarde AGORA
      </p>
      <p className="mt-1 text-[12px] text-stone-300">
        Cada código funciona 1 vez e só aparece uma única vez. Se você perder
        o celular, use um deles para entrar e configure 2FA novamente.
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-1.5 font-mono text-[13px] text-amber-100 sm:grid-cols-5">
        {codes.map((c) => (
          <li
            key={c}
            className="rounded-md border border-white/10 bg-stone-950 px-2 py-1.5 text-center"
          >
            {c}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold text-stone-200 hover:bg-white/[0.08]"
        >
          Copiar todos
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center rounded-lg bg-amber-500/20 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100 ring-1 ring-amber-400/40 hover:bg-amber-500/30"
        >
          Guardei em local seguro
        </button>
      </div>
    </div>
  );
}

// ─── Sessões / último IP / sair de todos ─────────────────────────────

function SessionBlock({
  status,
  onDone,
}: {
  status: TwoFaStatus;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const logoutAll = async () => {
    if (!confirm("Sair de todos os dispositivos? Você será deslogado aqui também.")) return;
    setBusy(true);
    try {
      await apiClient.post("/api/corretora/logout-all");
      toast.success("Todos os dispositivos foram desconectados. Faça login novamente.");
      // Dispara evento global que o AuthContext escuta pra redirecionar
      window.dispatchEvent(new CustomEvent("auth:expired"));
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao sair.").message);
    } finally {
      setBusy(false);
      onDone();
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-stone-900/60 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
        Última sessão
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Último IP
          </p>
          <p className="mt-1 font-mono text-[13px] text-stone-100">
            {status.last_login_ip ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Última entrada
          </p>
          <p className="mt-1 text-[13px] text-stone-100">
            {formatDate(status.last_login_at)}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <button
          type="button"
          onClick={logoutAll}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
        >
          {busy ? "..." : "Sair de todos os dispositivos"}
        </button>
      </div>
      <p className="mt-3 text-[11px] text-stone-500">
        Usamos JWT sem lista de sessões ativas — &quot;Sair de todos&quot;
        invalida todos os cookies emitidos até agora via{" "}
        <code className="font-mono">token_version</code>. Lista detalhada de
        sessões fica para uma futura versão do session store.
      </p>
    </section>
  );
}
