"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type HeroConfig = {
  hero_video_url: string;
  hero_image_url: string;

  // ✅ NOVO (opcionais)
  title?: string;
  subtitle?: string;

  button_label: string;
  button_href: string;
};

function isAuthError(res: Response) {
  return res.status === 401 || res.status === 403;
}

export default function SiteHeroAdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<HeroConfig>({
    hero_video_url: "",
    hero_image_url: "",
    title: "",
    subtitle: "",
    button_label: "Saiba Mais",
    button_href: "/drones",
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const videoPreview = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : config.hero_video_url),
    [videoFile, config.hero_video_url]
  );

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : config.hero_image_url),
    [imageFile, config.hero_image_url]
  );

  useEffect(() => {
    return () => {
      if (videoFile) URL.revokeObjectURL(videoPreview);
      if (imageFile) URL.revokeObjectURL(imagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/admin/site-hero`, {
          method: "GET",
          credentials: "include",
        });

        if (isAuthError(res)) {
          toast.error("Sessão expirada. Faça login novamente.");
          router.push("/admin/login");
          return;
        }

        if (!res.ok) throw new Error("Erro ao carregar Hero.");

        const data = (await res.json()) as Partial<HeroConfig>;

        setConfig({
          hero_video_url: data.hero_video_url || "",
          hero_image_url: data.hero_image_url || "",

          // ✅ NOVO (opcionais)
          title: data.title || "",
          subtitle: data.subtitle || "",

          button_label: data.button_label || "Saiba Mais",
          button_href: data.button_href || "/drones",
        });
      } catch (e) {
        console.error(e);
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

      // ✅ NOVO (não obrigatório)
      fd.append("title", String(config.title || ""));
      fd.append("subtitle", String(config.subtitle || ""));

      fd.append("button_label", config.button_label || "");
      fd.append("button_href", config.button_href || "");

      const res = await fetch(`${API_BASE}/api/admin/site-hero`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });

      if (isAuthError(res)) {
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/admin/login");
        return;
      }

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(payload?.message || "Erro ao salvar Hero.");
        return;
      }

      toast.success("Hero atualizado com sucesso!");
      setVideoFile(null);
      setImageFile(null);

      const hero = payload?.hero as HeroConfig | undefined;
      if (hero) {
        // garante que title/subtitle existam no state mesmo se vierem null
        setConfig({
          hero_video_url: hero.hero_video_url || "",
          hero_image_url: hero.hero_image_url || "",
          title: hero.title || "",
          subtitle: hero.subtitle || "",
          button_label: hero.button_label || "Saiba Mais",
          button_href: hero.button_href || "/drones",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Falha ao salvar Hero.");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    // Volta no histórico. Se não tiver histórico (ou der ruim), cai no fallback.
    try {
      router.back();
      // fallback “seguro” (executa logo depois; se back funcionar, o usuário sai antes de notar)
      setTimeout(() => {
        // @ts-ignore
        if (typeof window !== "undefined" && window.location.pathname.includes("/admin/destaques/site-hero")) {
          router.push("/admin/destaques");
        }
      }, 200);
    } catch {
      router.push("/admin/destaques");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="h-[340px] rounded-2xl bg-white/5 border border-white/10" />
              <div className="h-[340px] rounded-2xl bg-white/5 border border-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyMedia = Boolean(videoPreview || imagePreview);

  return (
    <div className="min-h-[70vh] p-4 sm:p-6 text-white">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            {/* ✅ Botão voltar (mobile) */}
            <button
              type="button"
              onClick={handleBack}
              className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition"
              aria-label="Voltar"
              title="Voltar"
            >
              <span className="text-lg leading-none">←</span>
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Hero do Site
              </h1>
              <p className="text-sm text-white/60">
                Atualize vídeo/imagem do Hero e personalize o CTA.
              </p>
            </div>
          </div>

          <button
            disabled={saving}
            onClick={handleSave}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#359293] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Preview */}
          <div className="lg:col-span-3 order-1">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="font-semibold">Preview</p>

                <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
                  <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">
                    {videoPreview ? "Vídeo" : imagePreview ? "Imagem" : "Vazio"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">
                    Responsivo
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div className="aspect-[16/9] w-full">
                  {videoPreview ? (
                    <video
                      className="absolute inset-0 h-full w-full object-cover"
                      src={videoPreview}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : imagePreview ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${imagePreview}')` }}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-white/70">
                      <div className="text-center px-6">
                        <p className="font-semibold">Sem mídia definida</p>
                        <p className="text-sm text-white/50 mt-1">
                          Envie um vídeo ou imagem para ver o Hero aqui.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

                  <div className="relative z-10 flex h-full items-end p-4 sm:p-6">
                    <div className="max-w-xl">
                      <h2 className="text-lg sm:text-2xl font-bold leading-tight">
                        {config.title?.trim() ? config.title : "Seu título aqui"}
                      </h2>
                      <p className="mt-1 sm:mt-2 text-sm sm:text-base text-white/80">
                        {config.subtitle?.trim() ? config.subtitle : "Seu subtítulo aqui"}
                      </p>

                      <div className="mt-4 sm:mt-5 flex flex-col xs:flex-row gap-2 xs:items-center">
                        <a
                          href={config.button_href || "#"}
                          className="inline-flex w-full xs:w-auto items-center justify-center rounded-xl border border-[#359293] bg-black/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-[#359293]/25 transition"
                        >
                          {config.button_label || "Saiba Mais"}
                        </a>

                        <div className="text-xs text-white/55">
                          {hasAnyMedia ? "Preview do CTA ativo" : "Defina uma mídia"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-white/50">
                *Se enviar vídeo, ele tem prioridade sobre a imagem (fallback).
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 order-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
              <p className="font-semibold mb-3">Configurações</p>

              <div className="space-y-4">
                {/* ✅ NOVO: Título/Subtítulo (opcional) */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4 space-y-3">
                  <div>
                    <label
                      htmlFor="heroTitleInput"
                      className="block text-sm text-white/80 mb-2"
                    >
                      Título (opcional)
                    </label>
                    <input
                      id="heroTitleInput"
                      name="heroTitleInput"
                      value={config.title || ""}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, title: e.target.value }))
                      }
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-[#359293]/70 focus:ring-2 focus:ring-[#359293]/20"
                      placeholder="Ex: Tecnologia que transforma o campo"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="heroSubtitleInput"
                      className="block text-sm text-white/80 mb-2"
                    >
                      Subtítulo (opcional)
                    </label>
                    <textarea
                      id="heroSubtitleInput"
                      name="heroSubtitleInput"
                      value={config.subtitle || ""}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, subtitle: e.target.value }))
                      }
                      rows={3}
                      className="w-full resize-none rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-[#359293]/70 focus:ring-2 focus:ring-[#359293]/20"
                      placeholder="Ex: Os drones agrícolas mais avançados do mercado"
                    />
                  </div>

                  <p className="text-xs text-white/50">
                    Se deixar vazio, o site pode mostrar um texto padrão (ou nada) no Hero.
                  </p>
                </div>

                {/* Upload Vídeo */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label
                        htmlFor="heroVideoInput"
                        className="block text-sm font-medium text-white/90"
                      >
                        Vídeo do Hero
                      </label>
                      <p className="text-xs text-white/55 mt-1">
                        Recomendo mp4 (leve e rápido).
                      </p>
                    </div>
                    {videoFile ? (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                        Selecionado
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <label
                      htmlFor="heroVideoInput"
                      className="group relative flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 hover:bg-white/[0.05] transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white/80">
                          {videoFile ? videoFile.name : "Clique para enviar o vídeo"}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {videoFile
                            ? `${Math.max(1, Math.round(videoFile.size / 1024 / 1024))} MB`
                            : "video/*"}
                        </p>
                      </div>

                      <span className="ml-3 shrink-0 rounded-lg bg-[#359293]/15 px-3 py-2 text-xs font-semibold text-white border border-[#359293]/30 group-hover:bg-[#359293]/25 transition">
                        Escolher arquivo
                      </span>

                      <input
                        id="heroVideoInput"
                        name="heroVideoInput"
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Upload Imagem */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label
                        htmlFor="heroImageInput"
                        className="block text-sm font-medium text-white/90"
                      >
                        Imagem (fallback)
                      </label>
                      <p className="text-xs text-white/55 mt-1">
                        Usada quando não houver vídeo.
                      </p>
                    </div>
                    {imageFile ? (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                        Selecionado
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <label
                      htmlFor="heroImageInput"
                      className="group relative flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 hover:bg-white/[0.05] transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white/80">
                          {imageFile ? imageFile.name : "Clique para enviar a imagem"}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {imageFile
                            ? `${Math.max(1, Math.round(imageFile.size / 1024 / 1024))} MB`
                            : "image/*"}
                        </p>
                      </div>

                      <span className="ml-3 shrink-0 rounded-lg bg-[#359293]/15 px-3 py-2 text-xs font-semibold text-white border border-[#359293]/30 group-hover:bg-[#359293]/25 transition">
                        Escolher arquivo
                      </span>

                      <input
                        id="heroImageInput"
                        name="heroImageInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* CTA */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4 space-y-3">
                  <div>
                    <label
                      htmlFor="buttonLabelInput"
                      className="block text-sm text-white/80 mb-2"
                    >
                      Label do botão
                    </label>
                    <input
                      id="buttonLabelInput"
                      name="buttonLabelInput"
                      value={config.button_label}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, button_label: e.target.value }))
                      }
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-[#359293]/70 focus:ring-2 focus:ring-[#359293]/20"
                      placeholder="Ex: Saiba Mais"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="buttonHrefInput"
                      className="block text-sm text-white/80 mb-2"
                    >
                      Link do botão (href)
                    </label>
                    <input
                      id="buttonHrefInput"
                      name="buttonHrefInput"
                      value={config.button_href}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, button_href: e.target.value }))
                      }
                      className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-[#359293]/70 focus:ring-2 focus:ring-[#359293]/20"
                      placeholder="/drones ou https://..."
                    />
                    <p className="text-xs text-white/50 mt-2">
                      Aceita rota interna (/drones) ou link externo (https://...).
                    </p>
                  </div>
                </div>

                {/* Ação no mobile */}
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="lg:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-[#359293] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50 w-full"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">
                  Dica: se quiser ainda mais “pro”, dá pra adicionar validação de
                  tamanho (ex: vídeo até 30MB / imagem até 5MB) e barra de progresso
                  no upload — sem mexer no seu backend.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
