// Server Component que le ?token= e passa pra Client Component.
// Mesmo padrao usado em /produtor/entrar.

import VerificarClient from "./VerificarClient";

type SearchParams = { token?: string | string[] };

export default async function MotoristaVerificarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const raw = sp.token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  return <VerificarClient tokenFromUrl={token ?? null} />;
}
