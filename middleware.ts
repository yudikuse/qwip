// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Rotas que exigem sessão (OTP feito)
const PROTECTED = ["/anuncio/novo"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ---------- Security headers ----------
  const res = NextResponse.next();
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-QWIP-Security-MW", "1");

  // ---------- Proteção de rotas (checagem leve no edge) ----------
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    // Apenas presença do cookie assinado; a verificação de assinatura/expiração fica no layout (server)
    const hasSession = Boolean(req.cookies.get("qwip_session")?.value);
    if (!hasSession) {
      const url = new URL("/verificar", req.nextUrl.origin);
      url.searchParams.set("redirect", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  // ---------- CORS para /api/* ----------
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

    res.headers.set("Access-Control-Allow-Origin", siteOrigin);
    res.headers.set("Vary", "Origin");
  }

  return res;
}

// Aplica globalmente
export const config = {
  matcher: ["/:path*"],
};
