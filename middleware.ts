// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Caminhos que exigem login por SMS (gate leve, baseado no cookie de UI como você já tinha)
const PROTECTED = ["/anuncio/novo"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const res = NextResponse.next();

  // ---------- Cabeçalhos de segurança (seguros e não quebram UI) ----------
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  // permitir geolocalização para o prompt do navegador
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-QWIP-Security-MW", "1"); // marcador temporário

  // ---------- Gate leve de páginas (compatível com seu front atual) ----------
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const hasUiCookie = req.cookies.get("qwip_phone_e164")?.value;
    if (!hasUiCookie) {
      const url = new URL("/verificar", req.nextUrl.origin);
      url.searchParams.set("redirect", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  // ---------- APIs: CORS básico (não tocar) ----------
  if (pathname.startsWith("/api")) {
    const siteOrigin = req.nextUrl.origin;

    if (req.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      preflight.headers.set("Access-Control-Allow-Origin", siteOrigin);
      preflight.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      preflight.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      preflight.headers.set("Access-Control-Max-Age", "600");
      return preflight;
    }

    // cabeçalho CORS para respostas de API
    res.headers.set("Access-Control-Allow-Origin", siteOrigin);
    res.headers.set("Vary", "Origin");
  }

  return res;
}

export const config = {
  matcher: ["/:path*"],
};
