"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// helper: formata CPF enquanto o usuário digita
function formatCpfMask(value: string): string {
  // tira tudo que não é número e limita em 11 dígitos
  let digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;

  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  }

  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  }

  return digits.replace(
    /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
    "$1.$2.$3-$4"
  );
}

// CPF: exige 11 dígitos numéricos (com ou sem pontos/traço)
const schema = z
  .object({
    nome: z.string().min(2, "Informe seu nome"),
    email: z.string().email("Email inválido"),
    cpf: z
      .string()
      .min(11, "Informe seu CPF")
      .refine(
        (value) => value.replace(/\D/g, "").length === 11,
        "CPF deve ter 11 dígitos"
      ),
    senha: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmSenha: z.string().min(6),
  })
  .refine((v) => v.senha === v.confirmSenha, {
    path: ["confirmSenha"],
    message: "As senhas não conferem",
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, login } = useAuth();
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerMsg(null);

    // 1) cadastra (agora envia CPF também)
    const { ok, message } = await registerUser({
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      cpf: data.cpf,
    });

    if (!ok) {
      setServerMsg(message || "Erro no cadastro.");
      return;
    }

    // 2) auto-login e 3) vai direto para a Home
    const r = await login(data.email, data.senha);
    if (!r.ok) {
      router.push("/");
      return;
    }

    reset();
    router.push("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#083E46] via-[#0f5e63] to-[#359293]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(#ffffff33 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-xl">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Cadastro
              </h1>
              <p className="mt-2 text-white/80 text-sm">
                Crie sua conta para acompanhar pedidos e ofertas.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-8 grid grid-cols-1 gap-5"
            >
              {serverMsg && (
                <div className="text-center text-sm px-3 py-2 rounded-md bg-white/20 text-white">
                  {serverMsg}
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Nome
                </label>
                <input
                  {...register("nome")}
                  placeholder="Seu nome"
                  className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-[#EC5B20] transition"
                />
                {errors.nome && (
                  <p className="mt-1 text-xs text-red-200">
                    {errors.nome.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="seu@email.com"
                  className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-[#EC5B20] transition"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-200">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  CPF
                </label>
                <input
                  {...register("cpf", {
                    onChange: (e) => {
                      const formatado = formatCpfMask(e.target.value);
                      setValue("cpf", formatado, { shouldValidate: true });
                    },
                  })}
                  placeholder="111.111.111-11"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14} // 000.000.000-00
                  className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-[#EC5B20] transition"
                />
                {errors.cpf && (
                  <p className="mt-1 text-xs text-red-200">
                    {errors.cpf.message}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    {...register("senha")}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 pr-11 outline-none ring-2 ring-transparent focus:ring-[#EC5B20] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-[#0f5e63] hover:text-[#EC5B20]"
                    aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                    title={showPw ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.senha && (
                  <p className="mt-1 text-xs text-red-200">
                    {errors.senha.message}
                  </p>
                )}
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    type={showPw2 ? "text" : "password"}
                    {...register("confirmSenha")}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 pr-11 outline-none ring-2 ring-transparent focus:ring-[#EC5B20] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-[#0f5e63] hover:text-[#EC5B20]"
                    aria-label={showPw2 ? "Ocultar senha" : "Mostrar senha"}
                    title={showPw2 ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPw2 ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.confirmSenha && (
                  <p className="mt-1 text-xs text-red-200">
                    {errors.confirmSenha.message}
                  </p>
                )}
              </div>

              <button
                disabled={isSubmitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#359293] hover:bg-[#2e7f81] active:bg-[#2a7476] text-white font-semibold py-3 shadow-lg transition"
              >
                {isSubmitting ? "Cadastrando…" : "Cadastrar"}
              </button>

              <p className="text-center text-white/90 text-sm">
                Já tem conta?{" "}
                <Link
                  className="underline text-[#EC5B20] hover:text-white transition"
                  href="/login"
                >
                  Entrar
                </Link>
              </p>
            </form>
          </div>

          <p className="mt-4 text-center text-white/60 text-xs">
            Ao continuar, você concorda com nossos Termos e Política de
            Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
