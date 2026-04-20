// src/app/painel/produtor/contratos/page.tsx
//
// Página /painel/produtor/contratos. O guard de sessão já está no
// layout pai (src/app/painel/produtor/layout.tsx); aqui só
// delegamos ao client component que faz fetch autenticado.

import type { Metadata } from "next";
import ContratosClient from "./ContratosClient";

export const metadata: Metadata = {
  title: "Meus Contratos · Kavita",
  description: "Contratos de compra e venda de café em que você é parte.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ContratosClient />;
}
