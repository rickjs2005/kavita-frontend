"use client";

import { useState } from "react";

type Props = {
  max?: number;
  disabled?: boolean;
  value?: number;
  onChange?: (qty: number) => void;
};

export default function QuantityInput({
  max,
  disabled,
  value = 1,
  onChange,
}: Props) {
  const [qty, setQty] = useState<number>(value);

  const emit = (v: number) => {
    const safe = Math.max(1, max ? Math.min(max, v) : v);
    setQty(safe);
    onChange?.(safe);
  };

  const btnClass =
    "px-3 py-2 text-lg leading-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset";

  return (
    <div className="inline-flex items-center rounded-xl border border-gray-300">
      <button
        type="button"
        onClick={() => emit(qty - 1)}
        disabled={disabled || qty <= 1}
        className={btnClass}
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
        aria-label="Quantidade"
        className="w-12 text-center py-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => emit(qty + 1)}
        disabled={
          disabled ||
          (Number.isFinite(max) && (max ?? 0) > 0 && qty >= (max ?? 0))
        }
        className={btnClass}
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}
