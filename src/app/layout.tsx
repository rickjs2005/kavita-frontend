// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";

import { fetchPublicCategories } from "@/server/data/categories";
import { fetchPublicShopSettings } from "@/server/data/shopSettings";

// ✅ Metadata dinâmico (App Router) baseado no backend
export async function generateMetadata(): Promise<Metadata> {
  try {
    const shop = await fetchPublicShopSettings();

    const storeName =
      typeof shop?.store_name === "string" && shop.store_name.trim()
        ? shop.store_name.trim()
        : "Kavita";

    return {
      title: storeName,
      description: "Loja de agropecuária",
    };
  } catch {
    return {
      title: "Kavita",
      description: "Loja de agropecuária",
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SSR/ISR das categorias (revalidate definido no fetchPublicCategories)
  // Shop settings vem com no-store no fetchPublicShopSettings
  const [categories, shop] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicShopSettings(),
  ]);

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
            {/* Header global */}
            <Header categories={categories} shop={shop} />

            <main id="conteudo">{children}</main>

            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}