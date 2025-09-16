// src/lib/nonce.ts
// Utilitários de NONCE (token curto assinado) para proteger mutações.
// Compatível com Next.js 15 e com src/lib/signing.ts (Claims estritos).

import { NextRequest, NextResponse } from "next/server";
import {
  signToken,
  verifyToken,
  type Claims as SigningClaims, // { sub: "ads"; path: "/api/ads"; phone: string; ip: string; ua: string; iat: number; exp: number }
} from "@/lib/signing";

export const NONCE_HEADER = "x-qwip-nonce";
export const NONCE_COOKIE = "qwip_nonce_sig";
const DEFAULT_PATH = "/api/ads";

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

// Alias local (só para nome mais expressivo)
export type NonceClaims = SigningClaims;

// Define o cookie httpOnly com o token
export function setNonceCookie(
  resOrToken: NextResponse | string,
  tokenMaybe?: string,
  maxAgeSeconds = 60
) {
  // Suporta ambos formatos:
  //   setNonceCookie(res, token, maxAge)
  //   setNonceCookie(token) -> no-op (compat para chamadas antigas sem Response)
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

// Gera um NextResponse.json(body) com NONCE novo (Header + Cookie)
export async function jsonWithNonce(
  body: unknown,
  opts?: {
    status?: number;
    headers?: Record<string, string>;
    ttlSeconds?: number;           // padrão 60s
    claims?: Partial<SigningClaims>; // path/phone/ip/ua (sub é sempre "ads")
    req?: NextRequest;             // para ip/ua
  }
): Promise<NextResponse> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10, Math.floor(opts?.ttlSeconds ?? 60));

  // Preenche TODOS os campos exigidos por Claims
  const phone = opts?.claims?.phone ?? "";
  const path = opts?.claims?.path ?? DEFAULT_PATH;
  const ip = (opts?.claims?.ip ?? ipFrom(opts?.req)) || "0.0.0.0";
  const ua = (opts?.claims?.ua ?? uaFrom(opts?.req)) || "";

  const claims: SigningClaims = {
    sub: "ads",
    path,
    phone,
    ip,
    ua,
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

// Extrai e valida o NONCE de Header OU Cookie
export async function extractAndVerifyNonce(
  req: NextRequest
): Promise<{ ok: boolean; claims?: NonceClaims; reason?: string }> {
  const token =
    req.headers.get(NONCE_HEADER) ||
    req.cookies.get(NONCE_COOKIE)?.value ||
    "";

  if (!token) return { ok: false, reason: "missing" };

  const v = await verifyToken(token);

  // Narrowing correto para o union de verifyToken:
  if (v.ok) {
    return { ok: true, claims: v.claims as NonceClaims };
  } else {
    return { ok: false, reason: v.reason };
  }
}

// ====== ALIAS de compatibilidade ======
// Alguns trechos antigos chamam "generateNonceHex".
export async function generateNonceHex(
  opts?: { ttlSeconds?: number; claims?: Partial<SigningClaims>; req?: NextRequest }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10, Math.floor(opts?.ttlSeconds ?? 60));

  const phone = opts?.claims?.phone ?? "";
  const path = opts?.claims?.path ?? DEFAULT_PATH;
  const ip = (opts?.claims?.ip ?? ipFrom(opts?.req)) || "0.0.0.0";
  const ua = (opts?.claims?.ua ?? uaFrom(opts?.req)) || "";

  const claims: SigningClaims = {
    sub: "ads",
    path,
    phone,
    ip,
    ua,
    iat: now,
    exp: now + ttl,
  };

  return signToken(claims);
}
