"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides children (Header, AuthExpiredHandler, etc.) on /admin routes.
 * The admin area has its own layout shell — public chrome must not leak in.
 */
export default function ConditionalHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
