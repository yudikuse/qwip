// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Rotas que exigem login por SMS (fluxo original por cookie de UI)
const PROTECTED = ["/anuncio/novo"];

function securityHeaders(res: NextResponse) {
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  // Permite geolocalização no próprio site (volta o prompt)
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // ---------- Gate: redireciona cedo se faltar cookie ----------
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const phoneCookie = req.cookies.get("qwip_phone_e164")?.value || "";
  const forceBypass = searchParams.get("force") === "skip"; // util p/ testes

  if (isProtected && !phoneCookie && !forceBypass) {
    const url = new URL("/verificar", req.nextUrl.origin);
    url.searchParams.set("redirect", pathname + (req.nextUrl.search || ""));
    const redir = NextResponse.redirect(url, { status: 302 });
    securityHeaders(redir);
    // headers de diagnóstico
    redir.headers.set("X-QWIP-MW", "redirect");
    redir.headers.set("X-QWIP-Auth", "phone:absent");
    return redir;
  }

  // ---------- Fluxo normal ----------
  const res = securityHeaders(NextResponse.next());

  // Diagnóstico sempre presente nas respostas
  res.headers.set("X-QWIP-MW", "pass");
  res.headers.set("X-QWIP-Auth", phoneCookie ? "phone:present" : "phone:absent");

  // CORS mínimo para /api/*
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

// Aplica globalmente (páginas e APIs)
export const config = {
  // evita pegar assets estáticos, mas cobre todas as páginas/app/api
  matcher: ["/((?!_next|.*\\..*).*)"],
};
