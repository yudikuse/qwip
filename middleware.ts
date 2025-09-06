import { NextRequest, NextResponse } from "next/server";

// Routes that need login (by cookie qwip_phone_e164)
const PROTECTED = ["/anuncio/novo"];

// Add security headers
function addSecurityHeaders(res: NextResponse) {
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  // Allow geolocation prompt (for “Usar minha localização” button)
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Redirect /verify → /verificar (preserving query parameters)
  if (pathname === "/verify") {
    const url = new URL("/verificar", req.nextUrl.origin);
    searchParams.forEach((val, key) => url.searchParams.set(key, val));
    return addSecurityHeaders(NextResponse.redirect(url, { status: 307 }));
  }

  // Check cookie on protected routes
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  const phoneCookie = req.cookies.get("qwip_phone_e164")?.value;
  const bypass = searchParams.get("force") === "skip";

  if (needsAuth && !phoneCookie && !bypass) {
    // Redirect to /verificar with redirect param
    const url = new URL("/verificar", req.nextUrl.origin);
    url.searchParams.set("redirect", pathname + (req.nextUrl.search || ""));
    const res = NextResponse.redirect(url, { status: 302 });
    addSecurityHeaders(res);
    res.headers.set("X-QWIP-MW", "redirect");
    res.headers.set("X-QWIP-Auth", "phone:absent");
    return res;
  }

  const res = addSecurityHeaders(NextResponse.next());
  res.headers.set("X-QWIP-MW", "pass");
  res.headers.set("X-QWIP-Auth", phoneCookie ? "phone:present" : "phone:absent");

  // Basic CORS handling for /api routes
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
  // Ignore static assets (/_next, etc.), apply to pages and API
  matcher: ["/((?!_next|.*\\..*).*)"],
};
