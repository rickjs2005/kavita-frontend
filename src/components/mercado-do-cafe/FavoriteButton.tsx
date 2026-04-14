"use client";

// src/components/mercado-do-cafe/FavoriteButton.tsx
//
// Botão de favoritar uma corretora. Comportamento:
//   - Se produtor NÃO está logado, abre /produtor/entrar?from=... com
//     informação suficiente para voltar aqui depois.
//   - Se está logado, faz toggle direto (otimista).
//   - Checa estado inicial via GET lista (cacheada no client via
//     useProducerAuth availability + localStorage pode vir depois).
//
// Não depende de layout específico — funciona na página de detalhe
// público que não tem ProducerAuthProvider pai. Por isso:
//   - chama /api/produtor/me diretamente quando monta
//   - silencia 401 (produtor não logado)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";

type Props = {
  corretoraId: number;
  corretoraSlug: string;
};

export function FavoriteButton({ corretoraId, corretoraSlug }: Props) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-detecta sessão do produtor em background.
    (async () => {
      try {
        await apiClient.get("/api/produtor/me");
        setAuthed(true);
        // Busca favoritos e testa se inclui este id.
        try {
          const favs = await apiClient.get<{ corretora_id: number }[]>(
            "/api/produtor/favorites",
          );
          setIsFav(favs.some((f) => f.corretora_id === corretoraId));
        } catch {
          // ignore
        }
      } catch {
        setAuthed(false);
      }
    })();
  }, [corretoraId]);

  const toggle = async () => {
    if (authed === false) {
      const from = encodeURIComponent(
        `/mercado-do-cafe/corretoras/${corretoraSlug}`,
      );
      router.push(`/produtor/entrar?from=${from}`);
      return;
    }
    setLoading(true);
    try {
      if (isFav) {
        await apiClient.request(`/api/produtor/favorites/${corretoraId}`, {
          method: "DELETE",
        });
        setIsFav(false);
        toast.success("Removida dos favoritos.");
      } else {
        await apiClient.post(`/api/produtor/favorites/${corretoraId}`);
        setIsFav(true);
        toast.success("Adicionada aos favoritos.");
      }
    } catch {
      toast.error("Erro ao atualizar favoritos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || authed === null}
      aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm transition-all ${
        isFav
          ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
          : "border-white/10 bg-white/[0.04] text-stone-300 hover:border-amber-400/30 hover:text-amber-200"
      } ${loading ? "opacity-60" : ""}`}
    >
      <svg
        viewBox="0 0 20 20"
        fill={isFav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isFav ? 0 : 1.5}
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path d="M10 3.22l-.61-.6a5.5 5.5 0 00-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 00-7.78-7.77l-.61.61z" />
      </svg>
      {isFav ? "Favoritada" : "Favoritar"}
    </button>
  );
}
