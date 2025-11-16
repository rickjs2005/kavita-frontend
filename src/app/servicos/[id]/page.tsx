// src/app/servicos/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Service } from "@/types/service";

export const dynamic = "force-dynamic";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data?.data && Array.isArray(data.data)) return data.data as T[];
  if (data?.items && Array.isArray(data.items)) return data.items as T[];
  if (data?.results && Array.isArray(data.results)) return data.results as T[];
  return [];
}

async function getServicoById(id: string): Promise<Service | null> {
  // 👉 Tente o endpoint PÚBLICO primeiro (singular/plural)
  const direct = [
    `${API}/api/public/servicos/${id}`,
    `${API}/api/public/servico/${id}`,
    // compat/legado:
    `${API}/api/servicos/${id}`,
    `${API}/api/servico/${id}`,
    `${API}/admin/servicos/${id}`,
  ];

  for (const url of direct) {
    const json = await fetchJSON<any>(url);
    const s = (json?.data ?? json) as Service | null;
    if (s?.id !== undefined) return s;
  }

  // Query (?id=)
  const query = [
    `${API}/api/public/servicos?id=${id}`,
    `${API}/api/public/servico?id=${id}`,
    `${API}/api/servicos?id=${id}`,
    `${API}/api/servico?id=${id}`,
  ];
  for (const url of query) {
    const json = await fetchJSON<any>(url);
    const arr = toArray<Service>(json);
    const found = arr.find((x) => String(x.id) === String(id));
    if (found) return found;
  }

  // Fallback: lista e filtra
  const lists = [
    `${API}/api/public/servicos`,
    `${API}/api/servicos`,
    `${API}/admin/servicos`,
  ];
  for (const url of lists) {
    const json = await fetchJSON<any>(url);
    const arr = toArray<Service>(json);
    const found = arr.find((x) => String(x.id) === String(id));
    if (found) return found;
  }

  // Loga 1x só no fim
  console.error(`[servico:get] não encontrado em nenhum endpoint (id=${id})`);
  return null;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const servico = await getServicoById(id);
  if (!servico) return notFound();

  const ServicoContent = (await import("./ServicoContent")).default;
  return <ServicoContent servico={servico} />;
}
