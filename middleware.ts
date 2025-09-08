// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // Protegemos apenas o que precisa de verificação
  const needsAuth =
    pathname.startsWith("/anuncio");

  if (!needsAuth) return NextResponse.next();

  const hasCookie = cookies.get("qwip_phone_e164")?.value;
  if (hasCookie) return NextResponse.next();

  // sem cookie -> manda para /verificar com redirect
  const url = new URL("/verificar", req.url);
  url.searchParams.set("redirect", pathname + nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/anuncio/:path*"], // ajuste se houver outras áreas protegidas
};
