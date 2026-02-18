"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingButton from "../../buttons/LoadingButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * ✅ Config Landing (Admin)
 * - Edita SOMENTE drone_page_settings (landing global)
 * - NÃO inclui: specs / features / benefits / galeria / modelos
 * - Mantém compatibilidade com backend:
 *   tenta GET/PUT em /page-settings e faz fallback para /page (se o seu backend ainda expõe assim)
 */

type PageSettingsDTO = {
  hero_title: string;
  hero_subtitle: string | null;
  hero_video_path: string | null;
  hero_image_fallback_path: string | null;

  cta_title: string | null;
  cta_message_template: string | null;
  cta_button_label: string | null;

  sections_order_json: string[] | null;
};

type AnyJson = Record<string, any> | any[] | null;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeJson<T = any>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readJsonOrText(res: Response): Promise<{ json: AnyJson; text: string }> {
  const text = await res.text();
  return { json: safeJson(text), text };
}

function sanitizeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function ensureArray<T>(v: unknown, fallback: T[]): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}

function normalizeNullableString(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

function uniqOrder(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of list) {
    const k = String(it || "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

const inputBase =
  "w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm text-slate-100 outline-none";
const inputFocus = "focus:border-white/20 focus:ring-2 focus:ring-white/10";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-semibold text-slate-200">{label}</label>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-extrabold text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-300">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function PageSettingsForm() {
  const router = useRouter();

  const defaultSections = useMemo(() => ["hero", "gallery", "representatives", "comments"], []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");

  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaButtonLabel, setCtaButtonLabel] = useState("");
  const [ctaTemplate, setCtaTemplate] = useState("");

  const [sectionsOrder, setSectionsOrder] = useState<string[]>(defaultSections);

  const [heroVideo, setHeroVideo] = useState<File | null>(null);
  const [heroImageFallback, setHeroImageFallback] = useState<File | null>(null);

  const [currentHeroVideoPath, setCurrentHeroVideoPath] = useState<string | null>(null);
  const [currentHeroImagePath, setCurrentHeroImagePath] = useState<string | null>(null);

  async function fetchWithFallback(paths: string[]) {
    let last: Response | null = null;
    for (const p of paths) {
      const res = await fetch(`${API_BASE}${p}`, {
        credentials: "include",
        cache: "no-store",
      });
      last = res;
      if (res.ok) return res;

      // Se for 404, tenta o próximo endpoint de compatibilidade
      if (res.status !== 404) return res;
    }
    return last!;
  }

  useEffect(() => {
    (async () => {
      setMsg(null);
      setLoading(true);
      try {
        // compat: /page-settings (novo) e /page (legado)
        const res = await fetchWithFallback(["/api/admin/drones/page-settings", "/api/admin/drones/page"]);
        const { json } = await readJsonOrText(res);

        if (!res.ok) {
          setMsg((json as any)?.message || "Falha ao carregar Config Landing.");
          return;
        }

        const data = (json && typeof json === "object" && "page" in json ? (json as any).page : json) as Partial<
          PageSettingsDTO
        >;

        setHeroTitle(sanitizeString(data.hero_title, ""));
        setHeroSubtitle(sanitizeString(data.hero_subtitle, ""));

        setCtaTitle(sanitizeString(data.cta_title, ""));
        setCtaButtonLabel(sanitizeString(data.cta_button_label, ""));
        setCtaTemplate(sanitizeString(data.cta_message_template, ""));

        setCurrentHeroVideoPath(sanitizeString(data.hero_video_path, "") || null);
        setCurrentHeroImagePath(sanitizeString(data.hero_image_fallback_path, "") || null);

        setSectionsOrder(uniqOrder(ensureArray<string>(data.sections_order_json, defaultSections)));
      } catch {
        setMsg("Erro de rede ao carregar Config Landing.");
      } finally {
        setLoading(false);
      }
    })();
  }, [defaultSections]);

  function validate(): string | null {
    if (!heroTitle.trim()) return "hero_title é obrigatório.";
    if (!Array.isArray(sectionsOrder) || sectionsOrder.length === 0) return "sections_order_json inválido.";
    return null;
  }

  async function save() {
    setMsg(null);

    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();

      // campos do DTO (landing)
      fd.append("hero_title", heroTitle.trim());

      const hs = normalizeNullableString(heroSubtitle);
      if (hs) fd.append("hero_subtitle", hs);

      const ct = normalizeNullableString(ctaTitle);
      if (ct) fd.append("cta_title", ct);

      const cbl = normalizeNullableString(ctaButtonLabel);
      if (cbl) fd.append("cta_button_label", cbl);

      const ctmp = normalizeNullableString(ctaTemplate);
      if (ctmp) fd.append("cta_message_template", ctmp);

      fd.append("sections_order_json", JSON.stringify(uniqOrder(sectionsOrder)));

      // mídia (nomes devem bater com seu controller)
      if (heroVideo) fd.append("heroVideo", heroVideo);
      if (heroImageFallback) fd.append("heroImageFallback", heroImageFallback);

      // compat PUT:
      // - tenta page-settings
      // - se 404, tenta /page
      const probe = await fetch(`${API_BASE}/api/admin/drones/page-settings`, {
        method: "OPTIONS",
        credentials: "include",
      }).catch(() => null);

      const targetPath = probe && probe.ok ? "/api/admin/drones/page-settings" : "/api/admin/drones/page";

      const res = await fetch(`${API_BASE}${targetPath}`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });

      const { json } = await readJsonOrText(res);

      if (!res.ok) {
        setMsg((json as any)?.message || "Falha ao salvar Config Landing.");
        return;
      }

      const page = (json && typeof json === "object" && "page" in json ? (json as any).page : json) as Partial<
        PageSettingsDTO
      >;

      setCurrentHeroVideoPath(sanitizeString(page.hero_video_path, "") || null);
      setCurrentHeroImagePath(sanitizeString(page.hero_image_fallback_path, "") || null);

      setHeroVideo(null);
      setHeroImageFallback(null);

      setMsg("Config Landing salva com sucesso.");
    } catch {
      setMsg("Erro de rede ao salvar Config Landing.");
    } finally {
      setSaving(false);
    }
  }

  function updateSectionAt(idx: number, value: string) {
    setSectionsOrder((prev) => prev.map((s, i) => (i === idx ? value : s)));
  }
  function addSection(value = "") {
    setSectionsOrder((prev) => [...prev, value]);
  }
  function removeSection(idx: number) {
    setSectionsOrder((prev) => prev.filter((_, i) => i !== idx));
  }

  if (loading) return <div className="text-slate-300">Carregando...</div>;

  return (
    <div className="relative grid gap-6">
      {/* Mobile header */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
            aria-label="Voltar"
          >
            ← Voltar
          </button>
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-extrabold text-slate-100">Config Landing</p>
            <p className="truncate text-[11px] text-slate-400">Kavita Drones</p>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-white">Config Landing (Drones)</h1>
          <p className="mt-1 text-sm text-slate-300">Ajuste título, CTA, mídias e a ordem das seções.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
          >
            Voltar
          </button>

          <LoadingButton isLoading={saving} onClick={save} className="rounded-full px-5">
            Salvar
          </LoadingButton>
        </div>
      </div>

      {msg ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
          {msg}
        </div>
      ) : null}

      <SectionCard title="Hero" subtitle="Título, subtítulo e mídias do hero.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título (hero_title)" hint="Obrigatório">
            <input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className={cx(inputBase, inputFocus)}
              placeholder="Ex: DJI Agras — Drones Agrícolas"
            />
          </Field>

          <Field label="Subtítulo (hero_subtitle)" hint="Opcional">
            <input
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className={cx(inputBase, inputFocus)}
              placeholder="Ex: Alto desempenho, precisão e suporte local"
            />
          </Field>

          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
            <Field
              label="Vídeo do Hero (upload)"
              hint={currentHeroVideoPath ? `Atual: ${currentHeroVideoPath}` : undefined}
            >
              <input type="file" accept="video/mp4" onChange={(e) => setHeroVideo(e.target.files?.[0] || null)} />
            </Field>

            <Field
              label="Imagem fallback (upload)"
              hint={currentHeroImagePath ? `Atual: ${currentHeroImagePath}` : undefined}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setHeroImageFallback(e.target.files?.[0] || null)}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="CTA" subtitle="Mensagem e botão de contato.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título do CTA (cta_title)" hint="Opcional">
            <input value={ctaTitle} onChange={(e) => setCtaTitle(e.target.value)} className={cx(inputBase, inputFocus)} />
          </Field>

          <Field label="Label do botão (cta_button_label)" hint="Opcional">
            <input
              value={ctaButtonLabel}
              onChange={(e) => setCtaButtonLabel(e.target.value)}
              className={cx(inputBase, inputFocus)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Template da mensagem (cta_message_template)" hint="Opcional">
              <textarea
                value={ctaTemplate}
                onChange={(e) => setCtaTemplate(e.target.value)}
                className="w-full min-h-[120px] rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm text-slate-100 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10"
                placeholder="Ex: Olá! Tenho interesse em um drone agrícola. Quero falar com um representante."
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Ordem das seções"
        subtitle="Define a ordem de renderização na landing pública."
        actions={
          <button
            type="button"
            onClick={() => addSection("")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-extrabold text-white hover:bg-white/10"
          >
            + Adicionar
          </button>
        }
      >
        <div className="grid gap-2">
          {sectionsOrder.map((s, idx) => (
            <div key={`${s}-${idx}`} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <input
                value={s}
                onChange={(e) => updateSectionAt(idx, e.target.value)}
                className={cx(inputBase, inputFocus, "font-mono")}
                placeholder="hero | gallery | representatives | comments"
              />
              <button
                type="button"
                onClick={() => removeSection(idx)}
                className="rounded-full bg-red-500/80 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-500"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="sm:hidden">
        <LoadingButton isLoading={saving} onClick={save} className="w-full rounded-full px-5 py-3">
          Salvar
        </LoadingButton>
      </div>
    </div>
  );
}
