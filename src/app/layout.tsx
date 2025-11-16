// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";

export const metadata: Metadata = {
  title: "Kavita",
  description: "Loja de agropecuária",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Evita o iPhone/iOS de auto-linkar telefone, datas, e-mails e endereços */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        {/* Viewport correta + safe area para iPhones com notch */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Pede ao Chrome para não traduzir/alterar o DOM (evita __gchrome_uniqueid) */}
        <meta name="google" content="notranslate" />
        {/* Charset explícito (boa prática) */}
        <meta charSet="utf-8" />
      </head>

      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
