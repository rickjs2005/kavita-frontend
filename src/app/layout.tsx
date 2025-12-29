// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";

import { fetchPublicCategories } from "@/server/data/categories";

export const metadata: Metadata = {
  title: "Kavita",
  description: "Loja de agropecuária",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SSR/ISR das categorias (revalidate: 60 definido no fetchPublicCategories)
  const categories = await fetchPublicCategories();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="google" content="notranslate" />
        <meta charSet="utf-8" />
      </head>

      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <AuthProvider>
          <CartProvider>
            {/* Header global como era antes */}
            <Header categories={categories} />

            <main id="conteudo">{children}</main>
            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
