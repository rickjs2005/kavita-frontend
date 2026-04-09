// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";
import AuthExpiredHandler from "@/components/auth/AuthExpiredHandler";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
import WhatsAppFloatingButton from "@/components/ui/WhatsAppFloatingButton";
import ChatAssistant from "@/components/ui/ChatAssistant";

import { fetchPublicCategories } from "@/server/data/categories";
import { fetchPublicShopSettings } from "@/server/data/shopSettings";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

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
        <AuthProvider>
          <CartProvider>
            <ConditionalHeader>
              <Header categories={categories} shop={shop} />
            </ConditionalHeader>
            <main id="conteudo">{children}</main>
            <ConditionalHeader>
              <AuthExpiredHandler />
            </ConditionalHeader>
            <ConditionalHeader>
              <WhatsAppFloatingButton
                phone={shop?.contact_whatsapp}
                url={shop?.social_whatsapp_url}
              />
              <ChatAssistant
                whatsappUrl={
                  shop?.social_whatsapp_url ||
                  (shop?.contact_whatsapp
                    ? `https://wa.me/${shop.contact_whatsapp.replace(/\D/g, "").replace(/^(?!55)/, "55")}`
                    : undefined)
                }
              />
            </ConditionalHeader>
            <Toaster position="top-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
