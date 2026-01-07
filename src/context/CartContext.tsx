"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { Product, CartItem } from "@/types/CartCarProps";
import { useAuth } from "@/context/AuthContext";
import { handleApiError } from "@/lib/handleApiError";

/* Config API */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ===== Tipos de resposta da API ===== */
type CartApiItem = {
  item_id?: number;
  produto_id: number;
  nome?: string;
  valor_unitario?: number | string;
  quantidade?: number | string;
  image?: string | null;
  stock?: number | string; // ✅ novo (retornado do backend)
};

type CartGetResponse = {
  success?: boolean;
  items?: CartApiItem[];
  carrinho_id?: number | null;
};

/* Helpers */
const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const knownStock = (item: Partial<CartItem>) =>
  typeof item._stock === "number" && item._stock >= 0 ? item._stock : undefined;

const clampByStock = (item: Partial<CartItem>, desired: number) => {
  const s = knownStock(item);
  if (s !== undefined) {
    if (s <= 0) return 0;
    return Math.max(1, Math.min(s, desired));
  }
  return Math.max(1, desired);
};

type AddResult =
  | { ok: true }
  | { ok: false; reason: "OUT_OF_STOCK" | "LIMIT_REACHED" };

type AfterFn = () => void;

interface CartContextProps {
  cartItems: CartItem[];
  addToCart: (product: Product, qty?: number) => AddResult;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  syncStock: (productId: number, newStock: number) => void;
  clearCart: () => void;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

const makeCartKey = (userId: number | null | undefined) =>
  userId ? `cartItems_${userId}` : "cartItems_guest";

function normalizeApiItems(itemsFromApi: CartApiItem[]): CartItem[] {
  return itemsFromApi.map((it) => {
    const stockNum = toNum((it as any).stock, NaN);
    const stock =
      Number.isFinite(stockNum) && stockNum >= 0 ? stockNum : undefined;

    return {
      id: Number(it.produto_id),
      name: it.nome ?? `Produto #${it.produto_id}`,
      price: toNum(it.valor_unitario, 0),
      image: it.image ?? null,
      quantity: Math.max(1, toNum(it.quantidade, 1)),
      _stock: stock, // ✅ agora vem do backend
    };
  });
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const userId: number | null = user?.id ? Number(user.id) : null;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartKey, setCartKey] = useState<string | null>(null);

