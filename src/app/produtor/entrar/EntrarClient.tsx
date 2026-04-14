"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import type { Producer } from "@/types/producer";

type Props = { tokenFromUrl: string | null };

export default function EntrarClient({ tokenFromUrl }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [consumeError, setConsumeError] = useState<string | null>(null);
  const [consuming, setConsuming] = useState(Boolean(tokenFromUrl));

  // Se veio ?token=, consome uma vez e redireciona.
  useEffect(() => {
    if (!tokenFromUrl) return;
    (async () => {
      try {
        await apiClient.post<Producer>("/api/public/produtor/consume-token", {
          token: tokenFromUrl,
        });
        toast.success("Autenticado com sucesso.");
        router.replace("/painel/produtor");
      } catch (err) {
        setConsumeError(
          formatApiError(err, "Link inválido ou expirado.").message,
        );
        setConsuming(false);
      }
    })();
  }, [tokenFromUrl, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!v.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/api/public/produtor/magic-link", { email: v });
      setSent(true);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao enviar link.").message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[700px] rounded-full bg-amber-700/[0.07] blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 py-16">
        <div className="w-full overflow-hidden rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-12">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
          />
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center text-amber-200">
              <PanelBrandMark className="h-full w-full" />
            </div>
            <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
              Produtor · Mercado do Café
            </p>

            {consuming && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Entrando...
                </h1>
                <p className="mt-2 text-sm text-stone-400">
                  Validando seu link de acesso.
                </p>
              </>
            )}

            {!consuming && consumeError && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Link não funcionou
                </h1>
                <p className="mt-2 max-w-md text-sm text-stone-300">{consumeError}</p>
                <p className="mt-1 text-[11px] text-stone-500">
                  Links valem 30 minutos e só podem ser usados uma vez.
                  Solicite um novo abaixo.
                </p>
              </>
            )}

            {!tokenFromUrl && sent && (
              <>
                <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-6 w-6"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.09l6.79-6.8a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Confira seu e-mail
                </h1>
                <p className="mt-3 max-w-md text-sm text-stone-300">
                  Se o endereço existir, enviamos um link de acesso. Abra no
                  mesmo navegador e pronto — sem senha.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="mt-6 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
                >
                  Enviar para outro e-mail
                </button>
              </>
            )}

            {!tokenFromUrl && !sent && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Entrar no Kavita
                </h1>
                <p className="mt-2 max-w-md text-sm text-stone-300">
                  Sem senha. Informe seu e-mail e enviamos um link seguro.
                </p>

                <form onSubmit={submit} className="mt-6 w-full space-y-3">
                  <label className="mb-2 block text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                    Seu e-mail
                  </label>
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-stone-100 placeholder:text-stone-500 transition-colors focus:border-amber-400/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/25"
                    placeholder="voce@email.com.br"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    />
                    {submitting ? "Enviando..." : "Receber link de acesso"}
                  </button>
                </form>

                <p className="mt-5 text-[11px] leading-relaxed text-stone-500">
                  Ao continuar, você concorda que vamos criar uma conta com
                  este e-mail (se ainda não existir) para você acompanhar
                  seus contatos e favoritos.
                </p>
              </>
            )}
          </div>
        </div>

        <Link
          href="/mercado-do-cafe"
          className="mt-6 text-[11px] font-semibold text-stone-500 hover:text-amber-200"
        >
          ← Voltar ao Mercado do Café
        </Link>
      </div>
    </main>
  );
}
