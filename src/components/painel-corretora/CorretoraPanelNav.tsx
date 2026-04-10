"use client";

// src/components/painel-corretora/CorretoraPanelNav.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";

const items = [
  { href: "/painel/corretora", label: "Resumo", exact: true },
  { href: "/painel/corretora/leads", label: "Leads" },
  { href: "/painel/corretora/perfil", label: "Meu perfil" },
];

export function CorretoraPanelNav() {
  const pathname = usePathname();
  const { user, logout } = useCorretoraAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Painel da corretora
          </p>
          <h1 className="truncate text-lg font-semibold text-zinc-900">
            {user?.corretora_name ?? "Carregando..."}
          </h1>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => logout({ redirectTo: "/painel/corretora/login" })}
            className="ml-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
