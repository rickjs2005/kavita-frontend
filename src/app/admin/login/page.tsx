'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type LoginResponse = { token: string; [k: string]: unknown };

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();

  // ---- state
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const redirectTo = useMemo(() => search.get('from') || '/admin', [search]);

  // limpa token antigo ao abrir a tela (não altera backend/lógica)
  useEffect(() => {
    try { localStorage.removeItem('adminToken'); } catch {}
    // remove cookie se existir
    document.cookie = 'adminToken=; path=/; max-age=0; samesite=lax';
  }, []);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setErrMsg(null);

    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        // tenta extrair msg do backend; se não vier, mostra genérica
        let msg = 'Credenciais inválidas.';
        try {
          const data = await res.json();
          if (typeof data?.message === 'string') msg = data.message;
        } catch {}
        setErrMsg(msg);
        setLoading(false);
        return;
      }

      const data = (await res.json()) as LoginResponse;

      // persiste cookie para o middleware
      const maxAge = 60 * 60 * 8; // 8h
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const secure = isHttps ? '; secure' : '';
      document.cookie = `adminToken=${data.token}; path=/; max-age=${maxAge}; samesite=lax${secure}`;

      // opcional: localStorage para uso em fetches client-side
      try { localStorage.setItem('adminToken', String(data.token)); } catch {}

      router.replace(redirectTo);
    } catch (e) {
      console.error('Erro de login:', e);
      setErrMsg('Falha de conexão com o servidor.');
      setLoading(false);
    }
  }, [API, email, senha, loading, redirectTo, router]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <main
      className="
        fixed inset-0                /* FULLSCREEN real, ignora paddings do layout */
        bg-gray-950
        flex items-center justify-center
        overflow-y-auto
        p-4 sm:p-6 md:p-8
      "
      aria-label="Tela de login administrativo"
    >
      <section
        className="
          w-full max-w-[26rem] sm:max-w-sm md:max-w-md
          bg-gray-800/90 backdrop-blur
          p-6 sm:p-7 md:p-8
          rounded-2xl shadow-xl ring-1 ring-black/10
        "
        role="dialog"
        aria-modal="true"
      >
        <header className="mb-6">
          <h1
            className="
              text-2xl sm:text-3xl font-extrabold tracking-tight
              text-center text-[#39a2a2]
            "
          >
            Acesso Administrativo
          </h1>
          {errMsg && (
            <p
              className="
                mt-4 text-sm sm:text-[0.95rem]
                text-red-300 bg-red-900/30 border border-red-500/40
                rounded-lg px-3 py-2
              "
              role="alert"
            >
              {errMsg}
            </p>
          )}
        </header>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-[0.95rem] font-medium text-gray-200 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="admin@kavita.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            className="
              w-full rounded-lg
              border border-white/10
              bg-white text-gray-900
              placeholder:text-gray-500
              px-3 py-3 text-base
              focus:outline-none focus:ring-2 focus:ring-[#39a2a2]/60
            "
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="senha"
            className="block text-[0.95rem] font-medium text-gray-200 mb-1"
          >
            Senha
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={onKeyDown}
            className="
              w-full rounded-lg
              border border-white/10
              bg-white text-gray-900
              placeholder:text-gray-500
              px-3 py-3 text-base
              focus:outline-none focus:ring-2 focus:ring-[#39a2a2]/60
            "
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading || !email || !senha}
          className="
            w-full rounded-xl
            bg-[#2b7c7c] text-white font-semibold
            py-3 text-base
            hover:bg-[#256f6f] active:scale-[0.99]
            transition disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {/* rodapé opcional (help / versão) */}
        <footer className="mt-4 text-xs text-gray-400 text-center">
          <span>Área restrita • Kavita Admin</span>
        </footer>
      </section>
    </main>
  );
}
