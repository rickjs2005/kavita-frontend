// src/app/produtor/entrar/page.tsx
//
// Tela pública de login do produtor por magic link.
//   - Sem token na URL → mostra formulário de email.
//   - Com ?token=... → consome e redireciona para /painel/produtor.

import EntrarClient from "./EntrarClient";

export const metadata = {
  title: "Entrar · Produtor | Kavita · Mercado do Café",
  robots: { index: false, follow: false },
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <EntrarClient tokenFromUrl={token ?? null} />;
}
