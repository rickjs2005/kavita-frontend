// src/components/layout/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminSidebar() {
  const { logout } = useAdminAuth();

  return (
    <aside className="w-64 bg-white shadow h-screen flex flex-col justify-between p-6">
      {/* Cabeçalho / Título */}
      <div>
        <h1 className="text-xl font-bold mb-6 text-[#359293]">
          Painel Admin
        </h1>

        {/* Navegação principal */}
        <nav className="flex flex-col gap-3 text-sm">
          <Link href="/admin" className="hover:text-[#359293] transition">
            🏠 Dashboard
          </Link>

          <Link
            href="/admin/produtos"
            className="hover:text-[#359293] transition"
          >
            📦 Produtos
          </Link>

          <Link
            href="/admin/destaques"
            className="hover:text-[#359293] transition"
          >
            ⭐ Destaques
          </Link>

          <Link
            href="/admin/pedidos"
            className="hover:text-[#359293] transition"
          >
            🧾 Pedidos
          </Link>

          <Link
            href="/admin/servicos"
            className="hover:text-[#359293] transition"
          >
            🛠️ Serviços
          </Link>

          {/* 🔥 Novo item Clientes */}
          <Link
            href="/admin/clientes"
            className="hover:text-[#359293] transition"
          >
            👥 Clientes
          </Link>
        </nav>
      </div>

      {/* Botão de logout fixado na parte inferior */}
      <button
        onClick={logout}
        className="mt-8 w-full flex items-center justify-center gap-2 
        bg-[#359293] text-white py-2 rounded-lg font-semibold shadow 
        hover:bg-[#2b7778] transition-colors"
      >
        🚪 Sair
      </button>
    </aside>
  );
}
