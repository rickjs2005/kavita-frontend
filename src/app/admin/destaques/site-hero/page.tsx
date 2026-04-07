"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import type { HeroSlide } from "@/types/heroSlide";

const SLIDE_TYPE_LABELS: Record<string, string> = {
  promotional: "Promocional",
  institutional: "Institucional",
  informational: "Informativo",
};

export default function HeroSlidesAdminPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSlides = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<HeroSlide[]>("/api/admin/hero-slides");
      setSlides(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        toast.error("Sessão expirada.");
        router.push("/admin/login");
        return;
      }
      toast.error("Erro ao carregar slides.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadSlides(); }, [loadSlides]);

  async function handleToggle(slide: HeroSlide) {
    try {
      await apiClient.patch(`/api/admin/hero-slides/${slide.id}/toggle`, {});
      toast.success(slide.is_active ? "Slide desativado." : "Slide ativado.");
      loadSlides();
    } catch {
      toast.error("Erro ao alterar status.");
    }
  }

  async function handleDelete(slide: HeroSlide) {
    if (!confirm(`Remover slide "${slide.title || `#${slide.id}`}"?`)) return;
    try {
      await apiClient.del(`/api/admin/hero-slides/${slide.id}`);
      toast.success("Slide removido.");
      loadSlides();
    } catch {
      toast.error("Erro ao remover slide.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6 text-white">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-white/10" />
          <div className="h-[200px] rounded-2xl bg-white/5 border border-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] p-4 sm:p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Carrossel Hero
            </h1>
            <p className="text-sm text-white/60">
              Gerencie os slides de divulgação da home.
            </p>
          </div>
          <a
            href="/admin/destaques/site-hero/novo"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90"
          >
            + Novo slide
          </a>
        </div>

        {/* List */}
        {slides.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <p className="text-white/60">Nenhum slide cadastrado.</p>
            <a
              href="/admin/destaques/site-hero/novo"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Criar primeiro slide
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide) => {
              const img = slide.hero_image_url || slide.hero_image_path;
              return (
                <div
                  key={slide.id}
                  className={`rounded-2xl border p-3 sm:p-4 transition ${
                    slide.is_active
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.02] opacity-60"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-full sm:w-40 h-24 rounded-xl bg-black/30 border border-white/10 overflow-hidden">
                      {img ? (
                        <img
                          src={absUrl(img)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-white/40">
                          Sem imagem
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">
                          {slide.title || <span className="text-white/40 italic">Sem título</span>}
                        </h3>
                        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/60">
                          {SLIDE_TYPE_LABELS[slide.slide_type] || slide.slide_type}
                        </span>
                        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/60">
                          Ordem: {slide.sort_order}
                        </span>
                      </div>
                      {slide.subtitle ? (
                        <p className="mt-1 text-xs text-white/50 truncate">{slide.subtitle}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-white/40">
                        CTA: {slide.button_label} &rarr; {slide.button_href}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(slide)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                          slide.is_active
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {slide.is_active ? "Ativo" : "Inativo"}
                      </button>
                      <a
                        href={`/admin/destaques/site-hero/${slide.id}`}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 transition"
                      >
                        Editar
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(slide)}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
