"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onBlur" });

  const onSubmit = async (data: FormData) => {
    setServerMsg(null);

    try {
      const r = await login(data.email, data.senha);

      if (!r.ok) {
        // Consistência: SEMPRE a mesma frase
        setServerMsg("Credenciais inválidas.");
        // Opcional: marcar campos como inválidos sem mensagem técnica
        setError("email", { message: undefined });
        setError("senha", { message: undefined });
        return; // fica na tela de login
      }

      router.push("/");
    } catch {
      // Blindagem final: nunca deixar erro estourar overlay
      setServerMsg("Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm"
        style={{ backgroundImage: "url('/images/cafe.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20">
        <div className="px-8 pt-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Login
          </h1>
          <p className="mt-2 text-white/80 text-sm">
            Entre para acompanhar pedidos e ofertas.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 grid gap-5">
          {/* Aviso de erro do servidor */}
          {serverMsg && (
            <div
              className="text-center text-sm px-3 py-2 rounded-md bg-red-500/20 text-red-100"
              role="alert"
              aria-live="assertive"
            >
              {serverMsg}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-white/90 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              {...register("email")}
              placeholder="seu@email.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 transition ${errors.email ? "ring-red-400" : "ring-transparent focus:ring-accent"}`}
              autoComplete="email"
            />
            {errors.email && (
              <p id="login-email-error" role="alert" className="mt-1 text-xs text-red-200">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="login-senha" className="block text-sm font-medium text-white/90 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-senha"
                type={showPw ? "text" : "password"}
                {...register("senha")}
                placeholder="••••••••"
                aria-invalid={errors.senha ? true : undefined}
                aria-describedby={errors.senha ? "login-senha-error" : undefined}
                className={`w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 pr-11 outline-none ring-2 transition ${errors.senha ? "ring-red-400" : "ring-transparent focus:ring-accent"}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-teal-dark hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                title={showPw ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.senha && (
              <p id="login-senha-error" role="alert" className="mt-1 text-xs text-red-200">
                {errors.senha.message}
              </p>
            )}
          </div>

          {/* Botão */}
          <button
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-white font-semibold py-3 shadow-lg transition"
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>

          {/* Links */}
          <p className="text-center text-white/90 text-sm">
            Esqueceu a senha?{" "}
            <Link
              href="/forgot-password"
              className="underline text-accent hover:text-white transition"
            >
              Recuperar
            </Link>
          </p>
          <p className="text-center text-white/90 text-sm">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="underline text-accent hover:text-white transition"
            >
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
