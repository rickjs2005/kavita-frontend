"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth, AdminRole } from "@/context/AdminAuthContext";

type LoginResponse = {
  token: string; // ainda existe na resposta, mas não é usado pelo front
  message?: string;
  admin: {
    id: number;
    email: string;
    nome: string;
    role: AdminRole;
    permissions?: string[];
  };
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function AdminLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { markAsAdmin } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const redirectTo = useMemo(() => search.get("from") || "/admin", [search]);

  // Ao abrir a tela: limpa cache local e tenta encerrar sessão no backend
  useEffect(() => {
    // limpa dados do admin no localStorage (cache visual)
    try {
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminNome");
      localStorage.removeItem("adminPermissions");
      // limpa também possível token antigo de versões anteriores
      localStorage.removeItem("adminToken");
    } catch {
      // ignore
    }

    // tenta encerrar sessão antiga no backend (limpar cookie HttpOnly)
    (async () => {
      try {
        await fetch(`${API}/api/admin/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // se der erro, não quebra o fluxo de login
      }
    })();
  }, []);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setErrMsg(null);

    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // recebe cookie HttpOnly do backend
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        let msg = "Credenciais inválidas.";
        try {
          const data = await res.json();
          if (typeof (data as any)?.message === "string") {
            msg = (data as any).message;
          }
        } catch {
          // ignore
        }
        setErrMsg(msg);
        setLoading(false);
        return;
      }

      const data = (await res.json()) as LoginResponse;

      // NÃO guarda token em localStorage, nem seta cookie via JS.
      // O cookie HttpOnly já foi definido pelo backend.

      // Mantemos apenas os dados de UX (role/nome/permissões)
      try {
        localStorage.setItem("adminRole", data.admin.role);
        localStorage.setItem("adminNome", data.admin.nome);
        if (Array.isArray(data.admin.permissions)) {
          localStorage.setItem(
            "adminPermissions",
            JSON.stringify(data.admin.permissions)
          );
        }
      } catch {
        // ignore
      }

      // Atualiza contexto de autenticação
      markAsAdmin({
        role: data.admin.role,
        nome: data.admin.nome,
        permissions: data.admin.permissions ?? [],
      });

      router.replace(redirectTo);
    } catch (e) {
      console.error("Erro de login:", e);
      setErrMsg("Falha de conexão com o servidor.");
      setLoading(false);
    }
  }, [email, senha, loading, redirectTo, router, markAsAdmin]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <main
      className="
        fixed inset-0
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
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <footer className="mt-4 text-xs text-gray-400 text-center">
          <span>Área restrita • Kavita Admin</span>
        </footer>
      </section>
    </main>
  );
}
