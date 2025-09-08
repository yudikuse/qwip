// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProtected = pathname.startsWith("/anuncio/novo"); // ajuste se precisar
  const hasAuth = req.cookies.get("qwip_auth")?.value;

  if (isProtected && !hasAuth) {
    const url = new URL("/verificar", req.url);
    url.searchParams.set("redirect", `${pathname}${search || ""}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/anuncio/novo"],
};
