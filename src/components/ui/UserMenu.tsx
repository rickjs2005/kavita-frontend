"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const userName = user?.nome || user?.email || "Usuário";

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="text-sm hover:text-[#EC5B20]">
        Login / Meus Pedidos
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="hover:text-[#EC5B20] cursor-pointer text-sm"
      >
        {`Bem-vindo, ${userName}`}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu do usuário"
          className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-50 border"
        >
          <div className="py-1">
            <Link
              href="/meus-dados"
              className="block px-4 py-2 hover:bg-gray-100 text-gray-800 text-sm"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Meus Dados
            </Link>
            <Link
              href="/pedidos"
              className="block px-4 py-2 hover:bg-gray-100 text-gray-800 text-sm"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Meus Pedidos
            </Link>
            <button
              role="menuitem"
              onClick={() => { logout(); setOpen(false); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
