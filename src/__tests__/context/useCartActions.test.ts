// src/__tests__/context/useCartActions.test.ts
//
// useCartActions não usa hooks React internamente — pode ser testado diretamente
// sem renderHook. Simula o setCartItems como updater funcional síncrono.
//
// ATENÇÃO: vitest.config.ts usa mockReset: true — as implementações de vi.fn()
// são apagadas antes de cada teste. Usar vi.hoisted() para mocks de módulo e
// reinicializar as implementações no beforeEach.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCartActions } from "@/context/cart/useCartActions";
import type { CartItem } from "@/types/CartCarProps";

// ── Mocks (via vi.hoisted para garantir init antes do vi.mock hoistado) ────────

const { apiPost, apiDel, apiPatch } = vi.hoisted(() => ({
  apiPost: vi.fn(),
  apiDel: vi.fn(),
  apiPatch: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: (...args: any[]) => apiPost(...args),
    del: (...args: any[]) => apiDel(...args),
    patch: (...args: any[]) => apiPatch(...args),
  },
}));

vi.mock("react-hot-toast", () => {
  const fn = Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  });
  return { default: fn };
});

vi.mock("@/lib/handleApiError", () => ({
  handleApiError: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simula React.useState: executa updaters síncronos. */
function makeState(initial: CartItem[] = []) {
  let items = [...initial];
  const setCartItems = vi.fn(
    (updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
      items = typeof updater === "function" ? updater(items) : updater;
    },
  );
  const getItems = () => items;
  return { setCartItems, getItems };
}

function makeActions({
  initial = [] as CartItem[],
  userId = null as number | null,
  cartKey = "test_cart",
} = {}) {
  const state = makeState(initial);
  const refetchServerCart = vi.fn().mockResolvedValue(undefined);
  const openCart = vi.fn();
  const closeCart = vi.fn();

  const { result } = renderHook(() =>
    useCartActions({
      userId,
      cartKey,
      setCartItems: state.setCartItems,
      refetchServerCart,
      openCart,
      closeCart,
    }),
  );

  return { ...result.current, state, refetchServerCart, openCart, closeCart };
}

const PROD = { id: 1, name: "Produto A", price: 50 };
const PROD_STOCK5 = { id: 2, name: "Com Estoque", price: 30, stock: 5 };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useCartActions", () => {
  beforeEach(() => {
    // mockReset: true limpa as implementações antes de cada teste;
    // re-inicializar aqui para que as chamadas de API retornem Promises.
    apiPost.mockResolvedValue(undefined);
    apiDel.mockResolvedValue(undefined);
    apiPatch.mockResolvedValue(undefined);
    localStorage.clear();
  });

  // ── addToCart ──────────────────────────────────────────────────────────────
  describe("addToCart", () => {
    it("adiciona novo item ao carrinho e retorna { ok: true } (positivo)", () => {
      const { addToCart, state, openCart } = makeActions();

      const result = addToCart(PROD);

      expect(result).toEqual({ ok: true });
      expect(state.getItems()).toHaveLength(1);
      expect(state.getItems()[0]).toMatchObject({
        id: 1,
        name: "Produto A",
        price: 50,
        quantity: 1,
      });
      expect(openCart).toHaveBeenCalledTimes(1);
    });

    it("incrementa quantity quando item já está no carrinho (positivo)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "Produto A", price: 50, quantity: 2 },
      ];
      const { addToCart, state } = makeActions({ initial: existing });

      const result = addToCart(PROD, 1);

      expect(result).toEqual({ ok: true });
      expect(state.getItems()[0].quantity).toBe(3);
    });

    it("retorna OUT_OF_STOCK quando stock=0 em produto novo (negativo)", () => {
      const { addToCart, state } = makeActions();
      const esgotado = { ...PROD, stock: 0 };

      const result = addToCart(esgotado);

      expect(result).toEqual({ ok: false, reason: "OUT_OF_STOCK" });
      expect(state.getItems()).toHaveLength(0);
    });

    it("retorna OUT_OF_STOCK quando estoque via campo 'estoque' é 0 (positivo)", () => {
      const { addToCart, state } = makeActions();
      const esgotado = { ...PROD, estoque: 0 };

      const result = addToCart(esgotado as any);

      expect(result).toEqual({ ok: false, reason: "OUT_OF_STOCK" });
      expect(state.getItems()).toHaveLength(0);
    });

    it("retorna LIMIT_REACHED quando item já está no limite de estoque (negativo)", () => {
      // Item no carrinho com quantity == _stock: já no máximo
      const existing: CartItem[] = [
        { id: 2, name: "Com Estoque", price: 30, quantity: 5, _stock: 5 },
      ];
      const { addToCart, state } = makeActions({ initial: existing });

      const result = addToCart(PROD_STOCK5, 1);

      expect(result).toEqual({ ok: false, reason: "LIMIT_REACHED" });
      expect(state.getItems()[0].quantity).toBe(5); // não mudou
    });

    it("chama apiClient.post quando userId está definido (positivo)", () => {
      const { addToCart } = makeActions({ userId: 42 });

      addToCart(PROD);

      expect(apiPost).toHaveBeenCalledWith("/api/cart/items", {
        produto_id: 1,
        quantidade: 1,
      });
    });

    it("NÃO chama apiClient quando userId é null — guest (negativo)", () => {
      const { addToCart } = makeActions({ userId: null });

      addToCart(PROD);

      expect(apiPost).not.toHaveBeenCalled();
    });

    it("respeita qty customizado ao adicionar item novo", () => {
      const { addToCart, state } = makeActions();

      addToCart(PROD, 3);

      expect(state.getItems()[0].quantity).toBe(3);
    });
  });

  // ── updateQuantity ─────────────────────────────────────────────────────────
  describe("updateQuantity", () => {
    it("atualiza quantidade de item existente (positivo)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 1 },
      ];
      const { updateQuantity, state } = makeActions({ initial: existing });

      updateQuantity(1, 3);

      expect(state.getItems()[0].quantity).toBe(3);
    });

    it("limita ao estoque disponível quando há _stock (guarda limite)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 1, _stock: 2 },
      ];
      const { updateQuantity, state } = makeActions({ initial: existing });

      updateQuantity(1, 99); // quer 99 mas _stock é 2

      expect(state.getItems()[0].quantity).toBe(2);
    });

    it("remove item quando _stock=0 (esgotou durante uso)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 1, _stock: 0 },
      ];
      const { updateQuantity, state } = makeActions({ initial: existing });

      updateQuantity(1, 2); // _stock=0 → clamped=0 → remove

      expect(state.getItems()).toHaveLength(0);
    });

    it("não altera estado quando id não existe no carrinho (guard)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 2 },
      ];
      const { updateQuantity, state } = makeActions({ initial: existing });

      updateQuantity(999, 5);

      expect(state.getItems()[0].quantity).toBe(2); // inalterado
    });

    it("chama apiClient.patch quando userId está definido e qty > 0", () => {
      const existing: CartItem[] = [
        { id: 5, name: "P", price: 10, quantity: 1 },
      ];
      const { updateQuantity } = makeActions({ initial: existing, userId: 1 });

      updateQuantity(5, 3);

      expect(apiPatch).toHaveBeenCalledWith("/api/cart/items", {
        produto_id: 5,
        quantidade: 3,
      });
    });

    it("chama apiClient.del quando qty clamped para 0 e userId está definido", () => {
      const existing: CartItem[] = [
        { id: 5, name: "P", price: 10, quantity: 1, _stock: 0 },
      ];
      const { updateQuantity } = makeActions({ initial: existing, userId: 1 });

      updateQuantity(5, 1); // _stock=0 → item removido → del

      expect(apiDel).toHaveBeenCalledWith("/api/cart/items/5");
    });
  });

  // ── removeFromCart ─────────────────────────────────────────────────────────
  describe("removeFromCart", () => {
    it("remove o item correto do estado local (positivo)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "A", price: 10, quantity: 1 },
        { id: 2, name: "B", price: 20, quantity: 1 },
      ];
      const { removeFromCart, state } = makeActions({ initial: existing });

      removeFromCart(1);

      expect(state.getItems()).toHaveLength(1);
      expect(state.getItems()[0].id).toBe(2);
    });

    it("chama apiClient.del quando userId está definido (positivo)", () => {
      const existing: CartItem[] = [
        { id: 5, name: "X", price: 10, quantity: 1 },
      ];
      const { removeFromCart } = makeActions({ initial: existing, userId: 1 });

      removeFromCart(5);

      expect(apiDel).toHaveBeenCalledWith("/api/cart/items/5");
    });

    it("NÃO chama apiClient.del quando userId é null (guest)", () => {
      const existing: CartItem[] = [
        { id: 5, name: "X", price: 10, quantity: 1 },
      ];
      const { removeFromCart } = makeActions({ initial: existing, userId: null });

      removeFromCart(5);

      expect(apiDel).not.toHaveBeenCalled();
    });
  });

  // ── syncStock ──────────────────────────────────────────────────────────────
  describe("syncStock", () => {
    it("atualiza _stock sem alterar quantity quando dentro do limite (positivo)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 2 },
      ];
      const { syncStock, state } = makeActions({ initial: existing });

      syncStock(1, 10);

      expect(state.getItems()[0]._stock).toBe(10);
      expect(state.getItems()[0].quantity).toBe(2); // inalterado
    });

    it("remove item quando novo estoque é 0 (esgotou no backend)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 1, _stock: 5 },
      ];
      const { syncStock, state } = makeActions({ initial: existing });

      syncStock(1, 0);

      expect(state.getItems()).toHaveLength(0);
    });

    it("clamp da quantity quando estoque reduz abaixo da quantidade atual", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 5, _stock: 10 },
      ];
      const { syncStock, state } = makeActions({ initial: existing });

      syncStock(1, 3); // estoque caiu para 3, quantity era 5

      expect(state.getItems()[0].quantity).toBe(3);
      expect(state.getItems()[0]._stock).toBe(3);
    });

    it("não altera outros itens ao sincronizar um produto específico (isolamento)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "A", price: 10, quantity: 2, _stock: 10 },
        { id: 2, name: "B", price: 20, quantity: 3, _stock: 10 },
      ];
      const { syncStock, state } = makeActions({ initial: existing });

      syncStock(1, 1); // clamp item 1 para 1

      expect(state.getItems()[0].quantity).toBe(1);
      expect(state.getItems()[1].quantity).toBe(3); // item 2 inalterado
    });
  });

  // ── clearCart ──────────────────────────────────────────────────────────────
  describe("clearCart", () => {
    it("limpa o estado local e chama closeCart (positivo)", () => {
      const existing: CartItem[] = [
        { id: 1, name: "P", price: 10, quantity: 1 },
      ];
      const { clearCart, state, closeCart } = makeActions({ initial: existing });

      clearCart();

      expect(state.getItems()).toHaveLength(0);
      expect(closeCart).toHaveBeenCalledTimes(1);
    });

    it("remove cartKey do localStorage quando fornecido (positivo)", () => {
      localStorage.setItem("test_cart", JSON.stringify([{ id: 1 }]));
      const { clearCart } = makeActions({ cartKey: "test_cart" });

      clearCart();

      expect(localStorage.getItem("test_cart")).toBeNull();
    });

    it("chama apiClient.del /api/cart quando userId está definido (positivo)", () => {
      const { clearCart } = makeActions({ userId: 99 });

      clearCart();

      expect(apiDel).toHaveBeenCalledWith("/api/cart");
    });

    it("NÃO chama apiClient quando userId é null (guest)", () => {
      const { clearCart } = makeActions({ userId: null });

      clearCart();

      expect(apiDel).not.toHaveBeenCalled();
    });

    it("não crasha quando cartKey é null (sem localStorage)", () => {
      const { clearCart } = makeActions({ cartKey: null as any });

      expect(() => clearCart()).not.toThrow();
    });
  });
});
