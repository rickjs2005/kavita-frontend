"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";

type Props = { tokenFromUrl: string | null };

export default function VerificarClient({ tokenFromUrl }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(Boolean(tokenFromUrl));

  useEffect(() => {
    if (!tokenFromUrl) {
      setError("Link inválido.");
      return;
    }
    (async () => {
      try {
        await apiClient.post("/api/public/motorista/consume-token", {
          token: tokenFromUrl,
        });
        toast.success("Autenticado.");
        router.replace("/motorista/rota");
      } catch (err) {
        setError(formatApiError(err, "Link inválido ou expirado.").message);
        setBusy(false);
      }
    })();
  }, [tokenFromUrl, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
          Kavita · Entregas
        </p>
        {busy ? (
          <>
            <h1 className="text-2xl font-semibold text-stone-50">Validando seu link…</h1>
            <p className="text-sm text-stone-400">Isso leva apenas alguns segundos.</p>
          </>
        ) : error ? (
          <>
            <h1 className="text-2xl font-semibold text-stone-50">Link não funcionou</h1>
            <p className="text-sm text-stone-300">{error}</p>
            <p className="text-[11px] text-stone-500">
              Os links valem 15 minutos e só podem ser usados uma vez.
            </p>
            <Link
              href="/motorista/login"
              className="inline-block mt-3 px-4 py-2 rounded-lg bg-amber-400 text-stone-950 font-semibold text-sm"
            >
              Solicitar novo link
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
