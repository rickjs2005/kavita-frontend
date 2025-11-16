// src/types/CartCarProps.ts
export type ImageLike =
  | string
  | { url?: string; path?: string; src?: string; image?: string | null }
  | null
  | undefined;

export interface CartItem {
  id: number;
  name: string;
  price: number;          // normalizado no contexto
  image?: ImageLike;      // 👉 opcional para alinhar com o contexto
  quantity: number;
  _stock?: number;        // estoque conhecido/sincronizado
}

export interface Product {
  id: number;
  name: string;
  price: number | string; // pode vir string do backend
  image?: ImageLike;
  quantity?: number | null;      // alguns backends usam "quantity"
  estoque?: number | null;       // outros usam "estoque"
}
