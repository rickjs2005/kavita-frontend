"use client";

import { useMemo, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { AddressForm } from "@/components/checkout/AddressForm";
import { PaymentMethodForm } from "@/components/checkout/PaymentMethodForm";
import { PersonalInfoForm } from "@/components/checkout/PersonalInfoForm";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import CloseButton from "@/components/buttons/CloseButton";
import LoadingButton from "@/components/buttons/LoadingButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface CheckoutResponse {
  pedido_id: number;
}

interface PaymentResponse {
  init_point?: string;
  sandbox_init_point?: string;
}

interface CartItem {
  id: number;
  name?: string;
  nome?: string;
  price: number;
  quantity: number;
}

interface CouponPreviewResponse {
  success: boolean;
  message?: string;
  desconto?: number;
  total_original?: number;
  total_com_desconto?: number;
  cupom?: {
    id: number;
    codigo: string;
    tipo: string;
    valor: number;
  };
}

/** Promoção vinda da API pública */
type ProductPromotion = {
  id: number;
  product_id?: number;
  title?: string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  ends_at?: string | null;
};

const money = (v: number) =>
  `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

const Icon = {
  user: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5A1.5 1.5 0 0 0 4.5 21h15A1.5 1.5 0 0 0 21 19.5C21 16.5 17 14 12 14Z"
      />
    </svg>
  ),
  pin: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z"
      />
    </svg>
  ),
  card: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM4 6h16v3H4Zm0 12v-7h16v7Z"
      />
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5Z"
      />
    </svg>
  ),
  truck: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M3 6h11v7h-1.5A3.5 3.5 0 0 0 9 16.5 3.5 3.5 0 0 0 12.5 20H13a3 3 0 0 0 3-3h2a2 2 0 0 0 2-2V9h-3l-2-3H3Zm6 10.5A1.5 1.5 0 1 1 10.5 18 1.5 1.5 0 0 1 9 16.5Z"
      />
    </svg>
  ),
  ticket: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M3 6h18v4a2 2 0 0 1 0 4v4H3v-4a2 2 0 0 1 0-4Z"
      />
    </svg>
  ),
};

export default function CheckoutPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { user, logout } = useAuth();
  const userId = user?.id ?? null;
  const isLoggedIn = !!userId;

  const { cartItems, clearCart } = useCart();
  const { formData, updateForm } = useCheckoutForm();

  // -----------------------------
  // PROMOÇÕES POR PRODUTO
  // -----------------------------
  const [promotions, setPromotions] = useState<
    Record<number, ProductPromotion | null>
  >({});

  useEffect(() => {
    if (!cartItems?.length) {
      setPromotions({});
      return;
    }

    const uniqueIds = Array.from(
      new Set(cartItems.map((it) => Number(it.id)))
    ).filter(Boolean);

    (async () => {
      try {
        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await axios.get<ProductPromotion>(
                `${API_BASE}/api/public/promocoes/${id}`
              );
              return { id, promo: res.data };
            } catch (err: any) {
              if (err?.response?.status === 404) {
                // sem promoção para esse produto
                return { id, promo: null };
              }
              console.error(
                "[Checkout] erro ao buscar promoção do produto",
                id,
                err?.response?.data || err
              );
              return { id, promo: null };
            }
          })
        );

        setPromotions((prev) => {
          const next = { ...prev };
          for (const { id, promo } of results) {
            next[id] = promo;
          }
          return next;
        });
      } catch (err) {
        console.error("[Checkout] erro geral ao carregar promoções:", err);
      }
    })();
  }, [cartItems]);

  /** Calcula preço original/final e desconto com base na promoção */
  const getPriceInfo = (item: CartItem) => {
    const basePrice = Number(item.price ?? 0);
    const promo = promotions[item.id];

    if (!promo) {
      return {
        originalPrice: basePrice,
        finalPrice: basePrice,
        discountValue: 0,
        hasDiscount: false,
      };
    }

    const originalFromPromo =
      promo.original_price != null ? Number(promo.original_price) : null;
    const finalFromPromo =
      promo.final_price != null
        ? Number(promo.final_price)
        : promo.promo_price != null
        ? Number(promo.promo_price)
        : null;

    const originalPrice =
      originalFromPromo !== null ? originalFromPromo : basePrice || 0;

    let finalPrice =
      finalFromPromo !== null ? finalFromPromo : originalPrice;

    let discountPercent: number | null = null;

    if (promo) {
      const explicitDiscount =
        promo.discount_percent != null
          ? Number(promo.discount_percent)
          : NaN;

      if (
        finalFromPromo === null &&
        !Number.isNaN(explicitDiscount) &&
        explicitDiscount > 0 &&
        originalPrice > 0
      ) {
        finalPrice = originalPrice * (1 - explicitDiscount / 100);
      }

      if (originalPrice > 0 && finalPrice < originalPrice) {
        discountPercent =
          ((originalPrice - finalPrice) / originalPrice) * 100;
      } else if (!Number.isNaN(explicitDiscount) && explicitDiscount > 0) {
        discountPercent = explicitDiscount;
      }
    }

    const hasDiscount =
      discountPercent !== null &&
      discountPercent > 0 &&
      finalPrice < originalPrice;

    const discountValue = hasDiscount ? originalPrice - finalPrice : 0;

    return {
      originalPrice,
      finalPrice,
      discountValue,
      hasDiscount,
    };
  };

  // -----------------------------
  // CUPOM
  // -----------------------------
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Subtotal SEM cupom (apenas promoções)
  const itemsCount = (cartItems || []).reduce(
    (acc, it) => acc + Number(it?.quantity ?? 0),
    0
  );

  const subtotal = useMemo(
    () =>
      (cartItems || []).reduce((acc, it) => {
        const info = getPriceInfo(it);
        return acc + info.finalPrice * Number(it.quantity ?? 1);
      }, 0),
    [cartItems, promotions]
  );

  const frete = 0;
  const total = Math.max(subtotal + frete - discount, 0);

  // reseta cupom quando subtotal muda (por promo ou quantidade)
  useEffect(() => {
    setDiscount(0);
    setCouponCode("");
    setCouponMessage(null);
    setCouponError(null);
  }, [subtotal]);

  // -----------------------------
  // ENDEREÇO SALVO
  // -----------------------------
  const [usarEnderecoSalvo, setUsarEnderecoSalvo] = useState<boolean>(false);
  const [enderecoSalvo, setEnderecoSalvo] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastOrderAddress: any = null;
    if (userId) {
      const key = `lastOrder_${userId}`;
      try {
        const last = sessionStorage.getItem(key);
        if (last) {
          const parsed = JSON.parse(last);
          if (parsed && parsed.endereco) {
            lastOrderAddress = parsed.endereco;
          }
        }
      } catch {
        // ignora
      }
    }

    if (!userId || !user?.token) {
      if (lastOrderAddress) {
        setEnderecoSalvo(lastOrderAddress);
        setUsarEnderecoSalvo(true);
      } else {
        setEnderecoSalvo(null);
        setUsarEnderecoSalvo(false);
      }
      return;
    }

    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/addresses`, {
          headers: { Authorization: `Bearer ${user.token}` },
          withCredentials: true,
        });

        const list: any[] = Array.isArray(res.data) ? res.data : [];
        const preferred =
          list.find((a: any) => a.is_default === 1) || list[0] || null;

        if (preferred) {
          setEnderecoSalvo({
            cep: preferred.cep,
            logradouro: preferred.endereco,
            numero: preferred.numero,
            bairro: preferred.bairro,
            cidade: preferred.cidade,
            estado: preferred.estado,
            complemento: preferred.complemento,
            referencia: preferred.ponto_referencia,
          });
          setUsarEnderecoSalvo(true);
          return;
        }
      } catch (e) {
        console.error("Erro ao carregar endereços do usuário:", e);
      }

      if (lastOrderAddress) {
        setEnderecoSalvo(lastOrderAddress);
        setUsarEnderecoSalvo(true);
      } else {
        setEnderecoSalvo(null);
        setUsarEnderecoSalvo(false);
      }
    })();
  }, [userId, user?.token]);

  const normalizeFormaPagamento = (value?: string) => {
    const v = String(value || "").toLowerCase();
    if (v.includes("mercado") || v.includes("cart")) return "mercadopago";
    if (v.includes("pix")) return "pix";
    if (v.includes("boleto")) return "boleto";
    if (v.includes("prazo")) return "prazo";
    return "pix";
  };

  // -----------------------------
  // PAYLOAD (usa total com promo+cupom)
  // -----------------------------
  const payload = useMemo(() => {
    const enderecoSelecionado =
      usarEnderecoSalvo && enderecoSalvo
        ? enderecoSalvo
        : formData?.endereco || {};

    const endereco = enderecoSelecionado || {};
    const formaPagamento = normalizeFormaPagamento(formData?.formaPagamento);

    const nome = String(formData?.nome || "").trim();
    const cpfDigits = String(formData?.cpf || "").replace(/\D/g, "");
    const telefoneDigits = String(formData?.telefone || "").replace(/\D/g, "");
    const email = String(formData?.email || "").trim();

    return {
      usuario_id: userId ? Number(userId) : undefined,
      endereco: {
        cep: endereco?.cep || "",
        rua: endereco?.logradouro || endereco?.rua || "",
        numero: endereco?.numero || "",
        bairro: endereco?.bairro || "",
        cidade: endereco?.cidade || "",
        estado: endereco?.estado || "",
        complemento:
          endereco?.referencia || endereco?.complemento || null,
      },
      formaPagamento,
      produtos: (cartItems || []).map((i: CartItem) => ({
        id: Number(i.id),
        quantidade: Number(i.quantity ?? 1),
      })),
      total: Number(total || 0),
      nome,
      cpf: cpfDigits,
      telefone: telefoneDigits,
      email,
      cupom_codigo: couponCode ? couponCode.trim() : undefined,
    };
  }, [
    userId,
    formData,
    cartItems,
    usarEnderecoSalvo,
    enderecoSalvo,
    total,
    couponCode,
  ]);

  // -----------------------------
  // APLICAR CUPOM (usa subtotal com promo)
  // -----------------------------
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite o código do cupom.");
      return;
    }

    if (!isLoggedIn) {
      toast.error("Você precisa estar logado para aplicar um cupom.");
      router.push("/login");
      return;
    }

    const subtotalAtual = Number(subtotal || 0);
    if (!subtotalAtual || subtotalAtual <= 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError(null);
      setCouponMessage(null);

      const token = user?.token ?? null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const { data } = await axios.post<CouponPreviewResponse>(
        `${API_BASE}/api/checkout/preview-cupom`,
        {
          codigo: couponCode.trim(),
          total: subtotalAtual,
        },
        { headers }
      );

      if (!data?.success) {
        const msg =
          data?.message || "Não foi possível aplicar este cupom.";
        setDiscount(0);
        setCouponError(msg);
        toast.error(msg);
        return;
      }

      const desconto = Number(data.desconto || 0);
      setDiscount(desconto > 0 ? desconto : 0);

      const msg = data.message || "Cupom aplicado com sucesso!";
      setCouponMessage(msg);
      setCouponError(null);
      toast.success(msg);
    } catch (err: any) {
      const msgBackend = err?.response?.data?.message;
      const msg = msgBackend || "Não foi possível aplicar este cupom.";
      setDiscount(0);
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  // -----------------------------
  // FINALIZAR CHECKOUT
  // -----------------------------
  const handleSubmit = async () => {
    if (submitting) return;

    if (!isLoggedIn) {
      toast.error("Você precisa estar logado para finalizar a compra.");
      router.push("/login");
      return;
    }

    if (!payload.produtos?.length) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    const errors: string[] = [];

    if (!payload.nome) {
      errors.push("Informe o nome do cliente.");
    }

    if (!payload.cpf) {
      errors.push("Informe o CPF.");
    } else if (payload.cpf.length !== 11) {
      errors.push("CPF deve ter exatamente 11 dígitos numéricos.");
    }

    if (!payload.telefone) {
      errors.push("Informe o WhatsApp.");
    } else if (payload.telefone.length < 10) {
      errors.push("WhatsApp deve ter pelo menos 10 dígitos.");
    }

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    try {
      setSubmitting(true);

      const token = user?.token ?? null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const { data } = await axios.post<CheckoutResponse>(
        `${API_BASE}/api/checkout`,
        payload,
        { headers }
      );
      const pedidoId = data.pedido_id;

      if (typeof window !== "undefined" && payload.usuario_id) {
        const key = `lastOrder_${payload.usuario_id}`;
        sessionStorage.setItem(
          key,
          JSON.stringify({
            id: pedidoId,
            usuario_id: payload.usuario_id,
            email: payload.email,
            cpf: payload.cpf,
            nome: payload.nome,
            endereco: payload.endereco,
            produtos: payload.produtos,
            total: payload.total,
            formaPagamento: payload.formaPagamento,
            criadoEm: new Date().toISOString(),
          })
        );
      }

      const isGatewayPayment = ["mercadopago", "pix", "boleto"].includes(
        payload.formaPagamento
      );

      if (isGatewayPayment) {
        const res = await axios.post<PaymentResponse>(
          `${API_BASE}/api/payment/start`,
          { pedidoId }
        );

        const initPoint =
          res.data?.init_point || res.data?.sandbox_init_point || null;

        clearCart?.();

        if (initPoint) {
          window.location.href = initPoint;
          return;
        }

        toast.error(
          "Não foi possível abrir a tela de pagamento. Tente novamente."
        );
        return;
      }

      clearCart?.();
      toast.success("Pedido criado com sucesso!");
      router.push(`/pedidos/${pedidoId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const msgBackend = err?.response?.data?.message as string | undefined;

      if (
        status === 401 ||
        status === 403 ||
        (msgBackend && msgBackend.toLowerCase().includes("token"))
      ) {
        toast.error(
          msgBackend ||
            "Sua sessão expirou. Faça login novamente para finalizar a compra."
        );

        try {
          logout();
        } catch {
          /* ignore */
        }

        router.push("/login");
        return;
      }

      const msg =
        msgBackend ||
        "Erro ao finalizar a compra. Verifique os dados e tente novamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ==============================
  // Tela para usuário não logado
  // ==============================
  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#F7FBFA] via-white to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <CloseButton className="text-2xl sm:text-3xl text-gray-600 hover:text-[#EC5B20]" />
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide text-[#EC5B20] uppercase">
              Checkout
            </h1>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/95 p-6 sm:p-8 shadow-sm text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">
              Faça login para finalizar sua compra
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Para garantir sua segurança e vincular o pedido à sua conta, é
              necessário estar logado antes de concluir o checkout.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#EC5B20] text-white font-semibold text-sm sm:text-base hover:bg-[#d84e1a] transition"
              >
                Ir para login
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-black/10 text-sm sm:text-base font-medium text-gray-700 hover:bg-black/5 transition"
              >
                Voltar para a página inicial
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // Checkout normal (logado)
  // ==============================

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#F7FBFA] via-white to-white">
      {/* Header compacto */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <CloseButton className="text-2xl sm:text-3xl text-gray-600 hover:text-[#EC5B20]" />
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide text-[#EC5B20] uppercase">
              Finalize sua Compra
            </h1>
            <div className="hidden sm:flex gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 rounded-full bg-black/5">Carrinho</span>
              <span>→</span>
              <span className="px-2 py-1 rounded-full bg-[#EC5B20]/10 text-[#EC5B20] font-semibold">
                Checkout
              </span>
              <span>→</span>
              <span className="px-2 py-1 rounded-full bg-black/5">
                Confirmação
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-28 lg:pb-8">
        {/* Coluna esquerda */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Dados pessoais */}
          <section className="rounded-2xl border border-black/10 bg-white/90 shadow-sm overflow-hidden">
            <header className="px-5 sm:px-6 py-3 sm:py-4 border-b border-black/10 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EC5B20]/15 text-[#EC5B20]">
                <Icon.user />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Dados Pessoais
                </h2>
                <p className="text-xs text-gray-500">
                  Informe nome, CPF, WhatsApp e e-mail.
                </p>
              </div>
            </header>
            <div className="p-5 sm:p-6">
              <PersonalInfoForm formData={formData} onChange={updateForm} />
            </div>
          </section>

          {/* Endereço */}
          <section className="rounded-2xl border border-black/10 bg-white/90 shadow-sm overflow-hidden">
            <header className="px-5 sm:px-6 py-3 sm:py-4 border-b border-black/10 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EC5B20]/15 text-[#EC5B20]">
                <Icon.pin />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Endereço de Entrega
                </h2>
                <p className="text-xs text-gray-500">
                  Receba seu pedido no endereço desejado.
                </p>
              </div>
            </header>

            <div className="p-5 sm:p-6">
              {enderecoSalvo && (
                <div className="mb-4 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="enderecoOption"
                      checked={usarEnderecoSalvo}
                      onChange={() => setUsarEnderecoSalvo(true)}
                    />
                    <span className="text-sm text-gray-700">
                      Entregar no endereço salvo:{" "}
                      {`${enderecoSalvo?.rua || enderecoSalvo?.logradouro || ""
                        }, ${enderecoSalvo?.numero || ""} - ${enderecoSalvo?.bairro || ""
                        } - ${enderecoSalvo?.cidade || ""}/${enderecoSalvo?.estado || ""
                        }`}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="enderecoOption"
                      checked={!usarEnderecoSalvo}
                      onChange={() => setUsarEnderecoSalvo(false)}
                    />
                    <span className="text-sm text-gray-700">
                      Entregar em outro endereço
                    </span>
                  </label>
                </div>
              )}

              {(!usarEnderecoSalvo || !enderecoSalvo) && (
                <AddressForm
                  endereco={formData.endereco}
                  onChange={updateForm}
                />
              )}
            </div>
          </section>

          {/* Pagamento + cupom */}
          <section className="rounded-2xl border border-black/10 bg-white/90 shadow-sm overflow-hidden">
            <header className="px-5 sm:px-6 py-3 sm:py-4 border-b border-black/10 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EC5B20]/15 text-[#EC5B20]">
                <Icon.card />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Forma de Pagamento
                </h2>
                <p className="text-xs text-gray-500">
                  Pix, Boleto, Cartão (Mercado Pago) ou Prazo.
                </p>
              </div>
            </header>

            <div className="p-5 sm:p-6">
              <PaymentMethodForm
                formaPagamento={formData.formaPagamento}
                onChange={updateForm}
              />

              {/* CUPOM */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <div className="flex items-center gap-2 border border-dashed border-black/20 rounded-xl px-3">
                  <Icon.ticket />
                  <input
                    placeholder="Possui um cupom?"
                    className="h-11 w-full bg-transparent outline-none text-sm"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponMessage(null);
                      setCouponError(null);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="h-11 px-4 rounded-xl border border-[#EC5B20] text-sm font-semibold text-white bg-[#EC5B20] hover:bg-[#d84e1a] disabled:opacity-60"
                >
                  {couponLoading ? "Aplicando..." : "Aplicar"}
                </button>
              </div>

              {couponMessage && (
                <p className="mt-2 text-xs text-emerald-600">
                  {couponMessage}
                </p>
              )}
              {couponError && (
                <p className="mt-2 text-xs text-red-600">{couponError}</p>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/5">
                    <Icon.shield />
                  </span>
                  Pagamento seguro
                </div>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/5">
                    <Icon.truck />
                  </span>
                  Entrega para todo Brasil
                </div>
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/5">
                    🏷️
                  </span>
                  Nota fiscal e garantia
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Coluna direita – Resumo */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white/95 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                  Resumo do Pedido
                </h3>
                <span className="text-xs sm:text-sm text-gray-600">
                  {itemsCount} item(s)
                </span>
              </div>

              <div className="divide-y divide-black/5">
                {(cartItems || []).map((it: CartItem) => {
                  const info = getPriceInfo(it);
                  const lineTotal = info.finalPrice * it.quantity;

                  return (
                    <div
                      key={it.id}
                      className="py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {it.name || it.nome || `Produto #${it.id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qtd: {it.quantity}
                        </p>
                        {info.hasDiscount && (
                          <p className="text-xs text-gray-400 line-through">
                            {money(info.originalPrice)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {info.hasDiscount && (
                          <p className="text-xs text-gray-400 line-through">
                            {money(info.originalPrice * it.quantity)}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-gray-800">
                          {money(lineTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Frete</span>
                  <span>{frete ? money(frete) : "Grátis"}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Desconto (cupom)</span>
                    <span>- {money(discount)}</span>
                  </div>
                )}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-gray-800 font-semibold">Total</span>
                  <span className="text-xl font-extrabold text-[#EC5B20]">
                    {money(total)}
                  </span>
                </div>
              </div>

              <LoadingButton
                isLoading={submitting}
                onClick={handleSubmit}
                className="mt-5 w-full bg-[#EC5B20] py-3 text-white hover:bg-[#d84e1a]"
              >
                Concluir Compra
              </LoadingButton>

              <p className="mt-3 text-[12px] leading-relaxed text-gray-500">
                Ao concluir, seu pedido será criado. Para cartão usamos o
                Mercado Pago; Pix/Boleto exibem instruções na confirmação.
              </p>
            </div>

            {/* CTA fixo no mobile */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 border-t border-black/10 backdrop-blur">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 pb-[env(safe-area-inset-bottom)]">
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-lg font-extrabold text-[#EC5B20]">
                    {money(total)}
                  </p>
                </div>

                <LoadingButton
                  isLoading={submitting}
                  onClick={handleSubmit}
                  className="flex-[2] bg-[#EC5B20] py-3 text-white hover:bg-[#d84e1a]"
                >
                  Concluir
                </LoadingButton>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
