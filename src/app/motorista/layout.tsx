// Layout do motorista — mobile-first puro. Sem sidebar, header curto.
// Cobre /motorista/login, /motorista/verificar, /motorista/rota,
// /motorista/parada/[id]. Auth e' via cookie httpOnly motoristaToken
// — paginas autenticadas chamam /api/motorista/me e redirecionam pra
// /motorista/login se 401.

import type { Metadata } from "next";
import "@/app/globals.css";
// Nota: SwKillSwitch ja e' renderizado pelo root layout — cobre todas as
// rotas (incluindo admin que tambem foi afetado pelo SW antigo).

export const metadata: Metadata = {
  title: "Kavita · Entregas",
  description: "Painel de entregas do motorista Kavita",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Kavita Entregas",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f59e0b",
};

export default function MotoristaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {children}
    </div>
  );
}
