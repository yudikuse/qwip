// middleware.ts — Qwip (Passo 1: blindagem mínima)
// - Verifica sessão (cookie HttpOnly assinado) para rotas sensíveis
// - Protege APIs de mutação (ads POST/PATCH/DELETE)
// - Redireciona UI protegida para /auth/phone quando não logado
// - Trata CORS básico para /api/*
//
// OBS: roda no Edge Runtime (WebCrypto disponível). Nada de libs Node.

import { NextRequest, NextResponse } from "next/server";

// ===== Config =====
const COOKIE_NAME = "qwip_session";
const SIGNING_SECRET =
  process.env.SIGNING_SECRET ||
  process.env.QWIP_SIGNING_SECRET ||
  "dev-secret-change-me";

// Páginas da UI que exigem sessão
const UI_PROTECTED = [
  "/anuncio/novo",
  "/anunciar",
];

// APIs de OTP/consent sempre liberadas
const API_PUBLIC_PREFIXES = [
  "/api/otp/",
  "/api/consent",
  "/api/health",
  "/api/moderation/twilio-webhook", // webhook não exige sessão, validaremos assinatura na rota
];

// APIs que exigem sessão por método
function isApiProtected(pathname: string, method: string) {
  // Criar anúncio
  if (pathname === "/api/ads" && method === "POST") return true;
  // Editar/Excluir anúncio
  if (pathname.startsWith("/api/ads/") && (method === "PATCH" || method === "DELETE")) return true;
  return false;
}

// ===== Helpers base64/url (Edge-safe) =====
function b64uToB64(b64u: string): string {
  const s = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  return pad ? s + "=".repeat(4 - pad) : s;
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function bytesEq(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let v = 0;
  for (let i = 0; i < a.length; i++) v |= a[i] ^ b[i];
  return v === 0;
}

// ===== Verificação do token de sessão (v1.<payload>.<signature>) =====
type Claims = { phone: string; iat: number; exp: number };

// Converte um Uint8Array para um ArrayBuffer “exato” (sem depender de byteOffset/byteLength)
function toArrayBufferExact(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

async function verifySession(raw: string | null): Promise<{ ok: boolean; claims?: Claims; reason?: string }> {
  if (!raw) return { ok: false, reason: "missing" };
  const parts = raw.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };
  const [ver, payloadB64u, sigB64u] = parts;
  if (ver !== "v1") return { ok: false, reason: "version" };

  // parse payload
  let claims: Claims | null = null;
  try {
    const json = new TextDecoder().decode(b64ToBytes(b64uToB64(payloadB64u)));
    claims = JSON.parse(json);
  } catch {
    return { ok: false, reason: "payload" };
  }
  if (!claims) return { ok: false, reason: "payload" };

  // check exp
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || claims.exp <= now) return { ok: false, reason: "expired" };

  // HMAC-SHA256(SECRET, `v1.${payload}`)
  const toSign = `v1.${payloadB64u}`;
  // >>> Correção: usar ArrayBuffer "exato" no importKey
  const secretBytes = enc(SIGNING_SECRET);
  const keyData = toArrayBufferExact(secretBytes);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData, // ArrayBuffer
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const expectedBuf = await crypto.subtle.sign("HMAC", key, enc(toSign));
  const expected = new Uint8Array(expectedBuf);
  const got = b64ToBytes(b64uToB64(sigB64u));
  if (!bytesEq(expected, got)) return { ok: false, reason: "signature" };

  return { ok: true, claims };
}

// ===== CORS =====
function getSiteOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base) try { return new URL(base).origin; } catch {}
  return req.nextUrl.origin;
}
function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  };
}

// ===== Middleware principal =====
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // CORS pré-flight
  if (pathname.startsWith("/api/") && method === "OPTIONS") {
    const origin = getSiteOrigin(req);
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Libera APIs públicas
  if (pathname.startsWith("/api/")) {
    const pub = API_PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
    if (!pub) {
      if (isApiProtected(pathname, method)) {
        const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
        const v = await verifySession(token);
        if (!v.ok) {
          return new NextResponse("Forbidden", { status: 403 });
        }
      }
    }
    // aplica CORS nas APIs
    const res = NextResponse.next();
    const origin = getSiteOrigin(req);
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // UI protegida → precisa sessão
  if (UI_PROTECTED.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get(COOKIE_NAME)?.value ?? null;
    const v = await verifySession(token);
    if (!v.ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/phone";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Aplica globalmente
export const config = {
  matcher: ["/:path*"],
};
