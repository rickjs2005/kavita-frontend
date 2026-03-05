import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

// Static assets that must never be blocked (images, scripts, styles, fonts, etc.)
const STATIC_ASSET_RE = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|otf|eot|css|js|map|json|txt|xml)$/i;

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Aplica apenas sob /admin/*
  if (pathname.startsWith("/admin")) {
    // Libera assets estáticos (CSS, JS, imagens, fontes, etc.)
    if (STATIC_ASSET_RE.test(pathname)) {
      return NextResponse.next();
    }

    // Libera rotas públicas
    if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
      return NextResponse.next();
    }

    // ✅ usa o MESMO cookie do backend (HttpOnly; Secure; SameSite=Strict)
    const token = req.cookies.get("adminToken")?.value;

    if (!token) {
      console.warn(`[middleware] Acesso rejeitado sem token: ${pathname}`);

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