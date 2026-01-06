"use client";

import React from "react";

export type ShippingRules = {
  shippingFree: boolean;
  shippingFreeFromQtyStr: string; 
};

type Props = {
  value: ShippingRules;
  onChange: (next: ShippingRules) => void;
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

export default function ProductShippingSection({ value, onChange }: Props) {
  function patch(next: Partial<ShippingRules>) {
    onChange({ ...value, ...next });
  }

  const showDetails = value.shippingFree;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Frete do produto</h3>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Configure regras simples de frete grátis por produto.
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          id="shippingFree"
          type="checkbox"
          checked={value.shippingFree}
          onChange={(e) => {
            const nextChecked = e.target.checked;

            if (!nextChecked) {
              // Evita estado zumbi: desmarcou => zera qty e manda false
              onChange({
                shippingFree: false,
                shippingFreeFromQtyStr: "", // => NULL no backend
              });
              return;
            }

            // Marcou => mantém qty como está (ou vazio), mas garante boolean true
            patch({ shippingFree: true });
          }}
          className="h-4 w-4 rounded border-gray-300 text-[#359293] focus:ring-[#359293]"
        />
        <label htmlFor="shippingFree" className="text-sm font-medium text-gray-800">
          Frete grátis (este produto)
        </label>
      </div>

      {showDetails && (
        <div className="mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
              Frete grátis a partir de (unidades) — opcional
            </label>

            <input
              value={value.shippingFreeFromQtyStr}
              onChange={(e) => {
                // Regras:
                // - só números
                // - "" => NULL no backend (sempre grátis)
                // - "0" => trata como "" (sempre grátis)
                const digits = onlyDigits(e.target.value).slice(0, 6); // limite razoável
                const normalized = digits === "0" ? "" : digits;

                patch({ shippingFreeFromQtyStr: normalized });
              }}
              placeholder="Ex.: 3"
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
            />

            <span className="text-[11px] text-gray-500">
              Se vazio, o frete grátis vale para qualquer quantidade (sem limite).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
