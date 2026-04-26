"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/context/AuthContext";
import CloseButton from "@/components/buttons/CloseButton";
import LoadingButton from "@/components/buttons/LoadingButton";
import {
  formatCpfMask,
  normalizeEmail,
  onlyDigits,
} from "@/utils/formatters";

/**
 * Segurança (front): não vazar “email já cadastrado” (evita enumeração).
 * Mantém mensagens úteis para validações não sensíveis (ex.: CPF inválido, senha fraca).
 */
function safeServerMessage(raw?: string | null): string | null {
  if (!raw) return null;

  const msg = raw.trim();
  const lowered = msg.toLowerCase();

  // padrões comuns que indicam enumeração de conta
  const looksLikeEmailExists =
    lowered.includes("e-mail já está cadastrado") ||
    lowered.includes("email já está cadastrado") ||
    lowered.includes("já existe") ||
    lowered.includes("já cadastrado");

  if (looksLikeEmailExists) {
    return "Não foi possível concluir o cadastro. Verifique seus dados e tente novamente.";
  }

  return msg;
}

// senha mais forte (mínimo viável)
const passwordSchema = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .regex(/[A-Z]/, "Inclua pelo menos 1 letra maiúscula")
  .regex(/[a-z]/, "Inclua pelo menos 1 letra minúscula")
  .regex(/\d/, "Inclua pelo menos 1 número");

const schema = z
  .object({
    // Honeypot anti-bot (campo invisível no form)
    website: z.string().optional(),

    nome: z
      .string()
      .min(2, "Informe seu nome")
      .transform((v) => v.trim()),
    email: z
      .string()
      .email("Email inválido")
      .transform((v) => normalizeEmail(v)),
    cpf: z
      .string()
      .min(11, "Informe seu CPF")
      .refine(
        (value) => onlyDigits(value).length === 11,
        "CPF deve ter 11 dígitos",
      ),
    senha: passwordSchema,
    confirmSenha: z.string().min(8, "Confirme sua senha"),
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
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      website: "",
    },
  });

  const canSubmit = useMemo(() => {
    // isValid só funciona bem com mode onChange e resolver
    return isValid && !isSubmitting;
  }, [isValid, isSubmitting]);

  const onSubmit = async (data: FormData) => {
    setServerMsg(null);

    // Honeypot anti-bot: se preenchido, “finge sucesso” e não chama API
    if (data.website && data.website.trim().length > 0) {
      reset();
      router.push("/");
      return;
    }

    // Normalizações finais (defensivo)
    const payload = {
      nome: data.nome.trim(),
      email: normalizeEmail(data.email),
      senha: data.senha,
      cpf: onlyDigits(data.cpf), // envia apenas dígitos para evitar divergência no backend
    };

    const { ok, message } = await registerUser(payload);

    if (!ok) {
      setServerMsg(
        safeServerMessage(message) ||
          "Não foi possível concluir o cadastro. Verifique seus dados e tente novamente.",
      );
      return;
    }

    // Auto-login (mantido). Se falhar, vai para login (fluxo mais previsível que jogar pra Home).
    const r = await login(payload.email, payload.senha);
    reset();

    if (!r.ok) {
      router.push("/login");
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-header via-teal-dark to-primary" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8 sm:py-10">
        <div className="w-full max-w-xl">
          <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Botão voltar/fechar */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
              <CloseButton
                className="
                    text-teal-dark
                    bg-white/90
                    hover:bg-white
                    hover:text-accent
                    rounded-full
                    p-2
                    shadow-md
                    text-2xl
                    transition
                  "
              />
            </div>

            <div className="px-5 sm:px-8 pt-8 sm:pt-10 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Cadastro
              </h1>
              <p className="mt-2 text-white/80 text-sm">
                Crie sua conta para acompanhar pedidos e ofertas.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-5 sm:p-8 grid grid-cols-1 gap-5"
            >
              {/* Mensagem do servidor (aria-live para acessibilidade) */}
              {serverMsg && (
                <div
                  className="text-center text-sm px-3 py-2 rounded-md bg-white/20 text-white"
                  role="status"
                  aria-live="polite"
                >
                  {serverMsg}
                </div>
              )}

              {/* Honeypot invisível */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
                {...register("website")}
              />

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Nome
                </label>
                <input
                  {...register("nome")}
                  placeholder="Seu nome"
                  autoComplete="name"
                  className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-accent transition"
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
                  autoComplete="email"
                  inputMode="email"
                  className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-accent transition"
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
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-accent transition"
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
                    autoComplete="new-password"
                    className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 pr-11 outline-none ring-2 ring-transparent focus:ring-accent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-teal-dark hover:text-accent"
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
                    autoComplete="new-password"
                    className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 pr-11 outline-none ring-2 ring-transparent focus:ring-accent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-teal-dark hover:text-accent"
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

              <div className="mt-2">
                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!canSubmit}
                  className="w-full justify-center rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover"
                >
                  Cadastrar
                </LoadingButton>
                <p className="mt-2 text-[11px] text-white/60 text-center">
                  Dica: use uma senha com letras maiúsculas, minúsculas e
                  números.
                </p>
              </div>

              <p className="text-center text-white/90 text-sm">
                Já tem conta?{" "}
                <Link
                  className="underline text-accent hover:text-white transition"
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
