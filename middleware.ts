import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Aplica apenas sob /admin/*
  if (pathname.startsWith("/admin")) {
    // Libera rotas públicas
    if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
      return NextResponse.next();
    }

    // ✅ usa o MESMO cookie do backend
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set(
        "from",
        pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
      );
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};