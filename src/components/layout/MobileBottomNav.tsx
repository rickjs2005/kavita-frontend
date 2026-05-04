"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Bottom navigation fixa no mobile.
 *
 * - Renderizada apenas em rotas públicas (ConditionalHeader esconde em
 *   /admin e /painel/*) e apenas em telas <md (md:hidden).
 * - Item ativo destacado em verde Kavita.
 * - "Conta" leva para /meus-dados quando autenticado, /login caso contrário.
 * - O componente sempre renderiza um spacer de 64px no final do main flow
 *   para evitar que conteúdo importante fique escondido atrás da nav.
 *
 * Rotas usadas — todas existentes no projeto:
 * /, /produtos, /servicos, /favoritos, /meus-dados, /login.
 */
type IconProps = { className?: string };

function HomeIcon({ className = "" }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function GridIcon({ className = "" }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ToolsIcon({ className = "" }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M14.7 6.3a4 4 0 0 1 5 5L17 14l-7 7-3-3 7-7 2.7-4.7z" />
      <path d="M5 19l3-3" />
    </svg>
  );
}

function TagIcon({ className = "" }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 12L12 20l-9-9V3h8l9 9z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function UserIcon({ className = "" }: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

type Item = {
  href: string;
  label: string;
  Icon: (p: IconProps) => React.JSX.Element;
  matchPrefix?: string;
};

export default function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();

  const accountHref = user ? "/meus-dados" : "/login";

  const items: Item[] = [
    { href: "/", label: "Início", Icon: HomeIcon },
    {
      href: "/produtos",
      label: "Categorias",
      Icon: GridIcon,
      matchPrefix: "/categorias",
    },
    { href: "/servicos", label: "Serviços", Icon: ToolsIcon },
    {
      href: "/favoritos",
      label: "Ofertas",
      Icon: TagIcon,
    },
    {
      href: accountHref,
      label: "Conta",
      Icon: UserIcon,
      matchPrefix: user ? "/meus-dados" : "/login",
    },
  ];

  function isActive(item: Item) {
    if (item.href === "/") return pathname === "/";
    if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) return true;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <>
      {/* Spacer: garante que conteúdo final não fica escondido atrás da nav */}
      <div
        aria-hidden
        className="h-16 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      />

      <nav
        aria-label="Navegação inferior"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-[0_-6px_18px_-8px_rgba(0,0,0,0.12)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="flex h-16 items-stretch justify-between px-1">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.label} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex h-full flex-col items-center justify-center gap-0.5 px-1 transition-colors",
                    active
                      ? "text-emerald-600"
                      : "text-slate-500 hover:text-slate-800",
                  ].join(" ")}
                >
                  <item.Icon
                    className={
                      active
                        ? "h-[22px] w-[22px]"
                        : "h-[22px] w-[22px] opacity-90"
                    }
                  />
                  <span
                    className={[
                      "text-[10.5px] leading-none",
                      active ? "font-semibold" : "font-medium",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
