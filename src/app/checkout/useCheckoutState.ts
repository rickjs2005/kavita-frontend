"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/services/api/endpoints";
import { isApiError } from "@/lib/errors";
import { formatApiError } from "@/lib/formatApiError";
import {
  CheckoutResponseSchema,
  PaymentResponseSchema,
  CouponPreviewSchema,
} from "@/lib/schemas/api";
import { sanitizeUrl, isMercadoPagoUrl } from "@/lib/sanitizeHtml";
import { computeProductPrice } from "@/utils/pricing";

import type {
  EntregaTipo,
  NormalizedCheckoutItem,
  ProductPromotion,
  SavedAddress,
  ShippingQuote,
} from "./checkoutTypes";
import {
  toId,
  toPositiveInt,
  normalizeTipoLocalidade,
} from "./checkoutUtils";

export function useCheckoutState() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { formData, updateForm } = useCheckoutForm();

  const userId = user?.id ?? null;
  const isLoggedIn = !!userId;

  const [submitting, setSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Delivery type
  // ---------------------------------------------------------------------------
  const [entregaTipo, setEntregaTipo] = useState<EntregaTipo>("ENTREGA");
  const isPickup = entregaTipo === "RETIRADA";

  // ---------------------------------------------------------------------------
  // Cart normalization
  // ---------------------------------------------------------------------------
  const normalizedCartItems = useMemo<NormalizedCheckoutItem[]>(() => {
    const raw = (cartItems || []) as any[];
    return raw
      .map((it, index) => {
        const resolvedId =
          toId(it.id) ?? toId(it.productId) ?? toId(it.product_id);
        const resolvedQty = toPositiveInt(
          it.quantity ?? it.quantidade ?? it.qtd,
          1,
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
      .filter((it) => it.id !== null && it.quantity > 0);
  }, [cartItems]);

  // ---------------------------------------------------------------------------
  // Promotions
  // ---------------------------------------------------------------------------
  const [promotions, setPromotions] = useState<
    Record<number, ProductPromotion | null>
  >({});

  useEffect(() => {
    if (!normalizedCartItems.length) {
      setPromotions({});
      return;
    }

    const uniqueIds = Array.from(
      new Set(normalizedCartItems.map((it) => Number(it.id))),
    ).filter(Boolean);

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await apiClient.get<ProductPromotion>(
                ENDPOINTS.PRODUCTS.PROMOTIONS(id),
              );
              return { id, promo: res };
            } catch {
              return { id, promo: null };
            }
          }),
        );
        if (cancelled) return;
        setPromotions((prev) => {
          const next: Record<number, ProductPromotion | null> = { ...prev };
          for (const { id, promo } of results) next[id] = promo;
          return next;
        });
      } catch {
        // silencioso
      }
    })();
    return () => { cancelled = true; };
  }, [normalizedCartItems]);

  // ---------------------------------------------------------------------------
  // Derived cart totals
  // ---------------------------------------------------------------------------
  const itemsCount = useMemo(
    () => normalizedCartItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0),
    [normalizedCartItems],
  );

  const subtotal = useMemo(
    () =>
      normalizedCartItems.reduce((acc, it) => {
        const info = computeProductPrice(it.price, promotions[it.id as number]);
        return acc + info.finalPrice * Number(it.quantity ?? 1);
      }, 0),
    [normalizedCartItems, promotions],
  );

  // ---------------------------------------------------------------------------
  // Coupon
  // ---------------------------------------------------------------------------
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Reset coupon when subtotal changes (quantity change or promo applied)
  useEffect(() => {
    setDiscount(0);
    setCouponCode("");
    setCouponMessage(null);
    setCouponError(null);
  }, [subtotal]);

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

      const rawCoupon = await apiClient.post<unknown>(
        ENDPOINTS.CHECKOUT.PREVIEW_COUPON,
        { codigo: couponCode.trim(), total: subtotalAtual },
      );

      const couponParsed = CouponPreviewSchema.safeParse(rawCoupon);
      if (!couponParsed.success || !couponParsed.data.success) {
        const msg =
          (couponParsed.success ? couponParsed.data.message : null) ||
          "Não foi possível aplicar este cupom.";
        setDiscount(0);
        setCouponError(msg);
        toast.error(msg);
        return;
      }

      const desconto = couponParsed.data.desconto ?? 0;
      setDiscount(desconto > 0 ? desconto : 0);

      const msg = couponParsed.data.message || "Cupom aplicado com sucesso!";
      setCouponMessage(msg);
      setCouponError(null);
      toast.success(msg);
    } catch (err: unknown) {
      const ui = formatApiError(err, "Não foi possível aplicar este cupom.");
      setDiscount(0);
      setCouponError(ui.message);
      toast.error(ui.message);
    } finally {
      setCouponLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Saved addresses
  // ---------------------------------------------------------------------------
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const applyAddressToForm = useCallback(
    (addr: Partial<SavedAddress> | any) => {
      const tipo = normalizeTipoLocalidade(addr?.tipo_localidade);

      updateForm("endereco.logradouro", String(addr?.endereco || addr?.logradouro || ""));
      updateForm("endereco.bairro", String(addr?.bairro || ""));
      updateForm("endereco.numero", String(addr?.numero || ""));
      updateForm("endereco.cep", String(addr?.cep || ""));
      updateForm("endereco.estado", String(addr?.estado || ""));
      updateForm("endereco.cidade", String(addr?.cidade || ""));
      updateForm("endereco.tipo_localidade" as any, tipo);
      updateForm("endereco.complemento" as any, String(addr?.complemento || ""));
      updateForm("endereco.referencia", String(addr?.ponto_referencia || addr?.referencia || ""));

      if (tipo === "RURAL") {
        updateForm("endereco.comunidade" as any, String(addr?.comunidade || ""));
        updateForm("endereco.observacoes_acesso" as any, String(addr?.observacoes_acesso || ""));
      }
    },
    [updateForm],
  );

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    let lastOrderAddress: any = null;
    const key = `lastOrder_${userId}`;
    try {
      const last = sessionStorage.getItem(key);
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed?.endereco) lastOrderAddress = parsed.endereco;
      }
    } catch {
      //
    }

    let cancelled = false;
    (async () => {
      try {
        setAddressesLoading(true);
        setAddressesError(null);

        const list = await apiClient.get<SavedAddress[]>(ENDPOINTS.USERS.ADDRESSES);
        if (cancelled) return;

        const normalizedList: SavedAddress[] = Array.isArray(list) ? list : [];
        setSavedAddresses(normalizedList);

        if (normalizedList.length > 0) {
          const preferred =
            normalizedList.find((a) => Number(a.is_default) === 1) ||
            normalizedList[0];
          setSelectedAddressId(Number(preferred.id));
          setShowNewAddressForm(false);
          applyAddressToForm(preferred);
        } else {
          setSelectedAddressId(null);
          setShowNewAddressForm(true);
          if (lastOrderAddress) applyAddressToForm(lastOrderAddress);
        }
      } catch {
        if (cancelled) return;
        setAddressesError("Não foi possível carregar seus endereços.");
        setSavedAddresses([]);
        setSelectedAddressId(null);
        setShowNewAddressForm(true);
        if (lastOrderAddress) applyAddressToForm(lastOrderAddress);
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, userId, applyAddressToForm]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(Number(addr.id));
    setShowNewAddressForm(false);
    applyAddressToForm(addr);
  };

  const handleBackToSavedAddresses = () => {
    const preferred =
      savedAddresses.find((a) => Number(a.is_default) === 1) ||
      savedAddresses[0] ||
      null;
    if (preferred) {
      setSelectedAddressId(Number(preferred.id));
      setShowNewAddressForm(false);
      applyAddressToForm(preferred);
    } else {
      setShowNewAddressForm(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Shipping quote
  // ---------------------------------------------------------------------------
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);

  const cepDigits = String(formData?.endereco?.cep || "")
    .replace(/\D/g, "")
    .slice(0, 8);

  const isCepValid = cepDigits.length === 8;

  useEffect(() => {
    if (isPickup) {
      setShippingLoading(false);
      setShippingError(null);
      setShippingQuote(null);
    }
  }, [isPickup]);

  useEffect(() => {
    setShippingError(null);

    if (isPickup || !normalizedCartItems.length || !isCepValid) {
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

        const data = await apiClient.get<ShippingQuote>(
          `${ENDPOINTS.SHIPPING.QUOTE}?${params.toString()}`,
        );
        if (aborted) return;

        setShippingQuote({
          cep: String(data?.cep || cepDigits),
          price: Number(data?.price || 0),
          prazo_dias: Number(data?.prazo_dias || 0),
          ruleApplied: (data?.ruleApplied as any) || undefined,
        });
      } catch (err: any) {
        if (aborted) return;
        const msg =
          err?.message ||
          (err?.status === 404
            ? "CEP sem cobertura."
            : "Não foi possível calcular o frete.");
        setShippingQuote(null);
        setShippingError(msg);
      } finally {
        if (!aborted) setShippingLoading(false);
      }
    })();

    return () => { aborted = true; };
  }, [cepDigits, normalizedCartItems, isCepValid, isPickup]);

  // ---------------------------------------------------------------------------
  // Totals
  // ---------------------------------------------------------------------------
  const frete = !isPickup && shippingQuote ? Number(shippingQuote.price || 0) : 0;
  const total = Math.max(subtotal - discount + frete, 0);

  // ---------------------------------------------------------------------------
  // Checkout payload
  // ---------------------------------------------------------------------------
  const payload = useMemo(() => {
    const endereco = formData?.endereco || ({} as any);
    const formaPagamento = (() => {
      const v = String(formData?.formaPagamento || "").toLowerCase();
      if (v.includes("mercado") || v.includes("cart")) return "mercadopago";
      if (v.includes("pix")) return "pix";
      if (v.includes("boleto")) return "boleto";
      if (v.includes("prazo")) return "prazo";
      return "pix";
    })();

    const nome = String(formData?.nome || "").trim();
    const cpfDigits = String(formData?.cpf || "").replace(/\D/g, "");
    const telefoneDigits = String(formData?.telefone || "").replace(/\D/g, "");
    const email = String(formData?.email || "").trim();
    const tipoLocalidade = normalizeTipoLocalidade((endereco as any)?.tipo_localidade);

    const base: any = {
      entrega_tipo: entregaTipo,
      formaPagamento,
      produtos: normalizedCartItems.map((i) => ({
        id: Number(i.id),
        quantidade: Number(i.quantity ?? 1),
      })),
      nome,
      cpf: cpfDigits,
      telefone: telefoneDigits,
      email,
      cupom_codigo: couponCode ? couponCode.trim() : undefined,
    };

    if (entregaTipo === "RETIRADA") return base;

    return {
      ...base,
      endereco: {
        cep: endereco?.cep || "",
        rua: endereco?.logradouro || "",
        numero: endereco?.numero || "",
        bairro: endereco?.bairro || "",
        cidade: endereco?.cidade || "",
        estado: endereco?.estado || "",
        complemento: (endereco as any)?.complemento
          ? String((endereco as any).complemento)
          : null,
        ponto_referencia: endereco?.referencia
          ? String(endereco.referencia)
          : null,
        tipo_localidade: tipoLocalidade,
        comunidade: (endereco as any)?.comunidade
          ? String((endereco as any).comunidade)
          : null,
        observacoes_acesso: (endereco as any)?.observacoes_acesso
          ? String((endereco as any).observacoes_acesso)
          : null,
      },
    };
  }, [formData, normalizedCartItems, total, couponCode, entregaTipo]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const canFinalizeCheckout =
    isLoggedIn &&
    (payload.produtos?.length || 0) > 0 &&
    (isPickup ||
      (isCepValid && shippingQuote !== null && !shippingError && !shippingLoading));

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

    if (!isPickup) {
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
    }

    const errors: string[] = [];
    if (!payload.nome) errors.push("Informe o nome do cliente.");
    if (!payload.cpf) errors.push("Informe o CPF.");
    else if (payload.cpf.length !== 11) errors.push("CPF deve ter exatamente 11 dígitos numéricos.");
    if (!payload.telefone) errors.push("Informe o WhatsApp.");
    else if (payload.telefone.length < 10) errors.push("WhatsApp deve ter pelo menos 10 dígitos.");

    if (!isPickup) {
      const tipo = normalizeTipoLocalidade(payload.endereco?.tipo_localidade);
      if (tipo === "RURAL") {
        if (!String(payload.endereco?.comunidade || "").trim())
          errors.push("Informe o Córrego/Comunidade para zona rural.");
        if (!String(payload.endereco?.observacoes_acesso || "").trim())
          errors.push("Informe a descrição de acesso para zona rural.");
      }
    }

    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    try {
      setSubmitting(true);

      const rawCheckout = await apiClient.post<unknown>(
        ENDPOINTS.CHECKOUT.PLACE_ORDER,
        payload,
      );

      const checkoutParsed = CheckoutResponseSchema.safeParse(rawCheckout);
      if (!checkoutParsed.success) {
        toast.error("Resposta inesperada ao criar pedido. Contate o suporte.");
        return;
      }

      const pedidoId = checkoutParsed.data.pedido_id;

      if (typeof window !== "undefined" && userId) {
        sessionStorage.setItem(
          `lastOrder_${userId}`,
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
            entrega_tipo: payload.entrega_tipo,
            criadoEm: new Date().toISOString(),
          }),
        );
      }

      const isGatewayPayment = ["mercadopago", "pix", "boleto"].includes(
        payload.formaPagamento,
      );

      if (isGatewayPayment) {
        const rawPayment = await apiClient.post<unknown>(
          ENDPOINTS.PAYMENT.START,
          { pedidoId },
        );

        const paymentParsed = PaymentResponseSchema.safeParse(rawPayment);
        const rawUrl = paymentParsed.success
          ? (paymentParsed.data.init_point ?? paymentParsed.data.sandbox_init_point ?? null)
          : null;

        const sanitized = rawUrl ? sanitizeUrl(rawUrl) : null;
        const safeUrl =
          sanitized && isMercadoPagoUrl(sanitized) ? sanitized : null;

        if (!safeUrl && sanitized) {
          console.warn(
            "[checkout] URL de pagamento rejeitada: domínio não pertence ao MercadoPago.",
          );
        }

        clearCart?.();

        if (safeUrl) {
          window.location.href = safeUrl;
          return;
        }

        toast.error("Não foi possível abrir a tela de pagamento. Tente novamente.");
        return;
      }

      clearCart?.();
      toast.success("Pedido criado com sucesso!");
      router.push(`/pedidos/${pedidoId}`);
    } catch (err: unknown) {
      const uiErr = formatApiError(err, "Erro ao processar pedido.");

      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        toast.error(
          uiErr.message ||
            "Sua sessão expirou. Faça login novamente para finalizar a compra.",
        );
        try {
          await logout();
        } catch {
          //
        }
        router.push("/login");
        return;
      }

      toast.error(
        uiErr.message ||
          "Erro ao finalizar a compra. Verifique os dados e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // auth
    isLoggedIn,
    // cart
    normalizedCartItems,
    promotions,
    itemsCount,
    subtotal,
    // form
    formData,
    updateForm,
    // delivery
    entregaTipo,
    setEntregaTipo,
    isPickup,
    // addresses
    savedAddresses,
    addressesLoading,
    addressesError,
    selectedAddressId,
    showNewAddressForm,
    setShowNewAddressForm,
    handleSelectAddress,
    handleBackToSavedAddresses,
    // shipping
    shippingLoading,
    shippingError,
    shippingQuote,
    isCepValid,
    frete,
    // coupon
    couponCode,
    setCouponCode,
    couponLoading,
    couponMessage,
    couponError,
    discount,
    handleApplyCoupon,
    // totals + submit
    total,
    submitting,
    canFinalizeCheckout,
    handleSubmit,
  };
}
