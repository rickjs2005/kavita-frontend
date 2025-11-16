"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";

type Toast = { type: "success" | "error"; message: string };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setToast({ type: "error", message: "Informe um e-mail válido." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      await api("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setToast({
        type: "success",
        message:
          "Se este e-mail existir em nossa base, você receberá um link para redefinir a senha.",
      });
      setEmail("");
    } catch (err: any) {
      setToast({
        type: "error",
        message:
          err?.message ?? "Não foi possível enviar o e-mail de recuperação.",
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

        {/* ícone de cadeado */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-white"
            fill="currentColor"
          >
            <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 0 1 6 0v3H9Zm3 4a1.5 1.5 0 0 1 .75 2.8V18a.75.75 0 1 1-1.5 0v-2.2A1.5 1.5 0 0 1 12 13Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Esqueci minha senha</h1>
        <p className="text-sm text-white/80 mb-6">
          Informe seu e-mail para enviarmos um link de redefinição.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="text-left">
            <label htmlFor="email" className="block text-sm mb-1 text-white/90">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-md border border-white/30 bg-white/20 placeholder-white/60 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#359293]"
            />
          </div>

          <CustomButton
            label={loading ? "Enviando..." : "Enviar link de redefinição"}
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
