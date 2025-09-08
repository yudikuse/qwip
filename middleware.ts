// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "qwip_phone_e164";

// Rotas que exigem verificação
const PROTECTED_PREFIXES = [
  "/anuncio/novo",
  "/anuncio",
  "/painel",
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Libera APIs e rotas públicas
  if (pathname.startsWith("/api")) return NextResponse.next();
  if (pathname.startsWith("/verificar")) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/assets")) {
    return NextResponse.next();
  }

  const hasCookie = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  // Se a rota é protegida e não tem cookie, manda para /verificar com redirect
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasCookie) {
      const url = new URL("/verificar", req.url);
      url.searchParams.set("redirect", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Ajuste de matcher para pegar tudo, exceto estáticos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
