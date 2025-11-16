"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";

type Toast = { type: "success" | "error"; message: string };

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
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setToast({
        type: "error",
        message: "Token ausente ou inválido. Verifique o link enviado ao seu e-mail.",
      });
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!password || password.length < 6) {
      setToast({ type: "error", message: "A nova senha deve ter pelo menos 6 caracteres." });
      return;
    }
    if (password !== confirm) {
      setToast({ type: "error", message: "As senhas não conferem." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      await api("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha: password }),
      });

      setToast({ type: "success", message: "Senha redefinida com sucesso! Você já pode fazer login." });
      setPassword("");
      setConfirm("");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setToast({ type: "error", message: err?.message ?? "Falha ao redefinir a senha." });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5500);
    }
  }

  return (
    <main
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/cafe.png')", // mesma imagem do forgot
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
            <label htmlFor="password" className="block text-sm mb-1 text-white/90">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/30 bg-white/20 placeholder-white/60 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#359293]"
            />
          </div>

          <div className="text-left">
            <label htmlFor="confirm" className="block text-sm mb-1 text-white/90">
              Confirmar nova senha
            </label>
            <input
              id="confirm"
              type="password"
              required
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-white/30 bg-white/20 placeholder-white/60 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#359293]"
            />
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
            role="status"
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
      <p className="text-sm opacity-80">Carregando formulário de redefinição...</p>
    </main>
  );
}
