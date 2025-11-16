// src/app/busca/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function toArray<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data?.data && Array.isArray(data.data)) return data.data as T[];
  if (data?.items && Array.isArray(data.items)) return data.items as T[];
  if (data?.results && Array.isArray(data.results)) return data.results as T[];
  if (data?.produtos && Array.isArray(data.produtos)) return data.produtos as T[];
  return [];
}

function absUrl(p?: string | null) {
  if (!p) return "/placeholder.png";
  const s = String(p).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/uploads")) return `${API_URL}${s}`;
  if (s.startsWith("uploads")) return `${API_URL}/${s}`;
  return `${API_URL}/uploads/${s}`;
}

async function searchAll(q: string) {
  const [prodRes, servRes] = await Promise.all([
    fetch(`${API_URL}/api/public/produtos?busca=${encodeURIComponent(q)}`, { cache: "no-store" }),
    fetch(`${API_URL}/api/public/servicos?busca=${encodeURIComponent(q)}`, { cache: "no-store" }),
  ]);

  const [prodJson, servJson] = await Promise.all([
    prodRes.ok ? prodRes.json() : [],
    servRes.ok ? servRes.json() : [],
  ]);

  const produtos = toArray<any>(prodJson).map((p) => ({
    id: Number(p.id),
    name: p.name ?? p.nome ?? "Produto",
    price: Number(p.price ?? p.preco ?? 0),
    image: absUrl(p.image ?? (p.images?.[0] ?? null)),
  }));

  const servicos = toArray<any>(servJson).map((s) => ({
    id: Number(s.id),
    name: s.nome ?? s.name ?? "Serviço",
    price: Number(s.preco ?? s.price ?? 0),
    image: absUrl(s.imagem ?? s.image ?? (s.images?.[0] ?? null)),
  }));

  return { produtos, servicos };
}

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type BuscaPageProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

async function resolveSearchParams(
  params?: Promise<SearchParamsRecord>
): Promise<SearchParamsRecord> {
  if (!params) {
    return {};
  }

  const awaited = await params;
  return awaited ?? {};
}

export default async function BuscaPage({ searchParams }: BuscaPageProps) {
  const resolved = await resolveSearchParams(searchParams);
  const raw = resolved.q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  if (!q) {
    return (
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Buscar</h1>
        <p className="text-gray-600">Digite algo na barra de busca acima para ver os resultados.</p>
      </section>
    );
  }

  const { produtos, servicos } = await searchAll(q);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">
          Resultados para: <span className="text-[#2F7E7F]">{q}</span>
        </h1>
        <p className="text-sm text-gray-500">
          {produtos.length + servicos.length} itens encontrados
        </p>
      </header>

      {/* Produtos */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Produtos</h2>
        {produtos.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum produto encontrado.</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtos.map((p) => (
              <li
                key={`p-${p.id}`}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <Link href={`/produtos/${p.id}`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-40 object-cover bg-gray-50"
                  />
                  <div className="p-3">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-green-600 text-sm font-semibold">
                      R$ {p.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Serviços */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Serviços</h2>
        {servicos.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum serviço encontrado.</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {servicos.map((s) => (
              <li
                key={`s-${s.id}`}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <Link href={`/servicos/${s.id}`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image}
                    alt={s.name}
                    className="w-full h-40 object-cover bg-gray-50"
                  />
                  <div className="p-3">
                    <p className="font-medium truncate">{s.name}</p>
                    {s.price > 0 && (
                      <p className="text-green-600 text-sm font-semibold">
                        R$ {s.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
