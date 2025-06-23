export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartCarProps {
  isCartOpen: boolean;
  closeCart: () => void;
  cartItems: CartItem[];
  removeFromCart: (itemId: number) => void;
  cartTotal: number;
  updateQuantity: (itemId: number, quantity: number) => void;
  applyDiscount: (code: string) => void;
  discount: number;
}