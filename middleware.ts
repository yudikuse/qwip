// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/anuncio/novo"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Bypass para rotas técnicas
  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname === "/verificar") return NextResponse.next();

  // Cabeçalhos de segurança
  const res = NextResponse.next();
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");

  // Proteção de páginas
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const hasPhone = req.cookies.get("qwip_phone_e164")?.value;
    if (!hasPhone) {
      const url = new URL("/verificar", req.nextUrl.origin);
      url.searchParams.set("redirect", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/:path*"],
};
