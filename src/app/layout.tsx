// src/app/layout.tsx

// Importa os estilos globais da aplicação (Tailwind, fontes, resets etc)
import "./globals.css";

// Importa os provedores de contexto do carrinho e autenticação
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";

// Importa o componente do cabeçalho
import Header from "../components/layout/Header";

// Metadados da aplicação (úteis para SEO e exibição em navegadores)
export const metadata = {
  title: "Kavita", // Título da aba do navegador
  description: "Loja de agropecuária", // Descrição do site
};

// Componente que representa o layout principal do site (envolve todas as páginas)
export default function RootLayout({
  children, // Conteúdo da página atual
}: {
  children: React.ReactNode; // Tipagem do conteúdo (pode ser qualquer componente React)
}) {
  return (
    <html lang="pt-br"> {/* Define o idioma do site como português do Brasil */}
      <body>
        {/* O contexto do carrinho envolve tudo: autenticação e conteúdo */}
        <CartProvider>
          
          {/* O contexto de autenticação depende do carrinho */}
          <AuthProvider>
            
            {/* Cabeçalho que aparece em todas as páginas */}
            <Header />

            {/* Conteúdo específico de cada página */}
            <main>{children}</main>

          </AuthProvider>
        </CartProvider>
      </body>
    </html>
  );
}
// O RootLayout é o layout principal que envolve todas as páginas da aplicação,
// garantindo que o cabeçalho e os contextos de carrinho e autenticação estejam disponíveis
// em todas as rotas. Ele define também os metadados da aplicação, como título e descrição,
// que são importantes para SEO e usabilidade. O uso de "lang" no elemento <html> ajuda a definir o idioma do conteúdo, melhorando a acessibilidade e a indexação