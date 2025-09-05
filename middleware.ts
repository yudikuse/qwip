// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Caminhos que exigem login por SMS (mantém seu fluxo original por cookie de UI)
const PROTECTED = ["/anuncio/novo"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Resposta padrão
  const res = NextResponse.next();

  // ---------- Cabeçalhos de segurança ----------
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  // CORREÇÃO: permitir geolocalização para o próprio site (volta a exibir o prompt)
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");

  // ---------- Proteção de rotas por cookie de UI (igual ao começo do dia) ----------
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const hasPhone = req.cookies.get("qwip_phone_e164")?.value;
    if (!hasPhone) {
      const url = new URL("/verificar", req.nextUrl.origin);
      url.searchParams.set("redirect", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  // ---------- Regras para APIs (/api/*): CORS restritivo + preflight ----------
  if (pathname.startsWith("/api")) {
    const requestOrigin = req.headers.get("origin");
    const siteOrigin = req.nextUrl.origin;

    // Preflight (sempre responder e encerrar)
    if (req.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      preflight.headers.set("Access-Control-Allow-Origin", siteOrigin);
      preflight.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      preflight.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      preflight.headers.set("Access-Control-Max-Age", "600");
      return preflight;
    }

    // Só permite métodos de escrita se for mesma origem
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const sameOrigin = !requestOrigin || requestOrigin === siteOrigin;

    if (isWrite && !sameOrigin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Cabeçalho CORS para respostas de API
    res.headers.set("Access-Control-Allow-Origin", siteOrigin);
    res.headers.set("Vary", "Origin");
  }

  return res;
}

// Aplica globalmente (páginas e APIs)
export const config = {
  matcher: ["/:path*"],
};
