// src/components/admin/hero/useHeroAdmin.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import type { HeroData } from "@/types/hero";

// ── Limites (alinhados com o backend) ───────────────────────────────────────
export const LIMITS = {
  title: 255,
  subtitle: 500,
  button_label: 80,
  button_href: 255,
  videoMaxBytes: 50 * 1024 * 1024, // 50 MB
  imageMaxBytes: 5 * 1024 * 1024,  // 5 MB
} as const;

export type FieldErrors = Partial<Record<string, string>>;

const DEFAULTS: HeroData = {
  hero_video_url: "",
  hero_video_path: "",
  hero_image_url: "",
  hero_image_path: "",
  title: "",
  subtitle: "",
  button_label: "Saiba Mais",
  button_href: "/drones",
};

function validateFields(
  config: HeroData,
  videoFile: File | null,
  imageFile: File | null,
): FieldErrors {
  const errors: FieldErrors = {};

  if ((config.title || "").length > LIMITS.title) {
    errors.title = `Máximo ${LIMITS.title} caracteres.`;
  }
  if ((config.subtitle || "").length > LIMITS.subtitle) {
    errors.subtitle = `Máximo ${LIMITS.subtitle} caracteres.`;
  }
  if ((config.button_label || "").length > LIMITS.button_label) {
    errors.button_label = `Máximo ${LIMITS.button_label} caracteres.`;
  }
  if ((config.button_href || "").length > LIMITS.button_href) {
    errors.button_href = `Máximo ${LIMITS.button_href} caracteres.`;
  }

  const href = (config.button_href || "").trim();
  if (
    href &&
    !href.startsWith("/") &&
    !href.startsWith("http://") &&
    !href.startsWith("https://")
  ) {
    errors.button_href = 'Deve começar com "/" ou "http(s)://".';
  }

  if (videoFile) {
    if (!videoFile.type.startsWith("video/")) {
      errors.video = "Arquivo precisa ser um vídeo.";
    } else if (videoFile.size > LIMITS.videoMaxBytes) {
      errors.video = `Vídeo muito grande (máx. ${LIMITS.videoMaxBytes / 1024 / 1024} MB).`;
    }
  }

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      errors.image = "Arquivo precisa ser uma imagem.";
    } else if (imageFile.size > LIMITS.imageMaxBytes) {
      errors.image = `Imagem muito grande (máx. ${LIMITS.imageMaxBytes / 1024 / 1024} MB).`;
    }
  }

  return errors;
}

export function useHeroAdmin() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HeroData>(DEFAULTS);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Object URL management — create once per file, revoke the previous on change/unmount
  const videoObjUrl = useRef<string | null>(null);
  const imageObjUrl = useRef<string | null>(null);

  useEffect(() => {
    if (videoObjUrl.current) URL.revokeObjectURL(videoObjUrl.current);
    videoObjUrl.current = videoFile ? URL.createObjectURL(videoFile) : null;
    return () => {
      if (videoObjUrl.current) URL.revokeObjectURL(videoObjUrl.current);
      videoObjUrl.current = null;
    };
  }, [videoFile]);

  useEffect(() => {
    if (imageObjUrl.current) URL.revokeObjectURL(imageObjUrl.current);
    imageObjUrl.current = imageFile ? URL.createObjectURL(imageFile) : null;
    return () => {
      if (imageObjUrl.current) URL.revokeObjectURL(imageObjUrl.current);
      imageObjUrl.current = null;
    };
  }, [imageFile]);

  const videoPreview = videoObjUrl.current || config.hero_video_url;
  const imagePreview = imageObjUrl.current || config.hero_image_url;

  // Live validation
  const errors = useMemo(
    () => validateFields(config, videoFile, imageFile),
    [config, videoFile, imageFile],
  );

  const hasErrors = Object.keys(errors).length > 0;

  // Load current hero config
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await apiClient.get<Partial<HeroData>>(
          "/api/admin/site-hero",
        );
        setConfig({
          hero_video_url: data.hero_video_url || "",
          hero_video_path: data.hero_video_path || "",
          hero_image_url: data.hero_image_url || "",
          hero_image_path: data.hero_image_path || "",
          title: data.title || "",
          subtitle: data.subtitle || "",
          button_label: data.button_label || "Saiba Mais",
          button_href: data.button_href || "/drones",
        });
      } catch (e: any) {
        if (e?.status === 401 || e?.status === 403) {
          toast.error("Sessão expirada. Faça login novamente.");
          router.push("/admin/login");
          return;
        }
        toast.error("Não foi possível carregar as configurações do Hero.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleSave = useCallback(async () => {
    if (hasErrors) {
      toast.error("Corrija os erros antes de salvar.");
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      if (videoFile) fd.append("heroVideo", videoFile);
      if (imageFile) fd.append("heroImage", imageFile);
      fd.append("title", String(config.title || ""));
      fd.append("subtitle", String(config.subtitle || ""));
      fd.append("button_label", config.button_label || "");
      fd.append("button_href", config.button_href || "");

      const payload = await apiClient.put<any>("/api/admin/site-hero", fd, {
        skipContentType: true,
      });

      toast.success("Hero atualizado com sucesso!");
      setVideoFile(null);
      setImageFile(null);

      const hero = payload?.hero as HeroData | undefined;
      if (hero) {
        setConfig({
          hero_video_url: hero.hero_video_url || "",
          hero_video_path: hero.hero_video_path || "",
          hero_image_url: hero.hero_image_url || "",
          hero_image_path: hero.hero_image_path || "",
          title: hero.title || "",
          subtitle: hero.subtitle || "",
          button_label: hero.button_label || "Saiba Mais",
          button_href: hero.button_href || "/drones",
        });
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/admin/login");
        return;
      }
      toast.error(e?.message || "Falha ao salvar Hero.");
    } finally {
      setSaving(false);
    }
  }, [hasErrors, config, videoFile, imageFile, router]);

  function handleBack() {
    try {
      router.back();
      setTimeout(() => {
        if (
          typeof window !== "undefined" &&
          window.location.pathname.includes("/admin/destaques/site-hero")
        ) {
          router.push("/admin/destaques");
        }
      }, 200);
    } catch {
      router.push("/admin/destaques");
    }
  }

  function updateConfig(patch: Partial<HeroData>) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  return {
    loading,
    saving,
    config,
    updateConfig,
    videoFile,
    setVideoFile,
    imageFile,
    setImageFile,
    videoPreview,
    imagePreview,
    errors,
    hasErrors,
    handleSave,
    handleBack,
  };
}
