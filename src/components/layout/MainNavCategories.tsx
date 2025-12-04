"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean | 0 | 1;
};

export default function MainNavCategories() {
  const [categorias, setCategorias] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategorias() {
      try {
        const res = await fetch(`${API_BASE}/api/public/categorias`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Erro ao carregar categorias (${res.status})`);
        }

        const data = await res.json();
        const arr: PublicCategory[] = Array.isArray(data)
          ? data
          : (data?.categorias as PublicCategory[]) || [];

        // garante só ativas (se o backend mandar o campo)
        const ativas = arr.filter(
          (c) =>
            c.is_active === undefined ||
            c.is_active === 1 ||
            c.is_active === true
        );

        setCategorias(ativas);
      } catch (err) {
        console.error("[MainNavCategories] Erro:", err);
        setCategorias([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategorias();
  }, []);

  if (loading && !categorias.length) return null;
  if (!categorias.length) return null;

  return (
    <nav className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 md:gap-x-8 md:gap-y-3">
      {categorias.map((cat) => (
        <Link
          key={cat.id}
          href={`/categorias/${cat.slug}`}
          className="text-sm font-medium text-emerald-50/95 hover:text-[#EC5B20] transition-colors"
        >
          {cat.name}
        </Link>
      ))}
      <Link 
        href="/servicos"
        className="text-sm font-medium text-emerald-50/95 hover:text-[#EC5B20] transition-colors">
        Serviços
      </Link>

      {/* Link manual do Drone, destaque especial mas hover igual ao carrinho */}
      <Link
        href="/drones"
        className="text-sm font-semibold text-[#38bdf8]/110 hover:text-[#EC5B20] transition-colors"
      >
        Kavita Drone
      </Link>
    </nav>
  );
}
