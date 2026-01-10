"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { AdminConfig } from "../../../types/adminConfig";
import FormattedInput from "@/components/layout/FormattedInput";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AdminConfigForm = Partial<AdminConfig>;

type FooterLinkItem = {
  label: string;
  href: string;
  highlight?: boolean;
};

function stableStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "";
  }
}

function pickChangedFields(
  current: AdminConfigForm,
  baseline: AdminConfigForm
): Partial<AdminConfigForm> {
  const out: Partial<AdminConfigForm> = {};

  const keys = new Set([
    ...Object.keys(current ?? {}),
    ...Object.keys(baseline ?? {}),
  ]);

  for (const k of keys) {
    const key = k as keyof AdminConfigForm;
    const cur = (current as any)?.[key];
    const base = (baseline as any)?.[key];

    const curIsObj = typeof cur === "object" && cur !== null;
    const baseIsObj = typeof base === "object" && base !== null;

    const different =
      curIsObj || baseIsObj
        ? stableStringify(cur) !== stableStringify(base)
        : cur !== base;

    if (different) {
      (out as any)[key] = cur;
    }
  }

  return out;
}

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<AdminConfigForm>({});
  const [baseline, setBaseline] = useState<AdminConfigForm>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [savingTop, setSavingTop] = useState<boolean>(false);
  const [savingBottom, setSavingBottom] = useState<boolean>(false);

  // Upload de logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const topRef = useRef<HTMLDivElement | null>(null);

  // ============================================================
  // 🔐 Carregar configurações com cookie HttpOnly
  // ============================================================
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/admin/config`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          toast.error("Sessão expirada. Faça login novamente.");
          router.push("/admin/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Erro ao carregar configurações.");
        }

        const data = (await res.json()) as any;

        // Se footer_links vier como string, parse aqui.
        let footerLinksParsed: FooterLinkItem[] | null | undefined =
          data.footer_links;

        if (typeof footerLinksParsed === "string") {
          try {
            footerLinksParsed = JSON.parse(footerLinksParsed);
          } catch {
            footerLinksParsed = [];
          }
        }

        const normalized: AdminConfigForm = {
          ...data,
          footer_links: footerLinksParsed,

          checkout_require_cpf: !!data.checkout_require_cpf,
          checkout_require_address: !!data.checkout_require_address,
          checkout_allow_pickup: !!data.checkout_allow_pickup,
          checkout_enable_coupons: !!data.checkout_enable_coupons,
          checkout_enable_abandoned_cart: !!data.checkout_enable_abandoned_cart,

          payment_pix_enabled: !!data.payment_pix_enabled,
          payment_card_enabled: !!data.payment_card_enabled,
          payment_boleto_enabled: !!data.payment_boleto_enabled,

          mp_sandbox_mode: !!data.mp_sandbox_mode,

          shipping_flat_enabled: !!data.shipping_flat_enabled,
          shipping_flat_value: data.shipping_flat_value ?? 0,
          shipping_free_over: data.shipping_free_over ?? 0,

          comm_email_enabled: !!data.comm_email_enabled,
          comm_whatsapp_enabled: !!data.comm_whatsapp_enabled,

          footer_partner_cta_enabled:
            typeof data.footer_partner_cta_enabled === "boolean"
              ? data.footer_partner_cta_enabled
              : !!data.footer_partner_cta_enabled,

          // Endereço (Sede) - garante string (evita undefined em inputs)
          address_city: data.address_city ?? "",
          address_state: data.address_state ?? "",
          address_street: data.address_street ?? "",
          address_neighborhood: data.address_neighborhood ?? "",
          address_zip: data.address_zip ?? "",
        };

        setSettings(normalized);
        setBaseline(normalized); // baseline para patch (somente alterados)
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [router]);

  // ============================================================
  // 🧠 Nome da loja -> título da aba
  // ============================================================
  useEffect(() => {
    const name =
      typeof settings?.store_name === "string" && settings.store_name.trim()
        ? settings.store_name.trim()
        : "Kavita";

    document.title = `${name} • Admin`;
  }, [settings?.store_name]);

  // ============================================================
  // 🔧 Handlers
  // ============================================================
  function handleChange<K extends keyof AdminConfigForm>(
    field: K,
    value: AdminConfigForm[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // ============================================================
  // Footer Links Editor (simples)
  // ============================================================
  const footerLinks = useMemo<FooterLinkItem[]>(() => {
    const raw = (settings as any)?.footer_links;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as FooterLinkItem[];
    return [];
  }, [settings]);

  function addFooterLink() {
    const next: FooterLinkItem[] = [
      ...footerLinks,
      { label: "", href: "", highlight: false },
    ];
    setSettings((prev: any) => ({ ...prev, footer_links: next }));
  }

  function removeFooterLink(index: number) {
    const next = footerLinks.filter((_, i) => i !== index);
    setSettings((prev: any) => ({ ...prev, footer_links: next }));
  }

  function updateFooterLink(index: number, patch: Partial<FooterLinkItem>) {
    const next = footerLinks.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    setSettings((prev: any) => ({ ...prev, footer_links: next }));
  }

  // ============================================================
  // 🖼️ Upload Logo (FormData)
  // POST /api/admin/shop-config/upload/logo
  // ============================================================
  async function uploadLogo() {
    if (!logoFile) return;

    const MAX_MB = 2;
    const maxBytes = MAX_MB * 1024 * 1024;
    if (logoFile.size > maxBytes) {
      toast.error("Arquivo muito grande. Envie até 2MB.");
      return;
    }

    setLogoUploading(true);
    const tId = toast.loading("Enviando logo...");
    try {
      const fd = new FormData();
      fd.append("logo", logoFile);

      const res = await fetch(`${API_BASE}/api/admin/shop-config/upload/logo`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "Falha ao enviar logo.");

      setSettings((prev: any) => ({ ...prev, logo_url: data.logo_url }));
      setBaseline((prev: any) => ({ ...prev, logo_url: data.logo_url }));
      setLogoFile(null);

      toast.success("Logo enviada com sucesso!", { id: tId });
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar logo.", { id: tId });
    } finally {
      setLogoUploading(false);
    }
  }

  const logoPreviewSrc =
    settings?.logo_url && typeof settings.logo_url === "string"
      ? settings.logo_url.startsWith("http")
        ? settings.logo_url
        : `${API_BASE}${settings.logo_url}`
      : null;

  // ============================================================
  // 🔐 Salvar configurações
  // - Envia SOMENTE campos alterados (não obriga preencher tudo)
  // - Mostra ação (loading + toast + scroll)
  // ============================================================
  async function saveConfig(source: "top" | "bottom") {
    try {
      source === "top" ? setSavingTop(true) : setSavingBottom(true);

      const changed = pickChangedFields(settings, baseline);

      if (Object.keys(changed).length === 0) {
        toast("Nenhuma alteração para salvar.", { icon: "ℹ️" } as any);
        return;
      }

      const tId = toast.loading("Salvando alterações...");

      const res = await fetch(`${API_BASE}/api/admin/config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sessão expirada. Faça login novamente.", { id: tId });
        router.push("/admin/login");
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Erro ao salvar as configurações.");
      }

      setBaseline(settings);
      toast.success("Configurações salvas com sucesso!", { id: tId });

      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao salvar as configurações.");
    } finally {
      source === "top" ? setSavingTop(false) : setSavingBottom(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div
        ref={topRef}
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-6 sm:px-6 lg:px-8"
      >
        {/* HEADER */}
        <header className="relative rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-4 shadow-lg shadow-emerald-900/20 sm:px-6 lg:px-7">
          <div className="absolute right-3 top-3 flex sm:hidden">
            <CloseButton />
          </div>

          <div className="pr-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#38bdf8]/80">
              Painel Admin
            </p>

            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
                  Configurações da Loja
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  No topo você ajusta apenas a identidade (nome + logo). No footer
                  ficam os dados públicos (CNPJ, e-mail, redes, links e endereço).
                </p>

                {loading && (
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Carregando configurações...
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-col items-stretch gap-2 sm:mt-0 sm:items-end">
                <CustomButton
                  label="Painel de configuração de categorias"
                  href="/admin/configuracoes/categorias"
                  variant="secondary"
                  size="small"
                  isLoading={false}
                />
                <p className="text-[11px] text-slate-500">
                  Gerencie as categorias exibidas no site.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* FORM */}
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-xl shadow-black/30 backdrop-blur-sm sm:p-6 lg:p-7">
          {/* PRIMEIRA LINHA: Identidade + Checkout */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
            {/* IDENTIDADE DA LOJA */}
            <section className="space-y-5 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                    Identidade da Loja
                  </h2>
                  <p className="text-xs text-slate-400">
                    Aqui você muda apenas o nome e a logo (o nome também muda o título da aba).
                  </p>
                </div>
                <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline">
                  Marca
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormattedInput
                  label="Nome da loja"
                  name="store_name"
                  value={settings.store_name ?? ""}
                  mask="none"
                  variant="dark"
                  placeholder="Kavita"
                  helperText="Aparece no site e no título da aba."
                  onChange={(e) => handleChange("store_name", e.target.value)}
                />

                {/* Logo upload */}
                <div>
                  <label className="text-sm text-gray-200">Logo (upload)</label>

                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800/70 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-800"
                    />

                    <button
                      type="button"
                      onClick={uploadLogo}
                      disabled={!logoFile || logoUploading}
                      className="rounded bg-emerald-600 px-4 py-2 disabled:opacity-50"
                    >
                      {logoUploading ? "Enviando..." : "Enviar"}
                    </button>
                  </div>

                  {logoPreviewSrc ? (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400">Preview:</p>
                      <img
                        src={logoPreviewSrc}
                        alt="Logo da loja"
                        style={{ height: 60, width: "auto" }}
                      />
                    </div>
                  ) : null}

                  <p className="mt-2 text-xs text-gray-400">PNG/JPG/WEBP até 2MB.</p>
                </div>
              </div>
            </section>

            {/* CHECKOUT */}
            <section className="space-y-5 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                    Checkout
                  </h2>
                  <p className="text-xs text-slate-400">
                    Regras para finalizar pedidos, cupons e carrinho abandonado.
                  </p>
                </div>
                <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 lg:inline">
                  Experiência do cliente
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
                <ToggleItem
                  label="Exigir CPF no checkout"
                  description="O cliente precisa informar CPF para concluir o pedido."
                  checked={!!settings.checkout_require_cpf}
                  onChange={(value) => handleChange("checkout_require_cpf", value)}
                />

                <ToggleItem
                  label="Exigir endereço completo"
                  description="Obrigar cadastro de endereço para concluir o pedido."
                  checked={!!settings.checkout_require_address}
                  onChange={(value) => handleChange("checkout_require_address", value)}
                />

                <ToggleItem
                  label="Permitir retirada na loja / fazenda"
                  description="Adiciona a opção de retirada em vez de entrega."
                  checked={!!settings.checkout_allow_pickup}
                  onChange={(value) => handleChange("checkout_allow_pickup", value)}
                />

                <ToggleItem
                  label="Habilitar uso de cupons"
                  description="Permite que o cliente aplique cupons no carrinho."
                  checked={!!settings.checkout_enable_coupons}
                  onChange={(value) => handleChange("checkout_enable_coupons", value)}
                />

                <ToggleItem
                  label="Ativar recuperação de carrinho abandonado"
                  description="Usado junto com o módulo de carrinhos abandonados."
                  checked={!!settings.checkout_enable_abandoned_cart}
                  onChange={(value) =>
                    handleChange("checkout_enable_abandoned_cart", value)
                  }
                />
              </div>
            </section>
          </div>

          {/* BOTÃO DE CIMA (SALVAR TOPO) */}
          <div className="flex items-center justify-end border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => saveConfig("top")}
              disabled={savingTop || loading}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {savingTop ? "Salvando..." : "Salvar alterações (Topo)"}
            </button>
          </div>

          {/* ============================================================
              FOOTER
             ============================================================ */}
          <section className="space-y-5 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                  Footer
                </h2>
                <p className="text-xs text-slate-400">
                  Dados que aparecem no rodapé do site (contato, endereço, redes, CTA e links).
                </p>
              </div>
              <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline">
                Público (site)
              </span>
            </div>

            {/* 1) Contato / Redes / Texto */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormattedInput
                label="Tagline (texto do rodapé)"
                name="footer_tagline"
                value={(settings as any).footer_tagline ?? ""}
                mask="none"
                variant="dark"
                placeholder="Conectando você ao melhor da agropecuária..."
                onChange={(e) =>
                  handleChange("footer_tagline" as any, e.target.value as any)
                }
              />

              <FormattedInput
                label="WhatsApp (rodapé)"
                name="contact_whatsapp"
                value={(settings as any).contact_whatsapp ?? ""}
                mask="telefone"
                variant="dark"
                type="tel"
                placeholder="(31) 99999-9999"
                onChange={(e) =>
                  handleChange("contact_whatsapp" as any, e.target.value as any)
                }
              />

              <FormattedInput
                label="E-mail (rodapé)"
                name="contact_email"
                value={(settings as any).contact_email ?? ""}
                mask="email"
                variant="dark"
                type="email"
                placeholder="contato@kavita.com.br"
                onChange={(e) =>
                  handleChange("contact_email" as any, e.target.value as any)
                }
              />

              <FormattedInput
                label="CNPJ (rodapé)"
                name="cnpj"
                value={(settings as any).cnpj ?? ""}
                mask="cnpj"
                variant="dark"
                placeholder="00.000.000/0000-00"
                onChange={(e) => handleChange("cnpj" as any, e.target.value as any)}
              />

              <FormattedInput
                label="Instagram URL"
                name="social_instagram_url"
                value={(settings as any).social_instagram_url ?? ""}
                mask="none"
                variant="dark"
                placeholder="https://instagram.com/sua-loja"
                onChange={(e) =>
                  handleChange(
                    "social_instagram_url" as any,
                    e.target.value as any
                  )
                }
              />

              <FormattedInput
                label="WhatsApp URL (wa.me)"
                name="social_whatsapp_url"
                value={(settings as any).social_whatsapp_url ?? ""}
                mask="none"
                variant="dark"
                placeholder="https://wa.me/5531999999999"
                helperText="Se você preencher, será usado no ícone do WhatsApp do Footer."
                onChange={(e) =>
                  handleChange(
                    "social_whatsapp_url" as any,
                    e.target.value as any
                  )
                }
              />
            </div>

            {/* 2) Endereço (Sede) — card separado (correto) */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-50">
                  Endereço (Sede)
                </p>
                <p className="text-xs text-slate-400">
                  Aparece no rodapé como endereço da loja/sede (opcional).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormattedInput
                  label="Cidade (Sede)"
                  name="address_city"
                  value={(settings as any).address_city ?? ""}
                  mask="none"
                  variant="dark"
                  placeholder="Ex: Santana do Mucuri"
                  onChange={(e) =>
                    handleChange("address_city" as any, e.target.value as any)
                  }
                />

                <FormattedInput
                  label="Estado (UF)"
                  name="address_state"
                  value={(settings as any).address_state ?? ""}
                  mask="none"
                  variant="dark"
                  placeholder="Ex: MG"
                  onChange={(e) =>
                    handleChange(
                      "address_state" as any,
                      (e.target.value || "").toUpperCase().slice(0, 2) as any
                    )
                  }
                />

                <FormattedInput
                  label="Rua / Avenida"
                  name="address_street"
                  value={(settings as any).address_street ?? ""}
                  mask="none"
                  variant="dark"
                  placeholder="Ex: Rua Central, 123"
                  onChange={(e) =>
                    handleChange("address_street" as any, e.target.value as any)
                  }
                />

                <FormattedInput
                  label="Bairro"
                  name="address_neighborhood"
                  value={(settings as any).address_neighborhood ?? ""}
                  mask="none"
                  variant="dark"
                  placeholder="Ex: Centro"
                  onChange={(e) =>
                    handleChange(
                      "address_neighborhood" as any,
                      e.target.value as any
                    )
                  }
                />

                <FormattedInput
                  label="CEP"
                  name="address_zip"
                  value={(settings as any).address_zip ?? ""}
                  mask="none"
                  variant="dark"
                  placeholder="Ex: 39860-000"
                  onChange={(e) =>
                    handleChange("address_zip" as any, e.target.value as any)
                  }
                />
              </div>
            </div>

            {/* 3) CTA + Links */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* CTA parceiros */}
              <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      CTA de parceiros
                    </p>
                    <p className="text-xs text-slate-400">
                      Ativa o bloco “É profissional do campo?” no rodapé.
                    </p>
                  </div>
                  <TogglePill
                    checked={!!(settings as any).footer_partner_cta_enabled}
                    onChange={(v) =>
                      handleChange("footer_partner_cta_enabled" as any, v as any)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <FormattedInput
                    label="Título"
                    name="footer_partner_cta_title"
                    value={(settings as any).footer_partner_cta_title ?? ""}
                    mask="none"
                    variant="dark"
                    placeholder="É profissional do campo?"
                    onChange={(e) =>
                      handleChange(
                        "footer_partner_cta_title" as any,
                        e.target.value as any
                      )
                    }
                  />

                  <div>
                    <label className="text-sm text-gray-200">Texto</label>
                    <textarea
                      value={(settings as any).footer_partner_cta_text ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "footer_partner_cta_text" as any,
                          e.target.value as any
                        )
                      }
                      placeholder="Veterinário, agrônomo, mecânico..."
                      className="mt-2 w-full min-h-[90px] rounded-xl border border-slate-800/80 bg-slate-950/50 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Dica: mantenha o texto curto para ficar elegante no rodapé.
                    </p>
                  </div>

                  <FormattedInput
                    label="Link (href)"
                    name="footer_partner_cta_href"
                    value={(settings as any).footer_partner_cta_href ?? ""}
                    mask="none"
                    variant="dark"
                    placeholder="/trabalhe-conosco"
                    onChange={(e) =>
                      handleChange(
                        "footer_partner_cta_href" as any,
                        e.target.value as any
                      )
                    }
                  />
                </div>
              </div>

              {/* Links do footer */}
              <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      Links do Footer
                    </p>
                    <p className="text-xs text-slate-400">
                      Lista dinâmica exibida em “Navegação”.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addFooterLink}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Adicionar link
                  </button>
                </div>

                {footerLinks.length === 0 ? (
                  <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4">
                    <p className="text-xs text-slate-400">
                      Nenhum link configurado. Clique em{" "}
                      <span className="font-semibold text-slate-200">
                        “Adicionar link”
                      </span>{" "}
                      para criar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {footerLinks.map((item, idx) => (
                      <div
                        key={`${idx}-${item.label}-${item.href}`}
                        className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4"
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FormattedInput
                            label="Label"
                            name={`footer_links_label_${idx}`}
                            value={item.label ?? ""}
                            mask="none"
                            variant="dark"
                            placeholder="Home"
                            onChange={(e) =>
                              updateFooterLink(idx, { label: e.target.value })
                            }
                          />

                          <FormattedInput
                            label="Href"
                            name={`footer_links_href_${idx}`}
                            value={item.href ?? ""}
                            mask="none"
                            variant="dark"
                            placeholder="/"
                            onChange={(e) =>
                              updateFooterLink(idx, { href: e.target.value })
                            }
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={!!item.highlight}
                              onChange={(e) =>
                                updateFooterLink(idx, {
                                  highlight: e.target.checked,
                                })
                              }
                              className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                            />
                            Highlight (destaque)
                          </label>

                          <button
                            type="button"
                            onClick={() => removeFooterLink(idx)}
                            className="rounded-lg bg-rose-600/90 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-slate-500">
                  Os links são salvos como JSON no banco ({`{ label, href, highlight }`}).
                </p>
              </div>
            </div>
          </section>

          {/* BOTÃO DE BAIXO (SALVAR FINAL) */}
          <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500">
              Você pode salvar apenas o que mudou. Não é obrigatório preencher todos os campos.
            </p>

            <button
              type="button"
              onClick={() => saveConfig("bottom")}
              disabled={savingBottom || loading}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {savingBottom ? "Salvando..." : "Salvar alterações (Final)"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle padrão                                                       */
/* ------------------------------------------------------------------ */

type ToggleItemProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function ToggleItem({ label, description, checked, onChange }: ToggleItemProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-3 text-left shadow-sm transition hover:border-emerald-400 hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-50">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        )}
      </div>
      <span
        className={`inline-flex h-6 w-11 items-center rounded-full border shadow-inner transition ${
          checked
            ? "border-emerald-400 bg-emerald-500/80"
            : "border-slate-500 bg-slate-700"
        }`}
      >
        <span
          className={`ml-[2px] inline-block h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle compacto (pill)                                              */
/* ------------------------------------------------------------------ */

function TogglePill({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex h-7 w-12 items-center rounded-full border shadow-inner transition ${
        checked
          ? "border-emerald-400 bg-emerald-500/80"
          : "border-slate-500 bg-slate-700"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`ml-[2px] inline-block h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
