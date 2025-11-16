'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
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
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerMsg(null);

    // chama o contexto -> ele já trata rotas e normalização
    const r = await login(data.email, data.senha);

    if (!r.ok) {
      // Mensagem de credenciais inválidas / usuário não encontrado etc.
      const message = r.message || 'Credenciais inválidas.';
      setServerMsg(message);
      // Opcional: marcar campos com erro
      setError('email', { message: undefined });
      setError('senha', { message: undefined });
      return; // ❌ fica na tela de login
    }

    // sucesso -> ir para Home
    router.push('/');
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
            <label className="block text-sm font-medium text-white/90 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="seu@email.com"
              className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-[#EC5B20] transition"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-200">{errors.email.message}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                {...register('senha')}
                placeholder="••••••••"
                className="w-full rounded-lg bg-white/90 focus:bg-white px-4 py-2.5 pr-11 outline-none ring-2 ring-transparent focus:ring-[#EC5B20] transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-[#0f5e63] hover:text-[#EC5B20]"
                aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                title={showPw ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.senha && (
              <p className="mt-1 text-xs text-red-200">{errors.senha.message}</p>
            )}
          </div>

          {/* Botão */}
          <button
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#359293] hover:bg-[#2e7f81] active:bg-[#2a7476] text-white font-semibold py-3 shadow-lg transition"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>

          {/* Links */}
          <p className="text-center text-white/90 text-sm">
            Esqueceu a senha?{' '}
            <Link
              href="/forgot-password"
              className="underline text-[#EC5B20] hover:text-white transition"
            >
              Recuperar
            </Link>
          </p>
          <p className="text-center text-white/90 text-sm">
            Ainda não tem conta?{' '}
            <Link
              href="/register"
              className="underline text-[#EC5B20] hover:text-white transition"
            >
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
