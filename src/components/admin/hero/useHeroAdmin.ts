// src/components/admin/hero/useHeroAdmin.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import type { HeroConfig } from "./types";

const DEFAULTS: HeroConfig = {
  hero_video_url: "",
  hero_image_url: "",
  title: "",
  subtitle: "",
  button_label: "Saiba Mais",
  button_href: "/drones",
};

export function useHeroAdmin() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HeroConfig>(DEFAULTS);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const videoPreview = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : config.hero_video_url),
    [videoFile, config.hero_video_url],
  );

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : config.hero_image_url),
    [imageFile, config.hero_image_url],
  );

  // Cleanup object URLs when files change or unmount
  useEffect(() => {
    return () => {
      if (videoFile) URL.revokeObjectURL(URL.createObjectURL(videoFile));
      if (imageFile) URL.revokeObjectURL(URL.createObjectURL(imageFile));
    };
  }, [videoFile, imageFile]);

  // Load current hero config
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await apiClient.get<Partial<HeroConfig>>(
          "/api/admin/site-hero",
        );
        setConfig({
          hero_video_url: data.hero_video_url || "",
          hero_image_url: data.hero_image_url || "",
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

  async function handleSave() {
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

      const hero = payload?.hero as HeroConfig | undefined;
      if (hero) {
        setConfig({
          hero_video_url: hero.hero_video_url || "",
          hero_image_url: hero.hero_image_url || "",
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
  }

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

  function updateConfig(patch: Partial<HeroConfig>) {
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
    handleSave,
    handleBack,
  };
}
