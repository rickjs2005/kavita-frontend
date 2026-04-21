// src/app/painel/produtor/meus-dados/page.tsx
//
// Guard de sessão no layout pai; aqui só delegamos ao client
// component que faz fetch autenticado.

import type { Metadata } from "next";
import MeusDadosClient from "./MeusDadosClient";

export const metadata: Metadata = {
  title: "Meus Dados · Kavita",
  description: "Seus dados, exportação e direitos LGPD.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MeusDadosClient />;
}
