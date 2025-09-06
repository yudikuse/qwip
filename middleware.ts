import { NextRequest, NextResponse } from "next/server";

// Rotas protegidas: exigem login por SMS
const PROTECTED = ["/anuncio/novo"];

function securityHeaders(res: NextResponse) {
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  // permite geolocalização
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Redireciona /verify para /verificar (preserva query)
  if (pathname === "/verify") {
    const url = new URL("/verificar", req.nextUrl.origin);
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
    const redir = NextResponse.redirect(url, { status: 307 });
    return securityHeaders(redir);
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const phoneCookie = req.cookies.get("qwip_phone_e164")?.value || "";
  const forceBypass = searchParams.get("force") === "skip";

  if (isProtected && !phoneCookie && !forceBypass) {
    const url = new URL("/verificar", req.nextUrl.origin);
    url.searchParams.set("redirect", pathname + (req.nextUrl.search || ""));
    const redir = NextResponse.redirect(url, { status: 302 });
    securityHeaders(redir);
    redir.headers.set("X-QWIP-MW", "redirect");
    redir.headers.set("X-QWIP-Auth", "phone:absent");
    return redir;
  }

  const res = securityHeaders(NextResponse.next());
  res.headers.set("X-QWIP-MW", "pass");
  res.headers.set("X-QWIP-Auth", phoneCookie ? "phone:present" : "phone:absent");

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

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
