"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { AdminConfig } from "../../../types/adminConfig";
import FormattedInput from "@/components/layout/FormattedInput";

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
                    checkout_enable_abandoned_cart:
                        !!data.checkout_enable_abandoned_cart,

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
        <main className="flex min-h-screen w-full flex-1 flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-6 sm:px-6 lg:px-8">
                {/* HEADER */}
                <header className="relative rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-4 shadow-lg shadow-emerald-900/20 sm:px-6 lg:px-7">
                    {/* X fixo no canto superior direito (apenas mobile) */}
                    <div className="absolute right-3 top-3 flex sm:hidden">
                        <CloseButton />
                    </div>

                    {/* Texto do header com padding à direita para não ficar embaixo do X */}
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
                                    Ajuste dados gerais, checkout, frete, pagamento e comunicação
                                    com o cliente em um só lugar.
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

                {/* FORM / LAYOUT NOVO */}
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-xl shadow-black/30 backdrop-blur-sm sm:p-6 lg:p-7"
                >
                    {/* PRIMEIRA LINHA: Dados da Loja + Checkout */}
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
                        {/* COLUNA ESQUERDA – DADOS DA LOJA */}
                        <section className="space-y-5 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                        Dados da Loja
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Nome, identificador e dados de contato usados no site e nas
                                        notificações de pedido.
                                    </p>
                                </div>
                                <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline">
                                    Identidade da marca
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Nome */}
                                <FormattedInput
                                    label="Nome da loja"
                                    name="store_name"
                                    value={settings.store_name ?? ""}
                                    mask="none"
                                    variant="dark"
                                    placeholder="Kavita Agropecuária"
                                    onChange={(e) => handleChange("store_name", e.target.value)}
                                />

                                {/* Slug */}
                                <FormattedInput
                                    label="Slug / identificador"
                                    name="store_slug"
                                    value={settings.store_slug ?? ""}
                                    mask="none"
                                    variant="dark"
                                    placeholder="kavita-agro"
                                    helperText="Usado em integrações, URLs amigáveis e identificação interna."
                                    onChange={(e) => handleChange("store_slug", e.target.value)}
                                />

                                {/* CNPJ */}
                                <FormattedInput
                                    label="CNPJ"
                                    name="cnpj"
                                    value={settings.cnpj ?? ""}
                                    mask="cnpj"
                                    variant="dark"
                                    placeholder="00.000.000/0000-00"
                                    onChange={(e) => handleChange("cnpj", e.target.value)}
                                />

                                {/* WhatsApp */}
                                <FormattedInput
                                    label="WhatsApp principal"
                                    name="main_whatsapp"
                                    value={settings.main_whatsapp ?? ""}
                                    mask="telefone"
                                    variant="dark"
                                    type="tel"
                                    placeholder="(00) 90000-0000"
                                    helperText="Usado para links de WhatsApp e mensagens transacionais."
                                    onChange={(e) =>
                                        handleChange("main_whatsapp", e.target.value)
                                    }
                                />

                                {/* Email */}
                                <FormattedInput
                                    label="E-mail principal"
                                    name="main_email"
                                    value={settings.main_email ?? ""}
                                    mask="email"
                                    variant="dark"
                                    type="email"
                                    placeholder="contato@kavita.com"
                                    onChange={(e) => handleChange("main_email", e.target.value)}
                                />

                                {/* Logo */}
                                <FormattedInput
                                    label="Logo (URL)"
                                    name="logo_url"
                                    value={settings.logo_url ?? ""}
                                    mask="none"
                                    variant="dark"
                                    placeholder="https://..."
                                    helperText="URL da imagem usada no topo do site, e-mails e WhatsApp."
                                    onChange={(e) => handleChange("logo_url", e.target.value)}
                                />
                            </div>
                        </section>

                        {/* COLUNA DIREITA – CHECKOUT / REGRAS */}
                        <section className="space-y-5 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                                        Checkout
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Defina as regras para finalizar pedidos, uso de cupons e
                                        recuperação de carrinhos abandonados.
                                    </p>
                                </div>
                                <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 lg:inline">
                                    Experiência do cliente
                                </span>
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
                                    description="Usado junto com o módulo de carrinhos abandonados."
                                    checked={!!settings.checkout_enable_abandoned_cart}
                                    onChange={(value) =>
                                        handleChange("checkout_enable_abandoned_cart", value)
                                    }
                                />
                            </div>
                        </section>
                    </div>

                    {/* (restante da página permanece igual...) */}

                    {/* SEGUNDA LINHA: Pagamentos + Frete + Comunicação + SEO */}
                    {/* ... TODO: código igual ao seu arquivo atual, não alterei nada aqui ... */}

                    {/* Rodapé do form */}
                    <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[11px] text-slate-500">
                            Essas configurações impactam o fluxo de checkout, frete, meios de
                            pagamento e visibilidade da sua loja. Revise com cuidado antes de
                            publicar.
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
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-3 text-left shadow-sm transition hover:border-emerald-400 hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-50">{label}</p>
                {description && (
                    <p className="mt-0.5 text-xs text-slate-400">{description}</p>
                )}
            </div>
            <span
                className={`inline-flex h-6 w-11 items-center rounded-full border shadow-inner transition ${checked
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
