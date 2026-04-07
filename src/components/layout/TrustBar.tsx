// src/components/layout/TrustBar.tsx
"use client";
export default function TrustBar() {
  const items = [
    { title: "Pagamento Seguro", desc: "Pix · Cartão · Boleto" },
    { title: "Entrega Garantida", desc: "Rastreio e seguro" },
    { title: "Atendimento", desc: "WhatsApp e E-mail" },
  ];
  return (
    <div className="border-y bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3 sm:gap-4">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3 justify-center min-[480px]:justify-start">
            <div className="h-9 w-9 shrink-0 rounded-full border flex items-center justify-center text-emerald-600">
              ✓
            </div>
            <div>
              <div className="text-sm font-semibold">{it.title}</div>
              <div className="text-xs text-gray-600">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
