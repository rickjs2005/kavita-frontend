"use client";

import { useState } from "react";

type Props = {
  max?: number;
  disabled?: boolean;
  value?: number;
  onChange?: (qty: number) => void;
};

export default function QuantityInput({ max, disabled, value = 1, onChange }: Props) {
  const [qty, setQty] = useState<number>(value);

  const emit = (v: number) => {
    const safe = Math.max(1, max ? Math.min(max, v) : v);
    setQty(safe);
    onChange?.(safe);
  };

  return (
    <div className="inline-flex items-center rounded-xl border border-gray-300">
      <button
        type="button"
        onClick={() => emit(qty - 1)}
        disabled={disabled || qty <= 1}
        className="px-3 py-2 text-lg leading-none disabled:opacity-40"
        aria-label="Diminuir quantidade"
      >
        −
      </button>

      <input
        value={qty}
        onChange={(e) => {
          const v = parseInt(e.target.value.replace(/\D/g, "") || "1", 10);
          emit(v);
        }}
        inputMode="numeric"
        className="w-12 text-center py-2 outline-none"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => emit(qty + 1)}
        disabled={disabled || (Number.isFinite(max) && (max ?? 0) > 0 && qty >= (max ?? 0))}
        className="px-3 py-2 text-lg leading-none disabled:opacity-40"
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}
