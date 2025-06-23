"use client"; // Esse arquivo roda do lado do cliente (Next.js)

// Importações de hooks do React
import { createContext, useContext, useEffect, useState } from "react";
import { Product } from "../types/product";           // Tipo do produto
import { CartItem } from "../types/CartCarProps";     // Tipo de item no carrinho

// Tipagem do contexto do carrinho
interface CartContextProps {
  cartItems: CartItem[]; // Itens no carrinho
  addToCart: (product: Product) => void; // Adiciona um item ao carrinho
  removeFromCart: (id: number) => void;  // Remove um item do carrinho
  updateQuantity: (id: number, quantity: number) => void; // Altera quantidade de um item
  cartTotal: number; // Total da compra
  clearCart: () => void; // Limpa o carrinho
  isCartOpen: boolean; // Carrinho está aberto?
  openCart: () => void; // Abre o carrinho
  closeCart: () => void; // Fecha o carrinho
}

// Criação do contexto (ponto central)
const CartContext = createContext<CartContextProps | undefined>(undefined);

// Provider: disponibiliza o contexto para os componentes filhos
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Estado do carrinho
  const [isCartOpen, setIsCartOpen] = useState(false);        // Estado de visibilidade

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const [cartKey, setCartKey] = useState<string | null>(null); // Chave usada no localStorage

  // 1️⃣ Ao carregar, define a chave do carrinho com base no ID do usuário
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCartKey(`cartItems_${storedUserId}`);
    }
  }, []);

  // 2️⃣ Restaura o carrinho salvo do localStorage quando a chave estiver pronta
  useEffect(() => {
    if (cartKey) {
      const saved = localStorage.getItem(cartKey);
      if (saved) {
        setCartItems(JSON.parse(saved));
      } else {
        setCartItems([]); // Se não existir nada salvo
      }
    }
  }, [cartKey]);

  // 3️⃣ Salva o carrinho automaticamente sempre que ele muda
  useEffect(() => {
    if (cartKey) {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    }
  }, [cartItems, cartKey]);

  // ➕ Adiciona um produto ao carrinho (ou aumenta a quantidade se já existir)
  const addToCart = (product: Product) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
          },
        ];
      }
    });
    openCart(); // Abre o carrinho automaticamente
  };

  // ❌ Remove um item do carrinho
  const removeFromCart = (id: number) => {
    setCartItems((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // 🔁 Atualiza a quantidade de um item (mínimo 1)
  const updateQuantity = (id: number, quantity: number) => {
    setCartItems((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  // 🧹 Limpa todo o carrinho (estado e localStorage)
  const clearCart = () => {
    setCartItems([]);
    if (cartKey) localStorage.removeItem(cartKey);
  };

  // 💰 Calcula o total do carrinho
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Retorna o contexto para os filhos
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook para acessar o contexto do carrinho
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
};
// Este arquivo define o contexto do carrinho de compras, permitindo que componentes acessem e manipulem o carrinho de forma centralizada.
// Ele inclui funcionalidades como adicionar/remover itens, atualizar quantidades, calcular total e gerenciar a visibilidade do carrinho.
// O estado do carrinho é salvo no localStorage para persistência entre recarregamentos de página, utilizando uma chave baseada no ID do usuário.
// O hook `useCart` facilita o acesso a essas funcionalidades em qualquer componente filho do ` CartProvider`.
// O `CartProvider` deve ser usado no nível mais alto da aplicação, geralmente em `__app.tsx` ou `layout.tsx`,para que todos os componentes tenham acesso ao carrinho.     