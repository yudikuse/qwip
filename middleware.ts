import { NextRequest, NextResponse } from "next/server";
import { PHONE_COOKIE } from "@/lib/cookies";

const PROTECTED = ["/anuncio/novo"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const cookie = req.cookies.get(PHONE_COOKIE)?.value;

  // Libera APIs, estáticos e a própria verificação
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/verificar"
  ) {
    return NextResponse.next();
  }

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/verificar";
    url.search = `?redirect=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
