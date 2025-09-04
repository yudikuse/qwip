// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Rotas que exigem login por SMS
const PROTECTED = ["/anuncio/novo"];

// Helpers de base64/url (sem depender de libs no Edge)
function b64uToB64(b64u: string): string {
  const s = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  return pad ? s + "=".repeat(4 - pad) : s;
}
function strToU8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function b64ToU8(b64: string): Uint8Array {
  // @ts-ignore
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  // @ts-ignore
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function u8eq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// Verifica cookie de sessão qwip_session = v1.<payload>.<signature>
// payload = { phone, iat, exp }
async function verifySessionCookie(raw: string | undefined | null): Promise<boolean> {
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [v, p, s] = parts;
  if (v !== "v1") return false;

  // decodifica payload
  let claims: any;
  try {
    const json = new TextDecoder().decode(b64ToU8(b64uToB64(p)));
    claims = JSON.parse(json);
  } catch {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims?.exp) || claims.exp <= now) return false;

  // valida HMAC
  const toSign = `${v}.${p}`;
  const secret = process.env.SIGNING_SECRET || process.env.QWIP_SIGNING_SECRET || "dev-secret-change-me";
  const key = await crypto.subtle.importKey("raw", strToU8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, strToU8(toSign));
  const expected = new Uint8Array(sig);
  const got = b64ToU8(b64uToB64(s));
  return u8eq(expected, got);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const res = NextResponse.next();

  // ---------- Cabeçalhos de segurança ----------
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  // permitir geolocalização (para o prompt do navegador)
  res.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("X-QWIP-Security-MW", "1"); // marcador temporário

  // ---------- Gate de sessão para rotas protegidas ----------
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const raw = req.cookies.get("qwip_session")?.value || "";
    const ok = await verifySessionCookie(raw);
    if (!ok) {
      const url = new URL("/verificar", req.nextUrl.origin);
      url.searchParams.set("redirect", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  // ---------- Regras para APIs (/api/*): CORS restritivo + preflight ----------
  if (pathname.startsWith("/api")) {
    const requestOrigin = req.headers.get("origin"); // quem está chamando
    const siteOrigin = req.nextUrl.origin;           // seu domínio (ex.: https://qwip.pro)

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
