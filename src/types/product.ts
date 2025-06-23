export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  third_category?: string;
  category_id: string;
  destaque?: "mais_vendido" | "super_oferta" | "promocao" | null;
};
