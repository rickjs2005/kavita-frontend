// src/types/coupon.ts

export type CouponType = "percentual" | "valor";

export type Coupon = {
  id: number;
  codigo: string;
  tipo: CouponType;
  valor: number;
  minimo: number;
  expiracao: string | null; // ISO string ou null
  usos: number;
  max_usos: number | null;
  ativo: boolean | 0 | 1;
};

export const emptyCoupon: Coupon = {
  id: 0,
  codigo: "",
  tipo: "percentual",
  valor: 0,
  minimo: 0,
  expiracao: "",
  usos: 0,
  max_usos: null,
  ativo: true,
};
