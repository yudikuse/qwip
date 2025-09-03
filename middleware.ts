// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/anuncio/novo"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // protege apenas as páginas definidas
  if (PROTECTED.some(p => pathname.startsWith(p))) {
    const hasPhone = req.cookies.get("qwip_phone_e164")?.value;

    if (!hasPhone) {
      // manda para /verificar trazendo de volta após sucesso
      const url = new URL("/verificar", req.nextUrl.origin);
      url.searchParams.set("redirect", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// ajuste aqui os caminhos que precisam de OTP
export const config = {
  matcher: ["/anuncio/novo"],
};
