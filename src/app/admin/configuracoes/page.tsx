"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import type { AdminConfig } from "../../../types/adminConfig";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Form vai trabalhar com um subset de AdminConfig
type AdminConfigForm = Partial<AdminConfig>;

function getAdminToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("adminToken");
}

export default function ConfiguracoesPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<AdminConfigForm>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);

    // Carrega configurações ao abrir a página
    useEffect(() => {
        const token = getAdminToken();
        if (!token) {
            setLoading(false);
            toast.error("Faça login no painel admin.");
            router.push("/admin/login");
            return;
        }

        async function loadConfig() {
            try {
                setLoading(true);
                const res = await axios.get<AdminConfig>(
                    `${API_BASE}/api/admin/config`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        withCredentials: true,
                    }
                );

                const data = res.data || ({} as AdminConfig);

                setSettings({
                    ...data,
                    // garante booleano e número mesmo se vier null/undefined
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
                });
            } catch (err) {
                console.error(err);
                toast.error("Não foi possível carregar as configurações.");
            } finally {
                setLoading(false);
            }
        }

        loadConfig();
    }, [router]);

    function handleChange<K extends keyof AdminConfigForm>(
        field: K,
        value: AdminConfigForm[K]
    ) {
        setSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    const handleNumberChange =
        (field: keyof AdminConfigForm) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                handleChange(field, value === "" ? 0 : Number(value));
            };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const token = getAdminToken();
        if (!token) {
            toast.error("Faça login no painel admin.");
            return;
        }

        try {
            setSaving(true);

            await axios.put(`${API_BASE}/api/admin/config`, settings, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            toast.success("Configurações salvas com sucesso!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar as configurações.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="flex w-full flex-1 flex-col bg-slate-950 text-slate-50">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-5 sm:px-4 lg:px-6">
                {/* HEADER */}
                <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* X fixo no canto superior direito (apenas mobile) */}
                    <div className="absolute right-0 top-0 flex sm:hidden">
                        <CloseButton />
                    </div>

                    {/* Texto do header com padding à direita para não ficar embaixo do X */}
                    <div className="pr-10">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
                            Painel Admin
                        </p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
                            Configurações da Loja
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-300">
                            Ajuste dados gerais da loja, regras de checkout, frete, formas de
                            pagamento e comunicação com o cliente.
                        </p>

                        {loading && (
                            <p className="mt-2 text-xs text-slate-400">
                                Carregando configurações...
                            </p>
                        )}
                    </div>
                </header>


                {/* FORM / LAYOUT NOVO */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-sm sm:p-6 lg:p-7"
                >
                    {/* PRIMEIRA LINHA: Dados da Loja + Checkout */}
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                        {/* COLUNA ESQUERDA – DADOS DA LOJA */}
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                    Dados da Loja
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Nome, identificador e dados de contato usados no site e nas
                                    notificações de pedido.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Nome */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Nome da loja
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.store_name ?? ""}
                                        onChange={(e) =>
                                            handleChange("store_name", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Kavita Agropecuária"
                                    />
                                </div>

                                {/* Slug */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Slug / identificador
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.store_slug ?? ""}
                                        onChange={(e) =>
                                            handleChange("store_slug", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="kavita-agro"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Usado em integrações, URLs amigáveis e identificação
                                        interna.
                                    </p>
                                </div>

                                {/* CNPJ */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        CNPJ
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.cnpj ?? ""}
                                        onChange={(e) => handleChange("cnpj", e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

                                {/* WhatsApp */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        WhatsApp principal
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.main_whatsapp ?? ""}
                                        onChange={(e) =>
                                            handleChange("main_whatsapp", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="(00) 90000-0000"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Usado para links de WhatsApp no site e em mensagens
                                        transacionais.
                                    </p>
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        E-mail principal
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.main_email ?? ""}
                                        onChange={(e) =>
                                            handleChange("main_email", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="contato@kavita.com"
                                    />
                                </div>

                                {/* Logo */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Logo (URL)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.logo_url ?? ""}
                                        onChange={(e) => handleChange("logo_url", e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="https://..."
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        URL da imagem usada no topo do site, e-mails e WhatsApp.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* COLUNA DIREITA – CHECKOUT / REGRAS */}
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                    Checkout
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Regras para finalização do pedido, uso de cupons e recuperação
                                    de carrinhos abandonados.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
                                {/* Exigir CPF */}
                                <ToggleItem
                                    label="Exigir CPF no checkout"
                                    description="O cliente precisa informar CPF para concluir o pedido."
                                    checked={!!settings.checkout_require_cpf}
                                    onChange={(value) =>
                                        handleChange("checkout_require_cpf", value)
                                    }
                                />

                                {/* Endereço obrigatório */}
                                <ToggleItem
                                    label="Exigir endereço completo"
                                    description="Obrigar cadastro de endereço para concluir o pedido."
                                    checked={!!settings.checkout_require_address}
                                    onChange={(value) =>
                                        handleChange("checkout_require_address", value)
                                    }
                                />

                                {/* Retirada */}
                                <ToggleItem
                                    label="Permitir retirada na loja / fazenda"
                                    description="Adiciona a opção de retirada em vez de entrega."
                                    checked={!!settings.checkout_allow_pickup}
                                    onChange={(value) =>
                                        handleChange("checkout_allow_pickup", value)
                                    }
                                />

                                {/* Cupons */}
                                <ToggleItem
                                    label="Habilitar uso de cupons"
                                    description="Permite que o cliente aplique cupons no carrinho."
                                    checked={!!settings.checkout_enable_coupons}
                                    onChange={(value) =>
                                        handleChange("checkout_enable_coupons", value)
                                    }
                                />

                                {/* Carrinho abandonado */}
                                <ToggleItem
                                    label="Ativar recuperação de carrinho abandonado"
                                    description="Usado junto com a tela de carrinhos abandonados para enviar lembretes."
                                    checked={!!settings.checkout_enable_abandoned_cart}
                                    onChange={(value) =>
                                        handleChange("checkout_enable_abandoned_cart", value)
                                    }
                                />
                            </div>
                        </section>
                    </div>

                    {/* SEGUNDA LINHA: Pagamentos + Frete + Comunicação + SEO */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        {/* PAGAMENTOS */}
                        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                    Pagamentos (Mercado Pago)
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Controle quais meios de pagamento aparecem no checkout e
                                    configure as credenciais do Mercado Pago.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <ToggleItem
                                    label="PIX habilitado"
                                    checked={!!settings.payment_pix_enabled}
                                    onChange={(value) =>
                                        handleChange("payment_pix_enabled", value)
                                    }
                                />
                                <ToggleItem
                                    label="Cartão habilitado"
                                    checked={!!settings.payment_card_enabled}
                                    onChange={(value) =>
                                        handleChange("payment_card_enabled", value)
                                    }
                                />
                                <ToggleItem
                                    label="Boleto habilitado"
                                    checked={!!settings.payment_boleto_enabled}
                                    onChange={(value) =>
                                        handleChange("payment_boleto_enabled", value)
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Public Key (Mercado Pago)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.mp_public_key ?? ""}
                                        onChange={(e) =>
                                            handleChange("mp_public_key", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Access Token (Mercado Pago)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.mp_access_token ?? ""}
                                        onChange={(e) =>
                                            handleChange("mp_access_token", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Auto Return
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.mp_auto_return ?? ""}
                                        onChange={(e) =>
                                            handleChange("mp_auto_return", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="approved"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Modo Sandbox
                                    </label>
                                    <ToggleItem
                                        label="Usar modo de teste (sandbox)"
                                        checked={!!settings.mp_sandbox_mode}
                                        onChange={(value) =>
                                            handleChange("mp_sandbox_mode", value)
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        {/* FRETE + COMUNICAÇÃO + SEO/Analytics */}
                        <div className="space-y-4">
                            {/* FRETE */}
                            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                        Frete
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Configure frete fixo, frete grátis e texto das regiões
                                        atendidas.
                                    </p>
                                </div>

                                <ToggleItem
                                    label="Ativar frete fixo"
                                    checked={!!settings.shipping_flat_enabled}
                                    onChange={(value) =>
                                        handleChange("shipping_flat_enabled", value)
                                    }
                                />

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-200">
                                            Valor frete fixo (R$)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.shipping_flat_value ?? 0}
                                            onChange={handleNumberChange("shipping_flat_value")}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-200">
                                            Frete grátis acima de (R$)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.shipping_free_over ?? 0}
                                            onChange={handleNumberChange("shipping_free_over")}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Regiões atendidas (texto)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.shipping_region_text ?? ""}
                                        onChange={(e) =>
                                            handleChange("shipping_region_text", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Ex: MG, ES, RJ e sul da Bahia"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Prazo de entrega (texto)
                                    </label>
                                    <textarea
                                        value={settings.shipping_deadline_text ?? ""}
                                        onChange={(e) =>
                                            handleChange("shipping_deadline_text", e.target.value)
                                        }
                                        className="w-full min-h-[70px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Ex: Entrega em até 5 dias úteis."
                                    />
                                </div>
                            </section>

                            {/* COMUNICAÇÃO */}
                            <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                        Comunicação
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Define se a loja pode enviar e-mails e mensagens de WhatsApp
                                        transacionais.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <ToggleItem
                                        label="Habilitar envio de e-mails"
                                        checked={!!settings.comm_email_enabled}
                                        onChange={(value) =>
                                            handleChange("comm_email_enabled", value)
                                        }
                                    />
                                    <ToggleItem
                                        label="Habilitar envio de WhatsApp"
                                        checked={!!settings.comm_whatsapp_enabled}
                                        onChange={(value) =>
                                            handleChange("comm_whatsapp_enabled", value)
                                        }
                                    />
                                </div>
                            </section>

                            {/* SEO / Analytics */}
                            <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                        SEO & Analytics
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Título e descrição usados nos buscadores, e códigos de
                                        rastreamento.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Título SEO (home)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.seo_title ?? ""}
                                        onChange={(e) =>
                                            handleChange("seo_title", e.target.value)
                                        }
                                        maxLength={160}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-200">
                                        Descrição SEO (home)
                                    </label>
                                    <textarea
                                        value={settings.seo_description ?? ""}
                                        onChange={(e) =>
                                            handleChange("seo_description", e.target.value)
                                        }
                                        maxLength={255}
                                        className="w-full min-h-[70px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-200">
                                            Google Analytics ID
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.google_analytics_id ?? ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    "google_analytics_id",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="G-XXXXXXX"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-200">
                                            Facebook Pixel ID
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.facebook_pixel_id ?? ""}
                                            onChange={(e) =>
                                                handleChange(
                                                    "facebook_pixel_id",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="XXXXXXXXXXXXX"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Rodapé do form */}
                    <div className="flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[11px] text-slate-500">
                            Essas configurações impactam o fluxo de checkout, frete, meios de
                            pagamento e visibilidade da sua loja.
                        </p>
                        <CustomButton
                            label={saving ? "Salvando..." : "Salvar alterações"}
                            size="medium"
                            variant="primary"
                            isLoading={saving}
                        />
                    </div>
                </form>
            </div>
        </main>
    );
}

/* ------------------------------------------------------------------ */
/* Componentinho para os toggles (checkout/pagamento/etc.)            */
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
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-left shadow-sm transition hover:border-emerald-500/80 hover:bg-slate-900"
        >
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-50">{label}</p>
                {description && (
                    <p className="mt-0.5 text-xs text-slate-400">{description}</p>
                )}
            </div>
            <span
                className={`inline-flex h-6 w-11 items-center rounded-full border transition ${checked
                    ? "border-emerald-400 bg-emerald-500/80"
                    : "border-slate-500 bg-slate-700"
                    }`}
            >
                <span
                    className={`ml-[2px] inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-4" : "translate-x-0"
                        }`}
                />
            </span>
        </button>
    );
}
