// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PHONE_COOKIE } from "@/lib/auth-phone";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const hasPhone = !!req.cookies.get(PHONE_COOKIE)?.value;

  // Se já verificado, não deixa ficar em /verificar
  if (pathname === "/verificar" && hasPhone) {
    const red = searchParams.get("redirect") || "/";
    const url = new URL(red.startsWith("/") ? red : "/", req.url);
    return NextResponse.redirect(url);
  }

  // Protege rotas de anúncio (ajuste se quiser proteger mais caminhos)
  if (pathname.startsWith("/anuncio") && !hasPhone) {
    const back = pathname + (req.nextUrl.search || "");
    const url = new URL("/verificar", req.url);
    url.searchParams.set("redirect", back);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // ignora assets e /api
  matcher: ["/((?!_next/|favicon.ico|api/).*)"],
};
