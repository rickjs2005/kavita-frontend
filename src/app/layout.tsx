// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";
import Analytics from "@/components/Analytics";

import { fetchPublicCategories } from "@/server/data/categories";
import { fetchPublicShopSettings } from "@/server/data/shopSettings";

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
  const [categories, shop] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicShopSettings(),
  ]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Analytics />

        <AuthProvider>
          <CartProvider>
            <Header categories={categories} shop={shop} />
            <main id="conteudo">{children}</main>
            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
