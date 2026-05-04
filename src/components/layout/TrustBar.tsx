// src/components/layout/TrustBar.tsx
"use client";
export default function TrustBar() {
  const items = [
    { title: "Pagamento Seguro", desc: "Pix · Cartão · Boleto" },
    { title: "Entrega Garantida", desc: "Rastreio e seguro" },
    { title: "Atendimento", desc: "WhatsApp e E-mail" },
  ];
  return (
    <div className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-4 min-[480px]:grid-cols-3 sm:gap-4 sm:py-5">
        {items.map((it) => (
          <div
            key={it.title}
            className="flex items-center justify-center gap-3 min-[480px]:justify-start"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
              ✓
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                {it.title}
              </div>
              <div className="text-[11px] text-slate-500 sm:text-xs">
                {it.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
