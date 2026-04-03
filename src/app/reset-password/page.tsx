"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";

type Toast = { type: "success" | "error"; message: string };

function validatePassword(value: string): string | null {
  if (!value) return "Informe a nova senha.";
  if (value.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  return null;
}

function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "Confirme a nova senha.";
  if (confirm !== password) return "As senhas não conferem.";
  return null;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setToast({
        type: "error",
        message:
          "Token ausente ou inválido. Verifique o link enviado ao seu e-mail.",
      });
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const pwErr = validatePassword(password);
    const cfErr = validateConfirm(password, confirm);
    setPasswordError(pwErr);
    setConfirmError(cfErr);
    if (pwErr || cfErr) return;

    setLoading(true);
    setToast(null);

    try {
      await apiClient.post("/api/users/reset-password", { token, novaSenha: password });

      setToast({
        type: "success",
        message: "Senha redefinida com sucesso! Você já pode fazer login.",
      });
      setPassword("");
      setConfirm("");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err?.message ?? "Falha ao redefinir a senha.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5500);
    }
  }

  return (
    <main
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/cafe.png')",
      }}
    >
      {/* camada escura por cima da imagem */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-xl text-center text-white p-8">
        <div className="absolute left-4 top-4">
          <CloseButton className="text-white/70 hover:text-white" />
        </div>

        {/* ícone de chave */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-white"
            fill="currentColor"
          >
            <path d="M17 8V6a5 5 0 1 0-10 0v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1Zm-8 0V6a3 3 0 1 1 6 0v2H9Zm3 4a1.5 1.5 0 0 1 .75 2.8V18a.75.75 0 1 1-1.5 0v-2.2A1.5 1.5 0 0 1 12 13Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Redefinir senha</h1>
        <p className="text-sm text-white/80 mb-6">
          Digite sua nova senha para concluir a redefinição.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="text-left">
            <label
              htmlFor="reset-password"
              className="block text-sm mb-1 text-white/90"
            >
              Nova senha
            </label>
            <input
              id="reset-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(validatePassword(e.target.value));
                // re-validate confirm when password changes
                if (confirmError) setConfirmError(validateConfirm(e.target.value, confirm));
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "reset-password-error" : undefined}
              className={`w-full rounded-md border bg-white/20 placeholder-white/60 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#359293] transition ${passwordError ? "border-red-400" : "border-white/30"}`}
            />
            {passwordError && (
              <p id="reset-password-error" role="alert" className="mt-1 text-xs text-red-300">
                {passwordError}
              </p>
            )}
          </div>

          <div className="text-left">
            <label
              htmlFor="reset-confirm"
              className="block text-sm mb-1 text-white/90"
            >
              Confirmar nova senha
            </label>
            <input
              id="reset-confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (confirmError) setConfirmError(validateConfirm(password, e.target.value));
              }}
              onBlur={() => setConfirmError(validateConfirm(password, confirm))}
              aria-invalid={confirmError ? true : undefined}
              aria-describedby={confirmError ? "reset-confirm-error" : undefined}
              className={`w-full rounded-md border bg-white/20 placeholder-white/60 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#359293] transition ${confirmError ? "border-red-400" : "border-white/30"}`}
            />
            {confirmError && (
              <p id="reset-confirm-error" role="alert" className="mt-1 text-xs text-red-300">
                {confirmError}
              </p>
            )}
          </div>

          <CustomButton
            label={loading ? "Salvando..." : "Redefinir senha"}
            variant="primary"
            size="large"
            isLoading={loading}
            type="submit"
            className="w-full"
          />
        </form>

        {toast && (
          <div
            className={`mt-5 rounded-lg px-4 py-3 text-sm ${
              toast.type === "success"
                ? "bg-green-500/20 text-green-100"
                : "bg-red-500/20 text-red-100"
            }`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            {toast.message}
          </div>
        )}
      </section>
    </main>
  );
}

function ResetPasswordFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <p className="text-sm opacity-80">
        Carregando formulário de redefinição...
      </p>
    </main>
  );
}
