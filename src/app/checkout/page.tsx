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
  id?: number | string;
  productId?: number | string;
  product_id?: number | string;

  name?: string;
  nome?: string;

  price?: number | string;

  quantity?: number | string;
  quantidade?: number | string;
  qtd?: number | string;
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

type ShippingRuleApplied = "ZONE" | "CEP_RANGE" | "PRODUCT_FREE";

type ShippingQuote = {
  price: number;
  prazo_dias: number;
  cep: string;
  ruleApplied?: ShippingRuleApplied;
};

const money = (v: number) =>
  `R$ ${Number(v || 0)
    .toFixed(2)
    .replace(".", ",")}`;

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
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5Z" />
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
      <path fill="currentColor" d="M3 6h18v4a2 2 0 0 1 0 4v4H3v-4a2 2 0 0 1 0-4Z" />
    </svg>
  ),
};

function ruleLabel(rule?: ShippingRuleApplied) {
  if (!rule) return null;
  if (rule === "PRODUCT_FREE") return "Frete grátis por produto";
  if (rule === "CEP_RANGE") return "Frete por faixa de CEP";
  return "Frete por zona";
}

function toPositiveInt(value: any, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i > 0 ? i : fallback;
}

function toId(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { user, logout } = useAuth();
  const userId = user?.id ?? null;
  const isLoggedIn = !!userId;

  const { cartItems, clearCart } = useCart();
  const { formData, updateForm } = useCheckoutForm();

  /**
   * NORMALIZA ITENS DO CARRINHO (corrige “item some no checkout” por:
   * - id vindo como productId/product_id
   * - quantity vindo como quantidade/qtd
   * - key undefined no React
   */
  const normalizedCartItems = useMemo(() => {
    const raw = (cartItems || []) as CartItem[];

    return raw
      .map((it, index) => {
        const resolvedId =
          toId(it.id) ??
          toId(it.productId) ??
          toId(it.product_id);

        const resolvedQty = toPositiveInt(
          it.quantity ?? it.quantidade ?? it.qtd,
          1
        );

        const resolvedPrice = Number(it.price ?? 0) || 0;
        const resolvedName = String(it.nome || it.name || "").trim();

        return {
          __key: `${resolvedId ?? "noid"}-${index}`,
          id: resolvedId,
          name: resolvedName,
          price: resolvedPrice,
          quantity: resolvedQty,
        };
      })
      // Mantém item mesmo sem nome; mas precisa de id e qty válidos
      .filter((it) => it.id !== null && it.quantity > 0);
  }, [cartItems]);

  // -----------------------------
  // PROMOÇÕES POR PRODUTO
  // -----------------------------
  const [promotions, setPromotions] = useState<Record<number, ProductPromotion | null>>({});

  useEffect(() => {
    if (!normalizedCartItems.length) {
      setPromotions({});
      return;
    }

    const uniqueIds = Array.from(new Set(normalizedCartItems.map((it) => Number(it.id)))).filter(Boolean);

    (async () => {
      try {
        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await axios.get<ProductPromotion>(`${API_BASE}/api/public/promocoes/${id}`);
              return { id, promo: res.data };
            } catch (err: any) {
              if (err?.response?.status === 404) {
                return { id, promo: null };
              }
              return { id, promo: null };
            }
          })
        );

        setPromotions((prev) => {
          const next: Record<number, ProductPromotion | null> = { ...prev };
          for (const { id, promo } of results) next[id] = promo;
          return next;
        });
      } catch {
        // silencioso (UX via UI + toast em ações)
      }
    })();
  }, [normalizedCartItems]);

  /** Calcula preço original/final e desconto com base na promoção */
  const getPriceInfo = (item: { id: number; price: number }) => {
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

    const originalFromPromo = promo.original_price != null ? Number(promo.original_price) : null;
    const finalFromPromo =
      promo.final_price != null
        ? Number(promo.final_price)
        : promo.promo_price != null
          ? Number(promo.promo_price)
          : null;

    const originalPrice = originalFromPromo !== null ? originalFromPromo : basePrice || 0;
    let finalPrice = finalFromPromo !== null ? finalFromPromo : originalPrice;

    let discountPercent: number | null = null;

    const explicitDiscount = promo.discount_percent != null ? Number(promo.discount_percent) : NaN;

    if (finalFromPromo === null && !Number.isNaN(explicitDiscount) && explicitDiscount > 0 && originalPrice > 0) {
      finalPrice = originalPrice * (1 - explicitDiscount / 100);
    }

    if (originalPrice > 0 && finalPrice < originalPrice) {
      discountPercent = ((originalPrice - finalPrice) / originalPrice) * 100;
    } else if (!Number.isNaN(explicitDiscount) && explicitDiscount > 0) {
      discountPercent = explicitDiscount;
    }

    const hasDiscount = discountPercent !== null && discountPercent > 0 && finalPrice < originalPrice;
    const discountValue = hasDiscount ? originalPrice - finalPrice : 0;

    return { originalPrice, finalPrice, discountValue, hasDiscount };
  };

  // -----------------------------
  // CUPOM
  // -----------------------------
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  const itemsCount = useMemo(
    () => normalizedCartItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0),
    [normalizedCartItems]
  );

  // Subtotal SEM cupom (apenas promoções)
  const subtotal = useMemo(() => {
    return normalizedCartItems.reduce((acc, it) => {
      const info = getPriceInfo({ id: it.id as number, price: it.price });
      return acc + info.finalPrice * Number(it.quantity ?? 1);
    }, 0);
  }, [normalizedCartItems, promotions]);

  // -----------------------------
  // FRETE (quote)
  // -----------------------------
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);

  const cepDigits = String(formData?.endereco?.cep || "").replace(/\D/g, "").slice(0, 8);
  const isCepValid = cepDigits.length === 8;

  // Frete e total SEMPRE baseados no quote real (quando existe).
  const frete = shippingQuote ? Number(shippingQuote.price || 0) : 0;
  const total = Math.max(subtotal - discount + frete, 0);

  // reseta cupom quando subtotal muda (por promo ou quantidade)
  useEffect(() => {
    setDiscount(0);
    setCouponCode("");
    setCouponMessage(null);
    setCouponError(null);
  }, [subtotal]);

  // COTAR FRETE quando CEP tiver 8 dígitos e carrinho tiver itens
  useEffect(() => {
    setShippingError(null);

    if (!normalizedCartItems.length) {
      setShippingQuote(null);
      return;
    }

    if (!isCepValid) {
      setShippingQuote(null);
      return;
    }

    let aborted = false;

    (async () => {
      try {
        setShippingLoading(true);
        setShippingError(null);

        const itemsPayload = normalizedCartItems.map((i) => ({
          id: Number(i.id),
          quantidade: Number(i.quantity ?? 1),
        }));

        const params = new URLSearchParams({
          cep: cepDigits,
          items: JSON.stringify(itemsPayload),
        });

        const res = await fetch(`${API_BASE}/api/shipping/quote?${params.toString()}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg =
            data?.message ||
            (res.status === 404 ? "CEP sem cobertura." : "Não foi possível calcular o frete.");
          if (!aborted) {
            setShippingQuote(null);
            setShippingError(msg);
          }
          return;
        }

        const data = await res.json();
        if (aborted) return;

        setShippingQuote({
          cep: String(data?.cep || cepDigits),
          price: Number(data?.price || 0),
          prazo_dias: Number(data?.prazo_dias || 0),
          ruleApplied: (data?.ruleApplied as ShippingRuleApplied) || undefined,
        });
      } catch {
        if (!aborted) {
          setShippingQuote(null);
          setShippingError("Falha ao calcular frete. Tente novamente.");
        }
      } finally {
        if (!aborted) setShippingLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [cepDigits, normalizedCartItems, isCepValid]);

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
          if (parsed && parsed.endereco) lastOrderAddress = parsed.endereco;
        }
      } catch {
        // ignora
      }
    }

    if (!userId) {
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
          withCredentials: true,
        });

        const list: any[] = Array.isArray(res.data) ? res.data : [];
        const preferred = list.find((a: any) => a.is_default === 1) || list[0] || null;

        if (preferred) {
          const salvo = {
            cep: preferred.cep,
            logradouro: preferred.endereco,
            numero: preferred.numero,
            bairro: preferred.bairro,
            cidade: preferred.cidade,
            estado: preferred.estado,
            complemento: preferred.complemento,
            referencia: preferred.ponto_referencia,
          };
          setEnderecoSalvo(salvo);
          setUsarEnderecoSalvo(true);
          return;
        }
      } catch {
        // silencioso
      }

      if (lastOrderAddress) {
        setEnderecoSalvo(lastOrderAddress);
        setUsarEnderecoSalvo(true);
      } else {
        setEnderecoSalvo(null);
        setUsarEnderecoSalvo(false);
      }
    })();
  }, [userId]);

  const normalizeFormaPagamento = (value?: string) => {
    const v = String(value || "").toLowerCase();
    if (v.includes("mercado") || v.includes("cart")) return "mercadopago";
    if (v.includes("pix")) return "pix";
    if (v.includes("boleto")) return "boleto";
    if (v.includes("prazo")) return "prazo";
    return "pix";
  };

  // -----------------------------
  // PAYLOAD (usa total com promo+cupom+frete REAL)
  // -----------------------------
  const payload = useMemo(() => {
    const endereco = formData?.endereco || {};
    const formaPagamento = normalizeFormaPagamento(formData?.formaPagamento);

    const nome = String(formData?.nome || "").trim();
    const cpfDigits = String(formData?.cpf || "").replace(/\D/g, "");
    const telefoneDigits = String(formData?.telefone || "").replace(/\D/g, "");
    const email = String(formData?.email || "").trim();

    return {
      endereco: {
        cep: endereco?.cep || "",
        rua: endereco?.logradouro || "",
        numero: endereco?.numero || "",
        bairro: endereco?.bairro || "",
        cidade: endereco?.cidade || "",
        estado: endereco?.estado || "",
        complemento: endereco?.referencia || null,
      },
      formaPagamento,
      produtos: normalizedCartItems.map((i) => ({
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
  }, [formData, normalizedCartItems, total, couponCode]);

  // -----------------------------
  // APLICAR CUPOM
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

      const { data } = await axios.post<CouponPreviewResponse>(
        `${API_BASE}/api/checkout/preview-cupom`,
        {
          codigo: couponCode.trim(),
          total: subtotalAtual,
        },
        { withCredentials: true }
      );

      if (!data?.success) {
        const msg = data?.message || "Não foi possível aplicar este cupom.";
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
  const canFinalizeCheckout =
    isLoggedIn &&
    (payload.produtos?.length || 0) > 0 &&
    isCepValid &&
    shippingQuote !== null &&
    !shippingError &&
    !shippingLoading;

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

    // Bloqueios obrigatórios de frete
    if (!isCepValid) {
      toast.error("Informe um CEP válido (8 dígitos) para calcular o frete.");
      return;
    }

    if (shippingError) {
      toast.error(shippingError);
      return;
    }

    if (shippingLoading || shippingQuote === null) {
      toast.error("Aguarde o cálculo do frete para finalizar a compra.");
      return;
    }

    const errors: string[] = [];

    if (!payload.nome) errors.push("Informe o nome do cliente.");

    if (!payload.cpf) errors.push("Informe o CPF.");
    else if (payload.cpf.length !== 11) errors.push("CPF deve ter exatamente 11 dígitos numéricos.");

    if (!payload.telefone) errors.push("Informe o WhatsApp.");
    else if (payload.telefone.length < 10) errors.push("WhatsApp deve ter pelo menos 10 dígitos.");

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    try {
      setSubmitting(true);

      const { data } = await axios.post<CheckoutResponse>(`${API_BASE}/api/checkout`, payload, {
        withCredentials: true,
      });

      const pedidoId = data.pedido_id;

      if (typeof window !== "undefined" && userId) {
        const key = `lastOrder_${userId}`;
        sessionStorage.setItem(
          key,
          JSON.stringify({
            id: pedidoId,
            usuario_id: userId,
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

      const isGatewayPayment = ["mercadopago", "pix", "boleto"].includes(payload.formaPagamento);

      if (isGatewayPayment) {
        const res = await axios.post<PaymentResponse>(
          `${API_BASE}/api/payment/start`,
          { pedidoId },
          { withCredentials: true }
        );

        const initPoint = res.data?.init_point || res.data?.sandbox_init_point || null;

        clearCart?.();

        if (initPoint) {
          window.location.href = initPoint;
          return;
        }

        toast.error("Não foi possível abrir a tela de pagamento. Tente novamente.");
        return;
      }

      clearCart?.();
      toast.success("Pedido criado com sucesso!");
      router.push(`/pedidos/${pedidoId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const msgBackend = err?.response?.data?.message as string | undefined;

      if (status === 401 || status === 403 || (msgBackend && msgBackend.toLowerCase().includes("token"))) {
        toast.error(msgBackend || "Sua sessão expirou. Faça login novamente para finalizar a compra.");

        try {
          await logout();
        } catch {
          //
        }

        router.push("/login");
        return;
      }

      const msg = msgBackend || "Erro ao finalizar a compra. Verifique os dados e tente novamente.";
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
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide text-[#EC5B20] uppercase">Checkout</h1>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/95 p-6 sm:p-8 shadow-sm text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">Faça login para finalizar sua compra</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Para garantir sua segurança e vincular o pedido à sua conta, é necessário estar logado antes de concluir o
              checkout.
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <CloseButton className="text-2xl sm:text-3xl text-gray-600 hover:text-[#EC5B20]" />
          <div className="flex-1 flex flex-col items-center sm:items-start">
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide text-[#EC5B20] uppercase">Finalizar compra</h1>
            <p className="text-xs sm:text-sm text-gray-600">Revise seus dados e confirme o pedido com segurança.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Icon.shield />
            <span>Compra protegida</span>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)] gap-6 lg:gap-8 items-start">
          {/* Coluna esquerda - formulários */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Dados pessoais */}
            <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EC5B20]/10 text-[#EC5B20] text-xs font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Icon.user />
                    Dados do cliente
                  </h2>
                  <p className="text-xs text-gray-500">Nome, CPF, e contato para confirmação do pedido.</p>
                </div>
              </div>

              <PersonalInfoForm formData={formData} onChange={updateForm} />
            </section>

            {/* Endereço */}
            <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#16A34A] text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                      <Icon.pin />
                      Endereço de entrega
                    </h2>
                    <p className="text-xs text-gray-500">Use um endereço salvo ou informe um novo.</p>
                  </div>
                </div>

                {enderecoSalvo && (
                  <button
                    type="button"
                    onClick={() =>
                      setUsarEnderecoSalvo((prev) => {
                        const novo = !prev;
                        if (novo && enderecoSalvo) {
                          const e = enderecoSalvo;
                          updateForm("endereco.cep", e.cep || "");
                          updateForm("endereco.logradouro", e.logradouro || "");
                          updateForm("endereco.numero", e.numero || "");
                          updateForm("endereco.bairro", e.bairro || "");
                          updateForm("endereco.cidade", e.cidade || "");
                          updateForm("endereco.estado", e.estado || "");
                          updateForm("endereco.referencia", e.referencia || e.complemento || "");
                        }
                        return novo;
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-black/5 transition"
                  >
                    <span
                      className={
                        "h-2 w-2 rounded-full border " +
                        (usarEnderecoSalvo ? "bg-[#22C55E] border-[#22C55E]" : "bg-white border-gray-400")
                      }
                    />
                    {usarEnderecoSalvo ? "Usando endereço salvo" : "Usar endereço salvo"}
                  </button>
                )}
              </div>

              <AddressForm endereco={formData.endereco} onChange={updateForm} />
            </section>

            {/* Forma de pagamento */}
            <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0EA5E9]/10 text-[#0284C7] text-xs font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Icon.card />
                    Pagamento
                  </h2>
                  <p className="text-xs text-gray-500">Escolha a melhor forma de pagamento para você.</p>
                </div>
              </div>

              <PaymentMethodForm formaPagamento={formData.formaPagamento} onChange={updateForm} />
            </section>
          </div>

          {/* Coluna direita - resumo do pedido */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Resumo dos produtos */}
            <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-5 shadow-sm">
              <header className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Icon.truck />
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800">Resumo do pedido</h2>
                </div>
                <span className="text-xs text-gray-500">
                  {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                </span>
              </header>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {normalizedCartItems.map((item) => {
                  const info = getPriceInfo({ id: item.id as number, price: item.price });

                  return (
                    <div
                      key={item.__key}
                      className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-none last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.name || `Produto #${item.id}`}</p>
                        <p className="text-[11px] text-gray-500">Quantidade: {item.quantity}</p>
                        {info.hasDiscount && (
                          <p className="mt-1 text-[11px] text-emerald-600">Promoção aplicada automaticamente</p>
                        )}
                      </div>

                      <div className="text-right text-xs sm:text-sm">
                        {info.hasDiscount ? (
                          <>
                            <div className="text-gray-400 line-through">{money(info.originalPrice * item.quantity)}</div>
                            <div className="text-[#EC5B20] font-semibold">{money(info.finalPrice * item.quantity)}</div>
                          </>
                        ) : (
                          <div className="text-gray-800 font-medium">{money(info.finalPrice * item.quantity)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!normalizedCartItems.length && <p className="text-xs text-gray-500">Seu carrinho está vazio.</p>}
              </div>
            </section>

            {/* Cupom + totais */}
            <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Cupom */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon.ticket />
                  <span className="text-sm font-semibold text-gray-800">Cupom de desconto</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Digite o código do cupom"
                    className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#EC5B20]/70"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-[#EC5B20] text-white hover:bg-[#d84e1a] disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {couponLoading ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>

                {couponMessage && <p className="mt-1 text-[11px] text-emerald-600">{couponMessage}</p>}
                {couponError && <p className="mt-1 text-[11px] text-red-500">{couponError}</p>}
              </div>

              {/* Totais */}
              <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-sm">
                    <span>Desconto</span>
                    <span>- {money(discount)}</span>
                  </div>
                )}

                {/* FRETE (UI) */}
                <div className="flex justify-between text-gray-700 text-sm items-center gap-3">
                  <span className="flex items-center gap-2">
                    <span>Frete</span>

                    {shippingLoading && isCepValid && <span className="text-[11px] text-gray-500">Calculando...</span>}

                    {!shippingLoading && shippingQuote?.prazo_dias ? (
                      <span className="text-[11px] text-gray-500">
                        ({shippingQuote.prazo_dias} {shippingQuote.prazo_dias === 1 ? "dia" : "dias"})
                      </span>
                    ) : null}
                  </span>

                  <span>
                    {shippingError ? (
                      <span className="text-[11px] text-red-500">{shippingError}</span>
                    ) : !isCepValid ? (
                      "Informe o CEP"
                    ) : shippingLoading ? (
                      <span className="text-[11px] text-gray-600">Calculando...</span>
                    ) : shippingQuote === null ? (
                      <span className="text-[11px] text-gray-600">Aguardando cotação</span>
                    ) : shippingQuote.price === 0 ? (
                      "Grátis"
                    ) : (
                      money(frete)
                    )}
                  </span>
                </div>

                {shippingQuote?.ruleApplied ? (
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Regra do frete</span>
                    <span>{ruleLabel(shippingQuote.ruleApplied)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-1">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-extrabold text-[#EC5B20]">{money(total)}</span>
                </div>

                <p className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
                  <Icon.shield />
                  Pagamento processado com segurança. Nenhum dado sensível fica salvo no navegador.
                </p>
              </div>
            </section>

            {/* Botão de finalizar */}
            <div className="mt-2">
              <LoadingButton
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={!canFinalizeCheckout || submitting}
                className="w-full justify-center rounded-2xl bg-[#EC5B20] hover:bg-[#d84e1a] text-white font-semibold text-sm sm:text-base py-3 shadow-md shadow-[#EC5B20]/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Confirmar pedido
              </LoadingButton>

              {!canFinalizeCheckout && (
                <p className="mt-2 text-[11px] text-center text-gray-500">
                  {shippingError
                    ? "Corrija o erro de frete para continuar."
                    : !isCepValid
                      ? "Informe um CEP válido (8 dígitos) para calcular o frete."
                      : shippingLoading
                        ? "Calculando frete…"
                        : shippingQuote === null
                          ? "Aguardando cotação do frete…"
                          : "Preencha os dados para continuar."}
                </p>
              )}

              <p className="mt-2 text-[11px] text-center text-gray-500">
                Ao continuar, você concorda com os <span className="underline underline-offset-2">termos de uso</span> e{" "}
                <span className="underline underline-offset-2">política de privacidade</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
