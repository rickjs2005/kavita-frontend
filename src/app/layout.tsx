// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";
import AuthExpiredHandler from "@/components/auth/AuthExpiredHandler";
import SwKillSwitch from "@/components/system/SwKillSwitch";
import ConditionalHeader from "@/components/layout/ConditionalHeader";
import ConditionalFloatingWidgets from "@/components/layout/ConditionalFloatingWidgets";
import WhatsAppFloatingButton from "@/components/ui/WhatsAppFloatingButton";
import ChatAssistant from "@/components/ui/ChatAssistant";
import { CookieBanner } from "@/components/CookieBanner";

import { fetchPublicCategories } from "@/server/data/categories";
import { fetchPublicShopSettings } from "@/server/data/shopSettings";
import { fetchSupportConfig } from "@/server/data/supportConfig";

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
  const [categories, shop, supportCfg] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicShopSettings(),
    fetchSupportConfig(),
  ]);

  const showWhatsApp = supportCfg?.show_whatsapp_widget !== false;
  const showChatbot = supportCfg?.show_chatbot !== false;

  const whatsappUrl =
    shop?.social_whatsapp_url ||
    (shop?.contact_whatsapp
      ? `https://wa.me/${shop.contact_whatsapp.replace(/\D/g, "").replace(/^(?!55)/, "55")}`
      : undefined);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Hotfix Fase 5: limpa SW antigo automaticamente quando PWA esta off
            (default). Renderiza nada visivel; pula totalmente quando
            NEXT_PUBLIC_ENABLE_PWA=true. Cobre todas as rotas (admin/motorista/etc). */}
        <SwKillSwitch />
        <AuthProvider>
          <CartProvider>
            <ConditionalHeader>
              <Header categories={categories} shop={shop} />
            </ConditionalHeader>
            <main id="conteudo">{children}</main>
            <ConditionalHeader>
              <AuthExpiredHandler />
            </ConditionalHeader>
            <ConditionalFloatingWidgets>
              {showWhatsApp && (
                <WhatsAppFloatingButton
                  phone={shop?.contact_whatsapp}
                  url={shop?.social_whatsapp_url}
                />
              )}
              {showChatbot && (
                <ChatAssistant whatsappUrl={whatsappUrl} />
              )}
            </ConditionalFloatingWidgets>
            <Toaster position="top-right" />
            <CookieBanner />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
