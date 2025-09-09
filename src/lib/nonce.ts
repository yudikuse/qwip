// src/lib/nonce.ts
// Utilitários de NONCE (token curto assinado) para proteger mutações.
// Next.js 15 compatível: usa NextResponse.cookies.set (nada de cookies().set).

import { NextRequest, NextResponse } from "next/server";
import {
  signToken,
  verifyToken,
  type Claims as SigningClaims,
} from "@/lib/signing";

export const NONCE_HEADER = "x-qwip-nonce";
export const NONCE_COOKIE = "qwip_nonce_sig";

// ===== Helpers =====
function ipFrom(req?: NextRequest): string {
  if (!req) return "0.0.0.0";
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}
function uaFrom(req?: NextRequest): string {
  if (!req) return "";
  return req.headers.get("user-agent") || "";
}

// ===== Tipos =====
// Mantemos um alias local para facilitar reuso nos retornos
export type NonceClaims = SigningClaims;

// Define o cookie httpOnly com o token (sem expor dados sensíveis ao client)
export function setNonceCookie(
  resOrToken: NextResponse | string,
  tokenMaybe?: string,
  maxAgeSeconds = 60
) {
  // Suporta ambos formatos:
  //   setNonceCookie(res, token, maxAge)
  //   setNonceCookie(token)  -> no-op (compat de chamadas antigas sem acesso ao Response)
  if (typeof resOrToken === "string") return;

  const res = resOrToken as NextResponse;
  const token = tokenMaybe ?? "";
  if (!token) return;

  res.cookies.set(NONCE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

// Retorna um JSON já com um novo nonce (em Header + Cookie).
export async function jsonWithNonce(
  body: unknown,
  opts?: {
    status?: number;
    headers?: Record<string, string>;
    ttlSeconds?: number; // padrão 60s
    claims?: Partial<SigningClaims>; // sub/path/phone/ip/ua/iat/exp
    req?: NextRequest; // para ip/ua
  }
): Promise<NextResponse> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10, Math.floor(opts?.ttlSeconds ?? 60));

  // >>> IMPORTANT: Claims compatíveis com lib/signing (sub literalmente "ads")
  const claims: SigningClaims = {
    sub: "ads",
    path: opts?.claims?.path ?? "/api/ads",
    phone: opts?.claims?.phone,
    ip: opts?.claims?.ip ?? ipFrom(opts?.req),
    ua: opts?.claims?.ua ?? uaFrom(opts?.req),
    iat: now,
    exp: now + ttl,
  };

  const token = await signToken(claims);

  const res = NextResponse.json(body, {
    status: opts?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
      ...(opts?.headers ?? {}),
    },
  });

  res.headers.set("X-Qwip-Nonce", token);
  setNonceCookie(res, token, ttl);

  return res;
}

// Extrai e valida o nonce de Header OU Cookie (fallback)
export async function extractAndVerifyNonce(
  req: NextRequest
): Promise<{ ok: boolean; claims?: NonceClaims; reason?: string }> {
  const token =
    req.headers.get(NONCE_HEADER) ||
    req.cookies.get(NONCE_COOKIE)?.value ||
    "";

  if (!token) return { ok: false, reason: "missing" };

  const v = await verifyToken(token);
  if (!v.ok || !v.claims) return { ok: false, reason: v.reason || "invalid" };

  // (Opcional) checar ip/ua aqui; por compatibilidade, mantemos permissivo.
  return { ok: true, claims: v.claims as NonceClaims };
}

// ====== ALIASES de compatibilidade ======
// Algumas partes antigas chamam "generateNonceHex". Mantemos o alias
// devolvendo o mesmo token (base64url) emitido por signToken/Claims "ads".
export async function generateNonceHex(
  opts?: { ttlSeconds?: number; claims?: Partial<SigningClaims>; req?: NextRequest }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10, Math.floor(opts?.ttlSeconds ?? 60));

  const claims: SigningClaims = {
    sub: "ads",
    path: opts?.claims?.path ?? "/api/ads",
    phone: opts?.claims?.phone,
    ip: opts?.claims?.ip ?? ipFrom(opts?.req),
    ua: opts?.claims?.ua ?? uaFrom(opts?.req),
    iat: now,
    exp: now + ttl,
  };

  return signToken(claims);
}