  // evita “vazar” itens para a chave nova quando troca user/guest
  const lastCartKeyRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<number | null>(userId);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  /**
   * 1) Quando muda de usuário (login/logout/troca), zera o estado local imediatamente.
   * Isso impede o carrinho do usuário logado aparecer no modo visitante.
   */
  useEffect(() => {
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      setCartItems([]);
      setIsCartOpen(false);
    }
  }, [userId]);

  /**
   * 2) Atualiza chave do carrinho
   */
  useEffect(() => {
    setCartKey(makeCartKey(userId));
  }, [userId]);

  const loadFromLocal = (key: string) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(key);
      setCartItems(raw ? JSON.parse(raw) : []);
    } catch {
      setCartItems([]);
    }
  };

  /**
   * 3) Carregamento:
   * - /admin: não chama API
   * - visitante: localStorage
   * - logado: servidor é fonte da verdade (inclusive vazio)
   */
  useEffect(() => {
    if (!cartKey || typeof window === "undefined") return;

    if (pathname.startsWith("/admin")) {
      loadFromLocal(cartKey);
      return;
    }

    if (!userId) {
      loadFromLocal(cartKey);
      return;
    }

    (async () => {
      try {
        const res = await axios.get<CartGetResponse>(`${API_BASE}/api/cart`, {
          withCredentials: true,
        });

        const data = res.data;
        const itemsFromApi = Array.isArray(data.items) ? data.items : [];
        const normalized = normalizeApiItems(itemsFromApi);

        // logado: reflete servidor sempre (mesmo vazio)
        setCartItems(normalized);

        // cache local (opcional)
        try {
          localStorage.setItem(cartKey, JSON.stringify(normalized));
        } catch {
          // ignore
        }
      } catch (e: unknown) {
        handleApiError(e, {
          fallbackMessage: "Erro ao sincronizar o carrinho com o servidor.",
        });
        // fallback de UX: tenta cache local
        loadFromLocal(cartKey);
      }
    })();
  }, [cartKey, userId, pathname]);

  /**
   * 4) Persistência local:
   * Se o cartKey mudou agora, não persiste ainda (evita gravar estado antigo na chave nova).
   */
  useEffect(() => {
    if (!cartKey || typeof window === "undefined") return;

    if (lastCartKeyRef.current !== cartKey) {
      lastCartKeyRef.current = cartKey;
      return;
    }

    try {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems, cartKey]);

  /**
   * 5) Fechar automaticamente quando carrinho ficar vazio
   */
  useEffect(() => {
    if (isCartOpen && cartItems.length === 0) {
      setIsCartOpen(false);
    }
  }, [isCartOpen, cartItems.length]);

  /* ========== Helpers de re-sync ========== */
  const refetchServerCart = async () => {
    if (!userId) return;
    try {
      const res = await axios.get<CartGetResponse>(`${API_BASE}/api/cart`, {
        withCredentials: true,
      });
      const itemsFromApi = Array.isArray(res.data.items) ? res.data.items : [];
      setCartItems(normalizeApiItems(itemsFromApi));
    } catch {
      // ignore
    }
  };

  /* ========== Ações ========== */

  const addToCart = (product: Product, qty = 1): AddResult => {
    const stockFromApi =
      typeof (product as any).quantity === "number"
        ? (product as any).quantity
        : typeof (product as any).estoque === "number"
          ? (product as any).estoque
          : typeof (product as any).stock === "number"
            ? (product as any).stock
            : undefined;

    let result: AddResult = { ok: true };
    const after: AfterFn[] = [];
    const increment = Math.max(1, toNum(qty, 1));

    // otimista no estado local
    setCartItems((prev) => {
      const found = prev.find((i) => i.id === product.id);

      if (found) {
        const stock = stockFromApi ?? knownStock(found);
        const desired = toNum(found.quantity, 1) + increment;
        const clamped = clampByStock({ ...found, _stock: stock }, desired);

        if (clamped === 0) {
          result = { ok: false, reason: "OUT_OF_STOCK" };
          after.push(() => toast.error("Produto esgotado."));
          return prev;
        }

        if (clamped <= found.quantity) {
          result = { ok: false, reason: "LIMIT_REACHED" };
          after.push(() =>
            typeof stock === "number"
              ? toast.error(`Limite de estoque atingido (máx. ${stock}).`)
              : toast.error("Quantidade máxima atingida.")
          );
          return prev;
        }

        after.push(() => toast.success("Quantidade atualizada no carrinho."));
        return prev.map((i) =>
          i.id === product.id ? { ...found, quantity: clamped, _stock: stock } : i
        );
      }

      const stock = stockFromApi;
      const firstQty = clampByStock({ _stock: stock }, increment);

      if (firstQty === 0) {
        result = { ok: false, reason: "OUT_OF_STOCK" };
        after.push(() => toast.error("Produto esgotado."));
        return prev;
      }

      after.push(() => {
        openCart();
        toast.success("Adicionado ao carrinho!");
      });

      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: toNum((product as any).price, 0),
        image: (product as any).image ?? null,
        quantity: firstQty,
        _stock: stock,
      };

      return [...prev, newItem];
    });

    // logado: sincroniza no servidor
    if (userId) {
      axios
        .post(
          `${API_BASE}/api/cart/items`,
          { produto_id: product.id, quantidade: increment },
          { withCredentials: true }
        )
        .catch((err) => {
          // Tratamento específico para STOCK_LIMIT (409)
          const status = err?.response?.status;
          const code = err?.response?.data?.code || err?.response?.data?.error?.code;

          if (status === 409 && code === "STOCK_LIMIT") {
            toast.error("Limite de estoque atingido.");
            refetchServerCart();
            return;
          }

          handleApiError(err, {
            fallbackMessage: "Erro ao salvar item no carrinho no servidor.",
          });

          // reconciliar com servidor (fallback)
          refetchServerCart();
        });
    }

    after.forEach((fn) => fn());
    return result;
  };

  const updateQuantity = (id: number, quantity: number) => {
    let finalQty: number | null = null;
    const after: AfterFn[] = [];

    setCartItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (!found) return prev;

      const desired = toNum(quantity, 1);
      const clamped = clampByStock(found, desired);
      finalQty = clamped;

      if (clamped === 0) {
        after.push(() => toast.error("Produto esgotado. Removemos do carrinho."));
        return prev.filter((i) => i.id !== id);
      }

      if (clamped !== desired) {
        after.push(() => toast.error(`Ajustamos para ${clamped} por limite de estoque.`));
      }

      return prev.map((i) => (i.id === id ? { ...i, quantity: clamped } : i));
    });

    if (userId && finalQty !== null) {
      if (finalQty <= 0) {
        axios
          .delete(`${API_BASE}/api/cart/items/${id}`, { withCredentials: true })
          .catch((err) =>
            handleApiError(err, {
              fallbackMessage: "Erro ao remover item do carrinho no servidor.",
            })
          );
      } else {
        axios
          .patch(
            `${API_BASE}/api/cart/items`,
            { produto_id: id, quantidade: finalQty },
            { withCredentials: true }
          )
          .catch((err) => {
            const status = err?.response?.status;
            const code = err?.response?.data?.code || err?.response?.data?.error?.code;

            if (status === 409 && code === "STOCK_LIMIT") {
              toast.error("Limite de estoque atingido.");
              refetchServerCart();
              return;
            }

            handleApiError(err, {
              fallbackMessage: "Erro ao atualizar quantidade no servidor.",
            });
          });
      }
    }

    after.forEach((fn) => fn());
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));

    if (userId) {
      axios
        .delete(`${API_BASE}/api/cart/items/${id}`, { withCredentials: true })
        .catch((err) =>
          handleApiError(err, {
            fallbackMessage: "Erro ao remover item do carrinho no servidor.",
          })
        );
    }

    toast("Item removido do carrinho.");
  };

  const syncStock = (productId: number, newStock: number) => {
    const after: AfterFn[] = [];

    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.id !== productId) return it;
          const stock = Math.max(0, toNum(newStock, 0));
          const clamped = clampByStock({ ...it, _stock: stock }, it.quantity);

          if (stock === 0) {
            after.push(() => toast.error("Um item esgotou e foi removido do carrinho."));
            return null;
          }

          if (clamped !== it.quantity) {
            after.push(() => toast.error(`Estoque atualizado. Ajustamos para ${clamped}.`));
          }

          return { ...it, _stock: stock, quantity: clamped };
        })
        .filter(Boolean) as CartItem[]
    );

    after.forEach((fn) => fn());
  };

  const clearCart = () => {
    setCartItems([]);
    closeCart();

    if (typeof window !== "undefined" && cartKey) {
      try {
        localStorage.removeItem(cartKey);
      } catch {
        // ignore
      }
    }

    if (userId) {
      axios
        .delete(`${API_BASE}/api/cart`, { withCredentials: true })
        .catch((err) =>
          handleApiError(err, {
            fallbackMessage: "Erro ao limpar o carrinho no servidor.",
          })
        );
    }

    toast("Carrinho limpo.");
  };

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, it) => sum + toNum(it.price, 0) * toNum(it.quantity, 1),
        0
      ),
    [cartItems]
  );

  const value: CartContextProps = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    syncStock,
    clearCart,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
};
