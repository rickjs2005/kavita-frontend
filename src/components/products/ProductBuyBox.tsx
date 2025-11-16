"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import QuantityInput from "@/components/ui/QuantityInput"; // ou "@/components/ui/QuantityInput"
import AddToCartButton from "@/components/buttons/AddToCartButton";

type Props = {
  product: Product;
  stock?: number;
};

export default function ProductBuyBox({ product, stock = 0 }: Props) {
  const [qty, setQty] = useState(1);
  const disponivel = (stock ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <QuantityInput max={stock} disabled={!disponivel} value={qty} onChange={setQty} />
        <div className="flex-1">
          <AddToCartButton product={product} qty={qty} disabled={!disponivel} />
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-gray-500">
        <li>• Envio rápido para MG/ES/RJ/BA.</li>
        <li>• Troca/devolução em até 7 dias conforme CDC.</li>
        <li>• Suporte pelo WhatsApp em horário comercial.</li>
      </ul>
    </div>
  );
}
