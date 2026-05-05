// src/app/news/layout.tsx
//
// v1: Kavita News fica fora do menu público e fora do índice de busca
// até ter conteúdo editorial mínimo (cf. plano de lançamento v1).
// As rotas /news/* continuam acessíveis por URL direta para o time
// usar/testar — só não são listadas em sitemap nem indexadas.
//
// Quando o módulo for liberado para o público, basta apagar este arquivo
// (ou trocar `index: false` por `index: true`).

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
